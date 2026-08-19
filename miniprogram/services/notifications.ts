import { notificationsMock } from '../mocks/notifications'
import type { NotificationsViewModel } from '../types/notifications'

// TODO(API): 接入通知列表真实接口
// Method: GET（待后端确认）
// Endpoint: 待后端确认
// Request: 待后端确认
// Response: NotificationsViewModel
// Auth/permission: 待后端确认
// Error states: 待后端确认
export function getNotifications(): Promise<NotificationsViewModel> {
  return Promise.resolve(notificationsMock)
}
