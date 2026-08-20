import type { NotificationsViewModel } from '../types/notifications'

export const notificationsMock: NotificationsViewModel = {
  filters: [
    { id: 'all', label: '全部' },
    { id: 'high', label: '高意向' },
    { id: 'medium', label: '中意向' },
    { id: 'low', label: '低意向' },
  ],
  groups: [
    {
      id: '2026-08-17',
      label: '08月17日',
      items: [
        {
          id: 'notification-xiaogai-reading',
          userId: 'user-01',
          visitorName: 'xiaogai',
          intent: 'high',
          intentLabel: '#高意向',
          action: 'reading',
          actionLabel: '“阅读”了你的作品',
          actionDate: '8月20日',
          actionIconPath: '/assets/notifications/action-reading.svg',
          avatarUrl: '/assets/notifications/avatar-xiaogai.png',
          thumbnailUrl: '/assets/notifications/thumb-xiaogai-1.jpg',
          recommendation: '意向程度较高，建议优先联系',
        },
        {
          id: 'notification-wang-xiaoer-forward',
          userId: 'user-02',
          visitorName: '王小二',
          intent: 'medium',
          intentLabel: '#中意向',
          action: 'forward',
          actionLabel: '“转发”了你的作品',
          actionDate: '8月20日',
          actionIconPath: '/assets/notifications/action-forward.svg',
          avatarUrl: '/assets/notifications/avatar-wang-xiaoer.png',
          thumbnailUrl: '/assets/notifications/thumb-wang-xiaoer-1.jpg',
          recommendation: '存在兴趣，建议主动跟进',
        },
      ],
    },
    {
      id: '2026-08-16',
      label: '08月16日',
      items: [],
    },
  ],
}
