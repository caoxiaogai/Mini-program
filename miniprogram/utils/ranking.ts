const RANKING_HEADER_FADE_DISTANCE_PX = 25

export function calculateRankingHeaderOpacity(scrollTop: number): number {
  return Math.min(Math.max(scrollTop / RANKING_HEADER_FADE_DISTANCE_PX, 0), 1)
}
