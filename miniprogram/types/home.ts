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

export type HomeSummaryCardState = 'data' | 'empty'

export interface HomeSummaryCardViewModel {
  state: HomeSummaryCardState
  isEmpty: boolean
  primaryPrefix: string
  primaryValue: string
  primarySuffix: string
  secondaryPrefix: string
  secondaryValue: string
  secondarySuffix: string
}

export interface HomeSummaryVisitorsViewModel extends HomeSummaryCardViewModel {
  showVisitors: boolean
  visitors: VisitorPreview[]
}

export interface HomeSummaryViewModel {
  newVisitors: HomeSummaryVisitorsViewModel
  reading: HomeSummaryCardViewModel
  sharing: HomeSummaryCardViewModel
}

export interface HomeOverviewViewModel {
  newVisitors: NewVisitorsSummary
  reading: ReadingSummary
  sharing: SharingSummary
  unreadNotificationCount: number
}
