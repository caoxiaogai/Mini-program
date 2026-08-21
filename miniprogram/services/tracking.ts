import { STORAGE_KEY_OPENID } from '../constants/auth'
import { request } from './request'

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

function readOpenId(): string {
  const openid = wx.getStorageSync(STORAGE_KEY_OPENID) as string | ''
  return typeof openid === 'string' && openid !== '' ? openid : 'anonymous'
}

export function createTrackingSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

/** POST /tracking/event 或 /tracking/forward */
export function reportTrackingEvent(input: TrackingEventInput): Promise<void> {
  const visitorId = readOpenId()
  const path = input.actionType === 'forward' ? '/tracking/forward' : '/tracking/event'

  return request<void>({
    method: 'POST',
    path,
    data: {
      trackingId: input.trackingId ?? undefined,
      materialId: input.materialId ? Number(input.materialId) : undefined,
      actionType: input.actionType,
      progress: input.progress ?? 0,
      duration: input.duration ?? 0,
      visitorId,
      sessionId: input.sessionId,
      nickname: input.nickname ?? '',
      avatar: input.avatar ?? '',
    },
    silent: true,
  }).catch(() => undefined)
}

/** 图片素材：已浏览张数 / 总张数 → 进度百分比 */
export function calcImageViewProgress(viewedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0
  const progress = Math.round((viewedCount / totalCount) * 100)
  return Math.min(100, Math.max(0, progress))
}
