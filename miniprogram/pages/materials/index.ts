import { getMaterialDetail, getMaterials } from '../../services/materials'
import type { MaterialCardViewModel, MaterialsFilterId, MaterialsViewModel } from '../../types/materials'
import { calculateRankingHeaderOpacity } from '../../utils/ranking'
import { takePendingPublishReturn } from '../../utils/publish-return'
import { runPullRefresh } from '../../utils/pull-refresh'
import { buildMaterialSharePath, buildMaterialShareQuery, buildMaterialShareTitle, enableMaterialShareMenu, showMomentsShareGuide } from '../../utils/share-material'

type MaterialsTabId = 'home' | 'notifications' | 'analysis' | 'profile'

const materialsTabItems = [
  {
    id: 'home' as const,
    label: '首页',
    iconPath: '/assets/home-new/tab-home-default.svg',
    activeIconPath: '/assets/home-new/tab-home-active.svg',
    active: false,
  },
  {
    id: 'notifications' as const,
    label: '通知',
    iconPath: '/assets/home-new/tab-notification-default.svg',
    activeIconPath: '/assets/home-new/tab-notification-active.svg',
    active: false,
  },
  {
    id: 'analysis' as const,
    label: '分析',
    iconPath: '/assets/home-new/tab-analysis-default.svg',
    activeIconPath: '/assets/home-new/tab-analysis-active.svg',
    active: false,
  },
  {
    id: 'profile' as const,
    label: '我的',
    iconPath: '/assets/home-new/tab-profile-default.svg',
    activeIconPath: '/assets/home-new/tab-profile-active.svg',
    active: false,
  },
]

function getVisibleMaterials(items: MaterialCardViewModel[], filterId: MaterialsFilterId): MaterialCardViewModel[] {
  return filterId === 'all' ? items : items.filter((item) => item.kind === filterId)
}

Page({
  data: {
    materials: null as MaterialsViewModel | null,
    tabItems: materialsTabItems,
    activeFilter: 'all' as MaterialsFilterId,
    visibleMaterials: [] as MaterialCardViewModel[],
    hasVisibleMaterials: false,
    materialsHeaderOpacity: 0,
    isAndroid: false,
    showPublishSuccessModal: false,
    shareMaterialId: '',
    shareTrackingId: '',
    shareTitle: '',
    shareImageUrl: '',
    pullRefreshing: false,
  },
  onLoad(options: Record<string, string | undefined>) {
    const { platform } = wx.getSystemInfoSync()
    this.setData({
      isAndroid: platform === 'android' || platform === 'devtools',
      showPublishSuccessModal: options.publishSuccess === '1',
      shareMaterialId: options.id ?? '',
    })

    if (options.id) this.loadShareMaterial(options.id)

    this.loadMaterials()
  },
  onShow() {
    enableMaterialShareMenu()
    this.applyPendingPublishReturn()
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
  onMaterialsScroll(event: WechatMiniprogram.ScrollViewScrollEvent) {
    const materialsHeaderOpacity = calculateRankingHeaderOpacity(event.detail.scrollTop)

    if (materialsHeaderOpacity === this.data.materialsHeaderOpacity) return

    this.setData({ materialsHeaderOpacity })
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

    const url = material?.isDraft
      ? `/pages/materials/publish/index?id=${materialId}`
      : `/pages/material-detail/index?id=${materialId}`

    wx.navigateTo({ url })
  },
  onPublishTap() {
    wx.navigateTo({ url: '/pages/materials/publish/index' })
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
        shareImageUrl: detail.previewUrl,
      })
    })
  },
  applyPendingPublishReturn() {
    const pending = takePendingPublishReturn()
    if (!pending) return

    this.setData({
      showPublishSuccessModal: pending.showSuccessModal,
      shareMaterialId: pending.materialId,
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
  onShareAppMessage() {
    if (!this.data.shareMaterialId) return

    return {
      title: this.data.shareTitle,
      path: buildMaterialSharePath(this.data.shareMaterialId, this.data.shareTrackingId),
      imageUrl: this.data.shareImageUrl || undefined,
    }
  },
  onShareTimeline() {
    if (!this.data.shareMaterialId) return

    return {
      title: this.data.shareTitle,
      query: buildMaterialShareQuery(this.data.shareMaterialId, this.data.shareTrackingId),
      imageUrl: this.data.shareImageUrl || undefined,
    }
  },
  onShareMomentsTap() {
    showMomentsShareGuide()
  },
})
