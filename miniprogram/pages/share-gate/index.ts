import { buildAuthPath } from '../../utils/auth'
import { buildMaterialDetailPath } from '../../utils/share-material'

const friendAvatars = [
  '/assets/ranking/avatar-01.png',
  '/assets/ranking/avatar-02.png',
  '/assets/ranking/avatar-03.png',
  '/assets/ranking/avatar-04.png',
  '/assets/ranking/avatar-05.png',
  '/assets/ranking/avatar-06.png',
]

Page({
  data: {
    friendAvatars,
  },

  materialId: '',
  trackingId: '',

  onLoad(options: Record<string, string | undefined>) {
    this.materialId = options.id ?? ''
    this.trackingId = options.trackingId ?? ''
  },

  onMoreTap() {
    if (!this.materialId) {
      wx.showToast({ title: '内容暂不可用', icon: 'none' })
      return
    }

    const detailPath = buildMaterialDetailPath(this.materialId, this.trackingId)
    wx.navigateTo({ url: buildAuthPath(detailPath) })
  },
})
