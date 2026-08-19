export type AnalysisMetric = { label: string; value: string }

export type AnalysisChartPoint = {
  id: string
  label: string
  value: string
  height: number
}

export type AnalysisReadRange = 'week' | 'month'

export type AnalysisTotalViewModel = {
  overview: AnalysisMetric[]
  readTrends: Record<AnalysisReadRange, AnalysisChartPoint[]>
}

export type AnalysisCard = {
  id: string
  thumbnailUrl: string
  title: string
  date: string
  metrics: AnalysisMetric[]
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
  thumbnailUrl: string
  title: string
  date: string
  type: string
  progress: string
  viewDuration: string
  completionCount: string
  shareCount: string
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
  viewedWorksCount: string
  shareCount: string
  showMarker?: boolean
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
