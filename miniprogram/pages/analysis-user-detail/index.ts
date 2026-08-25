import { getAnalysisUserDetail } from '../../services/analysis'
import type { AnalysisUserDetailViewModel, AnalysisUserRecord } from '../../types/analysis'

Page({
  noticeTimer: null as number | null,
  data: {
    detail: null as AnalysisUserDetailViewModel | null,
    visibleUserRecords: [] as AnalysisUserRecord[],
    noticeVisible: false,
  },
  onLoad(options: Record<string, string | undefined>) {
    const userId = options.id
    if (!userId) return

    getAnalysisUserDetail(userId).then((detail) => this.setData({ detail, visibleUserRecords: detail?.records ?? [] }))
  },
  onCopyUsername() {
    const username = this.data.detail?.profile.name
    if (!username) return

    wx.setClipboardData({
      data: username,
      success: () => {
        wx.hideToast()
        this.showNotice()
      },
    })
  },
  onContactTap() {
    this.showNotice()
  },
  showNotice() {
    if (this.noticeTimer !== null) {
      clearTimeout(this.noticeTimer)
    }
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
