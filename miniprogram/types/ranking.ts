export type RankingMetric = 'views' | 'shares' | 'completions'

export type RankingTab = {
  id: RankingMetric
  label: string
}

export type RankingEntry = {
  id: string
  avatarUrl: string
  name: string
  workCount: number
  views: number
  shares: number
  completions: number
}

export type RankingEntryViewModel = RankingEntry & {
  rankValue: number
}

export type RankingViewModel = {
  entries: RankingEntry[]
}
