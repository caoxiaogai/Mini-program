import { getAnalysisContentDetail } from '../../services/analysis'
import { runAuthed } from '../../services/auth'
import type { AnalysisContentDetailViewModel } from '../../types/analysis'
import { getDateRangeLimits, getDefaultDateRange } from '../../utils/date-range'
import type { DateRange } from '../../utils/date-range'
import { runPagePullRefresh } from '../../utils/pull-refresh'
import { buildReturnPath } from '../../utils/auth'

type ContentPeriodId = 'day' | 'week' | 'month' | 'custom'

const contentPeriods: Array<{ id: ContentPeriodId; label: string; iconPath?: string }> = [
  { id: 'day', label: '日' },
  { id: 'week', label: '周' },
  { id: 'month', label: '月' },
  { id: 'custom', label: '', iconPath: '/assets/analysis/calendar-filter.svg' },
]

const defaultDateRange = getDefaultDateRange()
const dateRangeLimits = getDateRangeLimits()

Page({
  data: {
    detail: null as AnalysisContentDetailViewModel | null,
    materialId: '',
    contentPeriods,
    activePeriod: 'day' as ContentPeriodId,
    dateRangePickerVisible: false,
    customStartDate: defaultDateRange.startDate,
    customEndDate: defaultDateRange.endDate,
    todayDate: dateRangeLimits.maxDate,
    twoMonthsAgoDate: dateRangeLimits.minDate,
  },
  onLoad(options: Record<string, string | undefined>) {
    const materialId = String(options.id ?? '')
    this.setData({ materialId })
    runAuthed(buildReturnPath('/pages/analysis-detail/index', options), () => {
      this.loadDetail('day', undefined, materialId)
    })
  },
  onPullDownRefresh() {
    runPagePullRefresh(this.loadDetail(this.data.activePeriod, this.getCustomRange(), this.data.materialId))
  },
  getCustomRange(): DateRange | undefined {
    if (this.data.activePeriod !== 'custom') return undefined
    return { startDate: this.data.customStartDate, endDate: this.data.customEndDate }
  },
  loadDetail(period: ContentPeriodId, dateRange?: DateRange, materialId = this.data.materialId) {
    return getAnalysisContentDetail(period, dateRange, 'view', materialId).then((detail) => {
      this.setData({ detail })
    })
  },
  onPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: ContentPeriodId; index: number }>) {
    const periodId = event.detail.id
    const periodIndex = event.detail.index
    if (!Number.isInteger(periodIndex) || !contentPeriods[periodIndex] || contentPeriods[periodIndex].id !== periodId) return

    if (periodId === 'custom') {
      this.setData({ dateRangePickerVisible: true })
      return
    }

    this.setData({ activePeriod: periodId })
    this.loadDetail(periodId, undefined, this.data.materialId)
  },
  onDateRangeConfirm(event: WechatMiniprogram.CustomEvent<{ startDate: string; endDate: string }>) {
    const dateRange = event.detail
    this.setData({
      activePeriod: 'custom',
      customStartDate: dateRange.startDate,
      customEndDate: dateRange.endDate,
      dateRangePickerVisible: false,
    })
    this.loadDetail('custom', dateRange, this.data.materialId)
  },
  onDateRangeCancel() {
    this.setData({ dateRangePickerVisible: false })
  },
  onIntentUserTap(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    const userId = String(event.detail.id ?? '')
    if (!userId) return
    wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${encodeURIComponent(userId)}` })
  },
})
