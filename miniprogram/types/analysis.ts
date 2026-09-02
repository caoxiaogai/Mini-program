export type AnalysisMetric = { label: string; value: string; iconPath?: string }

export type AnalysisWorkSortId = 'completion' | 'share' | 'view'

export type AnalysisCardSortCounts = Record<AnalysisWorkSortId, number>

export type AnalysisChartPoint = {
  id: string
  label: string
  value: string
}

export type AnalysisReadRange = 'day' | 'week' | 'month' | 'total'

export type AnalysisDeltaTone = 'up' | 'down'

export type AnalysisTotalHeroMetric = {
  id: string
  renderKey: string
  label: string
  value: string
  comparisonLabel: string
  delta: string
  deltaTone: AnalysisDeltaTone
}

export type AnalysisTotalViewModel = {
  heroMetrics: AnalysisTotalHeroMetric[]
  overview: AnalysisMetric[]
  readTrends: Record<AnalysisReadRange, AnalysisChartPoint[]>
}

export type AnalysisCard = {
  id: string
  thumbnailUrl: string
  title: string
  date: string
  publishedAt: string
  intentLevel: AnalysisIntentLevel | 'empty'
  intentLabel: string
  metrics: AnalysisMetric[]
  compactMetrics: AnalysisMetric[]
  sortCounts: AnalysisCardSortCounts
}

export type AnalysisIntentLevel = 'high' | 'medium' | 'low'

export type AnalysisUserRecord = {
  id: string
  contentId: string
  thumbnailUrl: string
  title: string
  date: string
  fileType?: string
  progress: string
  viewDuration: string
  readCount: string
  completionCount: string
  shareCount: string
  intentLevel: AnalysisIntentLevel
  intentLabel: string
}

export type AnalysisUserProfile = {
  id: string
  avatarUrl: string
  name: string
  level: AnalysisIntentLevel
  levelLabel: string
  readCount: string
  completionCount: string
  shareCount: string
  viewDuration: string
  highIntentContentCount: number
}

export type AnalysisUserDetailViewModel = {
  profile: AnalysisUserProfile
  records: AnalysisUserRecord[]
}

export type UserJourneyProduct = {
  id: string
  thumbnailUrl: string
  title: string
  intentLabel: string
}

export type UserJourneyEvent = {
  id: string
  occurredAt: string
  action: string
  detail: string
}

export type UserJourneyViewModel = {
  userId: string
  userName: string
  product: UserJourneyProduct
  events: UserJourneyEvent[]
}

export type AnalysisAudienceUser = {
  id: string
  userId?: string
  avatarUrl: string
  name: string
  level: AnalysisIntentLevel
  levelLabel: string
  readCount: string
  completionCount: string
  shareCount: string
}

export type AnalysisContentDetailViewModel = {
  card: {
    id: string
    thumbnailUrl: string
    title: string
    date: string
    metrics: AnalysisMetric[]
  }
  intentUsers: AnalysisAudienceUser[]
}

export type AnalysisViewModel = {
  summary: AnalysisMetric[]
  cards: AnalysisCard[]
  workCount: string
  userSummary: AnalysisMetric[]
  audienceUsers: AnalysisAudienceUser[]
  /** 用户分析列表可展示的访客上限；null 表示不限制 */
  visitorLimit: number | null
  totalData: AnalysisTotalViewModel
}

export type AnalysisWorkListViewModel = {
  summary: AnalysisMetric[]
  cards: AnalysisCard[]
  workCount: string
}
