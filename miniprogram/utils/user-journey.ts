import type { ApiIntentLevel, ApiUserJourney, ApiUserJourneyEvent } from '../types/api'
import type { UserJourneyEvent, UserJourneyViewModel } from '../types/analysis'
import { formatRelativeDayTime } from './format'

const intentLabels: Record<ApiIntentLevel, string> = {
  high: '#高意向',
  medium: '#中意向',
  low: '#低意向',
}

const DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']

function asList<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

function isPagedFileType(fileType: string): boolean {
  return fileType === 'IMAGE' || fileType === 'PDF' || fileType === 'TABLE'
}

function isVideoFileType(fileType: string): boolean {
  return fileType === 'VIDEO'
}

function resolveIntentLabel(level: string | null | undefined): string {
  if (level === 'high' || level === 'medium' || level === 'low') return intentLabels[level]
  return intentLabels.low
}

/** 1 → 一，11 → 十一，21 → 二十一 */
export function formatChineseCount(value: number): string {
  const count = Math.trunc(value)
  if (count <= 0) return String(count)
  if (count < 10) return DIGITS[count]
  if (count === 10) return '十'
  if (count < 20) return `十${DIGITS[count - 10]}`
  if (count < 100) {
    const tens = Math.floor(count / 10)
    const ones = count % 10
    return `${DIGITS[tens]}十${ones === 0 ? '' : DIGITS[ones]}`
  }
  return String(count)
}

export function formatForwardDetail(forwardIndex: number): string {
  return `第${formatChineseCount(forwardIndex)}次转发`
}

function resolveViewedPages(event: ApiUserJourneyEvent, pageCount: number): number {
  if (event.viewedPages != null && event.viewedPages > 0) return event.viewedPages
  if (pageCount <= 0) return 0
  if (event.completed === 1 || (event.progress ?? 0) >= 100) return pageCount
  const progress = event.progress ?? 0
  if (progress <= 0) return 0
  return Math.max(1, Math.round((progress / 100) * pageCount))
}

function resolvePlayDetail(event: ApiUserJourneyEvent, fileType: string, pageCount: number): string {
  if (isVideoFileType(fileType) || (!isPagedFileType(fileType) && (event.duration ?? 0) > 0 && pageCount <= 0)) {
    return `播放了 ${event.duration ?? 0} 秒`
  }
  if (isPagedFileType(fileType) || pageCount > 0) {
    return `查看 ${resolveViewedPages(event, pageCount)} 页`
  }
  if ((event.duration ?? 0) > 0) return `播放了 ${event.duration ?? 0} 秒`
  return ''
}

export function mapUserJourneyEvent(
  event: ApiUserJourneyEvent,
  fileType: string,
  pageCount: number,
  now = new Date(),
): UserJourneyEvent {
  const actionType = (event.actionType ?? '').toLowerCase()
  const isForward = actionType === 'forward'
  const completed = event.completed === 1
  const occurredAt = formatRelativeDayTime(event.occurredAt, now)

  if (isForward) {
    return {
      id: String(event.id),
      occurredAt,
      action: '转发了',
      detail: formatForwardDetail(event.forwardIndex ?? 0),
    }
  }

  return {
    id: String(event.id),
    occurredAt,
    action: completed ? '完播了' : '浏览了',
    detail: resolvePlayDetail(event, fileType, pageCount),
  }
}

export function mapUserJourney(
  raw: ApiUserJourney,
  thumbnailUrl: string,
  now = new Date(),
): UserJourneyViewModel {
  const fileType = (raw.fileType ?? '').toUpperCase()
  const pageCount = raw.pageCount ?? 0

  return {
    userId: String(raw.customerId ?? ''),
    userName: (raw.nickname ?? '').trim() || '微信用户',
    product: {
      id: String(raw.materialId ?? ''),
      thumbnailUrl,
      title: (raw.title ?? '').trim() || '未命名作品',
      intentLabel: resolveIntentLabel(raw.intentLevel),
    },
    events: asList(raw.events).map((event) => mapUserJourneyEvent(event, fileType, pageCount, now)),
  }
}
