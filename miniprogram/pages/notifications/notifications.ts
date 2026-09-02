import { getNotifications } from '../../services/notifications'
import { runAuthed } from '../../services/auth'
import { fromDatasetId } from '../../utils/dataset-id'
import { persistViewedNotification, persistViewedNotifications } from '../../utils/notification-viewed'
import { countUnreadNotificationGroups, getUnreadNotificationEventIds, markAllNotificationGroupsViewed, markNotificationGroupsViewed } from '../../utils/notifications'
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

function getVisibleNotificationGroups(groups: NotificationGroupViewModel[], filterId: NotificationFilterId): NotificationGroupViewModel[] {
  return groups
    .map((group) => ({
      ...group,
      items: filterId === 'all' ? group.items : group.items.filter((notification) => notification.intent === filterId),
    }))
    .filter((group) => group.items.length > 0)
}

Page({
  data: {
    notificationNavigationHeight: 91,
    notifications: null as NotificationsViewModel | null,
    activeFilter: 'all' as NotificationFilterId,
    tabItems: notificationTabItems,
    visibleGroups: [] as NotificationGroupViewModel[],
    hasVisibleGroups: false,
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
  loadNotifications() {
    return getNotifications().then((notifications) => {
      const visibleGroups = getVisibleNotificationGroups(notifications.groups, this.data.activeFilter)

      this.setData({
        notifications,
        visibleGroups,
        hasVisibleGroups: visibleGroups.length > 0,
        unreadNotificationCount: countUnreadNotificationGroups(notifications.groups),
      })
    })
  },
  onFilterTap(event: WechatMiniprogram.TouchEvent) {
    const filterId = event.currentTarget.dataset.id as NotificationFilterId
    if (!['all', 'high', 'medium', 'low'].includes(filterId)) {
      return
    }

    const visibleGroups = getVisibleNotificationGroups(this.data.notifications?.groups ?? [], filterId)

    this.setData({ activeFilter: filterId, visibleGroups, hasVisibleGroups: visibleGroups.length > 0 })
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
      const visibleGroups = getVisibleNotificationGroups(groups, this.data.activeFilter)
      this.setData({
        notifications,
        visibleGroups,
        hasVisibleGroups: visibleGroups.length > 0,
        unreadNotificationCount: countUnreadNotificationGroups(groups),
      })
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
    const visibleGroups = getVisibleNotificationGroups(nextGroups, this.data.activeFilter)
    this.setData({ notifications, visibleGroups, hasVisibleGroups: visibleGroups.length > 0, unreadNotificationCount: 0 })
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
