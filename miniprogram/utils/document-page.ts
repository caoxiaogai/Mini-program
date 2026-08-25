const PAGE_VERTICAL_MARGIN_RPX = 32
const PLACEHOLDER_HEIGHT_RPX = 1000

export function rpxToPx(rpx: number, windowWidth: number): number {
  return (rpx / 750) * windowWidth
}

export function getDocumentPageBlockHeight(measuredPx: number | undefined, windowWidth: number): number {
  const contentHeight = measuredPx && measuredPx > 0 ? measuredPx : rpxToPx(PLACEHOLDER_HEIGHT_RPX, windowWidth)
  return contentHeight + rpxToPx(PAGE_VERTICAL_MARGIN_RPX, windowWidth)
}

/** 阅读区顶部所在的页（0-based）。scrollTop 为 0 时一定是第一页。 */
export function pickCurrentDocumentPageByScroll(
  scrollTop: number,
  pageCount: number,
  measuredHeightsPx: Array<number | undefined>,
  windowWidth: number,
): number {
  if (pageCount <= 0) return -1

  const top = Math.max(0, scrollTop)
  let offset = 0

  for (let index = 0; index < pageCount; index += 1) {
    const blockHeight = getDocumentPageBlockHeight(measuredHeightsPx[index], windowWidth)
    if (top < offset + blockHeight) return index
    offset += blockHeight
  }

  return pageCount - 1
}
