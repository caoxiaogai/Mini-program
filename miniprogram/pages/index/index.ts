import { getAnalysisOverview, sortAnalysisCards } from '../../services/analysis'
import { getHomePageData } from '../../services/home'
import { getMaterialDetail, getMaterials } from '../../services/materials'
import { getNotifications } from '../../services/notifications'
import type { AnalysisAudienceUser, AnalysisCard, AnalysisIntentLevel, AnalysisReadRange, AnalysisViewModel, AnalysisWorkSortId } from '../../types/analysis'
import type { HomePageViewModel } from '../../types/home'
import type { MaterialCardViewModel, MaterialsFilterId, MaterialsViewModel } from '../../types/materials'
import type { NotificationFilterId, NotificationGroupViewModel, NotificationsViewModel } from '../../types/notifications'
import type { ProfilePageViewModel } from '../../types/profile'
import { getProfilePageData } from '../../services/profile'
import { getHomeGreeting } from '../../utils/greeting'
import { getHomeHeaderOpacity } from '../../utils/home-header'
import { calculateRankingHeaderOpacity } from '../../utils/ranking'
import { takePendingPublishReturn } from '../../utils/publish-return'
import { buildMaterialSharePath, buildMaterialShareQuery, buildMaterialShareTitle, enableMaterialShareMenu, showMomentsShareGuide } from '../../utils/share-material'
import { markHomeNotificationViewed } from './home-notification-preview'

type HomeTabId = 'home' | 'notifications' | 'materials' | 'analysis' | 'profile'
type AnalysisPeriodId = 'day' | 'week' | 'month' | 'total'
type AnalysisTabId = 'work' | 'user' | 'total'
type AnalysisIntentFilter = 'all' | AnalysisIntentLevel

const tabItems = [
  { id: 'home' as HomeTabId, label: '首页', iconPath: '/assets/home-new/tab-home.svg', activeIconPath: '/assets/home-new/tab-home-active.svg', active: true },
  { id: 'notifications' as HomeTabId, label: '通知', iconPath: '/assets/home-new/tab-notification.svg', activeIconPath: '/assets/home-new/tab-notification-active.svg', badgeCount: 0, active: false },
  { id: 'analysis' as HomeTabId, label: '分析', iconPath: '/assets/home-new/tab-analysis.svg', activeIconPath: '/assets/home-new/tab-analysis-active.svg', active: false },
  { id: 'profile' as HomeTabId, label: '我的', iconPath: '/assets/home-new/tab-profile.svg', activeIconPath: '/assets/home-new/tab-profile-active.svg', active: false },
]

const rootTabIds: HomeTabId[] = ['home', 'notifications', 'materials', 'analysis', 'profile']

const analysisPeriods = [
  { id: 'day' as AnalysisPeriodId, label: '日' },
  { id: 'week' as AnalysisPeriodId, label: '周' },
  { id: 'month' as AnalysisPeriodId, label: '月' },
  { id: 'total' as AnalysisPeriodId, label: '总' },
]

const analysisSortOptions = [
  { id: 'completion' as AnalysisWorkSortId, label: '完播数' },
  { id: 'share' as AnalysisWorkSortId, label: '转发数' },
  { id: 'view' as AnalysisWorkSortId, label: '浏览量' },
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

const totalAnalysisPeriods = [
  { id: 'day' as AnalysisPeriodId, label: '日' },
  { id: 'week' as AnalysisPeriodId, label: '本周' },
  { id: 'month' as AnalysisPeriodId, label: '本月' },
  { id: 'total' as AnalysisPeriodId, label: '总' },
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

function getVisibleMaterials(items: MaterialCardViewModel[], filterId: MaterialsFilterId): MaterialCardViewModel[] {
  return filterId === 'all' ? items : items.filter((item) => item.kind === filterId)
}

Page({
  data: {
    greetingHeadline: getHomeGreeting(),
    greetingSubtitle: '今日阳光明媚，祝你好运☀️',
    homeData: null as HomePageViewModel | null,
    hasNewIntentUsers: false,
    isLoading: true,
    loadError: false,
    tabItems,
    plusActive: false,
    isAndroid: false,
    activeTabIndex: 0,
    homeHeaderOpacity: 0,
    notifications: null as NotificationsViewModel | null,
    activeNotificationFilter: 'all' as NotificationFilterId,
    visibleNotificationGroups: [] as NotificationGroupViewModel[],
    hasVisibleNotificationGroups: false,
    materials: null as MaterialsViewModel | null,
    activeMaterialFilter: 'all' as MaterialsFilterId,
    visibleMaterials: [] as MaterialCardViewModel[],
    hasVisibleMaterials: false,
    materialsHeaderOpacity: 0,
    showPublishSuccessModal: false,
    shareMaterialId: '',
    shareTitle: '',
    shareImageUrl: '',
    analysisData: null as AnalysisViewModel | null,
    analysisTabs,
    activeAnalysisTab: 'work' as AnalysisTabId,
    activeAnalysisTabIndex: 0,
    analysisTabOffset: 0,
    analysisSwipeStartX: 0,
    analysisPeriods,
    activePeriod: 'day' as AnalysisPeriodId,
    analysisSortOptions,
    activeAnalysisSort: 'view' as AnalysisWorkSortId,
    activeAnalysisSortLabel: '浏览量',
    analysisSortSheetVisible: false,
    visibleAnalysisCards: [] as AnalysisCard[],
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
    profileData: null as ProfilePageViewModel | null,
  },
  onLoad(options: Record<string, string | undefined>) {
    const { platform } = wx.getSystemInfoSync()
    this.setData({ isAndroid: platform === 'android' || platform === 'devtools' })

    if (options.tab === 'materials') {
      const shareMaterialId = options.id ?? ''
      this.setData({
        showPublishSuccessModal: options.publishSuccess === '1',
        shareMaterialId,
      })
      this.setActiveTab(2)
      if (shareMaterialId) this.loadShareMaterial(shareMaterialId)
    }
    this.loadHomeData()
    this.loadProfileData()
  },
  onShow() {
    this.setData({ greetingHeadline: getHomeGreeting() })
    enableMaterialShareMenu()
    this.applyPendingPublishReturn()
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
        this.setData({ homeData, hasNewIntentUsers: homeData.intentSummary.total !== '0', tabItems: tabItemsWithBadge, isLoading: false })
      })
      .catch(() => this.setData({ isLoading: false, loadError: true }))
  },
  loadNotifications() {
    getNotifications().then((notifications) => {
      const visibleNotificationGroups = getVisibleNotificationGroups(notifications.groups, this.data.activeNotificationFilter)
      this.setData({ notifications, visibleNotificationGroups, hasVisibleNotificationGroups: visibleNotificationGroups.length > 0 })
    })
  },
  loadMaterials() {
    getMaterials().then((materials) => {
      const visibleMaterials = getVisibleMaterials(materials.items, this.data.activeMaterialFilter)
      this.setData({ materials, visibleMaterials, hasVisibleMaterials: visibleMaterials.length > 0 })
    })
  },
  loadShareMaterial(materialId: string) {
    getMaterialDetail(materialId).then((detail) => {
      if (!detail) return
      this.setData({
        shareMaterialId: detail.id,
        shareTitle: buildMaterialShareTitle(detail.descriptionLines),
        shareImageUrl: detail.previewUrl,
      })
    })
  },
  applyPendingPublishReturn() {
    const pending = takePendingPublishReturn()
    if (!pending) return

    this.setData({
      showPublishSuccessModal: pending.showSuccessModal,
      shareMaterialId: pending.materialId,
    })
    this.setActiveTab(2)
    this.loadMaterials()
    if (pending.showSuccessModal && pending.materialId) this.loadShareMaterial(pending.materialId)
  },
  loadAnalysis(period: AnalysisPeriodId = this.data.activePeriod) {
    getAnalysisOverview(period).then((analysisData) => {
      const visibleAnalysisUsers = getVisibleAnalysisUsers(analysisData.audienceUsers, this.data.activeAnalysisIntent)
      const visibleAnalysisCards = sortAnalysisCards(analysisData.cards, this.data.activeAnalysisSort)
      this.setData({ analysisData, visibleAnalysisCards, visibleAnalysisUsers, hasAnalysisCards: visibleAnalysisCards.length > 0, hasAnalysisUsers: visibleAnalysisUsers.length > 0, visibleAnalysisReadTrend: analysisData.totalData.readTrends[this.data.activeAnalysisReadRange] })
    })
  },
  loadProfileData() {
    getProfilePageData()
      .then((profileData) => this.setData({ profileData }))
      .catch(() => this.setData({ profileData: null }))
  },
  setActiveTab(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= rootTabIds.length) return
    const nextIndex = index
    const id = rootTabIds[index]
    const activeItems = this.data.tabItems.map((item) => ({ ...item, active: item.id === id }))
    this.setData({ activeTabIndex: nextIndex, tabItems: activeItems, plusActive: id === 'materials' })
    if (id === 'notifications' && !this.data.notifications) this.loadNotifications()
    if (id === 'materials' && !this.data.materials) this.loadMaterials()
    if (id === 'analysis' && !this.data.analysisData) this.loadAnalysis()
  },
  onTabTap(event: WechatMiniprogram.CustomEvent<{ id?: HomeTabId }>) {
    const id = event.detail?.id ?? (event.currentTarget.dataset.id as HomeTabId | undefined)
    const index = rootTabIds.findIndex((tabId) => tabId === id)
    this.setActiveTab(index)
  },
  onRetryTap() {
    this.loadHomeData()
  },
  onNotificationTap(event: WechatMiniprogram.TouchEvent) {
    const notificationId = event.currentTarget.dataset.id as string | undefined
    const userId = event.currentTarget.dataset.userId as string | undefined

    if (notificationId && this.data.homeData) {
      const homeData = markHomeNotificationViewed(this.data.homeData, notificationId)
      const tabItems = this.data.tabItems.map((item) => item.id === 'notifications' ? { ...item, badgeCount: homeData.unreadNotificationCount } : item)
      this.setData({ homeData, tabItems })
    }

    if (userId) wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${userId}` })
  },
  onRankingEntryTap() {
    wx.navigateTo({ url: '/pages/ranking/index' })
  },
  onTodayMostTap() {
    this.setActiveTab(3)
    this.setAnalysisTab(0)
  },
  onIntentSummaryTap() {
    this.setActiveTab(3)
    this.setAnalysisTab(1)
  },
  onTodayDataTap() {
    this.setActiveTab(3)
    this.setAnalysisTab(2)
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
    this.setData({ activePeriod: event.detail.id })
    this.loadAnalysis(event.detail.id)
  },
  onTotalAnalysisPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) {
    if (!totalAnalysisPeriods[event.detail.index]) return
    const readRange: AnalysisReadRange = event.detail.id === 'month' ? 'month' : 'week'

    this.setData({
      activeTotalPeriod: event.detail.id,
      activeAnalysisReadRange: readRange,
    })
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
    this.setData({ activeAnalysisIntent: selectedTab.id, analysisIntentIndex: index, visibleAnalysisUsers, hasAnalysisUsers: visibleAnalysisUsers.length > 0 })
  },
  onAnalysisSortTap() { this.setData({ analysisSortSheetVisible: !this.data.analysisSortSheetVisible }) },
  onAnalysisSortOptionTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisWorkSortId }>) {
    const option = analysisSortOptions.find((item) => item.id === event.detail.id)
    if (!option) return
    this.setData({
      activeAnalysisSort: option.id,
      activeAnalysisSortLabel: option.label,
      analysisSortSheetVisible: false,
      visibleAnalysisCards: sortAnalysisCards(this.data.analysisData?.cards ?? [], option.id),
    })
  },
  onAnalysisSortMaskTap() { this.setData({ analysisSortSheetVisible: false }) },
  onAnalysisCardTap(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    if (event.detail.id) wx.navigateTo({ url: `/pages/analysis-detail/index?id=${event.detail.id}` })
  },
  onAnalysisUserTap(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    if (!event.detail.id) return
    wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${event.detail.id}` })
  },
  onMaterialsScroll(event: WechatMiniprogram.ScrollViewScrollEvent) {
    const materialsHeaderOpacity = calculateRankingHeaderOpacity(event.detail.scrollTop)
    if (materialsHeaderOpacity === this.data.materialsHeaderOpacity) return
    this.setData({ materialsHeaderOpacity })
  },
  onMaterialFilterTap(event: WechatMiniprogram.TouchEvent) {
    const filterId = event.currentTarget.dataset.id as MaterialsFilterId
    if (!['all', 'image', 'video', 'pdf'].includes(filterId)) return

    const visibleMaterials = getVisibleMaterials(this.data.materials?.items ?? [], filterId)
    this.setData({ activeMaterialFilter: filterId, visibleMaterials, hasVisibleMaterials: visibleMaterials.length > 0 })
  },
  onMaterialCardTap(event: WechatMiniprogram.TouchEvent) {
    const materialId = event.currentTarget.dataset.id as string | undefined
    if (!materialId) return

    const material = this.data.visibleMaterials.find((item) => item.id === materialId)
    if (!material) return

    const url = material.isDraft
      ? `/pages/materials/publish/index?id=${materialId}`
      : `/pages/material-detail/index?id=${materialId}`
    wx.navigateTo({ url })
  },
  onMaterialPublishTap() {
    wx.navigateTo({ url: '/pages/materials/publish/index' })
  },
  onPublishSuccessClose() {
    this.setData({
      showPublishSuccessModal: false,
      shareMaterialId: '',
      shareTitle: '',
      shareImageUrl: '',
    })
  },
  onShareAppMessage() {
    if (!this.data.shareMaterialId) return

    return {
      title: this.data.shareTitle,
      path: buildMaterialSharePath(this.data.shareMaterialId),
      imageUrl: this.data.shareImageUrl || undefined,
    }
  },
  onShareTimeline() {
    if (!this.data.shareMaterialId) return

    return {
      title: this.data.shareTitle,
      query: buildMaterialShareQuery(this.data.shareMaterialId),
      imageUrl: this.data.shareImageUrl || undefined,
    }
  },
  onShareMomentsTap() {
    showMomentsShareGuide()
  },
  onPlusTap() {
    this.setActiveTab(2)
  },
})
