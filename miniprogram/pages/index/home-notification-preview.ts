import type { HomePageViewModel } from '../../types/home'

export function markHomeNotificationViewed(
  homeData: HomePageViewModel,
  notificationId: string,
): HomePageViewModel {
  const notifications = homeData.notifications.filter((notification) => notification.id !== notificationId)

  if (notifications.length === homeData.notifications.length) return homeData

  return {
    ...homeData,
    unreadNotificationCount: Math.max(homeData.unreadNotificationCount - 1, 0),
    notifications,
  }
}
