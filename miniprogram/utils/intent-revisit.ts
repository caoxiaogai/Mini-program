/** 视频回看高意向：进度必须先超过这个百分比 */
export const VIDEO_REVISIT_MIN_PROGRESS = 80

/**
 * 多图或 PDF 看完后，又回到更靠前的图片或页。
 * previousIndex 为上一次停留位置，nextIndex 更小表示往回看。
 */
export function shouldReportIndexRevisit(input: {
  completed: boolean
  previousIndex: number
  nextIndex: number
  alreadyReported: boolean
}): boolean {
  if (input.alreadyReported || !input.completed || input.previousIndex < 0) return false
  return input.nextIndex < input.previousIndex
}

/** 进度超过 80% 之后，播放时间至少回退 1 秒。 */
export function shouldReportVideoRevisit(input: {
  peakProgress: number
  peakTimeSec: number
  nextTimeSec: number
  alreadyReported: boolean
}): boolean {
  if (input.alreadyReported || input.peakProgress <= VIDEO_REVISIT_MIN_PROGRESS) return false
  return input.nextTimeSec <= input.peakTimeSec - 1
}
