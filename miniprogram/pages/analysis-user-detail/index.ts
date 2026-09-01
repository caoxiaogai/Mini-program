import { enrichAnalysisUserDetailThumbnails, getAnalysisUserDetail } from '../../services/analysis'
import { runAuthed } from '../../services/auth'
import type { AnalysisUserDetailViewModel, AnalysisUserRecord } from '../../types/analysis'
import { fromDatasetId } from '../../utils/dataset-id'
import { LIST_PAGE_SIZE, nextListWindow, windowList } from '../../utils/list-window'
import { runPagePullRefresh } from '../../utils/pull-refresh'
import { buildReturnPath } from '../../utils/auth'

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
    recordsVisibleCount: 0,
    noticeVisible: false,
  },
  userId: '',
  onLoad(options: Record<string, string | undefined>) {
    runAuthed(buildReturnPath('/pages/analysis-user-detail/index', options), () => {
      this.userId = options.id ?? ''
      if (!this.userId) return

      this.loadDetail()
    })
  },
  onPullDownRefresh() {
    runPagePullRefresh(this.loadDetail())
  },
  onReachBottom() {
    const detail = this.data.detail
    if (!detail) return
    const sorted = sortUserRecords(detail.records, this.data.activeRecordSort)
    const next = nextListWindow(this.data.recordsVisibleCount, sorted.length)
    if (next === this.data.recordsVisibleCount) return
    this.applyUserRecordsWindow(detail, sorted, next)
  },
  loadDetail() {
    if (!this.userId) return Promise.resolve()

    return getAnalysisUserDetail(this.userId)
      .then((detail) => {
        if (!detail) {
          this.setData({ detail: null, visibleUserRecords: [], recordsVisibleCount: LIST_PAGE_SIZE })
          return
        }

        this.setData({ detail })
        this.applyUserRecordsWindow(detail, sortUserRecords(detail.records, this.data.activeRecordSort), LIST_PAGE_SIZE)
      })
      .catch((error) => {
        console.warn('[analysis-user-detail] load failed', error)
      })
  },
  applyUserRecordsWindow(detail: AnalysisUserDetailViewModel, records: AnalysisUserRecord[], visibleCount: number) {
    const visibleUserRecords = windowList(records, visibleCount)
    this.setData({
      visibleUserRecords,
      recordsVisibleCount: visibleCount,
    })
    if (visibleUserRecords.length === 0) return
    enrichAnalysisUserDetailThumbnails(detail, visibleUserRecords.map((record) => record.contentId)).then((next) => {
      this.setData({
        detail: next,
        visibleUserRecords: windowList(sortUserRecords(next.records, this.data.activeRecordSort), this.data.recordsVisibleCount),
      })
    })
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

    this.setData({ activeRecordSort: sortId })
    this.applyUserRecordsWindow(detail, sortUserRecords(detail.records, sortId), LIST_PAGE_SIZE)
  },
  onUserRecordTap(event: WechatMiniprogram.TouchEvent) {
    const dataset = event.currentTarget.dataset as WechatMiniprogram.IAnyObject
    const contentId = fromDatasetId(dataset.contentId ?? dataset['content-id'])
    if (!contentId || !this.userId) return

    wx.navigateTo({
      url: `/pages/analysis-user-journey/index?userId=${encodeURIComponent(this.userId)}&materialId=${encodeURIComponent(contentId)}`,
    })
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
