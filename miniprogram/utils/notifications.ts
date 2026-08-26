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

function formatMonthDayTime(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getMonth() + 1}月${date.getDate()}日 ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function formatMonthDayLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function resolveNotificationIntent(level: string | null | undefined): NotificationIntent {
  if (level === 'high' || level === 'medium' || level === 'low') return level
  return 'low'
}

export function buildNotificationStatus(event: Pick<ApiNotificationEvent, 'actionType' | 'completed'>): string {
  if ((event.actionType ?? '').toLowerCase() === 'forward') return '该用户转发了你的作品'
  if (event.completed === 1) return '该用户已完成浏览'
  return '未滑动看完所有图片'
}

export function mapNotificationEvent(
  event: ApiNotificationEvent,
  thumbnailUrl: string,
  avatarUrl: string,
): NotificationCardViewModel {
  const intent = resolveNotificationIntent(event.intentLevel)
  const isForward = (event.actionType ?? '').toLowerCase() === 'forward'

  return {
    id: `notification-${event.id}`,
    eventId: String(event.id),
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
