import { getUserJourney } from '../../services/user-journey'
import type { UserJourneyViewModel } from '../../types/analysis'
import { runPagePullRefresh } from '../../utils/pull-refresh'

Page({
  noticeTimer: null as number | null,
  data: {
    journey: null as UserJourneyViewModel | null,
    noticeVisible: false,
  },
  userId: '',
  materialId: '',
  onLoad(options: Record<string, string | undefined>) {
    this.userId = options.userId ?? ''
    this.materialId = options.materialId ?? ''
    if (!this.userId || !this.materialId) return

    this.loadJourney()
  },
  onPullDownRefresh() {
    runPagePullRefresh(this.loadJourney())
  },
  loadJourney() {
    if (!this.userId || !this.materialId) return Promise.resolve()

    return getUserJourney(this.userId, this.materialId)
      .then((journey) => this.setData({ journey }))
      .catch((error) => console.warn('[analysis-user-journey] load failed', error))
  },
  onContactTap() {
    const userName = this.data.journey?.userName
    if (!userName) return

    wx.setClipboardData({
      data: userName,
      success: () => {
        wx.hideToast()
        this.showNotice()
      },
    })
  },
  showNotice() {
    if (this.noticeTimer !== null) clearTimeout(this.noticeTimer)

    this.setData({ noticeVisible: true })
    this.noticeTimer = setTimeout(() => {
      this.setData({ noticeVisible: false })
      this.noticeTimer = null
    }, 1200)
  },
  onUnload() {
    if (this.noticeTimer !== null) {
      clearTimeout(this.noticeTimer)
      this.noticeTimer = null
    }
  },
})
