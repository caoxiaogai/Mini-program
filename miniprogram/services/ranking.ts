import type { RankingEntry, RankingEntryViewModel, RankingMetric, RankingViewModel } from '../types/ranking'
import { getRankingStyleMock } from '../mocks/ranking'

// TODO(API): 接入排行榜真实接口
// Method: 待后端确认
// Endpoint: 待后端确认（后端 aisales 项目当前未提供销售排行榜接口）
// Request: 待后端确认
// Response: RankingViewModel
// Auth/permission: 待后端确认
// Error states: 待后端确认
// 后端提供接口前返回固定开发数据，页面用于 Figma 视觉预览。
export function getRankingOverview(): Promise<RankingViewModel> {
  return Promise.resolve(getRankingStyleMock())
}

export function sortRankingEntries(entries: RankingEntry[], metric: RankingMetric): RankingEntryViewModel[] {
  return [...entries]
    .sort((left, right) => right[metric] - left[metric])
    .map((entry) => ({ ...entry, rankValue: entry[metric] }))
}
