import { rankingMock } from '../mocks/ranking'
import type { RankingEntry, RankingEntryViewModel, RankingMetric, RankingViewModel } from '../types/ranking'

// TODO(API): 接入排行榜真实接口
// Method: GET（待后端确认）
// Endpoint: 待后端确认
// Request: 待后端确认
// Response: RankingViewModel
// Error states: 待后端确认
export function getRankingOverview(): Promise<RankingViewModel> {
  return Promise.resolve(rankingMock)
}

export function sortRankingEntries(entries: RankingEntry[], metric: RankingMetric): RankingEntryViewModel[] {
  return [...entries]
    .sort((left, right) => right[metric] - left[metric])
    .map((entry) => ({ ...entry, rankValue: entry[metric] }))
}
