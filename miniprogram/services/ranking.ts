import type { RankingEntry, RankingEntryViewModel, RankingMetric, RankingViewModel } from '../types/ranking'

// TODO(API): 接入排行榜真实接口
// Method: 待后端确认
// Endpoint: 待后端确认（后端 aisales 项目当前未提供销售排行榜接口）
// Request: 待后端确认
// Response: RankingViewModel
// Auth/permission: 待后端确认
// Error states: 待后端确认
// 后端提供接口前返回空榜单，页面展示既有「暂无数据」空状态。
export function getRankingOverview(): Promise<RankingViewModel> {
  return Promise.resolve({ entries: [] })
}

export function sortRankingEntries(entries: RankingEntry[], metric: RankingMetric): RankingEntryViewModel[] {
  return [...entries]
    .sort((left, right) => right[metric] - left[metric])
    .map((entry) => ({ ...entry, rankValue: entry[metric] }))
}
