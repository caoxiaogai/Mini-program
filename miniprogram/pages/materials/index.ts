import { getMaterialDetail, getMaterials } from '../../services/materials'
import { runAuthed } from '../../services/auth'
import type { MaterialCardViewModel, MaterialsFilterId, MaterialsViewModel } from '../../types/materials'
import { takePendingPublishReturn } from '../../utils/publish-return'
import { runPullRefresh } from '../../utils/pull-refresh'
import { buildMaterialDetailPath, buildMaterialPublishPath, buildMaterialSharePath, buildMaterialShareQuery, buildMaterialShareTitle, enableMaterialShareMenu, pickShareImageUrl, showMomentsShareGuide } from '../../utils/share-material'
import { buildReturnPath } from '../../utils/auth'
import { getNavigationBarLayout } from '../../utils/navigation-layout'
import { isPdfFileName, MAX_IMAGE_COUNT, MAX_VIDEO_DURATION_SECONDS, mediaFilesToPublishItems } from '../../utils/publish-media'
import type { PublishEntryType } from '../../utils/publish-media'
import { setPendingPublishSelection } from '../../utils/publish-selection'

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

function isUserCancel(errMsg?: string): boolean {
  return typeof errMsg === 'string' && /cancel/i.test(errMsg)
}

Page({
  publishSuccessShared: false,
  data: {
    materials: null as MaterialsViewModel | null,
    tabItems: materialsTabItems,
    activeFilter: 'all' as MaterialsFilterId,
    visibleMaterials: [] as MaterialCardViewModel[],
    hasVisibleMaterials: false,
    materialsNavigationHeight: 91,
    isAndroid: false,
    showPublishSuccessModal: false,
    shareMaterialId: '',
    shareTrackingId: '',
    shareTitle: '',
    shareImageUrl: '',
    pullRefreshing: false,
    publishTypeSheetVisible: false,
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
      const visibleMaterials = getVisibleMaterials(materials.items, this.data.activeFilter)

      this.setData({
        materials,
        visibleMaterials,
        hasVisibleMaterials: visibleMaterials.length > 0,
      })
    })
  },
  onPullRefresh() {
    this.setData({ pullRefreshing: true })
    runPullRefresh(this.loadMaterials(), () => this.setData({ pullRefreshing: false }))
  },
  onFilterTap(event: WechatMiniprogram.TouchEvent) {
    const filterId = event.currentTarget.dataset.id as MaterialsFilterId
    if (!['all', 'image', 'video', 'pdf'].includes(filterId)) return

    const visibleMaterials = getVisibleMaterials(this.data.materials?.items ?? [], filterId)

    this.setData({
      activeFilter: filterId,
      visibleMaterials,
      hasVisibleMaterials: visibleMaterials.length > 0,
    })
  },
  onMaterialCardTap(event: WechatMiniprogram.TouchEvent) {
    const materialId = event.currentTarget.dataset.id as string | undefined
    if (!materialId) return

    const material = this.data.visibleMaterials.find((item) => item.id === materialId)
    if (!material) return

    const url = material.isDraft
      ? buildMaterialPublishPath(materialId)
      : buildMaterialDetailPath(materialId)

    wx.navigateTo({ url })
  },
  onPublishTap() {
    this.setData({ publishTypeSheetVisible: true })
  },
  onPublishTypeCancel() {
    this.setData({ publishTypeSheetVisible: false })
  },
  onPublishTypeSelect(event: WechatMiniprogram.CustomEvent<{ type: PublishEntryType }>) {
    const type = event.detail.type
    this.setData({ publishTypeSheetVisible: false }, () => {
      if (type === 'pdf') {
        this.choosePdfForPublish()
        return
      }

      wx.chooseMedia({
        count: type === 'image' ? MAX_IMAGE_COUNT : 1,
        mediaType: [type],
        sourceType: ['album'],
        maxDuration: MAX_VIDEO_DURATION_SECONDS,
        success: (result) => {
          setPendingPublishSelection({ type, media: mediaFilesToPublishItems(result.tempFiles, result.type) })
          wx.navigateTo({ url: `/pages/materials/publish/index?type=${type}` })
        },
        fail: (error) => {
          if (!isUserCancel(error.errMsg)) wx.showToast({ title: '选择失败，请稍后重试', icon: 'none' })
        },
      })
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
        if (!isUserCancel(error.errMsg)) wx.showToast({ title: '选择失败，请稍后重试', icon: 'none' })
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
    })
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
