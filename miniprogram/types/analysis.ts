export type AnalysisMetric = { label: string; value: string }

export type AnalysisWorkSortId = 'completion' | 'share' | 'view'

export type AnalysisCardSortCounts = Record<AnalysisWorkSortId, number>

export type AnalysisChartPoint = {
  id: string
  label: string
  value: string
}

export type AnalysisReadRange = 'week' | 'month'

export type AnalysisTotalHeroMetric = {
  label: string
  value: string
  delta: string
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
  metrics: AnalysisMetric[]
  compactMetrics: AnalysisMetric[]
  sortCounts: AnalysisCardSortCounts
}

export type AnalysisIntentLevel = 'high' | 'medium' | 'low'

export type AnalysisIntentUser = {
  id: string
  avatarUrl: string
  name: string
  level: AnalysisIntentLevel
  levelLabel: string
  readCount: string
  completionCount: string
  shareCount: string
}

export type AnalysisUserRecord = {
  id: string
  contentId: string
  thumbnailUrl: string
  title: string
  date: string
  progress: string
  viewDuration: string
  readCount: string
  completionCount: string
  shareCount: string
  intentLevel?: AnalysisIntentLevel
  intentLabel?: string
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
  highIntentContentCount?: number
}

export type AnalysisUserDetailViewModel = {
  profile: AnalysisUserProfile
  records: AnalysisUserRecord[]
}

export type AnalysisAudienceUser = {
  id: string
  avatarUrl: string
  name: string
  level: AnalysisIntentLevel
  levelLabel: string
  readCount: string
  completionCount: string
  shareCount: string
}

export type AnalysisDetailViewModel = {
  card: AnalysisCard
  intentUsers: AnalysisIntentUser[]
}

export type AnalysisViewModel = {
  summary: AnalysisMetric[]
  cards: AnalysisCard[]
  userSummary: AnalysisMetric[]
  audienceUsers: AnalysisAudienceUser[]
  totalData: AnalysisTotalViewModel
}

export type AnalysisWorkListViewModel = {
  summary: AnalysisMetric[]
  cards: AnalysisCard[]
}
