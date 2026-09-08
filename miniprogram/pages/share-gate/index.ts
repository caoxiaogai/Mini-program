import { continueAfterAuth, hasCompletedLogin, resolveAuthGate } from '../../services/auth'
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
    ready: false,
  },

  materialId: '',
  trackingId: '',
  returnPath: HOME_PAGE_PATH,

  onLoad(options: Record<string, string | undefined>) {
    this.materialId = options.id ?? ''
    this.trackingId = options.trackingId ?? ''
    this.returnPath = safeReturnPath(options.return, HOME_PAGE_PATH)
    if (this.leaveIfLoggedIn()) return
    resolveAuthGate().then((gate) => {
      if (gate === 'ok') {
        continueAfterAuth(this.destinationPath())
        return
      }
      this.setData({ ready: true })
    })
  },

  destinationPath() {
    return this.materialId
      ? buildMaterialDetailPath(this.materialId, this.trackingId)
      : this.returnPath
  },

  leaveIfLoggedIn() {
    if (!hasCompletedLogin()) return false
    continueAfterAuth(this.destinationPath())
    return true
  },

  onMoreTap() {
    if (this.leaveIfLoggedIn()) return
    wx.navigateTo({ url: buildAuthPath(this.destinationPath()) })
  },
})
