import type { ApiNotifyIntentLevel, ApiNotifySettings } from '../types/api'
import {
  DEFAULT_NOTIFY_INTENT_LEVEL,
  notifyIntentLevelOptions,
  type NotifyIntentLevel,
} from '../types/settings'
import { request } from './request'

export { DEFAULT_NOTIFY_INTENT_LEVEL, notifyIntentLevelOptions }

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
