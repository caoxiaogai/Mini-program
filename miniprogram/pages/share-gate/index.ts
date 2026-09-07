import { buildAuthPath, safeReturnPath } from '../../utils/auth'
import { buildMaterialDetailPath, HOME_PAGE_PATH } from '../../utils/share-material'

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
  returnPath: HOME_PAGE_PATH,

  onLoad(options: Record<string, string | undefined>) {
    this.materialId = options.id ?? ''
    this.trackingId = options.trackingId ?? ''
    this.returnPath = safeReturnPath(options.return, HOME_PAGE_PATH)
  },

  onMoreTap() {
    const destination = this.materialId
      ? buildMaterialDetailPath(this.materialId, this.trackingId)
      : this.returnPath
    wx.navigateTo({ url: buildAuthPath(destination) })
  },
})
