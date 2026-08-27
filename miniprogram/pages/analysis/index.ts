import { getAnalysisOverview, getAnalysisWorkList, sortAnalysisCards } from '../../services/analysis'
import { runAuthed } from '../../services/auth'
import type { AnalysisAudienceUser, AnalysisViewModel } from '../../types/analysis'
import { fromDatasetId } from '../../utils/dataset-id'
import { getDateRangeLimits, getDefaultDateRange } from '../../utils/date-range'
import type { DateRange } from '../../utils/date-range'
import { sortAnalysisUsers } from '../../utils/analysis-users'
import { buildTotalTrendState, getAnalysisReadRange } from '../../utils/analysis-trend'
import { runPagePullRefresh } from '../../utils/pull-refresh'
import { buildReturnPath } from '../../utils/auth'

type AnalysisPeriodId = 'day' | 'week' | 'month' | 'total' | 'custom'

type AnalysisSortId = 'completion' | 'share' | 'view'

interface AnalysisPeriodOption {
  id: AnalysisPeriodId
  label: string
  iconPath?: string
}

interface AnalysisSortOption {
  id: AnalysisSortId
  label: string
}

const analysisPeriods: AnalysisPeriodOption[] = [
  { id: 'day', label: '日' },
  { id: 'week', label: '周' },
  { id: 'month', label: '月' },
  { id: 'custom', label: '', iconPath: '/assets/analysis/calendar-filter.svg' },
]

const defaultDateRange = getDefaultDateRange()
const dateRangeLimits = getDateRangeLimits()

const totalAnalysisPeriods: AnalysisPeriodOption[] = [
  { id: 'day', label: '日' },
  { id: 'week', label: '本周' },
  { id: 'month', label: '本月' },
  { id: 'total', label: '总' },
]

const defaultTrendState = buildTotalTrendState('total')

const analysisSortOptions: AnalysisSortOption[] = [
  { id: 'completion', label: '完播数' },
  { id: 'share', label: '转发数' },
  { id: 'view', label: '浏览次数' },
]

type AnalysisTabId = 'work' | 'user' | 'total'
interface AnalysisTabOption {
  id: AnalysisTabId
  label: string
}

const analysisTabs: AnalysisTabOption[] = [
  { id: 'work', label: '作品分析' },
  { id: 'user', label: '用户分析' },
  { id: 'total', label: '总数据' },
]

const analysisSwipeThreshold = 40

Page({
  data: {
    analysisData: null as AnalysisViewModel | null,
    analysisTabs,
    activeAnalysisTab: 'work' as AnalysisTabId,
    activeAnalysisTabIndex: 0,
    analysisTabOffset: 0,
    analysisSwipeStartX: 0,
    analysisPeriods,
    activePeriod: 'day' as AnalysisPeriodId,
    dateRangePickerVisible: false,
    customStartDate: defaultDateRange.startDate,
    customEndDate: defaultDateRange.endDate,
    todayDate: dateRangeLimits.maxDate,
    twoMonthsAgoDate: dateRangeLimits.minDate,
    analysisSortOptions,
    activeAnalysisSort: 'view' as AnalysisSortId,
    activeAnalysisSortLabel: '浏览次数',
    analysisSortSheetVisible: false,
    visibleAnalysisUsers: [] as AnalysisAudienceUser[],
    workSummary: [] as AnalysisViewModel['summary'],
    visibleAnalysisCards: [] as AnalysisViewModel['cards'],
    hasAnalysisCards: false,
    hasAnalysisUsers: false,
    totalAnalysisPeriods,
    activeTotalPeriod: 'total' as AnalysisPeriodId,
    ...defaultTrendState,
  },
  onLoad(options: Record<string, string | undefined>) {
    runAuthed(buildReturnPath('/pages/analysis/index', options), () => {
      const analysisTabIndex = Math.max(0, analysisTabs.findIndex((tab) => tab.id === options.tab))

      this.setData({
        activeAnalysisTab: analysisTabs[analysisTabIndex].id,
        activeAnalysisTabIndex: analysisTabIndex,
        analysisTabOffset: analysisTabIndex * 100,
      })

      this.loadAnalysis(this.data.activePeriod)
    })
  },
  onPullDownRefresh() {
    runPagePullRefresh(this.refreshCurrentView())
  },
  refreshCurrentView() {
    if (this.data.activeAnalysisTab === 'user') {
      return this.loadAudienceUsers(this.data.activePeriod, this.resolveWorkDateRange(this.data.activePeriod))
    }
    if (this.data.activeAnalysisTab === 'total') {
      return this.loadAnalysis(this.data.activeTotalPeriod)
    }
    return this.loadWorkCards(this.data.activePeriod)
  },
  resolveWorkDateRange(period: AnalysisPeriodId, dateRange?: DateRange): DateRange | undefined {
    if (period !== 'custom') return dateRange
    return dateRange ?? { startDate: this.data.customStartDate, endDate: this.data.customEndDate }
  },
  loadAnalysis(period: AnalysisPeriodId, trendPeriod: AnalysisPeriodId = this.data.activeTotalPeriod) {
    return getAnalysisOverview(period, undefined, this.data.activeAnalysisSort).then((analysisData) => {
      const visibleAnalysisUsers = sortAnalysisUsers(analysisData.audienceUsers, this.data.activeAnalysisSort)
      const initializeWorkData = !this.data.analysisData
      const trendState = buildTotalTrendState(trendPeriod, analysisData.totalData.readTrends[getAnalysisReadRange(trendPeriod)])

      this.setData({
        analysisData,
        visibleAnalysisUsers,
        workSummary: initializeWorkData ? analysisData.summary : this.data.workSummary,
        visibleAnalysisCards: initializeWorkData ? analysisData.cards : this.data.visibleAnalysisCards,
        hasAnalysisCards: initializeWorkData ? analysisData.cards.length > 0 : this.data.hasAnalysisCards,
        hasAnalysisUsers: visibleAnalysisUsers.length > 0,
        ...trendState,
      })
    })
  },
  loadWorkCards(period: AnalysisPeriodId, dateRange?: DateRange) {
    return getAnalysisWorkList(period, this.resolveWorkDateRange(period, dateRange), this.data.activeAnalysisSort).then(({ summary, cards }) => {
      this.setData({ workSummary: summary, visibleAnalysisCards: cards, hasAnalysisCards: cards.length > 0 })
    })
  },
  loadAudienceUsers(period: AnalysisPeriodId, dateRange?: DateRange) {
    return getAnalysisOverview(period, dateRange).then((analysisData) => {
      const visibleAnalysisUsers = sortAnalysisUsers(analysisData.audienceUsers, this.data.activeAnalysisSort)
      const currentAnalysisData = this.data.analysisData ?? analysisData
      this.setData({
        analysisData: { ...currentAnalysisData, userSummary: analysisData.userSummary, audienceUsers: analysisData.audienceUsers },
        visibleAnalysisUsers,
        hasAnalysisUsers: visibleAnalysisUsers.length > 0,
      })
    })
  },
  onAnalysisTabTap(event: WechatMiniprogram.CustomEvent<{ index: number }>) {
    this.setAnalysisTab(event.detail.index)
  },
  onAnalysisTouchStart(event: WechatMiniprogram.CustomEvent<{ clientX: number }>) {
    this.setData({ analysisSwipeStartX: event.detail.clientX })
  },
  onAnalysisTouchEnd(event: WechatMiniprogram.CustomEvent<{ clientX: number }>) {
    const startX = this.data.analysisSwipeStartX
    const endX = event.detail.clientX
    const distance = endX - startX

    if (Math.abs(distance) < analysisSwipeThreshold) return
    this.setAnalysisTab(this.data.activeAnalysisTabIndex + (distance < 0 ? 1 : -1))
  },
  setAnalysisTab(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= analysisTabs.length) return

    this.setData({
      activeAnalysisTab: analysisTabs[index].id,
      activeAnalysisTabIndex: index,
      analysisTabOffset: index * 100,
    })
  },
  onTotalPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) {
    const { id: periodId, index: periodIndex } = event.detail

    if (!totalAnalysisPeriods[periodIndex]) return

    this.setData({
      activeTotalPeriod: periodId,
      ...buildTotalTrendState(periodId, this.data.analysisData?.totalData?.readTrends?.[getAnalysisReadRange(periodId)] ?? []),
    })
    this.loadAnalysis(periodId, periodId)
  },
  onPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) {
    const { id: periodId, index: periodIndex } = event.detail

    if (!Number.isInteger(periodIndex) || periodIndex < 0 || periodIndex >= analysisPeriods.length) return
    if (periodId === 'custom') {
      this.setData({ dateRangePickerVisible: true })
      return
    }

    this.setData({
      activePeriod: periodId,
    })

    if (this.data.activeAnalysisTab === 'user') {
      this.loadAudienceUsers(periodId)
      return
    }

    this.loadWorkCards(periodId)
  },
  onDateRangeConfirm(event: WechatMiniprogram.CustomEvent<{ startDate: string; endDate: string }>) {
    const dateRange = event.detail

    this.setData({
      activePeriod: 'custom',
      customStartDate: dateRange.startDate,
      customEndDate: dateRange.endDate,
      dateRangePickerVisible: false,
    })
    if (this.data.activeAnalysisTab === 'user') {
      this.loadAudienceUsers('custom', dateRange)
      return
    }

    this.loadWorkCards('custom', dateRange)
  },
  onDateRangeCancel() {
    this.setData({ dateRangePickerVisible: false })
  },
  onAnalysisSortTap() {
    this.setData({ analysisSortSheetVisible: !this.data.analysisSortSheetVisible })
  },
  onAnalysisSortOptionTap(event: WechatMiniprogram.TouchEvent) {
    const sortId = event.currentTarget.dataset.id as AnalysisSortId
    const sortOption = analysisSortOptions.find((option) => option.id === sortId)

    if (!sortOption) return

    this.setData({
      activeAnalysisSort: sortOption.id,
      activeAnalysisSortLabel: sortOption.label,
      analysisSortSheetVisible: false,
      visibleAnalysisCards: this.data.activeAnalysisTab === 'work'
        ? sortAnalysisCards(this.data.visibleAnalysisCards, sortOption.id)
        : this.data.visibleAnalysisCards,
      visibleAnalysisUsers: this.data.activeAnalysisTab === 'user'
        ? sortAnalysisUsers(this.data.analysisData?.audienceUsers ?? [], sortOption.id)
        : this.data.visibleAnalysisUsers,
    })
  },
  onAnalysisSortMaskTap() {
    this.setData({ analysisSortSheetVisible: false })
  },
  onCardTap(event: WechatMiniprogram.TouchEvent) {
    const cardId = event.currentTarget.dataset.id as string

    wx.navigateTo({ url: `/pages/analysis-detail/index?id=${cardId}` })
  },
  onAnalysisUserTap(event: WechatMiniprogram.TouchEvent) {
    const userId = fromDatasetId(event.currentTarget.dataset.id)
    if (!userId) return
    wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${userId}` })
  },
})
