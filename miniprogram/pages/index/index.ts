import { getAnalysisOverview } from '../../services/analysis'
import { getHomePageData } from '../../services/home'
import { getNotifications } from '../../services/notifications'
import type { AnalysisAudienceUser, AnalysisIntentLevel, AnalysisReadRange, AnalysisViewModel } from '../../types/analysis'
import type { HomePageViewModel } from '../../types/home'
import type { NotificationFilterId, NotificationGroupViewModel, NotificationsViewModel } from '../../types/notifications'
import { getHomeGreeting } from '../../utils/greeting'
import { getHomeHeaderOpacity } from '../../utils/home-header'

type HomeTabId = 'home' | 'notifications' | 'analysis' | 'profile'
type AnalysisPeriodId = 'day' | 'week' | 'month' | 'total'
type AnalysisSortId = 'completion' | 'share' | 'view'
type AnalysisTabId = 'work' | 'user' | 'total'
type AnalysisIntentFilter = 'all' | AnalysisIntentLevel

const tabItems = [
  { id: 'home' as HomeTabId, label: '首页', iconPath: '/assets/home-new/tab-home.svg', activeIconPath: '/assets/home-new/tab-home-active.svg', active: true },
  { id: 'notifications' as HomeTabId, label: '通知', iconPath: '/assets/home-new/tab-notification.svg', activeIconPath: '/assets/home-new/tab-notification-active.svg', badgeCount: 0, active: false },
  { id: 'analysis' as HomeTabId, label: '分析', iconPath: '/assets/home-new/tab-analysis.svg', activeIconPath: '/assets/home-new/tab-analysis-active.svg', active: false },
  { id: 'profile' as HomeTabId, label: '我的', iconPath: '/assets/home-new/tab-profile.svg', activeIconPath: '/assets/home-new/tab-profile-active.svg', active: false },
]

const analysisPeriods = [
  { id: 'day' as AnalysisPeriodId, label: '日' },
  { id: 'week' as AnalysisPeriodId, label: '周' },
  { id: 'month' as AnalysisPeriodId, label: '月' },
  { id: 'total' as AnalysisPeriodId, label: '总' },
]

const analysisSortOptions = [
  { id: 'completion' as AnalysisSortId, label: '完播数' },
  { id: 'share' as AnalysisSortId, label: '转发数' },
  { id: 'view' as AnalysisSortId, label: '浏览量' },
]

const analysisTabs = [
  { id: 'work' as AnalysisTabId, label: '作品分析' },
  { id: 'user' as AnalysisTabId, label: '用户分析' },
  { id: 'total' as AnalysisTabId, label: '总数据' },
]

const analysisIntentTabs = [
  { id: 'all' as AnalysisIntentFilter, label: '全部' },
  { id: 'high' as AnalysisIntentFilter, label: '高意向' },
  { id: 'medium' as AnalysisIntentFilter, label: '中意向' },
  { id: 'low' as AnalysisIntentFilter, label: '低意向' },
]

const analysisReadRanges: Array<{ id: AnalysisReadRange; label: string }> = [
  { id: 'week', label: '本周' },
  { id: 'month', label: '本月' },
]

const analysisSwipeThreshold = 40

function getVisibleNotificationGroups(groups: NotificationGroupViewModel[], filterId: NotificationFilterId) {
  return groups
    .map((group) => ({ ...group, items: filterId === 'all' ? group.items : group.items.filter((notification) => notification.intent === filterId) }))
    .filter((group) => group.items.length > 0)
}

function getVisibleAnalysisUsers(users: AnalysisAudienceUser[], filter: AnalysisIntentFilter) {
  if (filter === 'all') return users
  return users.filter((user) => user.level === filter)
}

Page({
  data: {
    greetingHeadline: getHomeGreeting(),
    greetingSubtitle: '今日阳光明媚，祝你好运☀️',
    homeData: null as HomePageViewModel | null,
    isLoading: true,
    loadError: false,
    tabItems,
    activeTabIndex: 0,
    homeHeaderOpacity: 0,
    notifications: null as NotificationsViewModel | null,
    activeNotificationFilter: 'all' as NotificationFilterId,
    visibleNotificationGroups: [] as NotificationGroupViewModel[],
    hasVisibleNotificationGroups: false,
    analysisData: null as AnalysisViewModel | null,
    analysisTabs,
    activeAnalysisTab: 'work' as AnalysisTabId,
    activeAnalysisTabIndex: 0,
    analysisTabOffset: 0,
    analysisSwipeStartX: 0,
    analysisPeriods,
    activePeriod: 'day' as AnalysisPeriodId,
    activePeriodOffset: 0,
    analysisSortOptions,
    activeAnalysisSort: 'view' as AnalysisSortId,
    activeAnalysisSortLabel: '阅读量',
    analysisSortSheetVisible: false,
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
  onLoad() {
    this.loadHomeData()
  },
  onShow() {
    this.setData({ greetingHeadline: getHomeGreeting() })
  },
  onHomeScroll(event: WechatMiniprogram.ScrollViewScrollEvent) {
    const homeHeaderOpacity = getHomeHeaderOpacity(event.detail.scrollTop)
    if (homeHeaderOpacity === this.data.homeHeaderOpacity) return
    this.setData({ homeHeaderOpacity })
  },
  loadHomeData() {
    this.setData({ isLoading: true, loadError: false })
    getHomePageData()
      .then((homeData) => {
        const tabItemsWithBadge = this.data.tabItems.map((item) => item.id === 'notifications' ? { ...item, badgeCount: homeData.unreadNotificationCount } : item)
        this.setData({ homeData, tabItems: tabItemsWithBadge, isLoading: false })
      })
      .catch(() => this.setData({ isLoading: false, loadError: true }))
  },
  loadNotifications() {
    getNotifications().then((notifications) => {
      const visibleNotificationGroups = getVisibleNotificationGroups(notifications.groups, this.data.activeNotificationFilter)
      this.setData({ notifications, visibleNotificationGroups, hasVisibleNotificationGroups: visibleNotificationGroups.length > 0 })
    })
  },
  loadAnalysis(period: AnalysisPeriodId = this.data.activePeriod) {
    getAnalysisOverview(period).then((analysisData) => {
      const visibleAnalysisUsers = getVisibleAnalysisUsers(analysisData.audienceUsers, this.data.activeAnalysisIntent)
      this.setData({ analysisData, visibleAnalysisUsers, hasAnalysisCards: analysisData.cards.length > 0, hasAnalysisUsers: visibleAnalysisUsers.length > 0, visibleAnalysisReadTrend: analysisData.totalData.readTrends[this.data.activeAnalysisReadRange] })
    })
  },
  setActiveTab(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= tabItems.length) return
    const nextIndex = index
    const activeItems = this.data.tabItems.map((item, itemIndex) => ({ ...item, active: itemIndex === index }))
    this.setData({ activeTabIndex: nextIndex, tabItems: activeItems })
    const id = tabItems[index].id
    if (id === 'notifications' && !this.data.notifications) this.loadNotifications()
    if (id === 'analysis' && !this.data.analysisData) this.loadAnalysis()
  },
  onTabTap(event: WechatMiniprogram.CustomEvent<{ id: HomeTabId }>) {
    const index = tabItems.findIndex((item) => item.id === event.detail.id)
    this.setActiveTab(index)
  },
  onTabChange(event: WechatMiniprogram.CustomEvent<{ current: string }>) {
    this.setActiveTab(Number(event.detail.current))
  },
  onRetryTap() {
    this.loadHomeData()
  },
  onNotificationTap(event: WechatMiniprogram.TouchEvent) {
    const userId = event.currentTarget.dataset.userId as string | undefined
    if (userId) wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${userId}` })
  },
  onContentTap(event: WechatMiniprogram.TouchEvent) {
    const contentId = event.currentTarget.dataset.id as string | undefined
    if (contentId) wx.navigateTo({ url: `/pages/analysis-detail/index?id=${contentId}` })
  },
  onRankingEntryTap() {
    wx.navigateTo({ url: '/pages/ranking/index' })
  },
  onNotificationFilterTap(event: WechatMiniprogram.CustomEvent<{ filterId: NotificationFilterId }>) {
    const filterId = event.detail.filterId
    if (!['all', 'high', 'medium', 'low'].includes(filterId)) return
    const visibleNotificationGroups = getVisibleNotificationGroups(this.data.notifications?.groups ?? [], filterId)
    this.setData({ activeNotificationFilter: filterId, visibleNotificationGroups, hasVisibleNotificationGroups: visibleNotificationGroups.length > 0 })
  },
  onNotificationCardTap(event: WechatMiniprogram.CustomEvent<{ userId: string }>) {
    if (event.detail.userId) wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${event.detail.userId}` })
  },
  onNotificationContactAction() {},
  onAnalysisTabTap(event: WechatMiniprogram.CustomEvent<{ index: number }>) { this.setAnalysisTab(event.detail.index) },
  onAnalysisTouchStart(event: WechatMiniprogram.CustomEvent<{ clientX: number }>) { this.setData({ analysisSwipeStartX: event.detail.clientX }) },
  onAnalysisTouchEnd(event: WechatMiniprogram.CustomEvent<{ clientX: number }>) {
    const distance = event.detail.clientX - this.data.analysisSwipeStartX
    if (Math.abs(distance) >= analysisSwipeThreshold) this.setAnalysisTab(this.data.activeAnalysisTabIndex + (distance < 0 ? 1 : -1))
  },
  setAnalysisTab(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= analysisTabs.length) return
    this.setData({ activeAnalysisTab: analysisTabs[index].id, activeAnalysisTabIndex: index, analysisTabOffset: index * 100 })
  },
  onAnalysisPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) {
    if (!analysisPeriods[event.detail.index]) return
    this.setData({ activePeriod: event.detail.id, activePeriodOffset: event.detail.index * 68 })
    this.loadAnalysis(event.detail.id)
  },
  onAnalysisIntentTap(event: WechatMiniprogram.CustomEvent<{ index: number }>) { this.setAnalysisIntentFilter(event.detail.index) },
  onAnalysisIntentTouchStart(event: WechatMiniprogram.CustomEvent<{ clientX: number }>) { this.setData({ analysisIntentSwipeStartX: event.detail.clientX }) },
  onAnalysisIntentTouchEnd(event: WechatMiniprogram.CustomEvent<{ clientX: number }>) {
    const distance = event.detail.clientX - this.data.analysisIntentSwipeStartX
    if (Math.abs(distance) >= analysisSwipeThreshold) this.setAnalysisIntentFilter(this.data.analysisIntentIndex + (distance < 0 ? 1 : -1))
  },
  setAnalysisIntentFilter(index: number) {
    const selectedTab = analysisIntentTabs[index]
    if (!selectedTab) return
    const visibleAnalysisUsers = getVisibleAnalysisUsers(this.data.analysisData?.audienceUsers ?? [], selectedTab.id)
    this.setData({ activeAnalysisIntent: selectedTab.id, analysisIntentIndex: index, analysisIntentOffset: index * 100, visibleAnalysisUsers, hasAnalysisUsers: visibleAnalysisUsers.length > 0 })
  },
  onAnalysisRangeTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisReadRange }>) {
    const readTrend = this.data.analysisData?.totalData.readTrends[event.detail.id]
    if (readTrend) this.setData({ activeAnalysisReadRange: event.detail.id, visibleAnalysisReadTrend: readTrend })
  },
  onAnalysisSortTap() { this.setData({ analysisSortSheetVisible: !this.data.analysisSortSheetVisible }) },
  onAnalysisSortOptionTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisSortId }>) {
    const option = analysisSortOptions.find((item) => item.id === event.detail.id)
    if (option) this.setData({ activeAnalysisSort: option.id, activeAnalysisSortLabel: option.label, analysisSortSheetVisible: false })
  },
  onAnalysisSortMaskTap() { this.setData({ analysisSortSheetVisible: false }) },
  onAnalysisCardTap(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    if (event.detail.id) wx.navigateTo({ url: `/pages/analysis-detail/index?id=${event.detail.id}` })
  },
  onAnalysisUserTap(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    if (!event.detail.id) return
    const visibleAnalysisUsers = this.data.visibleAnalysisUsers.map((user) => user.id === event.detail.id ? { ...user, showMarker: false } : user)
    this.setData({ visibleAnalysisUsers })
    wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${event.detail.id}` })
  },
  onPlusTap() {
    wx.navigateTo({ url: '/pages/materials/publish/index' })
  },
})
