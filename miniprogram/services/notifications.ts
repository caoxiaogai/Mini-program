import type { ApiIntentCustomer, ApiMaterial } from '../types/api'
import type {
  NotificationCardViewModel,
  NotificationFilterViewModel,
  NotificationIntent,
  NotificationsViewModel,
  NotifyIntentLevel,
  NotifyThresholdOptionViewModel,
} from '../types/notifications'
import { buildCustomRangeQuery, formatDateKey, formatMonthDay, formatPaddedMonthDay } from '../utils/format'
import { prepareMediaUrls } from '../utils/media'
import { request, resolveMediaUrl } from './request'

/** 后端查询时间范围上限（custom 最长 62 天） */
const NOTIFICATION_RANGE_DAYS = 62

const notificationFilters: NotificationFilterViewModel[] = [
  { id: 'all', label: '全部' },
  { id: 'high', label: '高意向' },
  { id: 'medium', label: '中意向' },
  { id: 'low', label: '低意向' },
]

const intentLabels: Record<NotificationIntent, string> = {
  high: '#高意向',
  medium: '#中意向',
  low: '#低意向',
}

const recommendations: Record<NotificationIntent, string> = {
  high: '客户意向较高，建议优先联系',
  medium: '存在兴趣，建议主动跟进',
  low: '意向程度较低，可保持观察',
}

const notifyThresholdOptions: NotifyThresholdOptionViewModel[] = [
  { id: 'low', label: '低意向' },
  { id: 'medium', label: '中意向' },
  { id: 'high', label: '高意向' },
]

export { notifyThresholdOptions }

/**
 * 通知列表：后端无独立通知接口，由意向客户列表（每名客户一条）映射为通知卡片，
 * 按最近行为日期倒序分组；行为类型按是否转发区分。
 */
export function getNotifications(): Promise<NotificationsViewModel> {
  const rangeQuery = buildCustomRangeQuery(NOTIFICATION_RANGE_DAYS)

  return Promise.all([
    request<ApiIntentCustomer[]>({ method: 'GET', path: '/analysis/intent/list', query: { ...rangeQuery } }),
    request<ApiMaterial[]>({ method: 'GET', path: '/material/mine', silent: true }).catch(() => [] as ApiMaterial[]),
  ]).then(async ([intentCustomers, materials]) => {
    const coverByMaterial = new Map(
      materials.map((material) => [String(material.id), resolveMediaUrl(material.coverUrl)]),
    )

    const visibleItems = intentCustomers.filter((item) => formatDateKey(item.lastViewTime) !== '')
    const [avatarUrls, thumbnailUrls] = await Promise.all([
      prepareMediaUrls(visibleItems.map((item) => item.avatar)),
      prepareMediaUrls(
        visibleItems.map((item) => (item.materialId ? coverByMaterial.get(String(item.materialId)) ?? '' : '')),
      ),
    ])

    const cardsByDate = new Map<string, NotificationCardViewModel[]>()
    visibleItems.forEach((item, index) => {
      const intent = item.intentLevel
      const isForward = item.hasForwarded === 1
      const dateKey = formatDateKey(item.lastViewTime)

      const card: NotificationCardViewModel = {
        id: `notification-${item.customerId}`,
        userId: String(item.customerId),
        visitorName: item.nickname ?? '微信用户',
        intent,
        intentLabel: intentLabels[intent],
        action: isForward ? 'forward' : 'reading',
        actionLabel: isForward ? '“转发”了你的作品' : '“阅读”了你的作品',
        actionDate: formatMonthDay(item.lastViewTime),
        actionIconPath: isForward ? '/assets/notifications/action-forward.svg' : '/assets/notifications/action-reading.svg',
        avatarUrl: avatarUrls[index] ?? '',
        thumbnailUrl: thumbnailUrls[index] ?? '',
        recommendation: recommendations[intent],
      }

      const cards = cardsByDate.get(dateKey) ?? []
      cards.push(card)
      cardsByDate.set(dateKey, cards)
    })

    const sortedDates = [...cardsByDate.keys()].sort().reverse()

    return {
      filters: notificationFilters,
      notifyThresholdOptions,
      groups: sortedDates.map((dateKey) => ({
        id: dateKey,
        label: formatPaddedMonthDay(`${dateKey} 00:00:00`),
        items: cardsByDate.get(dateKey) ?? [],
      })),
    }
  })
}
