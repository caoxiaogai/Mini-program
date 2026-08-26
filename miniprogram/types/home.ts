export type HomeIntentLevel = 'high' | 'medium' | 'low'

export type HomeNotificationAction = 'forward' | 'reading'

export interface HomeNotificationViewModel {
  id: string
  eventId: string
  userId: string
  visitorName: string
  intent: HomeIntentLevel
  intentLabel: string
  action: HomeNotificationAction
  actionLabel: string
  actionDate: string
  lastViewTime: string
  actionIconPath: string
  avatarUrl: string
  thumbnailUrl: string
  statusLabel: string
}

export interface HomeContentViewModel {
  id: string
  title: string
  date: string
  thumbnailUrl: string
  viewCount: string
  forwardCount: string
  highIntentCount: string
}

export interface HomeIntentSummaryViewModel {
  total: string
  highCount: string
  mediumCount: string
  lowCount: string
  previewAvatars: Array<{ id: string; avatarUrl: string }>
}

export interface HomeTodayViewModel {
  viewCount: string
  comparison?: {
    label: string
    value: string
  }
  completeCount: string
  forwardCount: string
  viewerCount: string
}

export interface HomePageViewModel {
  unreadNotificationCount: number
  notifications: HomeNotificationViewModel[]
  contents: HomeContentViewModel[]
  intentSummary: HomeIntentSummaryViewModel
  today: HomeTodayViewModel
}
