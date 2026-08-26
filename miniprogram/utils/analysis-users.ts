import type { AnalysisAudienceUser, AnalysisIntentLevel } from '../types/analysis'

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

/** 单条作品意向：浏览 ≥2 为高，完播过为中，否则低 */
export function resolveIntentLevelFromCounts(viewCount: number, completeCount: number): AnalysisIntentLevel {
  if (viewCount >= 2) return 'high'
  if (completeCount > 0) return 'medium'
  return 'low'
}

function historyAction(row: CustomerHistoryRow): string {
  return (row.actionType ?? '').trim().toLowerCase()
}

function isForwardHistory(row: CustomerHistoryRow): boolean {
  return historyAction(row) === 'forward'
}

/** play / end 都算浏览记录；缺 actionType 的旧数据按浏览处理；转发不计浏览 */
function isViewHistory(row: CustomerHistoryRow): boolean {
  const action = historyAction(row)
  return action === '' || action === 'play' || action === 'end'
}

/** 浏览次数只计 play（及缺类型的旧数据）；end 单独成行时再回退为浏览次数 */
function isPlayViewHistory(row: CustomerHistoryRow): boolean {
  const action = historyAction(row)
  return action === '' || action === 'play'
}

function laterViewTime(left: string | null, right: string | null): string | null {
  if (!left) return right
  if (!right) return left
  return left >= right ? left : right
}

type MergedCustomerHistory = AggregatedCustomerHistory & {
  endCount: number
  endCompleteCount: number
  endDuration: number
}

/** 同一作品的多次浏览合并为一条：进度取最大，时长/完播数/浏览次数/转发取合计 */
export function aggregateCustomerHistoryByMaterial(rows: CustomerHistoryRow[]): AggregatedCustomerHistory[] {
  const merged = new Map<string, MergedCustomerHistory>()

  for (const row of Array.isArray(rows) ? rows : []) {
    const materialId = row.materialId == null ? '' : String(row.materialId)
    if (!materialId) continue

    const forward = isForwardHistory(row)
    const viewed = isViewHistory(row)
    if (!forward && !viewed) continue

    const playView = isPlayViewHistory(row)
    const isEnd = historyAction(row) === 'end'
    const progress = viewed ? row.progress ?? 0 : 0
    const duration = playView ? row.duration ?? 0 : 0
    const viewCount = playView ? 1 : 0
    const completeCount = playView && row.completed === 1 ? 1 : 0
    const endCount = isEnd ? 1 : 0
    const endCompleteCount = isEnd && row.completed === 1 ? 1 : 0
    const endDuration = isEnd ? row.duration ?? 0 : 0
    const shareCount = forward ? 1 : 0
    const current = merged.get(materialId)

    if (!current) {
      merged.set(materialId, {
        materialId,
        title: row.title ?? '',
        fileType: row.fileType,
        viewTime: typeof row.viewTime === 'string' ? row.viewTime : null,
        progress,
        duration,
        viewCount,
        completeCount,
        shareCount,
        endCount,
        endCompleteCount,
        endDuration,
      })
      continue
    }

    current.progress = Math.max(current.progress, progress)
    current.duration += duration
    current.viewCount += viewCount
    current.completeCount += completeCount
    current.shareCount += shareCount
    current.endCount += endCount
    current.endCompleteCount += endCompleteCount
    current.endDuration += endDuration
    if (!current.title && row.title) current.title = row.title
    if (!current.fileType && row.fileType) current.fileType = row.fileType
    current.viewTime = laterViewTime(current.viewTime, typeof row.viewTime === 'string' ? row.viewTime : null)
  }

  return [...merged.values()].map(({ endCount, endCompleteCount, endDuration, ...record }) => ({
    ...record,
    viewCount: record.viewCount > 0 ? record.viewCount : endCount,
    completeCount: record.completeCount > 0 ? record.completeCount : endCompleteCount,
    duration: record.duration > 0 ? record.duration : endDuration,
  }))
}
