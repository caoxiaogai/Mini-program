export type NotificationFilterId = 'all' | 'high' | 'medium' | 'low'

export type NotificationIntent = Exclude<NotificationFilterId, 'all'>

export type NotificationAction = 'reading' | 'forward'

export interface NotificationFilterViewModel {
  id: NotificationFilterId
  label: string
}

export interface NotificationCardViewModel {
  id: string
  userId: string
  visitorName: string
  intent: NotificationIntent
  intentLabel: string
  action: NotificationAction
  actionLabel: string
  actionDate: string
  lastViewTime: string
  actionIconPath: string
  avatarUrl: string
  thumbnailUrl: string
  statusLabel: string
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
