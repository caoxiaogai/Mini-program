import { getNotifications } from '../../services/notifications'
import type { NotificationFilterId, NotificationsViewModel } from '../../types/notifications'

Page({
  data: {
    notifications: null as NotificationsViewModel | null,
    activeFilter: 'all' as NotificationFilterId,
  },
  onLoad() {
    getNotifications().then((notifications) => {
      this.setData({ notifications })
    })
  },
  onFilterTap(event: WechatMiniprogram.TouchEvent) {
    const filterId = event.currentTarget.dataset.id as NotificationFilterId
    if (!['all', 'high', 'medium', 'low'].includes(filterId)) {
      return
    }

    this.setData({ activeFilter: filterId })
  },
})
