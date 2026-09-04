import { applyThumbnailMap, deleteMaterials, enrichThumbnailsByIds, getMaterialDetail, getMaterials } from '../../services/materials'
import { runAuthed } from '../../services/auth'
import type { MaterialCardViewModel, MaterialsFilterId, MaterialsViewModel } from '../../types/materials'
import { takePendingPublishReturn } from '../../utils/publish-return'
import { runPullRefresh } from '../../utils/pull-refresh'
import { buildMaterialDetailPath, buildMaterialEditPath, buildMaterialSharePath, buildMaterialShareQuery, buildMaterialShareTitle, enableMaterialShareMenu, MATERIAL_NOTE_PATH, pickShareImageUrl, showMomentsShareGuide } from '../../utils/share-material'
import { buildReturnPath } from '../../utils/auth'
import { applyMaterialSelection, toggleMaterialSelection } from '../../utils/material-select'
import { getNavigationBarLayout } from '../../utils/navigation-layout'
import { choosePublishImageOrVideo, isPdfFileName, MAX_IMAGE_COUNT, showPublishPickerError } from '../../utils/publish-media'
import type { PublishEntryType, PublishMediaSource } from '../../utils/publish-media'
import { setPendingPublishSelection } from '../../utils/publish-selection'
import { LIST_PAGE_SIZE, nextListWindow, windowList } from '../../utils/list-window'

type MaterialsTabId = 'home' | 'notifications' | 'analysis' | 'profile'

const materialsTabItems = [
  {
    id: 'home' as const,
    label: '首页',
    iconPath: '/assets/home-new/tab-home-default.svg',
    activeIconPath: '/assets/home-new/tab-home-selected.svg',
    active: false,
  },
  {
    id: 'notifications' as const,
    label: '通知',
    iconPath: '/assets/home-new/tab-notification-default.svg',
    activeIconPath: '/assets/home-new/tab-notification-selected.svg',
    active: false,
  },
  {
    id: 'analysis' as const,
    label: '分析',
    iconPath: '/assets/home-new/tab-analysis-default.svg',
    activeIconPath: '/assets/home-new/tab-analysis-selected.svg',
    active: false,
  },
  {
    id: 'profile' as const,
    label: '我的',
    iconPath: '/assets/home-new/tab-profile-default.svg',
    activeIconPath: '/assets/home-new/tab-profile-selected.svg',
    active: false,
  },
]

function getVisibleMaterials(items: MaterialCardViewModel[], filterId: MaterialsFilterId): MaterialCardViewModel[] {
  return filterId === 'all' ? items : items.filter((item) => item.kind === filterId)
}

Page({
  publishSuccessShared: false,
  pendingPublishType: null as 'image' | 'video' | null,
  data: {
    materials: null as MaterialsViewModel | null,
    tabItems: materialsTabItems,
    activeFilter: 'all' as MaterialsFilterId,
    visibleMaterials: [] as MaterialCardViewModel[],
    hasVisibleMaterials: false,
    materialsVisibleCount: 0,
    materialsNavigationHeight: 91,
    isAndroid: false,
    materialSelecting: false,
    selectedMaterialIds: [] as string[],
    selectedMaterialCount: 0,
    deletingMaterials: false,
    showPublishSuccessModal: false,
    shareMaterialId: '',
    shareTrackingId: '',
    shareTitle: '',
    shareImageUrl: '',
    pullRefreshing: false,
    publishTypeSheetVisible: false,
    publishSourceSheetVisible: false,
  },
  authReady: false,
  onLoad(options: Record<string, string | undefined>) {
    const { platform } = wx.getSystemInfoSync()
    this.setData({
      materialsNavigationHeight: getNavigationBarLayout().totalHeight,
      isAndroid: platform === 'android' || platform === 'devtools',
    })
    runAuthed(buildReturnPath('/pages/materials/index', options), () => this.startMaterials(options))
  },
  startMaterials(options: Record<string, string | undefined>) {
    this.authReady = true
    this.setData({
      showPublishSuccessModal: options.publishSuccess === '1',
      shareMaterialId: options.id ?? '',
    })

    if (options.id) this.loadShareMaterial(options.id)

    this.loadMaterials()
    this.refreshAuthenticatedMaterials()
  },
  onShow() {
    if (!this.authReady) return
    this.refreshAuthenticatedMaterials()
  },
  refreshAuthenticatedMaterials() {
    enableMaterialShareMenu()
    this.applyPendingPublishReturn()
    this.closePublishSuccessModalAfterShareReturn()
  },
  loadMaterials() {
    return getMaterials().then((materials) => {
      this.setData({ materials })
      this.applyMaterialsWindow(materials.items, this.data.activeFilter, LIST_PAGE_SIZE)
    })
  },
  applyMaterialsWindow(items: MaterialCardViewModel[], filterId: MaterialsFilterId, visibleCount: number) {
    const filtered = getVisibleMaterials(items, filterId)
    const visibleMaterials = applyMaterialSelection(windowList(filtered, visibleCount), this.data.selectedMaterialIds)
    this.setData({
      visibleMaterials,
      hasVisibleMaterials: filtered.length > 0,
      materialsVisibleCount: visibleCount,
    })
    this.enrichVisibleMaterials(visibleMaterials)
  },
  enrichVisibleMaterials(items: MaterialCardViewModel[]) {
    if (items.length === 0) return
    enrichThumbnailsByIds(items.map((item) => item.id)).then((thumbs) => {
      const materials = this.data.materials
      if (!materials || thumbs.size === 0) return
      this.setData({
        materials: { ...materials, items: applyThumbnailMap(materials.items, thumbs) },
        visibleMaterials: applyMaterialSelection(applyThumbnailMap(this.data.visibleMaterials, thumbs), this.data.selectedMaterialIds),
      })
    })
  },
  loadMoreMaterials() {
    const filtered = getVisibleMaterials(this.data.materials?.items ?? [], this.data.activeFilter)
    const next = nextListWindow(this.data.materialsVisibleCount, filtered.length)
    if (next === this.data.materialsVisibleCount) return
    this.applyMaterialsWindow(this.data.materials?.items ?? [], this.data.activeFilter, next)
  },
  onMaterialsScrollToLower() {
    this.loadMoreMaterials()
  },
  onPullRefresh() {
    this.setData({ pullRefreshing: true })
    runPullRefresh(this.loadMaterials(), () => this.setData({ pullRefreshing: false }))
  },
  onFilterTap(event: WechatMiniprogram.TouchEvent) {
    const filterId = event.currentTarget.dataset.id as MaterialsFilterId
    if (!['all', 'image', 'video', 'pdf'].includes(filterId)) return

    this.setData({ activeFilter: filterId })
    this.applyMaterialsWindow(this.data.materials?.items ?? [], filterId, LIST_PAGE_SIZE)
  },
  onMaterialCardTap(event: WechatMiniprogram.TouchEvent) {
    const materialId = event.currentTarget.dataset.id as string | undefined
    if (!materialId) return

    if (this.data.materialSelecting) {
      this.toggleMaterialSelected(materialId)
      return
    }

    const material = this.data.visibleMaterials.find((item) => item.id === materialId)
    if (!material) return

    const url = material.isDraft
      ? buildMaterialEditPath(materialId, material.kind)
      : buildMaterialDetailPath(materialId)

    wx.navigateTo({ url })
  },
  onMaterialCardLongPress(event: WechatMiniprogram.TouchEvent) {
    const materialId = event.currentTarget.dataset.id as string | undefined
    if (!materialId || this.data.deletingMaterials) return
    const selectedMaterialIds = this.data.materialSelecting
      ? toggleMaterialSelection(this.data.selectedMaterialIds, materialId)
      : [materialId]
    this.setData({
      materialSelecting: true,
      selectedMaterialIds,
      selectedMaterialCount: selectedMaterialIds.length,
      visibleMaterials: applyMaterialSelection(this.data.visibleMaterials, selectedMaterialIds),
    })
  },
  onMaterialSelectCancelTap() {
    this.exitMaterialSelectMode()
  },
  toggleMaterialSelected(materialId: string) {
    if (this.data.deletingMaterials) return
    const selectedMaterialIds = toggleMaterialSelection(this.data.selectedMaterialIds, materialId)
    this.setData({
      selectedMaterialIds,
      selectedMaterialCount: selectedMaterialIds.length,
      visibleMaterials: applyMaterialSelection(this.data.visibleMaterials, selectedMaterialIds),
    })
  },
  exitMaterialSelectMode() {
    this.setData({
      materialSelecting: false,
      selectedMaterialIds: [],
      selectedMaterialCount: 0,
      deletingMaterials: false,
      visibleMaterials: applyMaterialSelection(this.data.visibleMaterials, []),
    })
  },
  deleteSelectedMaterials() {
    if (!this.data.materialSelecting || this.data.deletingMaterials) return
    const ids = this.data.selectedMaterialIds
    if (ids.length === 0) {
      wx.showToast({ title: '请先选择素材', icon: 'none' })
      return
    }

    wx.showModal({
      title: '删除素材',
      content: `确定删除已选的 ${ids.length} 个素材？草稿和已发布作品都会删除。`,
      confirmText: '删除',
      confirmColor: '#e45454',
      success: (result) => {
        if (!result.confirm) return
        this.setData({ deletingMaterials: true })
        deleteMaterials(ids)
          .then(() => this.loadMaterials())
          .then(() => {
            const remainingIds = new Set((this.data.materials?.items ?? []).map((item) => item.id))
            const stillThere = ids.some((id) => remainingIds.has(id))
            this.exitMaterialSelectMode()
            if (stillThere) {
              wx.showToast({ title: '删除失败，请稍后重试', icon: 'none' })
              return
            }
            wx.showToast({ title: '已删除', icon: 'success' })
          })
          .catch(() => {
            this.setData({ deletingMaterials: false })
            wx.showToast({ title: '删除失败，请稍后重试', icon: 'none' })
          })
      },
    })
  },
  onPublishTap() {
    if (this.data.materialSelecting) {
      this.deleteSelectedMaterials()
      return
    }
    this.setData({ publishTypeSheetVisible: true })
  },
  onPublishTypeCancel() {
    this.setData({ publishTypeSheetVisible: false })
  },
  onPublishSourceCancel() {
    this.setData({ publishSourceSheetVisible: false })
  },
  onPublishTypeSelect(event: WechatMiniprogram.CustomEvent<{ type: PublishEntryType }>) {
    const type = event.detail.type
    this.setData({ publishTypeSheetVisible: false }, () => {
      if (type === 'note') {
        wx.navigateTo({ url: MATERIAL_NOTE_PATH })
        return
      }
      if (type === 'pdf') {
        this.choosePdfForPublish()
        return
      }
      if (type !== 'image' && type !== 'video') return
      this.pendingPublishType = type
      this.setData({ publishSourceSheetVisible: true })
    })
  },
  onPublishSourceSelect(event: WechatMiniprogram.CustomEvent<{ source: PublishMediaSource }>) {
    const type = this.pendingPublishType
    const source = event.detail.source
    this.setData({ publishSourceSheetVisible: false }, () => {
      if (!type) return
      if (source !== 'camera' && source !== 'album') return
      this.openPublishEditorFromPicker(type, source)
    })
  },
  openPublishEditorFromPicker(type: 'image' | 'video', source: PublishMediaSource) {
    choosePublishImageOrVideo({
      type,
      source,
      count: type === 'image' ? MAX_IMAGE_COUNT : 1,
    })
      .then((media) => {
        setPendingPublishSelection({ type, media })
        wx.navigateTo({ url: `/pages/materials/publish/index?type=${type}` })
      })
      .catch((error: WechatMiniprogram.GeneralCallbackResult) => {
        showPublishPickerError(error.errMsg)
      })
  },
  choosePdfForPublish() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (result) => {
        const file = result.tempFiles[0]
        if (!file) return
        if (!isPdfFileName(file.name)) {
          wx.showToast({ title: '请选择 PDF 文件', icon: 'none' })
          return
        }

        setPendingPublishSelection({
          type: 'pdf',
          media: [{ id: file.path, path: file.path, kind: 'pdf', previewPath: '', name: file.name, duration: 0 }],
        })
        wx.navigateTo({ url: '/pages/materials/publish/index?type=pdf' })
      },
      fail: (error) => {
        showPublishPickerError(error.errMsg)
      },
    })
  },
  onTabTap(event: CustomEvent<{ id: MaterialsTabId }>) {
    const { id } = event.detail

    if (id === 'home') {
      wx.navigateTo({ url: '/pages/index/index' })
      return
    }

    if (id === 'notifications') {
      wx.navigateTo({ url: '/pages/notifications/notifications' })
      return
    }

    if (id === 'analysis') {
      wx.navigateTo({ url: '/pages/analysis/index' })
      return
    }

    wx.navigateTo({ url: '/pages/index/index' })
  },
  onPlusTap() {},
  loadShareMaterial(materialId: string) {
    getMaterialDetail(materialId).then((detail) => {
      if (!detail) return
      this.setData({
        shareMaterialId: detail.id,
        shareTrackingId: detail.trackingId,
        shareTitle: buildMaterialShareTitle(detail.descriptionLines),
        shareImageUrl: detail.previewUrl || this.data.shareImageUrl,
      })
    }).catch(() => undefined)
  },
  applyPendingPublishReturn() {
    const pending = takePendingPublishReturn()
    if (!pending) return

    this.publishSuccessShared = false
    this.setData({
      showPublishSuccessModal: pending.showSuccessModal,
      shareMaterialId: pending.materialId,
      shareTitle: pending.shareTitle || this.data.shareTitle,
      shareImageUrl: pending.shareImageUrl || this.data.shareImageUrl,
      shareTrackingId: pending.shareTrackingId || this.data.shareTrackingId,
    })
    this.loadMaterials()
    if (pending.showSuccessModal && pending.materialId) this.loadShareMaterial(pending.materialId)
  },
  onPublishSuccessClose() {
    this.setData({
      showPublishSuccessModal: false,
      shareMaterialId: '',
      shareTrackingId: '',
      shareTitle: '',
      shareImageUrl: '',
    })
  },
  closePublishSuccessModalAfterShare() {
    if (!this.data.showPublishSuccessModal) return
    this.publishSuccessShared = true
  },
  closePublishSuccessModalAfterShareReturn() {
    if (!this.publishSuccessShared) return

    this.publishSuccessShared = false
    this.onPublishSuccessClose()
  },
  onShareAppMessage() {
    const imageUrl = pickShareImageUrl(this.data.shareImageUrl, this.data.visibleMaterials, this.data.shareMaterialId)
    if (!this.data.shareMaterialId || !imageUrl) return

    this.closePublishSuccessModalAfterShare()
    return {
      title: this.data.shareTitle || buildMaterialShareTitle([]),
      path: buildMaterialSharePath(this.data.shareMaterialId, this.data.shareTrackingId),
      imageUrl,
    }
  },
  onShareTimeline() {
    const imageUrl = pickShareImageUrl(this.data.shareImageUrl, this.data.visibleMaterials, this.data.shareMaterialId)
    if (!this.data.shareMaterialId || !imageUrl) return

    this.closePublishSuccessModalAfterShare()
    return {
      title: this.data.shareTitle || buildMaterialShareTitle([]),
      query: buildMaterialShareQuery(this.data.shareMaterialId, this.data.shareTrackingId),
      imageUrl,
    }
  },
  onShareMomentsTap() {
    showMomentsShareGuide()
  },
})
