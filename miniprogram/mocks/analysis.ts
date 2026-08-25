import type {
  AnalysisAudienceUser,
  AnalysisCard,
  AnalysisChartPoint,
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
): AnalysisCard {
  return {
    id,
    thumbnailUrl,
    title,
    date: '2026-10-10',
    publishedAt,
    metrics: [
      { label: '转发', value: forwardCount },
      { label: '播完', value: '4' },
      { label: '浏览', value: '1,231' },
      { label: '观看人数', value: '1,231' },
    ],
    compactMetrics: [
      { label: '浏览', value: '1,231' },
      { label: '转发', value: forwardCount },
      { label: '完播', value: '4' },
    ],
  }
}

function createAudienceUser(
  id: string,
  avatarUrl: string,
  name: string,
  level: AnalysisAudienceUser['level'],
  levelLabel: string,
): AnalysisAudienceUser {
  return {
    id,
    avatarUrl,
    name,
    level,
    levelLabel,
    readCount: '50',
    viewedWorksCount: '4',
    shareCount: '4',
    showMarker: true,
  }
}

/**
 * 分析页 Figma 视觉预览数据。
 * 所有内容、人物和统计均为固定的开发阶段虚构数据，不代表生产数据。
 */
export function getAnalysisStyleMock(): AnalysisViewModel {
  const audienceUsers: AnalysisAudienceUser[] = [
    createAudienceUser('mock-analysis-user-01', '/assets/analysis/user-avatar-01.jpg', '小满', 'high', '高意向'),
    createAudienceUser('mock-analysis-user-02', '/assets/analysis/user-avatar-02.jpg', '周知行', 'medium', '中意向'),
    createAudienceUser('mock-analysis-user-03', '/assets/analysis/user-avatar-03.jpg', '顾南星', 'low', '低意向'),
    createAudienceUser('mock-analysis-user-04', '/assets/analysis/user-avatar-04.jpg', '林小满', 'high', '高意向'),
  ]

  return {
    summary: [
      { label: '总发布', value: '3' },
      { label: '总阅读次数', value: '24,234' },
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
      { label: '总用户', value: '4' },
      { label: '完播人数', value: '4' },
      { label: '转发人数', value: '4' },
    ],
    audienceUsers,
    totalData: {
      overview: [
        { label: '总发布', value: '3' },
        { label: '总阅读次数', value: '24,234' },
        { label: '总转发', value: '1,223' },
        { label: '总阅读人数', value: '1,231' },
        { label: '总完播', value: '23' },
        { label: '总完播率', value: '4.5%' },
        { label: '高意向', value: '12' },
        { label: '中意向', value: '18' },
        { label: '低意向', value: '20' },
      ],
      readTrends: {
        week: createChartPoints('week', ['日', '一', '二', '三', '四', '五', '六'], [320, 680, 520, 880, 760, 1020, 1231]),
        month: createChartPoints(
          'month',
          Array.from({ length: 30 }, (_, index) => String(index + 1)),
          [320, 420, 380, 520, 610, 560, 680, 720, 650, 810, 740, 920, 860, 980, 1030, 940, 880, 1100, 1020, 1160, 990, 1080, 1140, 1231, 1010, 1180, 1120, 1200, 1080, 1231],
        ),
      },
    },
  }
}
