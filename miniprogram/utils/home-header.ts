const HOME_HEADER_FADE_DISTANCE_PX = 100

export function getHomeHeaderOpacity(scrollTop: number): number {
  return Math.min(Math.max(scrollTop / HOME_HEADER_FADE_DISTANCE_PX, 0), 1)
}

export function getHomeHeaderGradientOpacity(scrollTop: number): number {
  return 1 - getHomeHeaderOpacity(scrollTop)
}
