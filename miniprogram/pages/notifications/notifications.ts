import { getNotifications } from '../../services/notifications'
import { runAuthed } from '../../services/auth'
import { fromDatasetId } from '../../utils/dataset-id'
import { persistViewedNotification } from '../../utils/notification-viewed'
import type { NotificationFilterId, NotificationGroupViewModel, NotificationsViewModel } from '../../types/notifications'
import { runPagePullRefresh } from '../../utils/pull-refresh'

type NotificationTabId = 'home' | 'notifications' | 'analysis' | 'profile'

const notificationTabItems = [
  { id: 'home' as NotificationTabId, label: '首页', iconPath: '/assets/home-new/tab-home.svg', activeIconPath: '/assets/home-new/tab-home-active.svg', active: false },
  { id: 'notifications' as NotificationTabId, label: '通知', iconPath: '/assets/home-new/tab-notification.svg', activeIconPath: '/assets/home-new/tab-notification-active.svg', active: true },
  { id: 'analysis' as NotificationTabId, label: '分析', iconPath: '/assets/home-new/tab-analysis.svg', activeIconPath: '/assets/home-new/tab-analysis-active.svg', active: false },
  { id: 'profile' as NotificationTabId, label: '我的', iconPath: '/assets/home-new/tab-profile.svg', activeIconPath: '/assets/home-new/tab-profile-active.svg', active: false },
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
    notifications: null as NotificationsViewModel | null,
    activeFilter: 'all' as NotificationFilterId,
    tabItems: notificationTabItems,
    visibleGroups: [] as NotificationGroupViewModel[],
    hasVisibleGroups: false,
  },
  authReady: false,
  onLoad() {
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

      this.setData({ notifications, visibleGroups, hasVisibleGroups: visibleGroups.length > 0 })
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
  onNotificationCardTap(event: WechatMiniprogram.TouchEvent) {
    const userId = fromDatasetId(event.currentTarget.dataset.id)
    const eventId = event.currentTarget.dataset.eventId as string | undefined
    if (!userId) return

    persistViewedNotification(eventId)

    wx.navigateTo({
      url: `/pages/analysis-user-detail/index?id=${userId}`,
    })
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
