import type { ApiNotifyIntentLevel, ApiNotifySettings } from '../types/api'
import { request } from './request'

export function getNotifySettings(): Promise<ApiNotifyIntentLevel> {
  return request<ApiNotifySettings>({
    method: 'GET',
    path: '/user/notify-settings',
  }).then((data) => data.notifyIntentLevel)
}

export function updateNotifySettings(notifyIntentLevel: ApiNotifyIntentLevel): Promise<void> {
  return request<void>({
    method: 'PUT',
    path: '/user/notify-settings',
    data: { notifyIntentLevel },
  })
}
