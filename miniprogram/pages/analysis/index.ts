import { getAnalysisOverview } from '../../services/analysis'
import type { AnalysisAudienceUser, AnalysisIntentLevel, AnalysisReadRange, AnalysisViewModel } from '../../types/analysis'

type AnalysisPeriodId = 'day' | 'week' | 'month' | 'total'

interface AnalysisPeriodOption {
  id: AnalysisPeriodId
  label: string
}

const analysisPeriods: AnalysisPeriodOption[] = [
  { id: 'day', label: '日' },
  { id: 'week', label: '周' },
  { id: 'month', label: '月' },
  { id: 'total', label: '总' },
]

type AnalysisTabId = 'work' | 'user' | 'total'
type AnalysisIntentFilter = 'all' | AnalysisIntentLevel

interface AnalysisTabOption {
  id: AnalysisTabId
  label: string
}

interface AnalysisIntentTabOption {
  id: AnalysisIntentFilter
  label: string
}

const analysisTabs: AnalysisTabOption[] = [
  { id: 'work', label: '作品分析' },
  { id: 'user', label: '用户分析' },
  { id: 'total', label: '总数据' },
]

const analysisIntentTabs: AnalysisIntentTabOption[] = [
  { id: 'all', label: '全部' },
  { id: 'high', label: '高意向' },
  { id: 'medium', label: '中意向' },
  { id: 'low', label: '低意向' },
]

const analysisReadRanges: Array<{ id: AnalysisReadRange; label: string }> = [
  { id: 'week', label: '本周' },
  { id: 'month', label: '本月' },
]

const analysisSwipeThreshold = 40

const getVisibleAnalysisUsers = (users: AnalysisAudienceUser[], filter: AnalysisIntentFilter) => {
  if (filter === 'all') return users
  return users.filter((user) => user.level === filter)
}

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
    activePeriodOffset: 0,
    analysisIntentTabs,
    activeAnalysisIntent: 'all' as AnalysisIntentFilter,
    analysisIntentIndex: 0,
    analysisIntentOffset: 0,
    analysisIntentSwipeStartX: 0,
    visibleAnalysisUsers: [] as AnalysisAudienceUser[],
    hasAnalysisCards: false,
    hasAnalysisUsers: false,
    analysisReadRanges,
    activeAnalysisReadRange: 'week' as AnalysisReadRange,
    visibleAnalysisReadTrend: [] as AnalysisViewModel['totalData']['readTrends']['week'],
  },
  onLoad(options: Record<string, string | undefined>) {
    const analysisTabIndex = Math.max(0, analysisTabs.findIndex((tab) => tab.id === options.tab))

    this.setData({
      activeAnalysisTab: analysisTabs[analysisTabIndex].id,
      activeAnalysisTabIndex: analysisTabIndex,
      analysisTabOffset: analysisTabIndex * 100,
    })

    this.loadAnalysis(this.data.activePeriod)
  },
  loadAnalysis(period: AnalysisPeriodId) {
    getAnalysisOverview(period).then((analysisData) => {
      const activeIntent = analysisIntentTabs[this.data.analysisIntentIndex]?.id ?? 'all'
      const visibleAnalysisUsers = getVisibleAnalysisUsers(analysisData.audienceUsers, activeIntent)

      this.setData({
        analysisData,
        visibleAnalysisUsers,
        hasAnalysisCards: analysisData.cards.length > 0,
        hasAnalysisUsers: visibleAnalysisUsers.length > 0,
        visibleAnalysisReadTrend: analysisData.totalData.readTrends[this.data.activeAnalysisReadRange],
      })
    })
  },
  onAnalysisTabTap(event: WechatMiniprogram.TouchEvent) {
    this.setAnalysisTab(Number(event.currentTarget.dataset.index))
  },
  onAnalysisTouchStart(event: WechatMiniprogram.TouchEvent) {
    this.setData({ analysisSwipeStartX: event.touches[0]?.clientX ?? 0 })
  },
  onAnalysisTouchEnd(event: WechatMiniprogram.TouchEvent) {
    const startX = this.data.analysisSwipeStartX
    const endX = event.changedTouches[0]?.clientX ?? startX
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
  onAnalysisIntentTap(event: WechatMiniprogram.TouchEvent) {
    this.setAnalysisIntentFilter(Number(event.currentTarget.dataset.index))
  },
  onAnalysisIntentTouchStart(event: WechatMiniprogram.TouchEvent) {
    this.setData({ analysisIntentSwipeStartX: event.touches[0]?.clientX ?? 0 })
  },
  onAnalysisIntentTouchEnd(event: WechatMiniprogram.TouchEvent) {
    const startX = this.data.analysisIntentSwipeStartX
    const endX = event.changedTouches[0]?.clientX ?? startX
    const distance = endX - startX

    if (Math.abs(distance) < analysisSwipeThreshold) return
    this.setAnalysisIntentFilter(this.data.analysisIntentIndex + (distance < 0 ? 1 : -1))
  },
  setAnalysisIntentFilter(index: number) {
    const selectedTab = analysisIntentTabs[index]
    const users = this.data.analysisData?.audienceUsers ?? []

    if (!selectedTab) return

    const visibleUsers = getVisibleAnalysisUsers(users, selectedTab.id)

    this.setData({
      activeAnalysisIntent: selectedTab.id,
      analysisIntentIndex: index,
      analysisIntentOffset: index * 100,
      visibleAnalysisUsers: visibleUsers,
      hasAnalysisUsers: visibleUsers.length > 0,
    })
  },
  onAnalysisRangeTap(event: WechatMiniprogram.TouchEvent) {
    const range = event.currentTarget.dataset.id as AnalysisReadRange
    const readTrend = this.data.analysisData?.totalData.readTrends[range]

    if (!readTrend) return

    this.setData({
      activeAnalysisReadRange: range,
      visibleAnalysisReadTrend: readTrend,
    })
  },
  onPeriodTap(event: WechatMiniprogram.TouchEvent) {
    const periodId = event.currentTarget.dataset.id as AnalysisPeriodId
    const periodIndex = Number(event.currentTarget.dataset.index)

    if (!Number.isInteger(periodIndex) || periodIndex < 0 || periodIndex >= analysisPeriods.length) return

    this.setData({
      activePeriod: periodId,
      activePeriodOffset: periodIndex * 68,
    })

    this.loadAnalysis(periodId)
  },
  onCardTap(event: WechatMiniprogram.TouchEvent) {
    const cardId = event.currentTarget.dataset.id as string

    wx.navigateTo({ url: `/pages/analysis-detail/index?id=${cardId}` })
  },
  onAnalysisUserTap(event: WechatMiniprogram.TouchEvent) {
    const userId = event.currentTarget.dataset.id as string
    const updatedUsers = this.data.visibleAnalysisUsers.map((user) => user.id === userId ? { ...user, showMarker: false } : user)

    this.setData({ visibleAnalysisUsers: updatedUsers })

    wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${userId}` })
  },
})
