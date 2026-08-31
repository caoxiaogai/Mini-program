import type { UserJourneyViewModel } from '../types/analysis'

const mockUserJourney: UserJourneyViewModel = {
  userId: 'mock-customer',
  userName: '云端探索者',
  product: {
    id: 'mock-material',
    thumbnailUrl: '/assets/analysis/user-journey-product.png',
    title: '资深AI-Native 全栈产品教程，一人即可干完所有',
    intentLabel: '#高意向',
  },
  events: [
    { id: 'journey-complete-pages', occurredAt: '今天 16:14', action: '完播了', detail: '查看 5 页' },
    { id: 'journey-complete-duration', occurredAt: '今天 14:23', action: '完播了', detail: '播放了 50 秒' },
    { id: 'journey-view-pages', occurredAt: '今天 12:20', action: '浏览了', detail: '查看 3 页' },
    { id: 'journey-view-duration', occurredAt: '今天 09:31', action: '浏览了', detail: '播放了 32 秒' },
    { id: 'journey-share-first', occurredAt: '昨天 15:30', action: '转发了', detail: '第一次转发' },
    { id: 'journey-share-repeat', occurredAt: '昨天 14:35', action: '转发了', detail: '第一次转发' },
  ],
}

export function getMockUserJourney(userId: string, materialId: string): UserJourneyViewModel {
  return {
    ...mockUserJourney,
    userId,
    product: { ...mockUserJourney.product, id: materialId },
    events: mockUserJourney.events.map((event) => ({ ...event })),
  }
}
