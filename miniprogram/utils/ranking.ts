import type { RankingEntry, RankingEntryViewModel, RankingMetric } from '../types/ranking'

const RANKING_HEADER_FADE_DISTANCE_PX = 25

export function calculateRankingHeaderOpacity(scrollTop: number): number {
  return Math.min(Math.max(scrollTop / RANKING_HEADER_FADE_DISTANCE_PX, 0), 1)
}

export function sortRankingEntries(entries: RankingEntry[], metric: RankingMetric): RankingEntryViewModel[] {
  return [...entries]
    .sort((left, right) => {
      const delta = right[metric] - left[metric]
      if (delta !== 0) return delta
      const workDelta = right.workCount - left.workCount
      if (workDelta !== 0) return workDelta
      return left.id.localeCompare(right.id)
    })
    .map((entry) => ({ ...entry, rankValue: entry[metric] }))
}
