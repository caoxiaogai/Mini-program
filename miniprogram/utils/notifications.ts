import type { ApiNotificationEvent } from '../types/api'
import type {
  NotificationCardViewModel,
  NotificationGroupViewModel,
  NotificationIntent,
} from '../types/notifications'

const intentLabels: Record<NotificationIntent, string> = {
  high: '#高意向',
  medium: '#中意向',
  low: '#低意向',
}

const pad2 = (value: number): string => String(value).padStart(2, '0')

function formatDateKey(value: string | null | undefined): string {
  if (value) return value.slice(0, 10)
  const now = new Date()
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

/** 按墙上时间拆 yyyy-MM-dd HH:mm:ss，避免无时区 ISO 被当成 UTC */
function parseWallClock(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(value.trim())
  if (!match) return null
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
  )
}

function formatMonthDayTime(value: string | null | undefined): string {
  if (!value) return ''
  const date = parseWallClock(value)
  if (!date) return ''
  return `${date.getMonth() + 1}月${date.getDate()}日 ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function formatMonthDayLabel(dateKey: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateKey)
  if (!match) return ''
  return `${Number(match[2])}月${Number(match[3])}日`
}

export function resolveNotificationIntent(level: string | null | undefined): NotificationIntent {
  if (level === 'high' || level === 'medium' || level === 'low') return level
  return 'low'
}

export function buildNotificationStatus(
  event: Pick<ApiNotificationEvent, 'actionType' | 'completed' | 'fileType'>,
): string {
  if ((event.actionType ?? '').toLowerCase() === 'forward') return '该用户转发了你的作品'
  if (event.completed === 1) return '该用户已完成浏览'

  const fileType = (event.fileType ?? '').toUpperCase()
  if (fileType === 'VIDEO') return '未完播视频'
  if (fileType === 'PDF' || fileType === 'TABLE') return '未浏览完文件'
  return '未滑动看完所有图片'
}

export function mapNotificationEvent(
  event: ApiNotificationEvent,
  thumbnailUrl: string,
  avatarUrl: string,
  isUnread = true,
): NotificationCardViewModel {
  const intent = resolveNotificationIntent(event.intentLevel)
  const isForward = (event.actionType ?? '').toLowerCase() === 'forward'

  return {
    id: `notification-${event.id}`,
    eventId: String(event.id),
    isUnread,
    userId: String(event.customerId),
    visitorName: event.nickname ?? '微信用户',
    intent,
    intentLabel: intentLabels[intent],
    action: isForward ? 'forward' : 'reading',
    actionLabel: isForward ? '“转发”了你的作品' : '“浏览”了你的作品',
    actionDate: formatMonthDayTime(event.viewTime),
    lastViewTime: event.viewTime ?? '',
    actionIconPath: isForward ? '/assets/notifications/action-forward.svg' : '/assets/notifications/action-reading.svg',
    avatarUrl,
    thumbnailUrl,
    statusLabel: buildNotificationStatus(event),
  }
}

export function markNotificationGroupsViewed(
  groups: NotificationGroupViewModel[],
  eventId: string,
): NotificationGroupViewModel[] {
  if (!eventId) return groups

  return groups.map((group) => ({
    ...group,
    items: group.items.map((notification) => (
      notification.eventId === eventId && notification.isUnread
        ? { ...notification, isUnread: false }
        : notification
    )),
  }))
}

export function countUnreadNotificationGroups(groups: NotificationGroupViewModel[]): number {
  return groups.reduce(
    (total, group) => total + group.items.filter((notification) => notification.isUnread).length,
    0,
  )
}

export function getUnreadNotificationEventIds(groups: NotificationGroupViewModel[]): string[] {
  return groups.flatMap((group) => group.items
    .filter((notification) => notification.isUnread)
    .map((notification) => notification.eventId))
}

export function markAllNotificationGroupsViewed(groups: NotificationGroupViewModel[]): NotificationGroupViewModel[] {
  return groups.map((group) => ({
    ...group,
    items: group.items.map((notification) => (
      notification.isUnread ? { ...notification, isUnread: false } : notification
    )),
  }))
}

export function groupNotificationCards(cards: NotificationCardViewModel[]): NotificationGroupViewModel[] {
  const cardsByDate = new Map<string, NotificationCardViewModel[]>()

  for (const card of cards) {
    const dateKey = formatDateKey(card.lastViewTime)
    if (!dateKey) continue
    const items = cardsByDate.get(dateKey) ?? []
    items.push(card)
    cardsByDate.set(dateKey, items)
  }

  return [...cardsByDate.keys()].sort().reverse().map((dateKey) => ({
    id: dateKey,
    label: formatMonthDayLabel(dateKey),
    items: cardsByDate.get(dateKey) ?? [],
  }))
}
