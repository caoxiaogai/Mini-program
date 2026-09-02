import type { ApiMaterial, ApiNotificationEvent } from '../types/api'
import type { NotificationCardViewModel, NotificationFilterViewModel, NotificationsViewModel } from '../types/notifications'
import { buildCustomRangeQuery } from '../utils/format'
import { prepareMediaUrls } from '../utils/media'
import { isViewedNotification, readViewedNotificationMap } from '../utils/notification-viewed'
import { groupNotificationCards, mapNotificationEvent } from '../utils/notifications'
import {
  enrichThumbnailsByIds,
  rememberMaterialThumbnailSources,
  resolveMaterialListThumbnail,
} from './materials'
import { keepEventsForVisitorLimit, shouldShowVisitorLimitPrompt, visitorLimitPromptActionLabel, visitorLimitPromptTargetTier } from '../utils/membership'
import { getMembershipAccessSilent } from './membership'
import { request, resolveMediaUrl } from './request'

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
    getMembershipAccessSilent(),
  ]).then(([events, materials, membershipAccess]) => {
    const visibleEvents = keepEventsForVisitorLimit(
      (events ?? []).filter((event) => event != null),
      membershipAccess.visitorLimit,
    )
    const materialById = new Map((materials ?? []).map((material) => [String(material.id), material]))
    const sources = [...materialById.values()].map((material) => ({
      id: String(material.id),
      fileType: material.fileType,
      coverUrl: material.coverUrl,
      fileUrl: material.fileUrl,
    }))
    rememberMaterialThumbnailSources(sources)
    const viewedNotifications = readViewedNotificationMap()
    const cards = visibleEvents.map((event) => {
      const material = event.materialId ? materialById.get(String(event.materialId)) : undefined
      const thumbnailSource = material
        ? {
          id: String(material.id),
          fileType: material.fileType,
          coverUrl: material.coverUrl,
          fileUrl: material.fileUrl,
        }
        : event.materialId
          ? { id: String(event.materialId), fileType: event.fileType }
          : null

      return mapNotificationEvent(
        {
          ...event,
          fileType: material?.fileType ?? event.fileType,
        },
        thumbnailSource ? resolveMaterialListThumbnail(thumbnailSource) : '',
        resolveMediaUrl(event.avatar),
        !isViewedNotification(String(event.id ?? ''), viewedNotifications),
      )
    })

    return {
      filters: notificationFilters,
      groups: groupNotificationCards(cards),
      showVisitorLimitPrompt: shouldShowVisitorLimitPrompt(membershipAccess),
      limitPromptActionLabel: visitorLimitPromptActionLabel(membershipAccess.tier),
      limitPromptTargetTier: visitorLimitPromptTargetTier(membershipAccess.tier),
    }
  })
}

export function enrichNotificationCards(cards: NotificationCardViewModel[]): Promise<NotificationCardViewModel[]> {
  if (cards.length === 0) return Promise.resolve(cards)

  const materialIds = cards.map((card) => card.materialId).filter((id) => id !== '')
  return Promise.all([
    enrichThumbnailsByIds(materialIds),
    prepareMediaUrls(cards.map((card) => card.avatarUrl)),
  ]).then(([thumbs, avatarUrls]) => cards.map((card, index) => ({
    ...card,
    thumbnailUrl: (card.materialId && thumbs.get(card.materialId)) || card.thumbnailUrl,
    avatarUrl: avatarUrls[index] || card.avatarUrl,
  })))
}
