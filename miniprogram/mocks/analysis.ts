import type { AnalysisAudienceUser, AnalysisIntentUser, AnalysisTotalViewModel, AnalysisUserDetailViewModel, AnalysisViewModel } from '../types/analysis'

export const analysisIntentUsersMock: AnalysisIntentUser[] = [
  { id: 'user-01', avatarUrl: '/assets/analysis/detail-avatar-01.jpg', name: 'xiaogai', level: 'high', levelLabel: '高意向', readCount: '50', completionCount: '4', shareCount: '4' },
  { id: 'user-02', avatarUrl: '/assets/analysis/detail-avatar-02.jpg', name: '快乐小鹅', level: 'medium', levelLabel: '中意向', readCount: '50', completionCount: '1', shareCount: '4' },
  { id: 'user-03', avatarUrl: '/assets/analysis/detail-avatar-03.jpg', name: '来财来财', level: 'low', levelLabel: '低意向', readCount: '50', completionCount: '2', shareCount: '4' },
  { id: 'user-04', avatarUrl: '/assets/analysis/detail-avatar-04.jpg', name: '金钱豹到', level: 'high', levelLabel: '高意向', readCount: '50', completionCount: '4', shareCount: '4' },
]

export const analysisAudienceUsersMock: AnalysisAudienceUser[] = [
  { id: 'audience-01', avatarUrl: '/assets/analysis/user-avatar-01.jpg', name: 'xiaogai', level: 'high', levelLabel: '高意向', readCount: '50', viewedWorksCount: '4', shareCount: '4', showMarker: true },
  { id: 'audience-02', avatarUrl: '/assets/analysis/user-avatar-02.jpg', name: '快乐小鹅', level: 'medium', levelLabel: '中意向', readCount: '50', viewedWorksCount: '4', shareCount: '4', showMarker: true },
  { id: 'audience-03', avatarUrl: '/assets/analysis/user-avatar-03.jpg', name: '来财来财', level: 'low', levelLabel: '低意向', readCount: '50', viewedWorksCount: '4', shareCount: '4', showMarker: true },
  { id: 'audience-04', avatarUrl: '/assets/analysis/user-avatar-04.jpg', name: '金钱豹到', level: 'low', levelLabel: '低意向', readCount: '50', viewedWorksCount: '4', shareCount: '4' },
  { id: 'audience-05', avatarUrl: '/assets/analysis/user-avatar-05.jpg', name: '恭喜暴富', level: 'high', levelLabel: '高意向', readCount: '50', viewedWorksCount: '4', shareCount: '4' },
  { id: 'audience-06', avatarUrl: '/assets/analysis/user-avatar-06.jpg', name: '给个生活比个耶', level: 'high', levelLabel: '高意向', readCount: '50', viewedWorksCount: '4', shareCount: '4' },
  { id: 'audience-07', avatarUrl: '/assets/analysis/user-avatar-07.jpg', name: '你瞅啥', level: 'high', levelLabel: '高意向', readCount: '50', viewedWorksCount: '4', shareCount: '4' },
]

export const analysisUserDetailMock: AnalysisUserDetailViewModel = {
  profile: {
    id: 'audience-06', avatarUrl: '/assets/analysis/user-detail-avatar.jpg', name: '给个生活比个耶', level: 'high', levelLabel: '高意向', readCount: '56', completionCount: '23', shareCount: '23', viewDuration: '11s',
  },
  records: [
    { id: 'record-01', thumbnailUrl: '/assets/analysis/user-detail-record-01.jpg', title: 'AI Native 产品学习', date: '8 月20日', type: '视频', progress: '10%', viewDuration: '11s', completionCount: '0', shareCount: '1' },
    { id: 'record-02', thumbnailUrl: '/assets/analysis/user-detail-record-02.jpg', title: '资深AI-Native 全栈产品教程，一人...', date: '8 月20日', type: '视频', progress: '10%', viewDuration: '11s', completionCount: '0', shareCount: '1' },
    { id: 'record-03', thumbnailUrl: '/assets/analysis/user-detail-record-03.jpg', title: '明日方舟，这个夏天很美好', date: '8 月20日', type: '视频', progress: '10%', viewDuration: '11s', completionCount: '0', shareCount: '1' },
    { id: 'record-04', thumbnailUrl: '/assets/analysis/user-detail-record-04.jpg', title: '绿水青山就是金山银山', date: '8 月20日', type: '视频', progress: '10%', viewDuration: '11s', completionCount: '0', shareCount: '1' },
  ],
}

export const analysisTotalDataMock: AnalysisTotalViewModel = {
  overview: [
    { label: '总发布', value: '5' },
    { label: '总阅读次数', value: '19,839' },
    { label: '总转发', value: '233' },
    { label: '总阅读人数', value: '1,042' },
    { label: '总完播', value: '872' },
    { label: '总完播率', value: '5.2%' },
    { label: '高意向', value: '12' },
    { label: '中意向', value: '2' },
    { label: '低意向', value: '0' },
  ],
  readTrends: {
    week: [
      { id: 'monday', label: '一', value: '500', height: 112 },
      { id: 'tuesday', label: '二', value: '500', height: 112 },
      { id: 'wednesday', label: '三', value: '1,300', height: 250 },
      { id: 'thursday', label: '四', value: '550', height: 118 },
      { id: 'friday', label: '五', value: '300', height: 74 },
      { id: 'saturday', label: '六', value: '800', height: 142 },
      { id: 'sunday', label: '日', value: '500', height: 112 },
    ],
    month: [
      { id: 'month-01', label: '1', value: '420', height: 92 },
      { id: 'month-02', label: '2', value: '680', height: 148 },
      { id: 'month-03', label: '3', value: '520', height: 114 },
      { id: 'month-04', label: '4', value: '860', height: 186 },
      { id: 'month-05', label: '5', value: '720', height: 156 },
      { id: 'month-06', label: '6', value: '540', height: 118 },
      { id: 'month-07', label: '7', value: '980', height: 212 },
      { id: 'month-08', label: '8', value: '630', height: 136 },
      { id: 'month-09', label: '9', value: '760', height: 164 },
      { id: 'month-10', label: '10', value: '440', height: 96 },
      { id: 'month-11', label: '11', value: '1,120', height: 242 },
      { id: 'month-12', label: '12', value: '690', height: 150 },
      { id: 'month-13', label: '13', value: '580', height: 126 },
      { id: 'month-14', label: '14', value: '820', height: 178 },
      { id: 'month-15', label: '15', value: '730', height: 158 },
      { id: 'month-16', label: '16', value: '480', height: 104 },
      { id: 'month-17', label: '17', value: '910', height: 198 },
      { id: 'month-18', label: '18', value: '640', height: 138 },
      { id: 'month-19', label: '19', value: '760', height: 164 },
      { id: 'month-20', label: '20', value: '530', height: 116 },
      { id: 'month-21', label: '21', value: '1,260', height: 272 },
      { id: 'month-22', label: '22', value: '700', height: 152 },
      { id: 'month-23', label: '23', value: '610', height: 132 },
      { id: 'month-24', label: '24', value: '840', height: 182 },
      { id: 'month-25', label: '25', value: '500', height: 108 },
      { id: 'month-26', label: '26', value: '960', height: 208 },
      { id: 'month-27', label: '27', value: '680', height: 148 },
      { id: 'month-28', label: '28', value: '780', height: 168 },
      { id: 'month-29', label: '29', value: '570', height: 124 },
      { id: 'month-30', label: '30', value: '890', height: 192 },
    ],
  },
}

export const analysisMock: AnalysisViewModel = {
  summary: [
    { label: '总发布', value: '3' },
    { label: '总阅读次数', value: '124,234' },
    { label: '总转发', value: '1,223' },
  ],
  userSummary: [
    { label: '总用户', value: '3,234' },
    { label: '完播人数', value: '21' },
    { label: '转发人数', value: '1,223' },
  ],
  audienceUsers: analysisAudienceUsersMock,
  totalData: analysisTotalDataMock,
  cards: [
    {
      id: 'content-01', thumbnailUrl: '/assets/analysis/content-01.jpg',
      title: '资深AI-Native 全栈产品教程', date: '2026-10-10',
      metrics: [{ label: '转发', value: '1600' }, { label: '播完', value: '23' }, { label: '浏览', value: '1,231' }, { label: '观看人数', value: '1,231' }],
    },
    {
      id: 'content-02', thumbnailUrl: '/assets/analysis/content-03.jpg',
      title: '资深AI-Native 全栈产品教程，一人即可干完所有', date: '2026-10-10',
      metrics: [{ label: '转发', value: '1600' }, { label: '播完', value: '23' }, { label: '浏览', value: '1,231' }, { label: '观看人数', value: '1,231' }],
    },
    {
      id: 'content-03', thumbnailUrl: '/assets/analysis/content-03.jpg',
      title: '资深AI-Native 全栈产品教程，一人即可干完所有', date: '2026-10-10',
      metrics: [{ label: '转发', value: '1600' }, { label: '播完', value: '23' }, { label: '浏览', value: '1,231' }, { label: '观看人数', value: '1,231' }],
    },
  ],
}
