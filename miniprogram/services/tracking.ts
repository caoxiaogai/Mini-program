import { ensureLogin, hasAuthorizedLogin, postNow, request } from './request'

export interface TrackingEventInput {
  trackingId?: string | null
  materialId?: string | null
  actionType: 'play' | 'end' | 'forward' | 'seek'
  progress?: number
  duration?: number
  sessionId: string
}

export function createTrackingSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * 上报素材浏览或转发。
 * POST /tracking/event（play / end / seek）或 POST /tracking/forward。
 * body 携带 visitorId（当前用户 openid），并走登录请求头；失败静默忽略。
 */
export function reportTrackingEvent(input: TrackingEventInput): Promise<void> {
  const path = input.actionType === 'forward' ? '/tracking/forward' : '/tracking/event'

  return ensureLogin()
    .then((user) =>
      request<void>({
        method: 'POST',
        path,
        silent: true,
        data: {
          trackingId: input.trackingId || undefined,
          materialId: input.materialId || undefined,
          actionType: input.actionType,
          progress: input.progress ?? 0,
          duration: input.duration ?? 0,
          visitorId: user.openid || undefined,
          sessionId: input.sessionId,
          nickname: user.nickname ?? '',
          avatar: user.avatar ?? '',
        },
      }),
    )
    .then(() => undefined)
    .catch((error) => {
      console.warn('[tracking] report failed', input.actionType, error)
    })
}

/** 同一次小程序进程里递增，后发出的回到请求可以盖过还在路上的离开请求。 */
let presenceGeneration = 0
let heartbeatTimer = 0
const HEARTBEAT_INTERVAL_MS = 2000

/** 访客离开或回到小程序。离开后才发通知；马上回来则取消。 */
function reportVisitorPresence(path: '/tracking/leave' | '/tracking/resume'): void {
  presenceGeneration += 1
  postNow(path, { generation: presenceGeneration })
}

/** 小程序在前台时持续心跳。切到后台后心跳停止，后端据此判断访客已离开。 */
export function startVisitorHeartbeat(): void {
  stopVisitorHeartbeat()
  reportVisitorHeartbeat()
  heartbeatTimer = setInterval(reportVisitorHeartbeat, HEARTBEAT_INTERVAL_MS) as unknown as number
}

export function stopVisitorHeartbeat(): void {
  if (!heartbeatTimer) return
  clearInterval(heartbeatTimer)
  heartbeatTimer = 0
}

function reportVisitorHeartbeat(): void {
  if (!hasAuthorizedLogin()) return
  request<void>({
    method: 'POST',
    path: '/tracking/heartbeat',
    silent: true,
    data: {},
  }).catch((error) => {
    console.warn('[tracking] heartbeat failed', error)
  })
}

export function reportVisitorLeave(): void {
  reportVisitorPresence('/tracking/leave')
}

export function cancelVisitorLeave(): void {
  reportVisitorPresence('/tracking/resume')
}

/** 视频播放进度 → 百分比（0–100） */
export function calcVideoViewProgress(currentTimeSec: number, durationSec: number): number {
  if (durationSec <= 0) return 0
  const progress = Math.round((currentTimeSec / durationSec) * 100)
  return Math.min(100, Math.max(0, progress))
}

/** 图片/文档：已浏览张数或页数 / 总数 → 进度百分比 */
export function calcImageViewProgress(viewedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0
  const progress = Math.round((viewedCount / totalCount) * 100)
  return Math.min(100, Math.max(0, progress))
}
