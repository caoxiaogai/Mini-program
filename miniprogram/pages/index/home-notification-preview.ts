import type { HomePageViewModel } from '../../types/home'

export function markHomeNotificationViewed(
  homeData: HomePageViewModel,
  eventId: string,
): HomePageViewModel {
  if (!eventId) return homeData

  const notifications = homeData.notifications.filter(
    (notification) => notification.eventId !== eventId && notification.id !== `home-notification-${eventId}`,
  )

  return {
    ...homeData,
    unreadNotificationCount: Math.max(homeData.unreadNotificationCount - 1, 0),
    notifications,
  }
}
