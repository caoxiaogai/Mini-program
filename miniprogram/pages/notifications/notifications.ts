import { getNotifications } from '../../services/notifications'
import type { NotificationFilterId, NotificationGroupViewModel, NotificationsViewModel } from '../../types/notifications'
import { calculateRankingHeaderOpacity } from '../../utils/ranking'

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
    notificationHeaderOpacity: 0,
    visibleGroups: [] as NotificationGroupViewModel[],
    hasVisibleGroups: false,
  },
  onLoad() {
    getNotifications().then((notifications) => {
      const visibleGroups = getVisibleNotificationGroups(notifications.groups, this.data.activeFilter)

      this.setData({ notifications, visibleGroups, hasVisibleGroups: visibleGroups.length > 0 })
    })
  },
  onPageScroll(event: WechatMiniprogram.PageScrollOption) {
    const notificationHeaderOpacity = calculateRankingHeaderOpacity(event.scrollTop)

    if (notificationHeaderOpacity === this.data.notificationHeaderOpacity) return

    this.setData({ notificationHeaderOpacity })
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
    const userId = event.currentTarget.dataset.id as string
    if (!userId) return

    wx.navigateTo({
      url: `/pages/analysis-user-detail/index?id=${userId}`,
    })
  },
  onContactActionTap() {},
})
