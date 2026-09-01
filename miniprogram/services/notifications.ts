import type { ApiMaterial, ApiNotificationEvent } from '../types/api'
import type { NotificationFilterViewModel, NotificationsViewModel } from '../types/notifications'
import { buildCustomRangeQuery } from '../utils/format'
import { prepareMediaUrls } from '../utils/media'
import { isViewedNotification, readViewedNotificationMap } from '../utils/notification-viewed'
import { groupNotificationCards, mapNotificationEvent } from '../utils/notifications'
import { prepareMaterialThumbnailMap } from './materials'
import { request } from './request'

/** 后端查询时间范围上限（custom 最长 62 天） */
export const NOTIFICATION_RANGE_DAYS = 62

const notificationFilters: NotificationFilterViewModel[] = [
  { id: 'all', label: '全部' },
  { id: 'high', label: '高意向' },
  { id: 'medium', label: '中意向' },
  { id: 'low', label: '低意向' },
]

/**
 * 通知列表：每一次浏览或转发各一条，按发生日期倒序分组。
 * 发布者本人浏览由后端 `/analysis/notify/list` 排除；本人打开自己的素材也不会写入浏览/转发/完播统计。
 */
export function getNotifications(): Promise<NotificationsViewModel> {
  const rangeQuery = buildCustomRangeQuery(NOTIFICATION_RANGE_DAYS)

  return Promise.all([
    request<ApiNotificationEvent[]>({ method: 'GET', path: '/analysis/notify/list', query: { ...rangeQuery } }),
    request<ApiMaterial[]>({ method: 'GET', path: '/material/mine', silent: true }).catch(() => [] as ApiMaterial[]),
  ]).then(async ([events, materials]) => {
    const visibleEvents = (events ?? []).filter((event) => event != null)
    const materialById = new Map((materials ?? []).map((material) => [String(material.id), material]))
    const neededIds = [...new Set(visibleEvents
      .map((event) => (event.materialId ? String(event.materialId) : ''))
      .filter((id) => id !== ''))]
    const thumbnailByMaterial = await prepareMaterialThumbnailMap(neededIds.map((id) => {
      const material = materialById.get(id)
      return material
        ? {
          id,
          fileType: material.fileType,
          coverUrl: material.coverUrl,
          fileUrl: material.fileUrl,
        }
        : { id }
    }))
    const avatarUrls = await prepareMediaUrls(visibleEvents.map((event) => event.avatar))
    const viewedNotifications = readViewedNotificationMap()
    const cards = visibleEvents.map((event, index) => {
      const material = event.materialId ? materialById.get(String(event.materialId)) : undefined
      return mapNotificationEvent(
        {
          ...event,
          fileType: material?.fileType ?? event.fileType,
        },
        event.materialId ? thumbnailByMaterial.get(String(event.materialId)) ?? '' : '',
        avatarUrls[index] ?? '',
        !isViewedNotification(String(event.id ?? ''), viewedNotifications),
      )
    })

    return {
      filters: notificationFilters,
      groups: groupNotificationCards(cards),
    }
  })
}
