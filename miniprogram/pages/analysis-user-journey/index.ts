import { runAuthed } from '../../services/auth'
import { getUserJourney } from '../../services/user-journey'
import type { UserJourneyViewModel } from '../../types/analysis'
import { buildReturnPath } from '../../utils/auth'
import { runPagePullRefresh } from '../../utils/pull-refresh'

Page({
  noticeTimer: null as number | null,
  data: {
    status: 'loading' as 'loading' | 'success' | 'error',
    errorMessage: '轨迹加载失败',
    journey: null as UserJourneyViewModel | null,
    noticeVisible: false,
  },
  userId: '',
  materialId: '',
  onLoad(options: Record<string, string | undefined>) {
    runAuthed(buildReturnPath('/pages/analysis-user-journey/index', options), () => {
      this.userId = options.userId ?? ''
      this.materialId = options.materialId ?? ''
      if (!this.userId || !this.materialId) {
        this.setData({ status: 'error', errorMessage: '无法打开用户轨迹' })
        return
      }

      this.loadJourney()
    })
  },
  onPullDownRefresh() {
    runPagePullRefresh(this.loadJourney(true))
  },
  onRetryTap() {
    this.loadJourney()
  },
  loadJourney(silent = false) {
    if (!this.userId || !this.materialId) return Promise.resolve()
    if (!silent) this.setData({ status: 'loading', errorMessage: '轨迹加载失败' })

    return getUserJourney(this.userId, this.materialId)
      .then((journey) => this.setData({ status: 'success', journey }))
      .catch((error) => {
        console.warn('[analysis-user-journey] load failed', error)
        if (silent) return
        this.setData({
          status: 'error',
          errorMessage: '无法加载用户轨迹，请稍后重试',
          journey: null,
        })
      })
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
