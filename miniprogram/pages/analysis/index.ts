import { getAnalysisOverview } from '../../services/analysis'
import type { AnalysisAudienceUser, AnalysisIntentLevel, AnalysisReadRange, AnalysisViewModel } from '../../types/analysis'

type AnalysisPeriodId = 'day' | 'week' | 'month' | 'total'

type AnalysisSortId = 'completion' | 'share' | 'view'

interface AnalysisPeriodOption {
  id: AnalysisPeriodId
  label: string
}

interface AnalysisSortOption {
  id: AnalysisSortId
  label: string
}

const analysisPeriods: AnalysisPeriodOption[] = [
  { id: 'day', label: '日' },
  { id: 'week', label: '周' },
  { id: 'month', label: '月' },
  { id: 'total', label: '总' },
]

const totalAnalysisPeriods: AnalysisPeriodOption[] = [
  { id: 'day', label: '日' },
  { id: 'week', label: '本周' },
  { id: 'month', label: '本月' },
  { id: 'total', label: '总' },
]

const analysisSortOptions: AnalysisSortOption[] = [
  { id: 'completion', label: '完播数' },
  { id: 'share', label: '转发数' },
  { id: 'view', label: '浏览量' },
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
    analysisSortOptions,
    activeAnalysisSort: 'view' as AnalysisSortId,
    activeAnalysisSortLabel: '阅读量',
    analysisSortSheetVisible: false,
    analysisIntentTabs,
    activeAnalysisIntent: 'all' as AnalysisIntentFilter,
    analysisIntentIndex: 0,
    analysisIntentSwipeStartX: 0,
    visibleAnalysisUsers: [] as AnalysisAudienceUser[],
    hasAnalysisCards: false,
    hasAnalysisUsers: false,
    totalAnalysisPeriods,
    activeTotalPeriod: 'total' as AnalysisPeriodId,
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
  onAnalysisIntentTap(event: WechatMiniprogram.CustomEvent<{ index: number }>) {
    this.setAnalysisIntentFilter(event.detail.index)
  },
  onAnalysisIntentTouchStart(event: WechatMiniprogram.CustomEvent<{ clientX: number }>) {
    this.setData({ analysisIntentSwipeStartX: event.detail.clientX })
  },
  onAnalysisIntentTouchEnd(event: WechatMiniprogram.CustomEvent<{ clientX: number }>) {
    const startX = this.data.analysisIntentSwipeStartX
    const endX = event.detail.clientX
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
      visibleAnalysisUsers: visibleUsers,
      hasAnalysisUsers: visibleUsers.length > 0,
    })
  },
  onTotalPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) {
    const { id: periodId, index: periodIndex } = event.detail
    const readRange: AnalysisReadRange = periodId === 'month' ? 'month' : 'week'

    if (!totalAnalysisPeriods[periodIndex]) return

    this.setData({
      activeTotalPeriod: periodId,
      activeAnalysisReadRange: readRange,
    })
    this.loadAnalysis(periodId)
  },
  onPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) {
    const { id: periodId, index: periodIndex } = event.detail

    if (!Number.isInteger(periodIndex) || periodIndex < 0 || periodIndex >= analysisPeriods.length) return

    this.setData({
      activePeriod: periodId,
    })

    this.loadAnalysis(periodId)
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
  },
  onAnalysisSortMaskTap() {
    this.setData({ analysisSortSheetVisible: false })
  },
  onCardTap(event: WechatMiniprogram.TouchEvent) {
    const cardId = event.currentTarget.dataset.id as string

    wx.navigateTo({ url: `/pages/analysis-detail/index?id=${cardId}` })
  },
  onAnalysisUserTap(event: WechatMiniprogram.TouchEvent) {
    const userId = event.currentTarget.dataset.id as string
    wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${userId}` })
  },
})
