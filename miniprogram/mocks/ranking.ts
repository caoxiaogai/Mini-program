import type { RankingViewModel } from '../types/ranking'

/** DEV_MOCK: 仅用于 Figma 519:4112 的排行榜视觉预览，不代表真实业务数据。 */
export function getRankingStyleMock(): RankingViewModel {
  return {
    entries: [
      {
        id: 'mock-ranking-happy-goose',
        avatarUrl: '/assets/ranking/avatar-01.png',
        name: '快乐小鹅',
        workCount: 50,
        views: 20984,
        shares: 980,
        completions: 840,
      },
      {
        id: 'mock-ranking-lai-cai',
        avatarUrl: '/assets/ranking/avatar-02.png',
        name: '来财来财',
        workCount: 50,
        views: 18930,
        shares: 760,
        completions: 920,
      },
      {
        id: 'mock-ranking-golden-leopard',
        avatarUrl: '/assets/ranking/avatar-03.png',
        name: '金钱豹到',
        workCount: 50,
        views: 18032,
        shares: 720,
        completions: 810,
      },
      {
        id: 'mock-ranking-congratulations',
        avatarUrl: '/assets/ranking/avatar-04.png',
        name: '恭喜暴富',
        workCount: 50,
        views: 16098,
        shares: 810,
        completions: 880,
      },
      {
        id: 'mock-ranking-peace-sign',
        avatarUrl: '/assets/ranking/avatar-05.png',
        name: '给个生活比个耶',
        workCount: 50,
        views: 15093,
        shares: 860,
        completions: 760,
      },
      {
        id: 'mock-ranking-what-looking',
        avatarUrl: '/assets/ranking/avatar-06.png',
        name: '你瞅啥',
        workCount: 50,
        views: 14093,
        shares: 640,
        completions: 730,
      },
      {
        id: 'mock-ranking-orange-cat',
        avatarUrl: '/assets/ranking/avatar-07.png',
        name: '橘里橘气',
        workCount: 50,
        views: 12938,
        shares: 580,
        completions: 680,
      },
      {
        id: 'mock-ranking-black-humor',
        avatarUrl: '/assets/ranking/avatar-08.png',
        name: '黑色幽默',
        workCount: 50,
        views: 11098,
        shares: 1120,
        completions: 620,
      },
    ],
  }
}
