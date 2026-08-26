import type { AnalysisAudienceUser } from '../types/analysis'

export type AnalysisUserSortId = 'completion' | 'share' | 'view'

const getSortValue = (user: Pick<AnalysisAudienceUser, 'readCount' | 'completionCount' | 'shareCount'>, sortId: AnalysisUserSortId): number => {
  const value = sortId === 'view' ? user.readCount : sortId === 'completion' ? user.completionCount : user.shareCount

  return Number(value.replace(/,/g, '')) || 0
}

export const sortAnalysisUsers = <T extends AnalysisAudienceUser>(users: T[], sortId: AnalysisUserSortId): T[] => (
  [...users].sort((left, right) => getSortValue(right, sortId) - getSortValue(left, sortId))
)
