import type { HomeOverviewViewModel } from '../types/home'

export const homeOverviewMock: HomeOverviewViewModel = {
  newVisitors: {
    total: 5,
    highIntentCount: 2,
    visitors: [
      { id: 'visitor-01', avatarUrl: '/assets/home/avatar-01.png' },
      { id: 'visitor-02', avatarUrl: '/assets/home/avatar-02.png' },
      { id: 'visitor-03', avatarUrl: '/assets/home/avatar-03.png' },
      { id: 'visitor-04', avatarUrl: '/assets/home/avatar-04.png' },
      { id: 'visitor-05', avatarUrl: '/assets/home/avatar-05.png' },
    ],
  },
  reading: {
    total: 2983,
  },
  sharing: {
    total: 98,
    highlightedContentTitle: 'AI 教程...',
    highlightedContentShareCount: 80,
  },
  unreadNotificationCount: 2,
}
