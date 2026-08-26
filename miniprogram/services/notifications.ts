import type { ApiMaterial, ApiNotificationEvent } from '../types/api'
import type { NotificationFilterViewModel, NotificationsViewModel } from '../types/notifications'
import { buildCustomRangeQuery } from '../utils/format'
import { prepareMediaUrls } from '../utils/media'
import { groupNotificationCards, mapNotificationEvent } from '../utils/notifications'
import { request, resolveMediaUrl } from './request'

/** 后端查询时间范围上限（custom 最长 62 天） */
const NOTIFICATION_RANGE_DAYS = 62

const notificationFilters: NotificationFilterViewModel[] = [
  { id: 'all', label: '全部' },
  { id: 'high', label: '高意向' },
  { id: 'medium', label: '中意向' },
  { id: 'low', label: '低意向' },
]

/**
 * 通知列表：每一次浏览或转发各一条，按发生日期倒序分组。
 */
export function getNotifications(): Promise<NotificationsViewModel> {
  const rangeQuery = buildCustomRangeQuery(NOTIFICATION_RANGE_DAYS)

  return Promise.all([
    request<ApiNotificationEvent[]>({ method: 'GET', path: '/analysis/notify/list', query: { ...rangeQuery } }),
    request<ApiMaterial[]>({ method: 'GET', path: '/material/mine', silent: true }).catch(() => [] as ApiMaterial[]),
  ]).then(async ([events, materials]) => {
    const coverByMaterial = new Map(
      materials.map((material) => [String(material.id), resolveMediaUrl(material.coverUrl)]),
    )
    const visibleEvents = events.filter((event) => Boolean(event.viewTime))
    const [avatarUrls, thumbnailUrls] = await Promise.all([
      prepareMediaUrls(visibleEvents.map((event) => event.avatar)),
      prepareMediaUrls(
        visibleEvents.map((event) => (event.materialId ? coverByMaterial.get(String(event.materialId)) ?? '' : '')),
      ),
    ])
    const cards = visibleEvents.map((event, index) => (
      mapNotificationEvent(event, thumbnailUrls[index] ?? '', avatarUrls[index] ?? '')
    ))

    return {
      filters: notificationFilters,
      groups: groupNotificationCards(cards),
    }
  })
}
