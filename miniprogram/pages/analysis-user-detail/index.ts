import { getAnalysisUserDetail } from '../../services/analysis'
import type { AnalysisUserDetailViewModel, AnalysisUserRecord } from '../../types/analysis'
import { runPagePullRefresh } from '../../utils/pull-refresh'

type RecordSortId = 'views' | 'completion' | 'shares'

const recordSortOptions: Array<{ id: RecordSortId; label: string }> = [
  { id: 'views', label: '浏览次数' },
  { id: 'completion', label: '完播' },
  { id: 'shares', label: '转发' },
]

const getRecordSortValue = (record: AnalysisUserRecord, sortId: RecordSortId) => {
  const raw = sortId === 'views'
    ? record.readCount
    : sortId === 'completion'
      ? record.completionCount
      : record.shareCount

  return Number(String(raw ?? '').replace(/[^\d.-]/g, '')) || 0
}

const sortUserRecords = (records: AnalysisUserRecord[], sortId: RecordSortId) => {
  return [...records].sort((left, right) => getRecordSortValue(right, sortId) - getRecordSortValue(left, sortId))
}

Page({
  noticeTimer: null as number | null,
  data: {
    detail: null as AnalysisUserDetailViewModel | null,
    recordSortOptions,
    activeRecordSort: 'views' as RecordSortId,
    visibleUserRecords: [] as AnalysisUserRecord[],
    noticeVisible: false,
  },
  userId: '',
  onLoad(options: Record<string, string | undefined>) {
    this.userId = options.id ?? ''
    if (!this.userId) return

    this.loadDetail()
  },
  onPullDownRefresh() {
    runPagePullRefresh(this.loadDetail())
  },
  loadDetail() {
    if (!this.userId) return Promise.resolve()

    return getAnalysisUserDetail(this.userId).then((detail) => this.setData({
      detail,
      visibleUserRecords: detail ? sortUserRecords(detail.records, this.data.activeRecordSort) : [],
    }))
  },
  onCopyUsername() {
    this.copyUsername()
  },
  onContactTap() {
    this.copyUsername()
  },
  copyUsername() {
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
  onRecordSortChange(event: WechatMiniprogram.CustomEvent<{ id: RecordSortId }>) {
    const sortId = event.detail.id
    const detail = this.data.detail
    if (!detail || !recordSortOptions.some((option) => option.id === sortId)) return

    this.setData({
      activeRecordSort: sortId,
      visibleUserRecords: sortUserRecords(detail.records, sortId),
    })
  },
  onUserRecordTap(event: WechatMiniprogram.TouchEvent) {
    const contentId = event.currentTarget.dataset.contentId as string | undefined
    if (!contentId) return

    wx.navigateTo({ url: `/pages/analysis-detail/index?id=${contentId}` })
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
