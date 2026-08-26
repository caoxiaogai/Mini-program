import type { AnalysisAudienceUser } from '../types/analysis'

export type AnalysisUserSortId = 'completion' | 'share' | 'view'

export type CustomerHistoryRow = {
  materialId: string | number | null | undefined
  title: string | null
  fileType: string | null
  duration: number | null
  progress: number | null
  completed: number | null
  viewTime: string | null
  actionType?: string | null
}

export type AggregatedCustomerHistory = {
  materialId: string
  title: string
  fileType: string | null
  viewTime: string | null
  progress: number
  duration: number
  viewCount: number
  completeCount: number
  shareCount: number
}

const getSortValue = (user: Pick<AnalysisAudienceUser, 'readCount' | 'completionCount' | 'shareCount'>, sortId: AnalysisUserSortId): number => {
  const value = sortId === 'view' ? user.readCount : sortId === 'completion' ? user.completionCount : user.shareCount

  return Number(value.replace(/,/g, '')) || 0
}

export const sortAnalysisUsers = <T extends AnalysisAudienceUser>(users: T[], sortId: AnalysisUserSortId): T[] => (
  [...users].sort((left, right) => getSortValue(right, sortId) - getSortValue(left, sortId))
)

function historyAction(row: CustomerHistoryRow): string {
  return (row.actionType ?? '').trim().toLowerCase()
}

function isForwardHistory(row: CustomerHistoryRow): boolean {
  return historyAction(row) === 'forward'
}

/** play 计为一次浏览；缺 actionType 的旧数据按浏览处理；转发不计浏览 */
function isViewHistory(row: CustomerHistoryRow): boolean {
  const action = historyAction(row)
  return action === '' || action === 'play'
}

function laterViewTime(left: string | null, right: string | null): string | null {
  if (!left) return right
  if (!right) return left
  return left >= right ? left : right
}

/** 同一作品的多次浏览合并为一条：进度取最大，时长/浏览次数/转发取合计 */
export function aggregateCustomerHistoryByMaterial(rows: CustomerHistoryRow[]): AggregatedCustomerHistory[] {
  const merged = new Map<string, AggregatedCustomerHistory>()

  for (const row of rows) {
    const materialId = row.materialId == null ? '' : String(row.materialId)
    if (!materialId) continue

    const forward = isForwardHistory(row)
    const viewed = isViewHistory(row)
    if (!forward && !viewed) continue

    const progress = viewed ? row.progress ?? 0 : 0
    const duration = viewed ? row.duration ?? 0 : 0
    const viewCount = viewed ? 1 : 0
    const completeCount = viewed && row.completed === 1 ? 1 : 0
    const shareCount = forward ? 1 : 0
    const current = merged.get(materialId)

    if (!current) {
      merged.set(materialId, {
        materialId,
        title: row.title ?? '',
        fileType: row.fileType,
        viewTime: row.viewTime,
        progress,
        duration,
        viewCount,
        completeCount,
        shareCount,
      })
      continue
    }

    current.progress = Math.max(current.progress, progress)
    current.duration += duration
    current.viewCount += viewCount
    current.completeCount += completeCount
    current.shareCount += shareCount
    if (!current.title && row.title) current.title = row.title
    if (!current.fileType && row.fileType) current.fileType = row.fileType
    current.viewTime = laterViewTime(current.viewTime, row.viewTime)
  }

  return [...merged.values()]
}
