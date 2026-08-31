import type { AnalysisContentDetailViewModel, AnalysisViewModel } from '../types/analysis'

/** Figma 743:4059 离线视觉预览数据，仅用于 UI 调试。 */
export const analysisContentDetailPreview: AnalysisContentDetailViewModel = {
  totalViewCount: '24,234',
  totalForwardCount: '1,223',
  totalPublishCount: '10',
  intentUserCount: '1,034',
  intentUsers: [
    { id: 'preview-xiaogai-1', userId: 'preview-xiaogai', avatarUrl: '/assets/analysis/user-avatar-01.jpg', name: 'xiaogai', level: 'high', levelLabel: '高意向', readCount: '50', completionCount: '4', shareCount: '4' },
    { id: 'preview-xiaogai-2', userId: 'preview-xiaogai', avatarUrl: '/assets/analysis/user-avatar-02.jpg', name: 'xiaogai', level: 'high', levelLabel: '高意向', readCount: '50', completionCount: '4', shareCount: '4' },
    { id: 'preview-xiaogai-3', userId: 'preview-xiaogai', avatarUrl: '/assets/analysis/user-avatar-03.jpg', name: 'xiaogai', level: 'high', levelLabel: '高意向', readCount: '50', completionCount: '4', shareCount: '4' },
    { id: 'preview-happy-goose', userId: 'preview-happy-goose', avatarUrl: '/assets/analysis/user-avatar-04.jpg', name: '快乐小鹅', level: 'medium', levelLabel: '中意向', readCount: '50', completionCount: '1', shareCount: '4' },
    { id: 'preview-laicai-1', userId: 'preview-laicai', avatarUrl: '/assets/analysis/user-avatar-05.jpg', name: '来财来财', level: 'low', levelLabel: '低意向', readCount: '50', completionCount: '2', shareCount: '4' },
    { id: 'preview-laicai-2', userId: 'preview-laicai', avatarUrl: '/assets/analysis/user-avatar-06.jpg', name: '来财来财', level: 'low', levelLabel: '低意向', readCount: '50', completionCount: '2', shareCount: '4' },
    { id: 'preview-laicai-3', userId: 'preview-laicai', avatarUrl: '/assets/analysis/user-avatar-07.jpg', name: '来财来财', level: 'low', levelLabel: '低意向', readCount: '50', completionCount: '2', shareCount: '4' },
    { id: 'preview-laicai-4', userId: 'preview-laicai', avatarUrl: '/assets/analysis/user-avatar-05.jpg', name: '来财来财', level: 'low', levelLabel: '低意向', readCount: '50', completionCount: '2', shareCount: '4' },
    { id: 'preview-laicai-5', userId: 'preview-laicai', avatarUrl: '/assets/analysis/user-avatar-06.jpg', name: '来财来财', level: 'low', levelLabel: '低意向', readCount: '50', completionCount: '2', shareCount: '4' },
  ],
  cards: [
    { id: 'preview-content-1', thumbnailUrl: '/assets/analysis/content-figma-mountain.jpg', title: '资深AI-Native 全栈产品教程', publishedAt: '2026-10-10 16:39 发布', intentLevel: 'high', intentLabel: '4 个高意向', viewCount: '1,231', forwardCount: '21', completeCount: '4' },
    { id: 'preview-content-2', thumbnailUrl: '/assets/analysis/content-figma-sunset.jpg', title: '资深AI-Native 全栈产品教程', publishedAt: '2026-10-10 16:39 发布', intentLevel: 'high', intentLabel: '4 个高意向', viewCount: '1,231', forwardCount: '21', completeCount: '4' },
    { id: 'preview-content-3', thumbnailUrl: '/assets/analysis/content-figma-lake.jpg', title: '资深AI-Native 全栈产品教程', publishedAt: '2026-10-10 16:39 发布', intentLevel: 'high', intentLabel: '4 个高意向', viewCount: '1,231', forwardCount: '21', completeCount: '4' },
  ],
}

/** Figma 743:3561 作品分析预览数据，供首页分析 Tab 离线排版使用。 */
export const analysisOverviewPreview: AnalysisViewModel = {
  summary: [
    { label: '总阅读次数', value: '24,234', iconPath: '/assets/analysis/total-view-icon.svg' },
    { label: '总转发', value: '1,223', iconPath: '/assets/analysis/total-forward-icon.svg' },
  ],
  workCount: '10',
  cards: [
    { id: 'preview-work-1', thumbnailUrl: '/assets/analysis/content-figma-mountain.jpg', title: '资深AI-Native 全栈产品教程', date: '2026-10-10', publishedAt: '2026-10-10 16:39 发布', intentLevel: 'high', intentLabel: '4 个高意向', metrics: [], compactMetrics: [{ label: '浏览次数', value: '1,231' }, { label: '转发', value: '21' }, { label: '完播', value: '4' }], sortCounts: { view: 1231, share: 21, completion: 4 } },
    { id: 'preview-work-2', thumbnailUrl: '/assets/analysis/content-figma-mountain.jpg', title: '资深AI-Native 全栈产品教程', date: '2026-10-10', publishedAt: '2026-10-10 16:39 发布', intentLevel: 'high', intentLabel: '4 个高意向', metrics: [], compactMetrics: [{ label: '浏览次数', value: '1,231' }, { label: '转发', value: '21' }, { label: '完播', value: '4' }], sortCounts: { view: 1231, share: 21, completion: 4 } },
    { id: 'preview-work-3', thumbnailUrl: '/assets/analysis/content-figma-mountain.jpg', title: '资深AI-Native 全栈产品教程', date: '2026-10-10', publishedAt: '2026-10-10 16:39 发布', intentLevel: 'high', intentLabel: '4 个高意向', metrics: [], compactMetrics: [{ label: '浏览次数', value: '1,231' }, { label: '转发', value: '21' }, { label: '完播', value: '4' }], sortCounts: { view: 1231, share: 21, completion: 4 } },
    { id: 'preview-work-4', thumbnailUrl: '/assets/analysis/content-figma-sunset.jpg', title: '资深AI-Native 全栈产品教程', date: '2026-10-10', publishedAt: '2026-10-10 16:39 发布', intentLevel: 'empty', intentLabel: '暂无高意向', metrics: [], compactMetrics: [{ label: '浏览次数', value: '1,231' }, { label: '转发', value: '21' }, { label: '完播', value: '4' }], sortCounts: { view: 1231, share: 21, completion: 4 } },
    { id: 'preview-work-5', thumbnailUrl: '/assets/analysis/content-figma-lake.jpg', title: '资深AI-Native 全栈产品教程，一人...', date: '2026-08-20', publishedAt: '8 月 20 17:00', intentLevel: 'medium', intentLabel: '3 个中意向', metrics: [], compactMetrics: [{ label: '浏览次数', value: '0' }, { label: '转发', value: '1' }, { label: '完播', value: '0' }], sortCounts: { view: 0, share: 1, completion: 0 } },
  ],
  userSummary: [
    { label: '高意向', value: '4,234', iconPath: '/assets/analysis/intent-summary-icon.svg' },
    { label: '中意向', value: '1,223', iconPath: '/assets/analysis/intent-summary-icon.svg' },
    { label: '低意向', value: '1,223', iconPath: '/assets/analysis/intent-summary-icon.svg' },
  ],
  audienceUsers: analysisContentDetailPreview.intentUsers,
  totalData: {
    heroMetrics: [
      { label: '阅读总次数', value: '122,100次', delta: '+30' },
      { label: '阅读总人数', value: '920人', delta: '+30' },
    ],
    overview: [
      { label: '总发布', value: '10' },
      { label: '总转发', value: '1,223' },
      { label: '总完播', value: '4' },
      { label: '高意向', value: '3' },
      { label: '中意向', value: '1' },
      { label: '低意向', value: '5' },
    ],
    readTrends: { day: [], week: [], month: [], total: [] },
  },
}
