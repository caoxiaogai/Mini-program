import { runAuthed } from '../../services/auth'
import { getAnalysisOverview, getAnalysisWorkList, sortAnalysisCards } from '../../services/analysis'
import { getHomePageData } from '../../services/home'
import { getMaterialDetail, getMaterials } from '../../services/materials'
import { getNotifications } from '../../services/notifications'
import type { AnalysisAudienceUser, AnalysisViewModel } from '../../types/analysis'
import type { HomePageViewModel } from '../../types/home'
import type { MaterialCardViewModel, MaterialsFilterId, MaterialsViewModel } from '../../types/materials'
import type { NotificationFilterId, NotificationGroupViewModel, NotificationsViewModel } from '../../types/notifications'
import type { ProfilePageViewModel } from '../../types/profile'
import { getProfilePageData } from '../../services/profile'
import { getHomeGreeting } from '../../utils/greeting'
import { getHomeHeaderOpacity } from '../../utils/home-header'
import { calculateRankingHeaderOpacity } from '../../utils/ranking'
import { getDateRangeLimits, getDefaultDateRange } from '../../utils/date-range'
import type { DateRange } from '../../utils/date-range'
import { sortAnalysisUsers } from '../../utils/analysis-users'
import { buildTotalTrendState, getAnalysisReadRange } from '../../utils/analysis-trend'
import { takePendingPublishReturn } from '../../utils/publish-return'
import { runPullRefresh } from '../../utils/pull-refresh'
import { buildMaterialDetailPath, buildMaterialPublishPath, buildMaterialSharePath, buildMaterialShareQuery, buildMaterialShareTitle, enableMaterialShareMenu, HOME_PAGE_PATH, pickShareImageUrl, showMomentsShareGuide } from '../../utils/share-material'
import { persistViewedNotification } from '../../utils/notification-viewed'
import { fromDatasetId } from '../../utils/dataset-id'
import { markHomeNotificationViewed } from './home-notification-preview'
import { buildReturnPath } from '../../utils/auth'

type HomeTabId = 'home' | 'notifications' | 'materials' | 'analysis' | 'profile'
type AnalysisPeriodId = 'day' | 'week' | 'month' | 'total' | 'custom'
type AnalysisSortId = 'completion' | 'share' | 'view'
type AnalysisTabId = 'work' | 'user' | 'total'

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
  { id: 'custom' as AnalysisPeriodId, label: '', iconPath: '/assets/analysis/calendar-filter.svg' },
]

const defaultDateRange = getDefaultDateRange()
const dateRangeLimits = getDateRangeLimits()

const analysisSortOptions = [
  { id: 'completion' as AnalysisSortId, label: '完播数' },
  { id: 'share' as AnalysisSortId, label: '转发数' },
  { id: 'view' as AnalysisSortId, label: '浏览次数' },
]

const analysisTabs = [
  { id: 'work' as AnalysisTabId, label: '作品分析' },
  { id: 'user' as AnalysisTabId, label: '用户分析' },
  { id: 'total' as AnalysisTabId, label: '总数据' },
]

const totalAnalysisPeriods = [
  { id: 'day' as AnalysisPeriodId, label: '日' },
  { id: 'week' as AnalysisPeriodId, label: '本周' },
  { id: 'month' as AnalysisPeriodId, label: '本月' },
  { id: 'total' as AnalysisPeriodId, label: '总' },
]

const defaultTrendState = buildTotalTrendState('total')

const analysisSwipeThreshold = 40

function getVisibleNotificationGroups(groups: NotificationGroupViewModel[], filterId: NotificationFilterId) {
  return groups
    .map((group) => ({ ...group, items: filterId === 'all' ? group.items : group.items.filter((notification) => notification.intent === filterId) }))
    .filter((group) => group.items.length > 0)
}

function getVisibleMaterials(items: MaterialCardViewModel[], filterId: MaterialsFilterId): MaterialCardViewModel[] {
  return filterId === 'all' ? items : items.filter((item) => item.kind === filterId)
}

Page({
  publishSuccessShared: false,
  authReady: false,
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
    shareTrackingId: '',
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
    profileData: null as ProfilePageViewModel | null,
    pullRefreshing: false,
  },
  onLoad(options: Record<string, string | undefined>) {
    const { platform } = wx.getSystemInfoSync()
    this.setData({ isAndroid: platform === 'android' || platform === 'devtools' })
    runAuthed(buildReturnPath(HOME_PAGE_PATH, options), () => this.startHome(options))
  },
  startHome(options: Record<string, string | undefined>) {
    this.authReady = true

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
    this.refreshAuthenticatedHome()
  },
  onShow() {
    if (!this.authReady) return
    this.refreshAuthenticatedHome()
  },
  refreshAuthenticatedHome() {
    this.setData({ greetingHeadline: getHomeGreeting() })
    enableMaterialShareMenu()
    this.applyPendingPublishReturn()
    this.closePublishSuccessModalAfterShareReturn()
    this.loadHomeData(true)
    if (rootTabIds[this.data.activeTabIndex] === 'notifications') {
      this.loadNotifications()
    }
  },
  onHomeScroll(event: WechatMiniprogram.ScrollViewScrollEvent) {
    const homeHeaderOpacity = getHomeHeaderOpacity(event.detail.scrollTop)
    if (homeHeaderOpacity === this.data.homeHeaderOpacity) return
    this.setData({ homeHeaderOpacity })
  },
  loadHomeData(silent = false) {
    if (!silent) this.setData({ isLoading: true, loadError: false })
    return getHomePageData()
      .then((homeData) => {
        const tabItemsWithBadge = this.data.tabItems.map((item) => item.id === 'notifications' ? { ...item, badgeCount: homeData.unreadNotificationCount } : item)
        this.setData({ homeData, hasNewIntentUsers: homeData.intentSummary.total !== '0', tabItems: tabItemsWithBadge, isLoading: false, loadError: false })
      })
      .catch(() => {
        if (!silent) this.setData({ isLoading: false, loadError: true })
      })
  },
  loadNotifications() {
    return getNotifications().then((notifications) => {
      const visibleNotificationGroups = getVisibleNotificationGroups(notifications.groups, this.data.activeNotificationFilter)
      this.setData({ notifications, visibleNotificationGroups, hasVisibleNotificationGroups: visibleNotificationGroups.length > 0 })
    })
  },
  loadMaterials() {
    return getMaterials().then((materials) => {
      const visibleMaterials = getVisibleMaterials(materials.items, this.data.activeMaterialFilter)
      this.setData({ materials, visibleMaterials, hasVisibleMaterials: visibleMaterials.length > 0 })
    })
  },
  loadShareMaterial(materialId: string) {
    getMaterialDetail(materialId).then((detail) => {
      if (!detail) return
      this.setData({
        shareMaterialId: detail.id,
        shareTrackingId: detail.trackingId,
        shareTitle: buildMaterialShareTitle(detail.descriptionLines),
        shareImageUrl: detail.previewUrl || this.data.shareImageUrl,
      })
    })
  },
  applyPendingPublishReturn() {
    const pending = takePendingPublishReturn()
    if (!pending) return

    this.publishSuccessShared = false
    this.setData({
      showPublishSuccessModal: pending.showSuccessModal,
      shareMaterialId: pending.materialId,
      shareTitle: pending.shareTitle || this.data.shareTitle,
      shareImageUrl: pending.shareImageUrl || this.data.shareImageUrl,
      shareTrackingId: pending.shareTrackingId || this.data.shareTrackingId,
    })
    this.setActiveTab(2)
    this.loadMaterials()
    if (pending.showSuccessModal && pending.materialId) this.loadShareMaterial(pending.materialId)
  },
  resolveWorkDateRange(period: AnalysisPeriodId, dateRange?: DateRange): DateRange | undefined {
    if (period !== 'custom') return dateRange
    return dateRange ?? { startDate: this.data.customStartDate, endDate: this.data.customEndDate }
  },
  loadAnalysis(period: AnalysisPeriodId = this.data.activePeriod, trendPeriod: AnalysisPeriodId = this.data.activeTotalPeriod) {
    return getAnalysisOverview(period, undefined, this.data.activeAnalysisSort, trendPeriod).then((analysisData) => {
      const visibleAnalysisUsers = sortAnalysisUsers(analysisData.audienceUsers, this.data.activeAnalysisSort)
      const initializeWorkData = !this.data.analysisData
      const trendState = buildTotalTrendState(trendPeriod, analysisData.totalData.readTrends[getAnalysisReadRange(trendPeriod)])
      this.setData({ analysisData, visibleAnalysisUsers, workSummary: initializeWorkData ? analysisData.summary : this.data.workSummary, visibleAnalysisCards: initializeWorkData ? analysisData.cards : this.data.visibleAnalysisCards, hasAnalysisCards: initializeWorkData ? analysisData.cards.length > 0 : this.data.hasAnalysisCards, hasAnalysisUsers: visibleAnalysisUsers.length > 0, ...trendState })
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
  loadProfileData() {
    return getProfilePageData()
      .then((profileData) => this.setData({ profileData }))
      .catch(() => this.setData({ profileData: null }))
  },
  onProfileSettingsTap() {
    wx.navigateTo({ url: '/pages/settings/index' })
  },
  refreshActiveTab() {
    const tab = rootTabIds[this.data.activeTabIndex]
    if (tab === 'notifications') return this.loadNotifications()
    if (tab === 'materials') return this.loadMaterials()
    if (tab === 'analysis') {
      if (this.data.activeAnalysisTab === 'user') {
        return this.loadAudienceUsers(this.data.activePeriod, this.resolveWorkDateRange(this.data.activePeriod))
      }
      if (this.data.activeAnalysisTab === 'total') return this.loadAnalysis(this.data.activeTotalPeriod)
      return this.loadWorkCards(this.data.activePeriod)
    }
    if (tab === 'profile') return this.loadProfileData()
    return this.loadHomeData(true)
  },
  onPullRefresh() {
    this.setData({ pullRefreshing: true })
    runPullRefresh(this.refreshActiveTab(), () => this.setData({ pullRefreshing: false }))
  },
  setActiveTab(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= rootTabIds.length) return
    const nextIndex = index
    const id = rootTabIds[index]
    const activeItems = this.data.tabItems.map((item) => ({ ...item, active: item.id === id }))
    this.setData({ activeTabIndex: nextIndex, tabItems: activeItems, plusActive: id === 'materials' })
    if (id === 'notifications') this.loadNotifications()
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
    const userId = fromDatasetId(event.currentTarget.dataset.userId)

    if (notificationId && this.data.homeData) {
      const notification = this.data.homeData.notifications.find((item) => item.id === notificationId)
      const eventId = notification?.eventId
      if (eventId && persistViewedNotification(eventId)) {
        const homeData = markHomeNotificationViewed(this.data.homeData, eventId)
        const tabItems = this.data.tabItems.map((item) => item.id === 'notifications' ? { ...item, badgeCount: homeData.unreadNotificationCount } : item)
        this.setData({ homeData, tabItems })
      }
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
    const hasAnalysisData = Boolean(this.data.analysisData)
    this.setData({ activeTotalPeriod: 'day', ...buildTotalTrendState('day', this.data.analysisData?.totalData?.readTrends?.day ?? []) })
    this.setActiveTab(3)
    this.setAnalysisTab(2)
    if (hasAnalysisData) this.loadAnalysis('day', 'day')
  },
  onNotificationFilterTap(event: WechatMiniprogram.CustomEvent<{ filterId: NotificationFilterId }>) {
    const filterId = event.detail.filterId
    if (!['all', 'high', 'medium', 'low'].includes(filterId)) return
    const visibleNotificationGroups = getVisibleNotificationGroups(this.data.notifications?.groups ?? [], filterId)
    this.setData({ activeNotificationFilter: filterId, visibleNotificationGroups, hasVisibleNotificationGroups: visibleNotificationGroups.length > 0 })
  },
  onNotificationCardTap(event: WechatMiniprogram.CustomEvent<{ userId: string; eventId?: string }>) {
    const userId = event.detail.userId
    const eventId = event.detail.eventId
    if (!userId) return

    if (eventId && persistViewedNotification(eventId) && this.data.homeData) {
      const homeData = markHomeNotificationViewed(this.data.homeData, eventId)
      const tabItems = this.data.tabItems.map((item) => item.id === 'notifications' ? { ...item, badgeCount: homeData.unreadNotificationCount } : item)
      this.setData({ homeData, tabItems })
    }

    wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${userId}` })
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
    if (event.detail.id === 'custom') {
      this.setData({ dateRangePickerVisible: true })
      return
    }
    this.setData({ activePeriod: event.detail.id })
    if (this.data.activeAnalysisTab === 'user') {
      this.loadAudienceUsers(event.detail.id)
      return
    }

    this.loadWorkCards(event.detail.id)
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
  onTotalAnalysisPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) {
    if (!totalAnalysisPeriods[event.detail.index]) return
    const periodId = event.detail.id

    this.setData({
      activeTotalPeriod: periodId,
      ...buildTotalTrendState(periodId, this.data.analysisData?.totalData?.readTrends?.[getAnalysisReadRange(periodId)] ?? []),
    })
    this.loadAnalysis(periodId, periodId)
  },
  onAnalysisSortTap() { this.setData({ analysisSortSheetVisible: !this.data.analysisSortSheetVisible }) },
  onAnalysisSortOptionTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisSortId }>) {
    const option = analysisSortOptions.find((item) => item.id === event.detail.id)
    if (option) this.setData({
      activeAnalysisSort: option.id,
      activeAnalysisSortLabel: option.label,
      analysisSortSheetVisible: false,
      visibleAnalysisCards: this.data.activeAnalysisTab === 'work'
        ? sortAnalysisCards(this.data.visibleAnalysisCards, option.id)
        : this.data.visibleAnalysisCards,
      visibleAnalysisUsers: this.data.activeAnalysisTab === 'user'
        ? sortAnalysisUsers(this.data.analysisData?.audienceUsers ?? [], option.id)
        : this.data.visibleAnalysisUsers,
    })
  },
  onHomeAnalysisSortOptionTap(event: WechatMiniprogram.TouchEvent) {
    const option = analysisSortOptions.find((item) => item.id === event.currentTarget.dataset.id as AnalysisSortId)
    if (option) this.setData({
      activeAnalysisSort: option.id,
      activeAnalysisSortLabel: option.label,
      analysisSortSheetVisible: false,
      visibleAnalysisCards: this.data.activeAnalysisTab === 'work'
        ? sortAnalysisCards(this.data.visibleAnalysisCards, option.id)
        : this.data.visibleAnalysisCards,
      visibleAnalysisUsers: this.data.activeAnalysisTab === 'user'
        ? sortAnalysisUsers(this.data.analysisData?.audienceUsers ?? [], option.id)
        : this.data.visibleAnalysisUsers,
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
      ? buildMaterialPublishPath(materialId)
      : buildMaterialDetailPath(materialId)
    wx.navigateTo({ url })
  },
  onMaterialPublishTap() {
    wx.navigateTo({ url: buildMaterialPublishPath() })
  },
  onPublishSuccessClose() {
    this.setData({
      showPublishSuccessModal: false,
      shareMaterialId: '',
      shareTrackingId: '',
      shareTitle: '',
      shareImageUrl: '',
    })
  },
  closePublishSuccessModalAfterShare() {
    if (!this.data.showPublishSuccessModal) return
    this.publishSuccessShared = true
  },
  closePublishSuccessModalAfterShareReturn() {
    if (!this.publishSuccessShared) return

    this.publishSuccessShared = false
    this.onPublishSuccessClose()
  },
  onShareAppMessage() {
    const imageUrl = pickShareImageUrl(this.data.shareImageUrl, this.data.materials?.items ?? [], this.data.shareMaterialId)
    if (!this.data.shareMaterialId || !imageUrl) return

    this.closePublishSuccessModalAfterShare()
    return {
      title: this.data.shareTitle || buildMaterialShareTitle([]),
      path: buildMaterialSharePath(this.data.shareMaterialId, this.data.shareTrackingId),
      imageUrl,
    }
  },
  onShareTimeline() {
    const imageUrl = pickShareImageUrl(this.data.shareImageUrl, this.data.materials?.items ?? [], this.data.shareMaterialId)
    if (!this.data.shareMaterialId || !imageUrl) return

    this.closePublishSuccessModalAfterShare()
    return {
      title: this.data.shareTitle || buildMaterialShareTitle([]),
      query: buildMaterialShareQuery(this.data.shareMaterialId, this.data.shareTrackingId),
      imageUrl,
    }
  },
  onShareMomentsTap() {
    showMomentsShareGuide()
  },
  onPlusTap() {
    this.setActiveTab(2)
  },
})
