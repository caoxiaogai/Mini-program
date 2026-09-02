import { enrichNotificationCards, getNotifications } from '../../services/notifications'
import { runAuthed } from '../../services/auth'
import { fromDatasetId } from '../../utils/dataset-id'
import { persistViewedNotification, persistViewedNotifications } from '../../utils/notification-viewed'
import { countUnreadNotificationGroups, getUnreadNotificationEventIds, markAllNotificationGroupsViewed, markNotificationGroupsViewed, patchNotificationGroupCards } from '../../utils/notifications'
import { buildNotificationListWindow, flattenNotificationCards, LIST_PAGE_SIZE, nextListWindow } from '../../utils/list-window'
import type { NotificationFilterId, NotificationGroupViewModel, NotificationsViewModel } from '../../types/notifications'
import { runPagePullRefresh } from '../../utils/pull-refresh'
import { getNavigationBarLayout } from '../../utils/navigation-layout'

type NotificationTabId = 'home' | 'notifications' | 'analysis' | 'profile'

const MEMBERSHIP_PAGE_PATH = '/pages/membership/index'

const notificationTabItems = [
  { id: 'home' as NotificationTabId, label: '首页', iconPath: '/assets/home-new/tab-home.svg', activeIconPath: '/assets/home-new/tab-home-selected.svg', active: false },
  { id: 'notifications' as NotificationTabId, label: '通知', iconPath: '/assets/home-new/tab-notification.svg', activeIconPath: '/assets/home-new/tab-notification-selected.svg', active: true },
  { id: 'analysis' as NotificationTabId, label: '分析', iconPath: '/assets/home-new/tab-analysis.svg', activeIconPath: '/assets/home-new/tab-analysis-selected.svg', active: false },
  { id: 'profile' as NotificationTabId, label: '我的', iconPath: '/assets/home-new/tab-profile.svg', activeIconPath: '/assets/home-new/tab-profile-selected.svg', active: false },
]

Page({
  data: {
    notificationNavigationHeight: 91,
    notifications: null as NotificationsViewModel | null,
    activeFilter: 'all' as NotificationFilterId,
    tabItems: notificationTabItems,
    visibleGroups: [] as NotificationGroupViewModel[],
    hasVisibleGroups: false,
    notificationVisibleCount: 0,
    unreadNotificationCount: 0,
  },
  authReady: false,
  onLoad() {
    this.setData({ notificationNavigationHeight: getNavigationBarLayout().totalHeight })
    runAuthed('/pages/notifications/notifications', () => {
      this.authReady = true
      this.loadNotifications()
    })
  },
  onShow() {
    if (!this.authReady) return
    this.loadNotifications()
  },
  onPullDownRefresh() {
    runPagePullRefresh(this.loadNotifications())
  },
  onReachBottom() {
    this.loadMoreNotifications()
  },
  loadNotifications() {
    return getNotifications().then((notifications) => {
      this.setData({ notifications, unreadNotificationCount: countUnreadNotificationGroups(notifications.groups) })
      this.applyNotificationWindow(notifications.groups, this.data.activeFilter, LIST_PAGE_SIZE)
    })
  },
  applyNotificationWindow(groups: NotificationGroupViewModel[], filterId: NotificationFilterId, visibleCount: number) {
    const windowed = buildNotificationListWindow(groups, filterId, visibleCount)
    this.setData({
      visibleGroups: windowed.visibleGroups,
      hasVisibleGroups: windowed.hasVisibleGroups,
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
      const windowed = buildNotificationListWindow(groups, this.data.activeFilter, this.data.notificationVisibleCount)
      this.setData({
        notifications: { ...current, groups },
        visibleGroups: windowed.visibleGroups,
        hasVisibleGroups: windowed.hasVisibleGroups,
      })
    })
  },
  loadMoreNotifications() {
    const windowed = buildNotificationListWindow(
      this.data.notifications?.groups ?? [],
      this.data.activeFilter,
      this.data.notificationVisibleCount,
    )
    const next = nextListWindow(this.data.notificationVisibleCount, windowed.totalCards)
    if (next === this.data.notificationVisibleCount) return
    this.applyNotificationWindow(this.data.notifications?.groups ?? [], this.data.activeFilter, next)
  },
  onFilterTap(event: WechatMiniprogram.TouchEvent) {
    const filterId = event.currentTarget.dataset.id as NotificationFilterId
    if (!['all', 'high', 'medium', 'low'].includes(filterId)) {
      return
    }

    this.setData({ activeFilter: filterId })
    this.applyNotificationWindow(this.data.notifications?.groups ?? [], filterId, LIST_PAGE_SIZE)
  },
  onMembershipLimitUpgrade() {
    wx.navigateTo({ url: MEMBERSHIP_PAGE_PATH })
  },
  onNotificationCardTap(event: WechatMiniprogram.TouchEvent) {
    const userId = fromDatasetId(event.currentTarget.dataset.id)
    const eventId = event.currentTarget.dataset.eventId as string | undefined
    if (!userId) return

    if (eventId && persistViewedNotification(eventId) && this.data.notifications) {
      const groups = markNotificationGroupsViewed(this.data.notifications.groups, eventId)
      const notifications = { ...this.data.notifications, groups }
      this.setData({
        notifications,
        unreadNotificationCount: countUnreadNotificationGroups(groups),
      })
      this.applyNotificationWindow(groups, this.data.activeFilter, this.data.notificationVisibleCount)
    }

    wx.navigateTo({
      url: `/pages/analysis-user-detail/index?id=${userId}`,
    })
  },
  onMarkAllReadTap() {
    const groups = this.data.notifications?.groups ?? []
    const eventIds = getUnreadNotificationEventIds(groups)
    if (eventIds.length === 0) return

    persistViewedNotifications(eventIds)
    const nextGroups = markAllNotificationGroupsViewed(groups)
    const notifications = this.data.notifications ? { ...this.data.notifications, groups: nextGroups } : null
    this.setData({ notifications, unreadNotificationCount: 0 })
    this.applyNotificationWindow(nextGroups, this.data.activeFilter, this.data.notificationVisibleCount)
  },
  onContactActionTap() {},
  onTabTap(event: WechatMiniprogram.CustomEvent<{ id: NotificationTabId }>) {
    if (event.detail.id === 'notifications') return
    wx.navigateTo({ url: '/pages/index/index' })
  },
  onPlusTap() {
    wx.navigateTo({ url: '/pages/materials/index' })
  },
})
