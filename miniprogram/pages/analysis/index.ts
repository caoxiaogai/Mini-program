import { enrichAnalysisCards, enrichAudienceUsers, getAnalysisOverview, getAnalysisWorkList, sortAnalysisCards } from '../../services/analysis'
import { applyThumbnailMap } from '../../services/materials'
import { runAuthed } from '../../services/auth'
import type { AnalysisAudienceUser, AnalysisViewModel } from '../../types/analysis'
import { fromDatasetId } from '../../utils/dataset-id'
import { getDateRangeLimits, getDefaultDateRange } from '../../utils/date-range'
import type { DateRange } from '../../utils/date-range'
import { sortAnalysisUsers } from '../../utils/analysis-users'
import { capAudienceUsers, resolveVisitorLimit } from '../../utils/membership'
import { LIST_PAGE_SIZE, nextListWindow, windowList } from '../../utils/list-window'
import { buildTotalTrendState, getAnalysisReadRange } from '../../utils/analysis-trend'
import { runPagePullRefresh } from '../../utils/pull-refresh'
import { buildReturnPath } from '../../utils/auth'
import { getNavigationBarLayout } from '../../utils/navigation-layout'

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
  { id: 'week', label: '周' },
  { id: 'month', label: '月' },
  { id: 'custom', label: '', iconPath: '/assets/analysis/calendar-filter.svg' },
]

const analysisSortOptions: AnalysisSortOption[] = [
  { id: 'completion', label: '完播数' },
  { id: 'share', label: '转发数' },
  { id: 'view', label: '浏览次数' },
]

type AnalysisTabId = 'work' | 'user' | 'total'
type TotalDateRangeTarget = 'work' | 'overview' | 'peak'
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
    analysisNavigationHeight: 91,
    analysisData: null as AnalysisViewModel | null,
    analysisTabs,
    activeAnalysisTab: 'work' as AnalysisTabId,
    activeAnalysisTabIndex: 0,
    analysisTabOffset: 0,
    analysisSwipeStartX: 0,
    analysisPeriods,
    activePeriod: 'day' as AnalysisPeriodId,
    dateRangePickerVisible: false,
    dateRangePickerTarget: 'work' as TotalDateRangeTarget,
    customStartDate: defaultDateRange.startDate,
    customEndDate: defaultDateRange.endDate,
    overviewCustomStartDate: defaultDateRange.startDate,
    overviewCustomEndDate: defaultDateRange.endDate,
    peakCustomStartDate: defaultDateRange.startDate,
    peakCustomEndDate: defaultDateRange.endDate,
    datePickerStartDate: defaultDateRange.startDate,
    datePickerEndDate: defaultDateRange.endDate,
    todayDate: dateRangeLimits.maxDate,
    twoMonthsAgoDate: dateRangeLimits.minDate,
    analysisSortOptions,
    activeAnalysisSort: 'view' as AnalysisSortId,
    activeAnalysisSortLabel: '浏览次数',
    analysisSortSheetVisible: false,
    visibleAnalysisUsers: [] as AnalysisAudienceUser[],
    allAnalysisCards: [] as AnalysisViewModel['cards'],
    workSummary: [] as AnalysisViewModel['summary'],
    visibleAnalysisCards: [] as AnalysisViewModel['cards'],
    analysisCardsVisibleCount: 0,
    analysisUsersVisibleCount: 0,
    workCount: '0',
    hasAnalysisCards: false,
    hasAnalysisUsers: false,
    totalAnalysisPeriods,
    activeOverviewPeriod: 'day' as AnalysisPeriodId,
    activePeakPeriod: 'day' as AnalysisPeriodId,
    ...buildTotalTrendState('day'),
  },
  onLoad(options: Record<string, string | undefined>) {
    this.setData({ analysisNavigationHeight: getNavigationBarLayout().totalHeight })
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
      const customRange = this.data.activeOverviewPeriod === 'custom'
        ? { startDate: this.data.overviewCustomStartDate, endDate: this.data.overviewCustomEndDate }
        : undefined
      const trendPeriod = this.data.activePeakPeriod === 'custom' ? 'total' : this.data.activePeakPeriod
      return this.loadAnalysis(this.data.activeOverviewPeriod, trendPeriod, customRange)
    }
    return this.loadWorkCards(this.data.activePeriod)
  },
  resolveWorkDateRange(period: AnalysisPeriodId, dateRange?: DateRange): DateRange | undefined {
    if (period !== 'custom') return dateRange
    return dateRange ?? { startDate: this.data.customStartDate, endDate: this.data.customEndDate }
  },
  loadAnalysis(period: AnalysisPeriodId, trendPeriod: AnalysisPeriodId = this.data.activePeakPeriod, dateRange?: DateRange) {
    const request = dateRange
      ? getAnalysisOverview(period, dateRange, this.data.activeAnalysisSort, trendPeriod)
      : getAnalysisOverview(period, undefined, this.data.activeAnalysisSort, trendPeriod)
    return request.then((analysisData) => {
      const sortedUsers = capAudienceUsers(
        sortAnalysisUsers(analysisData.audienceUsers, this.data.activeAnalysisSort),
        resolveVisitorLimit(analysisData.visitorLimit),
      )
      const initializeWorkData = !this.data.analysisData
      // Keep the chart tied to the latest peak selector choice even if an overview request resolves later.
      const currentTrendPeriod = this.data.activePeakPeriod || trendPeriod
      const resolvedTrendPeriod = currentTrendPeriod === 'custom' ? 'total' : currentTrendPeriod
      const trendState = buildTotalTrendState(resolvedTrendPeriod, analysisData.totalData.readTrends[getAnalysisReadRange(resolvedTrendPeriod)])
      const allAnalysisCards = initializeWorkData ? analysisData.cards : this.data.allAnalysisCards

      this.setData({
        analysisData,
        allAnalysisCards,
        workSummary: initializeWorkData ? analysisData.summary : this.data.workSummary,
        workCount: initializeWorkData ? analysisData.workCount : this.data.workCount,
        hasAnalysisCards: initializeWorkData ? analysisData.cards.length > 0 : this.data.hasAnalysisCards,
        ...trendState,
      })
      if (initializeWorkData) this.applyAnalysisCardsWindow(allAnalysisCards, LIST_PAGE_SIZE)
      this.applyAnalysisUsersWindow(sortedUsers, LIST_PAGE_SIZE)
    })
  },
  loadWorkCards(period: AnalysisPeriodId, dateRange?: DateRange) {
    return getAnalysisWorkList(period, this.resolveWorkDateRange(period, dateRange), this.data.activeAnalysisSort).then(({ summary, cards, workCount }) => {
      this.setData({
        workSummary: summary,
        workCount,
        allAnalysisCards: cards,
        analysisData: this.data.analysisData ? { ...this.data.analysisData, cards } : this.data.analysisData,
        hasAnalysisCards: cards.length > 0,
      })
      this.applyAnalysisCardsWindow(cards, LIST_PAGE_SIZE)
    })
  },
  loadAudienceUsers(period: AnalysisPeriodId, dateRange?: DateRange) {
    return getAnalysisOverview(period, dateRange).then((analysisData) => {
      const sortedUsers = capAudienceUsers(
        sortAnalysisUsers(analysisData.audienceUsers, this.data.activeAnalysisSort),
        resolveVisitorLimit(analysisData.visitorLimit),
      )
      const currentAnalysisData = this.data.analysisData ?? analysisData
      this.setData({
        analysisData: {
          ...currentAnalysisData,
          userSummary: analysisData.userSummary,
          audienceUsers: analysisData.audienceUsers,
          visitorLimit: analysisData.visitorLimit,
        },
      })
      this.applyAnalysisUsersWindow(sortedUsers, LIST_PAGE_SIZE)
    })
  },
  applyAnalysisCardsWindow(cards: AnalysisViewModel['cards'], visibleCount: number) {
    const visibleAnalysisCards = windowList(cards, visibleCount)
    this.setData({
      visibleAnalysisCards,
      analysisCardsVisibleCount: visibleCount,
      hasAnalysisCards: cards.length > 0,
    })
    if (visibleAnalysisCards.length === 0) return
    enrichAnalysisCards(visibleAnalysisCards).then((patched) => {
      const byId = new Map(patched.map((card) => [card.id, card.thumbnailUrl]))
      const allAnalysisCards = applyThumbnailMap(this.data.allAnalysisCards, byId)
      this.setData({
        allAnalysisCards,
        visibleAnalysisCards: applyThumbnailMap(this.data.visibleAnalysisCards, byId),
        analysisData: this.data.analysisData ? { ...this.data.analysisData, cards: allAnalysisCards } : this.data.analysisData,
      })
    })
  },
  applyAnalysisUsersWindow(users: AnalysisAudienceUser[], visibleCount: number) {
    const visibleAnalysisUsers = windowList(users, visibleCount)
    this.setData({
      visibleAnalysisUsers,
      analysisUsersVisibleCount: visibleCount,
      hasAnalysisUsers: users.length > 0,
    })
    if (visibleAnalysisUsers.length === 0) return
    enrichAudienceUsers(visibleAnalysisUsers).then((patched) => {
      const byId = new Map(patched.map((user) => [user.id, user]))
      const analysisData = this.data.analysisData
      this.setData({
        visibleAnalysisUsers: this.data.visibleAnalysisUsers.map((user) => byId.get(user.id) ?? user),
        analysisData: analysisData
          ? { ...analysisData, audienceUsers: analysisData.audienceUsers.map((user) => byId.get(user.id) ?? user) }
          : analysisData,
      })
    })
  },
  loadMoreAnalysisCards() {
    const next = nextListWindow(this.data.analysisCardsVisibleCount, this.data.allAnalysisCards.length)
    if (next === this.data.analysisCardsVisibleCount) return
    this.applyAnalysisCardsWindow(this.data.allAnalysisCards, next)
  },
  loadMoreAnalysisUsers() {
    const users = capAudienceUsers(
      sortAnalysisUsers(this.data.analysisData?.audienceUsers ?? [], this.data.activeAnalysisSort),
      resolveVisitorLimit(this.data.analysisData?.visitorLimit),
    )
    const next = nextListWindow(this.data.analysisUsersVisibleCount, users.length)
    if (next === this.data.analysisUsersVisibleCount) return
    this.applyAnalysisUsersWindow(users, next)
  },
  onReachBottom() {
    if (this.data.activeAnalysisTab === 'work') this.loadMoreAnalysisCards()
    if (this.data.activeAnalysisTab === 'user') this.loadMoreAnalysisUsers()
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
  onTotalOverviewPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) {
    const { id: periodId, index: periodIndex } = event.detail

    if (!totalAnalysisPeriods[periodIndex]) return
    if (periodId === 'custom') {
      this.setData({
        dateRangePickerVisible: true,
        dateRangePickerTarget: 'overview',
        datePickerStartDate: this.data.overviewCustomStartDate,
        datePickerEndDate: this.data.overviewCustomEndDate,
      })
      return
    }

    this.setData({ activeOverviewPeriod: periodId })
    const trendPeriod = this.data.activePeakPeriod === 'custom' ? 'total' : this.data.activePeakPeriod
    this.loadAnalysis(periodId, trendPeriod)
  },
  onTotalPeakPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) {
    const { id: periodId, index: periodIndex } = event.detail

    if (!totalAnalysisPeriods[periodIndex]) return
    if (periodId === 'custom') {
      this.setData({
        dateRangePickerVisible: true,
        dateRangePickerTarget: 'peak',
        datePickerStartDate: this.data.peakCustomStartDate,
        datePickerEndDate: this.data.peakCustomEndDate,
      })
      return
    }

    this.setData({
      activePeakPeriod: periodId,
      ...buildTotalTrendState(periodId, this.data.analysisData?.totalData?.readTrends?.[getAnalysisReadRange(periodId)] ?? []),
    })
  },
  onPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) {
    const { id: periodId, index: periodIndex } = event.detail

    if (!Number.isInteger(periodIndex) || periodIndex < 0 || periodIndex >= analysisPeriods.length) return
    if (periodId === 'custom') {
      this.setData({
        dateRangePickerVisible: true,
        dateRangePickerTarget: 'work',
        datePickerStartDate: this.data.customStartDate,
        datePickerEndDate: this.data.customEndDate,
      })
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

    const target = this.data.dateRangePickerTarget || (this.data.activeAnalysisTab === 'total' ? 'overview' : 'work')
    this.setData({ dateRangePickerVisible: false })
    if (target === 'overview') {
      this.setData({
        activeOverviewPeriod: 'custom',
        overviewCustomStartDate: dateRange.startDate,
        overviewCustomEndDate: dateRange.endDate,
      })
      const trendPeriod = this.data.activePeakPeriod === 'custom' ? 'total' : this.data.activePeakPeriod
      this.loadAnalysis('custom', trendPeriod, dateRange)
      return
    }
    if (target === 'peak') {
      this.setData({
        activePeakPeriod: 'custom',
        peakCustomStartDate: dateRange.startDate,
        peakCustomEndDate: dateRange.endDate,
        ...buildTotalTrendState('total', this.data.analysisData?.totalData?.readTrends?.total ?? []),
      })
      return
    }

    this.setData({
      activePeriod: 'custom',
      customStartDate: dateRange.startDate,
      customEndDate: dateRange.endDate,
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
    })
    if (this.data.activeAnalysisTab === 'work') {
      const cards = sortAnalysisCards(this.data.allAnalysisCards, sortOption.id)
      this.setData({ allAnalysisCards: cards })
      this.applyAnalysisCardsWindow(cards, LIST_PAGE_SIZE)
      return
    }
    if (this.data.activeAnalysisTab === 'user') {
      const users = capAudienceUsers(
        sortAnalysisUsers(this.data.analysisData?.audienceUsers ?? [], sortOption.id),
        resolveVisitorLimit(this.data.analysisData?.visitorLimit),
      )
      this.applyAnalysisUsersWindow(users, LIST_PAGE_SIZE)
    }
  },
  onAnalysisSortMaskTap() {
    this.setData({ analysisSortSheetVisible: false })
  },
  onCardTap(event: WechatMiniprogram.TouchEvent) {
    const cardId = fromDatasetId(event.currentTarget.dataset.id)
    if (!cardId) return
    wx.navigateTo({ url: `/pages/analysis-detail/index?id=${encodeURIComponent(cardId)}` })
  },
  onAnalysisUserTap(event: WechatMiniprogram.TouchEvent) {
    const userId = fromDatasetId(event.currentTarget.dataset.id)
    if (!userId) return
    wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${userId}` })
  },
})
