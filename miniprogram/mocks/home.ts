import type { HomePageViewModel } from '../types/home'

/**
 * 新版首页视觉预览数据。
 *
 * 当前展示 Figma 空数据状态；所有数量和头像仅用于开发阶段视觉验收，不代表生产数据。
 */
export function getHomeStyleMock(): HomePageViewModel {
  return {
    unreadNotificationCount: 0,
    notifications: [],
    contents: [],
    intentSummary: {
      total: '0',
      highCount: '0',
      mediumCount: '0',
      lowCount: '0',
      previewAvatars: [
        { id: 'mock-avatar-01', avatarUrl: '/assets/home-new/intent-avatar-01.png' },
        { id: 'mock-avatar-02', avatarUrl: '/assets/home-new/intent-avatar-02.png' },
        { id: 'mock-avatar-03', avatarUrl: '/assets/home-new/intent-avatar-03.png' },
        { id: 'mock-avatar-04', avatarUrl: '/assets/home-new/intent-avatar-04.png' },
        { id: 'mock-avatar-05', avatarUrl: '/assets/home-new/intent-avatar-05.png' },
      ],
    },
    today: {
      viewCount: '0',
      completeRate: '0',
      forwardCount: '0',
      viewerCount: '0',
    },
  }
}
