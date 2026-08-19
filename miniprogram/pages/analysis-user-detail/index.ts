import { getAnalysisUserDetail } from '../../services/analysis'
import type { AnalysisUserDetailViewModel, AnalysisUserRecord } from '../../types/analysis'

const userDetailRecordTabs = [
  { id: 'all', label: '全部' },
  { id: 'read', label: '阅读' },
  { id: 'share', label: '转发' },
]

const getVisibleUserRecords = (records: AnalysisUserRecord[], tabId: string) => {
  if (tabId === 'share') {
    return records.filter((record) => record.shareCount !== '0')
  }
  if (tabId === 'read') {
    return records.filter((record) => record.progress !== '0%' || record.viewDuration !== '0s')
  }
  return records
}

Page({
  copyNoticeTimer: null as number | null,
  data: {
    detail: null as AnalysisUserDetailViewModel | null,
    userDetailRecordTabs,
    activeRecordTab: 'all',
    visibleUserRecords: [] as AnalysisUserRecord[],
    copyNoticeVisible: false,
  },
  onLoad(options: Record<string, string | undefined>) {
    const userId = options.id
    if (!userId) return

    getAnalysisUserDetail(userId).then((detail) => this.setData({
      detail,
      visibleUserRecords: detail ? getVisibleUserRecords(detail.records, 'all') : [],
    }))
  },
  onRecordTabTap(event: WechatMiniprogram.TouchEvent) {
    const tabId = event.currentTarget.dataset.id as string
    const records = this.data.detail?.records ?? []
    this.setData({
      activeRecordTab: tabId,
      visibleUserRecords: getVisibleUserRecords(records, tabId),
    })
  },
  onCopyUsername() {
    const username = this.data.detail?.profile.name
    if (!username) return

    wx.setClipboardData({
      data: username,
      success: () => {
        wx.hideToast()
        if (this.copyNoticeTimer !== null) {
          clearTimeout(this.copyNoticeTimer)
        }
        this.setData({ copyNoticeVisible: true })
        this.copyNoticeTimer = setTimeout(() => {
          this.setData({ copyNoticeVisible: false })
          this.copyNoticeTimer = null
        }, 1000)
      },
    })
  },
  onUnload() {
    if (this.copyNoticeTimer !== null) {
      clearTimeout(this.copyNoticeTimer)
      this.copyNoticeTimer = null
    }
  },
})
