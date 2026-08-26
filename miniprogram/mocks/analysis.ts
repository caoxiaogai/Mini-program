import type {
  AnalysisAudienceUser,
  AnalysisCard,
  AnalysisChartPoint,
  AnalysisDetailViewModel,
  AnalysisIntentUser,
  AnalysisUserDetailViewModel,
  AnalysisViewModel,
} from '../types/analysis'

const publishedAt = '2026-10-10 16:39 发布'

function createChartPoints(range: 'week' | 'month', labels: string[], values: number[]): AnalysisChartPoint[] {
  const maxValue = Math.max(...values)

  return labels.map((label, index) => ({
    id: `mock-${range}-${index + 1}`,
    label,
    value: values[index].toLocaleString('en-US'),
    height: Math.round(24 + (values[index] / maxValue) * 226),
  }))
}

function createCard(
  id: string,
  thumbnailUrl: string,
  title: string,
  forwardCount: string,
  completionCount = '4',
): AnalysisCard {
  return {
    id,
    thumbnailUrl,
    title,
    date: '2026-10-10',
    publishedAt,
    metrics: [
      { label: '转发', value: forwardCount },
      { label: '播完', value: completionCount },
      { label: '浏览', value: '1,231' },
      { label: '观看人数', value: '1,231' },
    ],
    compactMetrics: [
      { label: '浏览次数', value: '1,231' },
      { label: '转发', value: forwardCount },
      { label: '完播', value: completionCount },
    ],
  }
}

function createAudienceUser(
  id: string,
  avatarUrl: string,
  name: string,
  level: AnalysisAudienceUser['level'],
  levelLabel: string,
  completionCount: string,
): AnalysisAudienceUser {
  return {
    id,
    avatarUrl,
    name,
    level,
    levelLabel,
    readCount: '50',
    completionCount,
    shareCount: '4',
  }
}

function createDetailIntentUser(
  id: string,
  avatarUrl: string,
  name: string,
  level: AnalysisIntentUser['level'],
  levelLabel: string,
  completionCount: string,
): AnalysisIntentUser {
  return {
    id,
    avatarUrl,
    name,
    level,
    levelLabel,
    readCount: '50',
    completionCount,
    shareCount: '4',
  }
}

function createUserRecord(
  id: string,
  contentId: string,
  thumbnailUrl: string,
  title: string,
  progress = '10%',
  overrides: Partial<AnalysisUserDetailViewModel['records'][number]> = {},
): AnalysisUserDetailViewModel['records'][number] {
  return {
    id,
    contentId,
    thumbnailUrl,
    title,
    date: '8 月20日',
    progress,
    viewDuration: '11s',
    readCount: '1',
    completionCount: '0',
    shareCount: '1',
    ...overrides,
  }
}

/** 用户详情页 Figma 497:4640 视觉预览数据。 */
export function getAnalysisUserDetailStyleMock(userId: string): AnalysisUserDetailViewModel {
  return {
    profile: {
      id: userId,
      avatarUrl: '/assets/notifications/avatar-duck.png',
      name: '给个生活比个耶',
      level: 'high',
      levelLabel: '高意向',
      readCount: '56',
      completionCount: '23',
      shareCount: '23',
      viewDuration: '11s',
      highIntentContentCount: 4,
    },
    records: [
      createUserRecord('mock-user-record-01', 'mock-analysis-content-01', '/assets/analysis/content-01.jpg', 'AI Native 产品学习', '10%', { readCount: '56', completionCount: '23', shareCount: '23', intentLevel: 'high', intentLabel: '高意向' }),
      createUserRecord('mock-user-record-02', 'mock-analysis-content-02', '/assets/materials/material-02.jpg', '资深AI-Native 全栈产品教程，一人...', '30%', { readCount: '34', completionCount: '12', shareCount: '8', intentLevel: 'medium', intentLabel: '中意向' }),
      createUserRecord('mock-user-record-03', 'mock-analysis-content-03', '/assets/home-new/today-most-01.jpg', '明日方舟，这个夏天很美好', '100%', { readCount: '21', completionCount: '18', shareCount: '16', intentLevel: 'high', intentLabel: '高意向' }),
      createUserRecord('mock-user-record-04', 'mock-analysis-content-04', '/assets/notifications/thumb-river.png', '绿水青山就是金山银山', '10%', { readCount: '8', completionCount: '3', shareCount: '1', intentLevel: 'low', intentLabel: '低意向' }),
      createUserRecord('mock-user-record-05', 'mock-analysis-content-05', '/assets/notifications/thumb-river.png', 'AI Native 产品学习', '60%', { readCount: '13', completionCount: '9', shareCount: '5', intentLevel: 'high', intentLabel: '高意向' }),
    ],
  }
}

/** 内容分析详情 Figma 视觉预览数据。 */
export function getAnalysisDetailStyleMock(cardId: string): AnalysisDetailViewModel {
  return {
    card: createCard(
      cardId,
      '/assets/analysis/content-02.jpg',
      '资深AI-Native 全栈产品教程，一人即可干完所有',
      '1600',
      '23',
    ),
    intentUsers: [
      createDetailIntentUser('mock-detail-user-01', '/assets/analysis/user-avatar-01.jpg', 'xiaogai', 'high', '高意向', '4'),
      createDetailIntentUser('mock-detail-user-02', '/assets/analysis/user-avatar-01.jpg', 'xiaogai', 'high', '高意向', '4'),
      createDetailIntentUser('mock-detail-user-03', '/assets/analysis/user-avatar-01.jpg', 'xiaogai', 'high', '高意向', '4'),
      createDetailIntentUser('mock-detail-user-04', '/assets/analysis/user-avatar-02.jpg', '快乐小鹅', 'medium', '中意向', '1'),
      createDetailIntentUser('mock-detail-user-05', '/assets/analysis/user-avatar-03.jpg', '来财来财', 'low', '低意向', '2'),
    ],
  }
}

/**
 * 分析页 Figma 视觉预览数据。
 * 所有内容、人物和统计均为固定的开发阶段虚构数据，不代表生产数据。
 */
export function getAnalysisStyleMock(): AnalysisViewModel {
  const audienceUsers: AnalysisAudienceUser[] = [
    createAudienceUser('mock-analysis-user-01', '/assets/analysis/user-avatar-01.jpg', 'xiaogai', 'high', '高意向', '4'),
    createAudienceUser('mock-analysis-user-02', '/assets/analysis/user-avatar-01.jpg', 'xiaogai', 'high', '高意向', '4'),
    createAudienceUser('mock-analysis-user-03', '/assets/analysis/user-avatar-01.jpg', 'xiaogai', 'high', '高意向', '4'),
    createAudienceUser('mock-analysis-user-04', '/assets/analysis/user-avatar-02.jpg', '快乐小鹅', 'medium', '中意向', '1'),
    createAudienceUser('mock-analysis-user-05', '/assets/analysis/detail-avatar-02.jpg', '来财来财', 'low', '低意向', '2'),
  ]

  return {
    summary: [
      { label: '总发布', value: '3' },
      { label: '总浏览次数', value: '24,234' },
      { label: '总转发', value: '1,223' },
    ],
    cards: [
      createCard(
        'mock-analysis-card-01',
        '/assets/analysis/content-01.jpg',
        '资深AI-Native 全栈产品教程',
        '21',
      ),
      createCard(
        'mock-analysis-card-02',
        '/assets/analysis/content-02.jpg',
        '资深AI-Native 全栈产品教程，一人即可干完所有',
        '1',
      ),
      createCard(
        'mock-analysis-card-03',
        '/assets/analysis/content-03.jpg',
        '内容运营与增长方法论',
        '1',
      ),
      createCard(
        'mock-analysis-card-04',
        '/assets/analysis/content-04.jpg',
        '从零开始搭建高效工作流',
        '1',
      ),
      createCard(
        'mock-analysis-card-05',
        '/assets/home-new/today-most-01.jpg',
        'AI 产品设计实践指南',
        '1',
      ),
    ],
    userSummary: [
      { label: '高意向', value: '3' },
      { label: '中意向', value: '24,234' },
      { label: '低意向', value: '1,223' },
    ],
    audienceUsers,
    totalData: {
      heroMetrics: [
        { label: '浏览总次数', value: '122,100次', delta: '+30' },
        { label: '浏览总人数', value: '920人', delta: '+30' },
      ],
      overview: [
        { label: '总发布', value: '5' },
        { label: '总转发', value: '233' },
        { label: '总完播', value: '872' },
        { label: '高意向', value: '2' },
        { label: '中意向', value: '2' },
        { label: '低意向', value: '0' },
      ],
      readTrends: {
        week: createChartPoints('week', ['一', '二', '三', '四', '五', '六', '日'], [500, 500, 1200, 550, 350, 700, 500]),
        month: createChartPoints(
          'month',
          Array.from({ length: 30 }, (_, index) => String(index + 1)),
          [320, 420, 380, 520, 610, 560, 680, 720, 650, 810, 740, 920, 860, 980, 1030, 940, 880, 1100, 1020, 1160, 990, 1080, 1140, 1231, 1010, 1180, 1120, 1200, 1080, 1231],
        ),
      },
    },
  }
}
