import type { MembershipUiTier } from './membership'

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
  completeCount: string
  highIntentCount: string
  highIntentLevel: 'high' | 'empty'
  highIntentLabel: string
}

export interface HomeIntentSummaryViewModel {
  total: string
  highCount: string
  mediumCount: string
  lowCount: string
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
  unreadNotificationEventIds: string[]
  showVisitorLimitPrompt: boolean
  limitPromptActionLabel: string
  limitPromptTargetTier: MembershipUiTier
  notifications: HomeNotificationViewModel[]
  contents: HomeContentViewModel[]
  intentSummary: HomeIntentSummaryViewModel
  today: HomeTodayViewModel
}
