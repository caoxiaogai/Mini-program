import { analysisIntentUsersMock, analysisMock, analysisUserDetailMock } from '../mocks/analysis'
import type { AnalysisDetailViewModel, AnalysisUserDetailViewModel, AnalysisViewModel } from '../types/analysis'

export function getAnalysisOverview(): Promise<AnalysisViewModel> {
  // TODO(API): 接入分析页真实接口。
  return Promise.resolve(analysisMock)
}

// TODO(API): 接入分析详情真实接口
// Method: GET（待后端确认）
// Endpoint: 待后端确认
// Request: cardId: string
// Response: AnalysisDetailViewModel
// Error states: 待后端确认
export function getAnalysisDetail(cardId: string): Promise<AnalysisDetailViewModel | null> {
  const card = analysisMock.cards.find((item) => item.id === cardId)

  return Promise.resolve(card ? { card, intentUsers: analysisIntentUsersMock } : null)
}

// TODO(API): 接入用户详情真实接口
// Method: GET（待后端确认）
// Endpoint: 待后端确认
// Request: userId: string
// Response: AnalysisUserDetailViewModel
// Error states: 待后端确认
export function getAnalysisUserDetail(userId: string): Promise<AnalysisUserDetailViewModel | null> {
  const user = analysisMock.audienceUsers.find((item) => item.id === userId)
    ?? analysisIntentUsersMock.find((item) => item.id === userId)

  if (!user) return Promise.resolve(null)

  if (user.id === analysisUserDetailMock.profile.id) return Promise.resolve(analysisUserDetailMock)

  return Promise.resolve({
    ...analysisUserDetailMock,
    profile: {
      ...analysisUserDetailMock.profile,
      id: user.id,
      avatarUrl: user.avatarUrl,
      name: user.name,
      level: user.level,
      levelLabel: user.levelLabel,
    },
  })
}
