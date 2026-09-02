import { runAuthed } from '../../services/auth'
import { getAnalysisOverview, getAnalysisWorkList, sortAnalysisCards, enrichAnalysisCards, enrichAudienceUsers } from '../../services/analysis'
import { getHomePageData } from '../../services/home'
import { applyThumbnailMap, enrichThumbnailsByIds, getMaterialDetail, getMaterials } from '../../services/materials'
import { enrichNotificationCards, getNotifications } from '../../services/notifications'
import type { AnalysisAudienceUser, AnalysisViewModel } from '../../types/analysis'
import type { HomePageViewModel } from '../../types/home'
import type { MaterialCardViewModel, MaterialsFilterId, MaterialsViewModel } from '../../types/materials'
import type { NotificationFilterId, NotificationGroupViewModel, NotificationsViewModel } from '../../types/notifications'
import type { ProfilePageViewModel } from '../../types/profile'
import { getProfilePageData } from '../../services/profile'
import { getHomeGreeting } from '../../utils/greeting'
import { getHomeHeaderGradientOpacity, getHomeHeaderOpacity } from '../../utils/home-header'
import { getDateRangeLimits, getDefaultDateRange } from '../../utils/date-range'
import type { DateRange } from '../../utils/date-range'
import { sortAnalysisUsers } from '../../utils/analysis-users'
import { capAudienceUsers, resolveVisitorLimit } from '../../utils/membership'
import { buildTotalTrendState, getAnalysisReadRange } from '../../utils/analysis-trend'
import { takePendingPublishReturn } from '../../utils/publish-return'
import { runPullRefresh } from '../../utils/pull-refresh'
import { buildMaterialDetailPath, buildMaterialPublishPath, buildMaterialSharePath, buildMaterialShareQuery, buildMaterialShareTitle, enableMaterialShareMenu, HOME_PAGE_PATH, pickShareImageUrl, showMomentsShareGuide } from '../../utils/share-material'
import { persistViewedNotification, persistViewedNotifications } from '../../utils/notification-viewed'
import { countUnreadNotificationGroups, getUnreadNotificationEventIds, markAllNotificationGroupsViewed, markNotificationGroupsViewed, patchNotificationGroupCards } from '../../utils/notifications'
import { buildNotificationListWindow, flattenNotificationCards, LIST_PAGE_SIZE, nextListWindow, windowList } from '../../utils/list-window'
import { fromDatasetId } from '../../utils/dataset-id'
import { markHomeNotificationViewed, markHomeNotificationsViewed } from './home-notification-preview'
import { buildReturnPath } from '../../utils/auth'
import { choosePublishImageOrVideo, isPdfFileName, MAX_IMAGE_COUNT, showPublishPickerError } from '../../utils/publish-media'
import type { PublishEntryType, PublishMediaSource } from '../../utils/publish-media'
import { setPendingPublishSelection } from '../../utils/publish-selection'
import { getNavigationBarLayout } from '../../utils/navigation-layout'
import { MEMBERSHIP_PAGE_PATH, membershipPageUrl } from '../../types/membership'

type HomeTabId = 'home' | 'notifications' | 'materials' | 'analysis' | 'profile'
type AnalysisPeriodId = 'day' | 'week' | 'month' | 'total' | 'custom'
type AnalysisSortId = 'completion' | 'share' | 'view'
type AnalysisTabId = 'work' | 'user' | 'total'
type TotalDateRangeTarget = 'work' | 'overview' | 'peak'

const tabItems = [
  { id: 'home' as HomeTabId, label: '首页', iconPath: '/assets/home-new/tab-home.svg', activeIconPath: '/assets/home-new/tab-home-selected.svg', active: true },
  { id: 'notifications' as HomeTabId, label: '通知', iconPath: '/assets/home-new/tab-notification.svg', activeIconPath: '/assets/home-new/tab-notification-selected.svg', active: false },
  { id: 'analysis' as HomeTabId, label: '分析', iconPath: '/assets/home-new/tab-analysis.svg', activeIconPath: '/assets/home-new/tab-analysis-selected.svg', active: false },
  { id: 'profile' as HomeTabId, label: '我的', iconPath: '/assets/home-new/tab-profile.svg', activeIconPath: '/assets/home-new/tab-profile-selected.svg', active: false },
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
  { id: 'week' as AnalysisPeriodId, label: '周' },
  { id: 'month' as AnalysisPeriodId, label: '月' },
  { id: 'custom' as AnalysisPeriodId, label: '', iconPath: '/assets/analysis/calendar-filter.svg' },
]

const analysisSwipeThreshold = 40

function getVisibleMaterials(items: MaterialCardViewModel[], filterId: MaterialsFilterId): MaterialCardViewModel[] {
  return filterId === 'all' ? items : items.filter((item) => item.kind === filterId)
}

Page({
  publishSuccessShared: false,
  authReady: false,
  pendingPublishType: null as 'image' | 'video' | null,
  data: {
    analysisNavigationHeight: 91,
    greetingHeadline: getHomeGreeting(),
    greetingSubtitle: '今日阳光明媚，祝你好运',
    homeData: null as HomePageViewModel | null,
    isLoading: true,
    loadError: false,
    tabItems,
    plusActive: false,
    isAndroid: false,
    activeTabIndex: 0,
    homeHeaderOpacity: 0,
    homeHeaderGradientOpacity: 1,
    homeScrollTop: 0,
    homeNotificationMarkAllReadCollapseKey: 0,
    notifications: null as NotificationsViewModel | null,
    activeNotificationFilter: 'all' as NotificationFilterId,
    visibleNotificationGroups: [] as NotificationGroupViewModel[],
    hasVisibleNotificationGroups: false,
    notificationVisibleCount: 0,
    unreadNotificationCount: 0,
    materials: null as MaterialsViewModel | null,
    activeMaterialFilter: 'all' as MaterialsFilterId,
    visibleMaterials: [] as MaterialCardViewModel[],
    hasVisibleMaterials: false,
    materialsVisibleCount: 0,
    showPublishSuccessModal: false,
    publishTypeSheetVisible: false,
    publishSourceSheetVisible: false,
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
    profileData: null as ProfilePageViewModel | null,
    pullRefreshing: false,
  },
  onLoad(options: Record<string, string | undefined>) {
    const { platform } = wx.getSystemInfoSync()
    this.setData({
      analysisNavigationHeight: getNavigationBarLayout().totalHeight,
      isAndroid: platform === 'android' || platform === 'devtools',
    })
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
    if (rootTabIds[this.data.activeTabIndex] === 'profile') {
      this.loadProfileData()
    }
  },
  onHomeScroll(event: WechatMiniprogram.ScrollViewScrollEvent) {
    const scrollTop = event.detail.scrollTop
    const homeHeaderOpacity = getHomeHeaderOpacity(scrollTop)
    const homeHeaderGradientOpacity = getHomeHeaderGradientOpacity(scrollTop)
    const scrollChanged = scrollTop !== this.data.homeScrollTop
    if (homeHeaderOpacity === this.data.homeHeaderOpacity && homeHeaderGradientOpacity === this.data.homeHeaderGradientOpacity && !scrollChanged) return
    this.setData({
      homeHeaderOpacity,
      homeHeaderGradientOpacity,
      homeScrollTop: scrollTop,
      ...(scrollChanged ? { homeNotificationMarkAllReadCollapseKey: this.data.homeNotificationMarkAllReadCollapseKey + 1 } : {}),
    })
  },
  loadHomeData(silent = false) {
    if (!silent) this.setData({ isLoading: true, loadError: false })
    return getHomePageData()
      .then((homeData) => {
        this.setData({ homeData, isLoading: false, loadError: false })
      })
      .catch(() => {
        if (!silent) this.setData({ isLoading: false, loadError: true })
      })
  },
  loadNotifications() {
    return getNotifications().then((notifications) => {
      this.setData({ notifications, unreadNotificationCount: countUnreadNotificationGroups(notifications.groups) })
      this.applyNotificationWindow(notifications.groups, this.data.activeNotificationFilter, LIST_PAGE_SIZE)
    })
  },
  applyNotificationWindow(groups: NotificationGroupViewModel[], filterId: NotificationFilterId, visibleCount: number) {
    const windowed = buildNotificationListWindow(groups, filterId, visibleCount)
    this.setData({
      visibleNotificationGroups: windowed.visibleGroups,
      hasVisibleNotificationGroups: windowed.hasVisibleGroups,
      notificationVisibleCount: visibleCount,
    })
    this.enrichVisibleNotifications(windowed.visibleGroups)
  },
  enrichVisibleNotifications(visibleGroups: NotificationGroupViewModel[]) {
    const cards = flattenNotificationCards(visibleGroups)
    if (cards.length === 0) return
    enrichNotificationCards(cards).then((patched) => {
      const current = this.data.notifications
      if (!current) return
      const groups = patchNotificationGroupCards(current.groups, patched)
      const windowed = buildNotificationListWindow(groups, this.data.activeNotificationFilter, this.data.notificationVisibleCount)
      this.setData({
        notifications: { ...current, groups },
        visibleNotificationGroups: windowed.visibleGroups,
        hasVisibleNotificationGroups: windowed.hasVisibleGroups,
      })
    })
  },
  loadMoreNotifications() {
    const windowed = buildNotificationListWindow(
      this.data.notifications?.groups ?? [],
      this.data.activeNotificationFilter,
      this.data.notificationVisibleCount,
    )
    const next = nextListWindow(this.data.notificationVisibleCount, windowed.totalCards)
    if (next === this.data.notificationVisibleCount) return
    this.applyNotificationWindow(this.data.notifications?.groups ?? [], this.data.activeNotificationFilter, next)
  },
  loadMaterials() {
    return getMaterials().then((materials) => {
      this.setData({ materials })
      this.applyMaterialsWindow(materials.items, this.data.activeMaterialFilter, LIST_PAGE_SIZE)
    })
  },
  applyMaterialsWindow(items: MaterialCardViewModel[], filterId: MaterialsFilterId, visibleCount: number) {
    const filtered = getVisibleMaterials(items, filterId)
    const visibleMaterials = windowList(filtered, visibleCount)
    this.setData({
      visibleMaterials,
      hasVisibleMaterials: filtered.length > 0,
      materialsVisibleCount: visibleCount,
    })
    this.enrichVisibleMaterials(visibleMaterials)
  },
  enrichVisibleMaterials(items: MaterialCardViewModel[]) {
    if (items.length === 0) return
    enrichThumbnailsByIds(items.map((item) => item.id)).then((thumbs) => {
      const materials = this.data.materials
      if (!materials || thumbs.size === 0) return
      this.setData({
        materials: { ...materials, items: applyThumbnailMap(materials.items, thumbs) },
        visibleMaterials: applyThumbnailMap(this.data.visibleMaterials, thumbs),
      })
    })
  },
  loadMoreMaterials() {
    const filtered = getVisibleMaterials(this.data.materials?.items ?? [], this.data.activeMaterialFilter)
    const next = nextListWindow(this.data.materialsVisibleCount, filtered.length)
    if (next === this.data.materialsVisibleCount) return
    this.applyMaterialsWindow(this.data.materials?.items ?? [], this.data.activeMaterialFilter, next)
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
  loadAnalysis(period: AnalysisPeriodId = this.data.activePeriod, trendPeriod: AnalysisPeriodId = this.data.activePeakPeriod, dateRange?: DateRange) {
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
      const byId = new Map(patched.map((card) => [card.id, card]))
      const allAnalysisCards = this.data.allAnalysisCards.map((card) => byId.get(card.id) ?? card)
      this.setData({
        allAnalysisCards,
        visibleAnalysisCards: applyThumbnailMap(this.data.visibleAnalysisCards, new Map(patched.map((card) => [card.id, card.thumbnailUrl]))),
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
  loadProfileData() {
    return getProfilePageData()
      .then((profileData) => this.setData({ profileData }))
      .catch(() => this.setData({ profileData: null }))
  },
  onProfileSettingsTap() {
    wx.navigateTo({ url: '/pages/settings/index' })
  },
  onProfileMembershipTap(event: WechatMiniprogram.CustomEvent<{ cardKind?: string }>) {
    const cardKind = event.detail?.cardKind
    wx.navigateTo({
      url: cardKind === 'standard' || cardKind === 'premium' ? membershipPageUrl('premium') : MEMBERSHIP_PAGE_PATH,
    })
  },
  onHomeMembershipLimitTap() {
    const targetTier =
      this.data.homeData?.limitPromptTargetTier ?? this.data.notifications?.limitPromptTargetTier ?? 'standard'
    wx.navigateTo({ url: membershipPageUrl(targetTier) })
  },
  refreshActiveTab() {
    const tab = rootTabIds[this.data.activeTabIndex]
    if (tab === 'notifications') return this.loadNotifications()
    if (tab === 'materials') return this.loadMaterials()
    if (tab === 'analysis') {
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
    }
    if (tab === 'profile') return this.loadProfileData()
    return this.loadHomeData(true)
  },
  onPullRefresh() {
    this.setData({ pullRefreshing: true })
    runPullRefresh(this.refreshActiveTab(), () => this.setData({ pullRefreshing: false }))
  },
  onNotificationsScrollToLower() {
    this.loadMoreNotifications()
  },
  onMaterialsScrollToLower() {
    this.loadMoreMaterials()
  },
  onAnalysisScrollToLower() {
    if (this.data.activeAnalysisTab === 'work') this.loadMoreAnalysisCards()
    if (this.data.activeAnalysisTab === 'user') this.loadMoreAnalysisUsers()
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
    if (id === 'profile') this.loadProfileData()
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
        this.setData({ homeData })
      }
    }

    if (userId) wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${userId}` })
  },
  onHomeMarkAllReadTap() {
    const homeData = this.data.homeData
    if (!homeData || homeData.unreadNotificationCount === 0) return

    const eventIds = homeData.unreadNotificationEventIds.length > 0
      ? homeData.unreadNotificationEventIds
      : homeData.notifications.map((notification) => notification.eventId)
    persistViewedNotifications(eventIds)

    const nextHomeData = markHomeNotificationsViewed(homeData)
    const groups = this.data.notifications?.groups ?? []
    const nextGroups = markAllNotificationGroupsViewed(groups)
    const notifications = this.data.notifications ? { ...this.data.notifications, groups: nextGroups } : null
    this.setData({
      homeData: nextHomeData,
      notifications,
      unreadNotificationCount: 0,
    })
    this.applyNotificationWindow(nextGroups, this.data.activeNotificationFilter, this.data.notificationVisibleCount)
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
    this.setData({
      activeOverviewPeriod: 'day',
      activePeakPeriod: 'day',
      ...buildTotalTrendState('day', this.data.analysisData?.totalData?.readTrends?.day ?? []),
    })
    this.setActiveTab(3)
    this.setAnalysisTab(2)
    if (hasAnalysisData) this.loadAnalysis('day', 'day')
  },
  onNotificationFilterTap(event: WechatMiniprogram.CustomEvent<{ filterId: NotificationFilterId }>) {
    const filterId = event.detail.filterId
    if (!['all', 'high', 'medium', 'low'].includes(filterId)) return
    this.setData({ activeNotificationFilter: filterId })
    this.applyNotificationWindow(this.data.notifications?.groups ?? [], filterId, LIST_PAGE_SIZE)
  },
  onNotificationCardTap(event: WechatMiniprogram.CustomEvent<{ userId: string; eventId?: string }>) {
    const userId = event.detail.userId
    const eventId = event.detail.eventId
    if (!userId) return

    if (eventId && persistViewedNotification(eventId)) {
      if (this.data.notifications) {
        const groups = markNotificationGroupsViewed(this.data.notifications.groups, eventId)
        const notifications = { ...this.data.notifications, groups }
        this.setData({
          notifications,
          unreadNotificationCount: countUnreadNotificationGroups(groups),
        })
        this.applyNotificationWindow(groups, this.data.activeNotificationFilter, this.data.notificationVisibleCount)
      }
      if (this.data.homeData) {
        const homeData = markHomeNotificationViewed(this.data.homeData, eventId)
        this.setData({ homeData })
      }
    }

    wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${userId}` })
  },
  onMarkAllReadTap() {
    const groups = this.data.notifications?.groups ?? []
    const eventIds = getUnreadNotificationEventIds(groups)
    if (eventIds.length === 0) return

    persistViewedNotifications(eventIds)
    const nextGroups = markAllNotificationGroupsViewed(groups)
    const notifications = this.data.notifications ? { ...this.data.notifications, groups: nextGroups } : null
    this.setData({ notifications, unreadNotificationCount: 0 })
    this.applyNotificationWindow(nextGroups, this.data.activeNotificationFilter, this.data.notificationVisibleCount)
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
      this.setData({
        dateRangePickerVisible: true,
        dateRangePickerTarget: 'work',
        datePickerStartDate: this.data.customStartDate,
        datePickerEndDate: this.data.customEndDate,
      })
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
  onTotalOverviewPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) {
    if (!totalAnalysisPeriods[event.detail.index]) return
    const periodId = event.detail.id
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
    if (!totalAnalysisPeriods[event.detail.index]) return
    const periodId = event.detail.id
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
  onAnalysisSortTap() { this.setData({ analysisSortSheetVisible: !this.data.analysisSortSheetVisible }) },
  onAnalysisSortOptionTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisSortId }>) {
    const option = analysisSortOptions.find((item) => item.id === event.detail.id)
    if (!option) return
    this.applyAnalysisSort(option.id, option.label)
  },
  onHomeAnalysisSortOptionTap(event: WechatMiniprogram.TouchEvent) {
    const option = analysisSortOptions.find((item) => item.id === event.currentTarget.dataset.id as AnalysisSortId)
    if (!option) return
    this.applyAnalysisSort(option.id, option.label)
  },
  applyAnalysisSort(sortId: AnalysisSortId, label: string) {
    this.setData({
      activeAnalysisSort: sortId,
      activeAnalysisSortLabel: label,
      analysisSortSheetVisible: false,
    })
    if (this.data.activeAnalysisTab === 'work') {
      const cards = sortAnalysisCards(this.data.allAnalysisCards, sortId)
      this.setData({ allAnalysisCards: cards })
      this.applyAnalysisCardsWindow(cards, LIST_PAGE_SIZE)
      return
    }
    if (this.data.activeAnalysisTab === 'user') {
      const users = capAudienceUsers(
        sortAnalysisUsers(this.data.analysisData?.audienceUsers ?? [], sortId),
        resolveVisitorLimit(this.data.analysisData?.visitorLimit),
      )
      this.applyAnalysisUsersWindow(users, LIST_PAGE_SIZE)
    }
  },
  onAnalysisSortMaskTap() { this.setData({ analysisSortSheetVisible: false }) },
  onAnalysisCardTap(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    const cardId = event.detail.id
    if (!cardId) return
    wx.navigateTo({ url: `/pages/analysis-detail/index?id=${encodeURIComponent(cardId)}` })
  },
  onAnalysisUserTap(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    if (!event.detail.id) return
    wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${event.detail.id}` })
  },
  onMaterialFilterTap(event: WechatMiniprogram.TouchEvent) {
    const filterId = event.currentTarget.dataset.id as MaterialsFilterId
    if (!['all', 'image', 'video', 'pdf'].includes(filterId)) return

    this.setData({ activeMaterialFilter: filterId })
    this.applyMaterialsWindow(this.data.materials?.items ?? [], filterId, LIST_PAGE_SIZE)
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
    this.setData({ publishTypeSheetVisible: true })
  },
  onPublishTypeSelect(event: WechatMiniprogram.CustomEvent<{ type: PublishEntryType }>) {
    const type = event.detail.type
    this.setData({ publishTypeSheetVisible: false }, () => {
      if (type === 'pdf') {
        this.choosePdfForPublish()
        return
      }
      if (type !== 'image' && type !== 'video') return
      this.pendingPublishType = type
      this.setData({ publishSourceSheetVisible: true })
    })
  },
  onPublishSourceSelect(event: WechatMiniprogram.CustomEvent<{ source: PublishMediaSource }>) {
    const type = this.pendingPublishType
    const source = event.detail.source
    this.setData({ publishSourceSheetVisible: false }, () => {
      if (!type) return
      if (source !== 'camera' && source !== 'album') return
      this.openPublishEditorFromPicker(type, source)
    })
  },
  openPublishEditorFromPicker(type: 'image' | 'video', source: PublishMediaSource) {
    choosePublishImageOrVideo({
      type,
      source,
      count: type === 'image' ? MAX_IMAGE_COUNT : 1,
    })
      .then((media) => {
        setPendingPublishSelection({ type, media })
        wx.navigateTo({ url: `/pages/materials/publish/index?type=${type}` })
      })
      .catch((error: WechatMiniprogram.GeneralCallbackResult) => {
        showPublishPickerError(error.errMsg)
      })
  },
  choosePdfForPublish() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (result) => {
        const file = result.tempFiles[0]
        if (!file) return
        if (!isPdfFileName(file.name)) {
          wx.showToast({ title: '请选择 PDF 文件', icon: 'none' })
          return
        }

        setPendingPublishSelection({
          type: 'pdf',
          media: [{ id: file.path, path: file.path, kind: 'pdf', previewPath: '', name: file.name, duration: 0 }],
        })
        wx.navigateTo({ url: '/pages/materials/publish/index?type=pdf' })
      },
      fail: (error) => {
        showPublishPickerError(error.errMsg)
      },
    })
  },
  onPublishTypeCancel() {
    this.setData({ publishTypeSheetVisible: false })
  },
  onPublishSourceCancel() {
    this.setData({ publishSourceSheetVisible: false })
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
