import type { ApiUserFeedback } from '../types/api'
import { request } from './request'

export interface UserFeedbackItem {
  id: string
  nickname: string
  content: string
  reply: string
  createTimeLabel: string
  replyTimeLabel: string
  draft: string
}

function formatFeedbackTime(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace('T', ' ').slice(0, 16)
}

function mapFeedback(item: ApiUserFeedback): UserFeedbackItem {
  return {
    id: String(item.id),
    nickname: item.nickname?.trim() || '微信用户',
    content: item.content ?? '',
    reply: item.reply?.trim() ?? '',
    createTimeLabel: formatFeedbackTime(item.createTime),
    replyTimeLabel: formatFeedbackTime(item.replyTime),
    draft: item.reply?.trim() ?? '',
  }
}

/** GET /feedback/mine */
export function getMyFeedback(): Promise<UserFeedbackItem[]> {
  return request<ApiUserFeedback[]>({ method: 'GET', path: '/feedback/mine' }).then((rows) => (rows ?? []).map(mapFeedback))
}

/** POST /feedback */
export function submitFeedback(content: string): Promise<void> {
  return request<void>({
    method: 'POST',
    path: '/feedback',
    data: { content },
  })
}

/** GET /feedback */
export function getAllFeedback(): Promise<UserFeedbackItem[]> {
  return request<ApiUserFeedback[]>({ method: 'GET', path: '/feedback' }).then((rows) => (rows ?? []).map(mapFeedback))
}

/** PUT /feedback/{id}/reply */
export function replyFeedback(id: string, reply: string): Promise<void> {
  return request<void>({
    method: 'PUT',
    path: `/feedback/${id}/reply`,
    data: { reply },
  })
}
