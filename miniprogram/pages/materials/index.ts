import { getMaterials } from '../../services/materials'
import type { MaterialCardViewModel, MaterialsFilterId, MaterialsViewModel } from '../../types/materials'
import { calculateRankingHeaderOpacity } from '../../utils/ranking'

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
  },
  onLoad(options: Record<string, string | undefined>) {
    const { platform } = wx.getSystemInfoSync()
    this.setData({
      isAndroid: platform === 'android' || platform === 'devtools',
      showPublishSuccessModal: options.publishSuccess === '1',
    })

    getMaterials().then((materials) => {
      const visibleMaterials = getVisibleMaterials(materials.items, this.data.activeFilter)

      this.setData({
        materials,
        visibleMaterials,
        hasVisibleMaterials: visibleMaterials.length > 0,
      })
    })
  },
  onPageScroll(event: WechatMiniprogram.PageScrollOption) {
    const materialsHeaderOpacity = calculateRankingHeaderOpacity(event.scrollTop)

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
  onPublishSuccessClose() {
    this.setData({ showPublishSuccessModal: false })
  },
  onShareFriendsTap() {
    this.setData({ showPublishSuccessModal: false })
    wx.showToast({ title: '分享功能待接入', icon: 'none' })
  },
  onShareMomentsTap() {
    this.setData({ showPublishSuccessModal: false })
    wx.showToast({ title: '分享功能待接入', icon: 'none' })
  },
})
