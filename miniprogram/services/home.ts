import type {
  ApiContentListItem,
  ApiCustomerListItem,
  ApiDashboard,
  ApiIntentCustomer,
  ApiMaterial,
  ApiNotificationEvent,
} from '../types/api'
import type { HomeContentViewModel, HomeNotificationViewModel, HomePageViewModel } from '../types/home'
import { buildCustomRangeQuery, formatCount, formatDateKey } from '../utils/format'
import { prepareMediaUrls } from '../utils/media'
import { readViewedNotificationMap, selectUnviewedNotificationEvents } from '../utils/notification-viewed'
import { mapNotificationEvent } from '../utils/notifications'
import { prepareMaterialThumbnailMap } from './materials'
import { NOTIFICATION_RANGE_DAYS } from './notifications'
import { request, resolveMediaUrl } from './request'

const HOME_PREVIEW_LIMIT = 3
const HOME_CONTENT_LIMIT = 2

function mapHomeNotification(
  event: ApiNotificationEvent,
  thumbnailByMaterialId: Map<string, string>,
): HomeNotificationViewModel {
  const thumbnailUrl = event.materialId ? thumbnailByMaterialId.get(String(event.materialId)) ?? '' : ''
  const card = mapNotificationEvent(event, thumbnailUrl, resolveMediaUrl(event.avatar))

  return {
    ...card,
    id: `home-notification-${event.id}`,
    actionIconPath:
      card.action === 'forward' ? '/assets/home-new/action-forward.svg' : '/assets/home-new/action-reading.svg',
  }
}

function mapContent(
  item: ApiContentListItem,
  intentCustomers: ApiIntentCustomer[],
  thumbnailUrl: string,
): HomeContentViewModel {
  const materialId = String(item.materialId)
  const highIntentCount = intentCustomers.filter(
    (customer) => String(customer.materialId) === materialId && customer.intentLevel === 'high',
  ).length

  return {
    id: materialId,
    title: item.title ?? '未命名作品',
    date: `${formatDateKey(item.createTime)} 发布`,
    thumbnailUrl,
    viewCount: formatCount(item.viewCount),
    forwardCount: formatCount(item.forwardCount),
    highIntentCount: formatCount(highIntentCount),
  }
}

function buildContentCards(
  contents: ApiContentListItem[],
  intentCustomers: ApiIntentCustomer[],
  thumbnailByMaterialId: Map<string, string>,
): HomeContentViewModel[] {
  return contents.map((item) => mapContent(item, intentCustomers, thumbnailByMaterialId.get(String(item.materialId)) ?? ''))
}

export function getHomePageData(): Promise<HomePageViewModel> {
  const notifyRange = buildCustomRangeQuery(NOTIFICATION_RANGE_DAYS)

  return Promise.all([
    request<ApiDashboard>({ method: 'GET', path: '/analysis/dashboard', query: { timeRange: 'today' } }),
    request<ApiCustomerListItem[]>({ method: 'GET', path: '/analysis/customer/list', query: { timeRange: 'today' } }),
    request<ApiContentListItem[]>({ method: 'GET', path: '/analysis/content/list', query: { timeRange: 'today' } }),
    request<ApiIntentCustomer[]>({ method: 'GET', path: '/analysis/intent/list', query: { timeRange: 'today' } }),
    request<ApiNotificationEvent[]>({ method: 'GET', path: '/analysis/notify/list', query: { ...notifyRange } }),
    request<ApiMaterial[]>({ method: 'GET', path: '/material/mine', silent: true }).catch(() => [] as ApiMaterial[]),
  ]).then(async ([dashboard, customers, contents, intentCustomers, notifyEvents, materials]) => {
    const unreadEvents = selectUnviewedNotificationEvents(
      (notifyEvents ?? []).filter((event) => event != null),
      readViewedNotificationMap(),
    )
    const previewEvents = unreadEvents
      .slice()
      .sort((left, right) => String(right.viewTime ?? '').localeCompare(String(left.viewTime ?? '')))
      .slice(0, HOME_PREVIEW_LIMIT)
    const previewContents = [...(contents ?? [])]
      .sort((left, right) => (right.viewCount ?? 0) - (left.viewCount ?? 0))
      .slice(0, HOME_CONTENT_LIMIT)
    const materialById = new Map((materials ?? []).map((material) => [String(material.id), material]))
    const contentById = new Map((contents ?? []).map((content) => [String(content.materialId), content]))
    const neededIds = [...new Set([
      ...previewEvents.map((event) => (event.materialId ? String(event.materialId) : '')),
      ...previewContents.map((content) => String(content.materialId)),
    ].filter((id) => id !== ''))]
    const thumbnailByMaterialId = await prepareMaterialThumbnailMap(neededIds.map((id) => {
      const material = materialById.get(id)
      if (material) {
        return {
          id,
          fileType: material.fileType,
          coverUrl: material.coverUrl,
          fileUrl: material.fileUrl,
        }
      }

      const content = contentById.get(id)
      return {
        id,
        fileType: content?.fileType,
        coverUrl: content?.coverUrl,
      }
    }))

    const notifications = previewEvents.map((event) => mapHomeNotification(event, thumbnailByMaterialId))
    const contentsCards = buildContentCards(previewContents, intentCustomers, thumbnailByMaterialId)
    const previewCustomers = intentCustomers.slice(0, 5)
    const highCount = dashboard.highIntentCount ?? 0
    const mediumCount = dashboard.mediumIntentCount ?? 0
    const lowCount = dashboard.lowIntentCount ?? 0

    const [notificationAvatars, previewAvatars] = await Promise.all([
      prepareMediaUrls(notifications.map((item) => item.avatarUrl)),
      prepareMediaUrls(previewCustomers.map((customer) => customer.avatar)),
    ])

    return {
      unreadNotificationCount: unreadEvents.length,
      notifications: notifications.map((item, index) => ({
        ...item,
        avatarUrl: notificationAvatars[index] ?? '',
      })),
      contents: contentsCards,
      intentSummary: {
        total: formatCount(dashboard.totalViewerCount ?? customers.length),
        highCount: formatCount(highCount),
        mediumCount: formatCount(mediumCount),
        lowCount: formatCount(lowCount),
        previewAvatars: previewCustomers.map((customer, index) => ({
          id: `${customer.customerId}-${index}`,
          avatarUrl: previewAvatars[index] ?? '',
        })),
      },
      today: {
        viewCount: formatCount(dashboard.totalViewCount),
        completeCount: formatCount(dashboard.totalCompleteCount),
        forwardCount: formatCount(dashboard.totalForwardCount),
        viewerCount: formatCount(dashboard.totalViewerCount ?? customers.length),
      },
    }
  })
}
