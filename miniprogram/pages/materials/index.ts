import { getMaterials } from '../../services/materials'
import type { MaterialCardViewModel, MaterialsFilterId, MaterialsViewModel } from '../../types/materials'
import { calculateRankingHeaderOpacity } from '../../utils/ranking'

function getVisibleMaterials(items: MaterialCardViewModel[], filterId: MaterialsFilterId): MaterialCardViewModel[] {
  return filterId === 'all' ? items : items.filter((item) => item.kind === filterId)
}

Page({
  data: {
    materials: null as MaterialsViewModel | null,
    activeFilter: 'all' as MaterialsFilterId,
    visibleMaterials: [] as MaterialCardViewModel[],
    hasVisibleMaterials: false,
    materialsHeaderOpacity: 0,
    showPublishSuccessModal: false,
  },
  onLoad(options: Record<string, string | undefined>) {
    this.setData({ showPublishSuccessModal: options.publishSuccess === '1' })

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
