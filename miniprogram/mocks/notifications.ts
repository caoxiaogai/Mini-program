import type { NotificationCardViewModel, NotificationFilterViewModel, NotificationsViewModel } from '../types/notifications'

const notificationFilters: NotificationFilterViewModel[] = [
  { id: 'all', label: '全部' },
  { id: 'high', label: '高意向' },
  { id: 'medium', label: '中意向' },
  { id: 'low', label: '低意向' },
]

function createCard(
  id: string,
  userId: string,
  intent: NotificationCardViewModel['intent'],
  action: NotificationCardViewModel['action'],
  actionLabel: string,
  actionIconPath: string,
  avatarUrl: string,
  thumbnailUrl: string,
  statusLabel: string,
): NotificationCardViewModel {
  const intentLabel = intent === 'high' ? '#高意向' : intent === 'medium' ? '#中意向' : '#低意向'

  return {
    id,
    userId,
    visitorName: 'xiaogai',
    intent,
    intentLabel,
    action,
    actionLabel,
    actionDate: '8月20日 14:30',
    actionIconPath,
    avatarUrl,
    thumbnailUrl,
    statusLabel,
  }
}

/** 新版通知页视觉验收用固定假数据，不代表真实用户或生产数据。 */
export function getNotificationsMock(): NotificationsViewModel {
  const duck = '/assets/notifications/avatar-duck.png'
  const cat = '/assets/notifications/avatar-cat.png'
  const river = '/assets/notifications/thumb-river.png'
  const aquatic = '/assets/notifications/thumb-aquatic.png'

  return {
    filters: notificationFilters,
    groups: [
      {
        id: 'mock-notification-group-1',
        label: '8月17日',
        items: [
          createCard('mock-notification-low-1', 'mock-notification-user-01', 'low', 'forward', '“转发”了你的作品', '/assets/notifications/action-forward.svg', duck, river, '未滑动看完所有图片'),
          createCard('mock-notification-medium-1', 'mock-notification-user-02', 'medium', 'reading', '“阅读”了你的作品', '/assets/notifications/action-forward.svg', duck, river, '该用户浏览进度80%'),
          createCard('mock-notification-high-1', 'mock-notification-user-03', 'high', 'reading', '“阅读”了你的AI', '/assets/notifications/action-reading.svg', cat, aquatic, '该用户转发了你的作品，查看2次以上'),
        ],
      },
      {
        id: 'mock-notification-group-2',
        label: '8月17日',
        items: [
          createCard('mock-notification-low-2', 'mock-notification-user-04', 'low', 'forward', '“转发”了你的作品', '/assets/notifications/action-forward.svg', duck, river, '未滑动看完所有图片'),
          createCard('mock-notification-medium-2', 'mock-notification-user-05', 'medium', 'reading', '“阅读”了你的作品', '/assets/notifications/action-forward.svg', duck, river, '该用户浏览进度80%'),
        ],
      },
    ],
  }
}
