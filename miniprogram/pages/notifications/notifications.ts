import { getNotifications, notifyThresholdOptions } from '../../services/notifications'
import { getNotifySettings, updateNotifySettings } from '../../services/user'
import type { NotificationFilterId, NotificationGroupViewModel, NotificationsViewModel, NotifyIntentLevel } from '../../types/notifications'
import { calculateRankingHeaderOpacity } from '../../utils/ranking'

function getVisibleNotificationGroups(groups: NotificationGroupViewModel[], filterId: NotificationFilterId): NotificationGroupViewModel[] {
  return groups
    .map((group) => ({
      ...group,
      items: filterId === 'all' ? group.items : group.items.filter((notification) => notification.intent === filterId),
    }))
    .filter((group) => group.items.length > 0)
}

function getNotifyThresholdIndex(level: NotifyIntentLevel): number {
  return notifyThresholdOptions.findIndex((item) => item.id === level)
}

Page({
  data: {
    notifications: null as NotificationsViewModel | null,
    activeFilter: 'all' as NotificationFilterId,
    notificationHeaderOpacity: 0,
    visibleGroups: [] as NotificationGroupViewModel[],
    hasVisibleGroups: false,
    notifyThresholdTabs: notifyThresholdOptions,
    activeNotifyThreshold: 'high' as NotifyIntentLevel,
    notifyThresholdOffset: 200,
    notifySettingsSaving: false,
  },

  onLoad() {
    Promise.all([getNotifications(), getNotifySettings()])
      .then(([notifications, activeNotifyThreshold]) => {
        const thresholdIndex = getNotifyThresholdIndex(activeNotifyThreshold)
        const visibleGroups = getVisibleNotificationGroups(notifications.groups, this.data.activeFilter)

        this.setData({
          notifications,
          activeNotifyThreshold,
          notifyThresholdOffset: (thresholdIndex >= 0 ? thresholdIndex : 2) * 100,
          visibleGroups,
          hasVisibleGroups: visibleGroups.length > 0,
        })
      })
      .catch(() => {
        getNotifications().then((notifications) => {
          const visibleGroups = getVisibleNotificationGroups(notifications.groups, this.data.activeFilter)
          this.setData({ notifications, visibleGroups, hasVisibleGroups: visibleGroups.length > 0 })
        })
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

  onNotifyThresholdTap(event: WechatMiniprogram.TouchEvent) {
    const index = Number(event.currentTarget.dataset.index)
    const tab = notifyThresholdOptions[index]
    if (!tab || Number.isNaN(index)) {
      return
    }

    const level = tab.id
    if (level === this.data.activeNotifyThreshold || this.data.notifySettingsSaving) {
      return
    }

    this.setData({ notifySettingsSaving: true })

    updateNotifySettings(level)
      .then(() => {
        this.setData({
          activeNotifyThreshold: level,
          notifyThresholdOffset: index * 100,
          notifySettingsSaving: false,
        })
        wx.showToast({ title: '推送设置已保存', icon: 'success' })
      })
      .catch(() => {
        this.setData({ notifySettingsSaving: false })
        wx.showToast({ title: '保存失败，请重试', icon: 'none' })
      })
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
