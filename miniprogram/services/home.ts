import type {
  ApiContentListItem,
  ApiCustomerListItem,
  ApiDashboard,
  ApiIntentCustomer,
  ApiMaterial,
} from '../types/api'
import type { HomeContentViewModel, HomeIntentLevel, HomeNotificationViewModel, HomePageViewModel } from '../types/home'
import { formatCount, formatDateKey, formatMonthDayTime } from '../utils/format'
import { prepareMediaUrls } from '../utils/media'
import { readViewedNotificationMap, selectUnviewedIntentCustomers } from '../utils/notification-viewed'
import { request, resolveMediaUrl } from './request'

const HOME_PREVIEW_LIMIT = 3
const HOME_CONTENT_LIMIT = 2

const intentLabels: Record<HomeIntentLevel, string> = {
  high: '#高意向',
  medium: '#中意向',
  low: '#低意向',
}

const actionLabels = {
  forward: '“转发”了你的作品',
  reading: '“浏览”了你的作品',
} as const

function buildNotificationStatus(item: ApiIntentCustomer): string {
  if (item.hasForwarded === 1) return '该用户转发了你的作品'
  if (item.completed === 1) return '该用户已完成浏览'
  return '该用户尚未完成浏览'
}

function mapNotification(
  item: ApiIntentCustomer,
  thumbnailByMaterialId: Map<string, string>,
): HomeNotificationViewModel {
  const action = item.hasForwarded === 1 ? 'forward' : 'reading'

  return {
    id: `home-notification-${item.customerId}`,
    userId: String(item.customerId),
    visitorName: item.nickname ?? '微信用户',
    intent: item.intentLevel,
    intentLabel: intentLabels[item.intentLevel],
    action,
    actionLabel: actionLabels[action],
    actionDate: formatMonthDayTime(item.lastViewTime),
    lastViewTime: item.lastViewTime ?? '',
    actionIconPath:
      action === 'forward' ? '/assets/home-new/action-forward.svg' : '/assets/home-new/action-reading.svg',
    avatarUrl: resolveMediaUrl(item.avatar),
    thumbnailUrl: item.materialId ? thumbnailByMaterialId.get(String(item.materialId)) ?? '' : '',
    statusLabel: buildNotificationStatus(item),
  }
}

function mapContent(item: ApiContentListItem, intentCustomers: ApiIntentCustomer[]): HomeContentViewModel {
  const materialId = String(item.materialId)
  const highIntentCount = intentCustomers.filter(
    (customer) => String(customer.materialId) === materialId && customer.intentLevel === 'high',
  ).length

  return {
    id: materialId,
    title: item.title ?? '未命名作品',
    date: `${formatDateKey(item.createTime)} 发布`,
    thumbnailUrl: resolveMediaUrl(item.coverUrl),
    viewCount: formatCount(item.viewCount),
    forwardCount: formatCount(item.forwardCount),
    highIntentCount: formatCount(highIntentCount),
  }
}

function buildContentCards(contents: ApiContentListItem[], intentCustomers: ApiIntentCustomer[]): HomeContentViewModel[] {
  return [...contents]
    .sort((left, right) => (right.viewCount ?? 0) - (left.viewCount ?? 0))
    .slice(0, HOME_CONTENT_LIMIT)
    .map((item) => mapContent(item, intentCustomers))
}

export function getHomePageData(): Promise<HomePageViewModel> {
  return Promise.all([
    request<ApiDashboard>({ method: 'GET', path: '/analysis/dashboard', query: { timeRange: 'today' } }),
    request<ApiCustomerListItem[]>({ method: 'GET', path: '/analysis/customer/list', query: { timeRange: 'today' } }),
    request<ApiContentListItem[]>({ method: 'GET', path: '/analysis/content/list', query: { timeRange: 'today' } }),
    request<ApiIntentCustomer[]>({ method: 'GET', path: '/analysis/intent/list', query: { timeRange: 'today' } }),
    request<ApiMaterial[]>({ method: 'GET', path: '/material/mine', silent: true }).catch(() => [] as ApiMaterial[]),
  ]).then(async ([dashboard, customers, contents, intentCustomers, materials]) => {
    const thumbnailByMaterialId = new Map(
      materials.map((material) => [String(material.id), resolveMediaUrl(material.coverUrl)]),
    )

    contents.forEach((content) => {
      const materialId = String(content.materialId)
      if (!thumbnailByMaterialId.has(materialId)) {
        thumbnailByMaterialId.set(materialId, resolveMediaUrl(content.coverUrl))
      }
    })

    const unreadCustomers = selectUnviewedIntentCustomers(intentCustomers, readViewedNotificationMap())
    const notifications = unreadCustomers
      .slice()
      .sort((left, right) => String(right.lastViewTime ?? '').localeCompare(String(left.lastViewTime ?? '')))
      .slice(0, HOME_PREVIEW_LIMIT)
      .map((item) => mapNotification(item, thumbnailByMaterialId))
    const contentsCards = buildContentCards(contents, intentCustomers)
    const previewCustomers = intentCustomers.slice(0, 5)
    const highCount = dashboard.highIntentCount ?? 0
    const mediumCount = dashboard.mediumIntentCount ?? 0
    const lowCount = dashboard.lowIntentCount ?? 0

    const [notificationAvatars, notificationThumbs, contentThumbs, previewAvatars] = await Promise.all([
      prepareMediaUrls(notifications.map((item) => item.avatarUrl)),
      prepareMediaUrls(notifications.map((item) => item.thumbnailUrl)),
      prepareMediaUrls(contentsCards.map((item) => item.thumbnailUrl)),
      prepareMediaUrls(previewCustomers.map((customer) => customer.avatar)),
    ])

    return {
      unreadNotificationCount: unreadCustomers.length,
      notifications: notifications.map((item, index) => ({
        ...item,
        avatarUrl: notificationAvatars[index] ?? '',
        thumbnailUrl: notificationThumbs[index] ?? '',
      })),
      contents: contentsCards.map((item, index) => ({
        ...item,
        thumbnailUrl: contentThumbs[index] ?? '',
      })),
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
        completeRate: `${dashboard.completeRate ?? 0}%`,
        forwardCount: formatCount(dashboard.totalForwardCount),
        viewerCount: formatCount(dashboard.totalViewerCount ?? customers.length),
      },
    }
  })
}
