import type { ApiNotifyIntentLevel, ApiNotifySettings } from '../types/api'
import {
  DEFAULT_NOTIFY_INTENT_LEVEL,
  notifyIntentLevelOptions,
  type NotifyIntentLevel,
} from '../types/settings'
import { request, uploadFile } from './request'

export { DEFAULT_NOTIFY_INTENT_LEVEL, notifyIntentLevelOptions }

/** PUT /user/profile */
export function updateUserProfile(input: { nickname: string; avatar: string }): Promise<void> {
  return request<void>({
    method: 'PUT',
    path: '/user/profile',
    data: { nickname: input.nickname, avatar: input.avatar },
  })
}

/** POST /user/avatar */
export function uploadUserAvatar(filePath: string): Promise<string> {
  return uploadFile('/user/avatar', filePath)
}

export function normalizeNotifyIntentLevel(level: string | null | undefined): NotifyIntentLevel {
  if (level === 'low' || level === 'medium' || level === 'high') return level
  return DEFAULT_NOTIFY_INTENT_LEVEL
}

/** GET /user/notify-settings */
export function getNotifySettings(): Promise<NotifyIntentLevel> {
  return request<ApiNotifySettings>({
    method: 'GET',
    path: '/user/notify-settings',
  }).then((data) => normalizeNotifyIntentLevel(data.notifyIntentLevel))
}

/** PUT /user/notify-settings */
export function updateNotifySettings(notifyIntentLevel: ApiNotifyIntentLevel): Promise<void> {
  return request<void>({
    method: 'PUT',
    path: '/user/notify-settings',
    data: { notifyIntentLevel },
    silent: true,
  })
}
