export type NotificationFilterId = 'all' | 'high' | 'medium' | 'low'

export type NotificationIntent = Exclude<NotificationFilterId, 'all'>

export type NotificationAction = 'reading' | 'forward'

export interface NotificationFilterViewModel {
  id: NotificationFilterId
  label: string
}

export interface NotificationThumbnailViewModel {
  id: string
  url: string
}

export interface NotificationCardViewModel {
  id: string
  visitorName: string
  intent: NotificationIntent
  intentLabel: string
  action: NotificationAction
  actionLabel: string
  actionDate: string
  actionIconPath: string
  avatarUrl: string
  thumbnailItems: NotificationThumbnailViewModel[]
  recommendation: string
}

export interface NotificationGroupViewModel {
  id: string
  label: string
  items: NotificationCardViewModel[]
}

export interface NotificationsViewModel {
  filters: NotificationFilterViewModel[]
  groups: NotificationGroupViewModel[]
}
