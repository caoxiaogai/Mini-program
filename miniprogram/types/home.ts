export interface VisitorPreview {
  id: string
  avatarUrl: string
}

export interface NewVisitorsSummary {
  total: number
  highIntentCount: number
  visitors: VisitorPreview[]
}

export interface ReadingSummary {
  total: number
}

export interface SharingSummary {
  total: number
  highlightedContentTitle: string
  highlightedContentShareCount: number
}

export interface HomeOverviewViewModel {
  greeting: string
  newVisitors: NewVisitorsSummary
  reading: ReadingSummary
  sharing: SharingSummary
  unreadNotificationCount: number
}
