import { ensureVisitorId } from '../constants/visitor'
import { getAuthSession } from './auth'
import { rawRequestWithAuth } from './request'

export interface TrackingEventInput {
  trackingId?: string | null
  materialId?: string | null
  actionType: 'play' | 'end' | 'forward'
  progress?: number
  duration?: number
  sessionId: string
  nickname?: string
  avatar?: string
}

export function createTrackingSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

/** POST /tracking/event 或 /tracking/forward（无需销售登录，后端 /tracking/** 已放行） */
export function reportTrackingEvent(input: TrackingEventInput): Promise<void> {
  const path = input.actionType === 'forward' ? '/tracking/forward' : '/tracking/event'
  const session = getAuthSession()

  return rawRequestWithAuth<void>({
    method: 'POST',
    path,
    data: {
      trackingId: input.trackingId ?? undefined,
      materialId: input.materialId ?? undefined,
      actionType: input.actionType,
      progress: input.progress ?? 0,
      duration: input.duration ?? 0,
      visitorId: ensureVisitorId(),
      sessionId: input.sessionId,
      nickname: input.nickname ?? session?.nickname ?? '',
      avatar: input.avatar ?? session?.avatar ?? '',
    },
    skipAuth: true,
    silent: true,
  }).catch((error) => {
    console.warn('[tracking] report failed', input.actionType, error)
    return undefined
  })
}

/** 视频播放进度 → 百分比（0–100） */
export function calcVideoViewProgress(currentTimeSec: number, durationSec: number): number {
  if (durationSec <= 0) return 0
  const progress = Math.round((currentTimeSec / durationSec) * 100)
  return Math.min(100, Math.max(0, progress))
}

/** 图片素材：已浏览张数 / 总张数 → 进度百分比 */
export function calcImageViewProgress(viewedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0
  const progress = Math.round((viewedCount / totalCount) * 100)
  return Math.min(100, Math.max(0, progress))
}
