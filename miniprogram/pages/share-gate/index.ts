import { continueAfterAuth, hasCompletedLogin } from '../../services/auth'
import { getMaterialListPreview } from '../../services/materials'
import { buildAuthPath, safeReturnPath } from '../../utils/auth'
import { buildMaterialDetailPath, HOME_PAGE_PATH, SHARE_GATE_DEFAULT_ART, shareGateArtFromPreview, shareGateHeroArt } from '../../utils/share-material'

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
  coverUrl: '',
  returnPath: HOME_PAGE_PATH,

  onLoad(options: Record<string, string | undefined>) {
    this.materialId = options.id ?? ''
    this.trackingId = options.trackingId ?? ''
    this.coverUrl = options.cover ?? ''
    this.returnPath = safeReturnPath(options.return, HOME_PAGE_PATH)
    if (this.leaveIfLoggedIn()) return
    const art = shareGateHeroArt(this.materialId, this.coverUrl)
    this.setData({ ready: true, ...art })
    this.loadWorkPreview()
  },

  destinationPath() {
    return this.materialId
      ? buildMaterialDetailPath(this.materialId, this.trackingId)
      : this.returnPath
  },

  loadWorkPreview() {
    if (!this.materialId) return
    getMaterialListPreview(this.materialId).then((preview) => {
      const art = shareGateArtFromPreview(preview)
      if (!art) return
      this.setData(art)
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
