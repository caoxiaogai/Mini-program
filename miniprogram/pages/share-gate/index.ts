import { continueAfterAuth, hasCompletedLogin, resolveAuthGate } from '../../services/auth'
import { getMaterialListPreview } from '../../services/materials'
import { buildAuthPath, safeReturnPath } from '../../utils/auth'
import { buildMaterialDetailPath, HOME_PAGE_PATH } from '../../utils/share-material'

const SHARE_GATE_DEFAULT_ART = '/assets/share-gate/group-98.svg'

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
    artSrc: SHARE_GATE_DEFAULT_ART,
    artFromWork: false,
  },

  materialId: '',
  trackingId: '',
  returnPath: HOME_PAGE_PATH,

  onLoad(options: Record<string, string | undefined>) {
    this.materialId = options.id ?? ''
    this.trackingId = options.trackingId ?? ''
    this.returnPath = safeReturnPath(options.return, HOME_PAGE_PATH)
    if (this.leaveIfLoggedIn()) return
    this.loadWorkPreview()
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

  loadWorkPreview() {
    if (!this.materialId) return
    getMaterialListPreview(this.materialId).then((url) => {
      if (!url) return
      this.setData({ artSrc: url, artFromWork: true })
    })
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
