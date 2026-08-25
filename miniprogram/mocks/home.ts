import type { HomePageViewModel } from '../types/home'

/**
 * 新版首页视觉预览数据。
 *
 * 这些人物、数量和内容均为开发阶段的虚构数据，不代表生产数据。
 */
export function getHomeStyleMock(): HomePageViewModel {
  return {
    unreadNotificationCount: 10,
    notifications: [
      {
        id: 'mock-notification-lin-xiaoman',
        userId: 'mock-user-lin-xiaoman',
        visitorName: '林小满',
        intent: 'high',
        intentLabel: '#高意向',
        action: 'forward',
        actionLabel: '“转发”了你的作品',
        actionDate: '8月20日 14:30',
        actionIconPath: '/assets/home-new/action-forward.svg',
        avatarUrl: '/assets/analysis/user-avatar-01.jpg',
        thumbnailUrl: '/assets/home-new/today-most-01.jpg',
        statusLabel: '该用户转发了你的作品',
      },
      {
        id: 'mock-notification-zhou-zhixing',
        userId: 'mock-user-zhou-zhixing',
        visitorName: '周知行',
        intent: 'medium',
        intentLabel: '#中意向',
        action: 'reading',
        actionLabel: '“阅读”了你的作品',
        actionDate: '8月20日 13:18',
        actionIconPath: '/assets/home-new/action-reading.svg',
        avatarUrl: '/assets/analysis/user-avatar-03.jpg',
        thumbnailUrl: '/assets/home-new/today-most-02.jpg',
        statusLabel: '该用户已完成阅读',
      },
      {
        id: 'mock-notification-gu-nanxing',
        userId: 'mock-user-gu-nanxing',
        visitorName: '顾南星',
        intent: 'low',
        intentLabel: '#低意向',
        action: 'reading',
        actionLabel: '“阅读”了你的作品',
        actionDate: '8月20日 11:42',
        actionIconPath: '/assets/home-new/action-reading.svg',
        avatarUrl: '/assets/analysis/user-avatar-05.jpg',
        thumbnailUrl: '/assets/home-new/today-most-02.jpg',
        statusLabel: '该用户尚未完成阅读',
      },
    ],
    contents: [
      {
        id: 'mock-material-ai-full-stack',
        title: '资深AI-Native 全栈产品教程',
        date: '2026-10-10 16:39 发布',
        thumbnailUrl: '/assets/home-new/today-most-01.jpg',
        viewCount: '1,231',
        forwardCount: '21',
        highIntentCount: '4',
      },
      {
        id: 'mock-material-growth-playbook',
        title: '增长型产品的内容运营手册',
        date: '2026-10-09 10:12 发布',
        thumbnailUrl: '/assets/home-new/today-most-02.jpg',
        viewCount: '856',
        forwardCount: '16',
        highIntentCount: '3',
      },
    ],
    intentSummary: {
      total: '50',
      highCount: '12',
      mediumCount: '18',
      lowCount: '20',
      previewAvatars: [
        { id: 'mock-avatar-01', avatarUrl: '/assets/home-new/intent-avatar-01.png' },
        { id: 'mock-avatar-02', avatarUrl: '/assets/home-new/intent-avatar-02.png' },
        { id: 'mock-avatar-03', avatarUrl: '/assets/home-new/intent-avatar-03.png' },
        { id: 'mock-avatar-04', avatarUrl: '/assets/home-new/intent-avatar-04.png' },
        { id: 'mock-avatar-05', avatarUrl: '/assets/home-new/intent-avatar-05.png' },
      ],
    },
    today: {
      viewCount: '840',
      completeRate: '4.5%',
      forwardCount: '21',
      viewerCount: '34',
    },
  }
}
