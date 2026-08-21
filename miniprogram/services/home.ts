import type { ApiContentListItem, ApiCustomerListItem, ApiDashboard } from '../types/api'
import type { HomeOverviewViewModel } from '../types/home'
import { prepareMediaUrls } from '../utils/media'
import { request } from './request'

const HOME_VISITOR_PREVIEW_LIMIT = 5

/**
 * 首页摘要。后端无单独首页接口，由分析域「今日」数据组合：
 * - 新增用户：今日观看客户数（去重），高意向数取今日高意向客户数
 * - 阅读 / 转发：今日阅读、转发总次数，转发榜首内容作为高亮文案
 * - 通知角标：今日产生意向行为的客户数（后端暂无未读通知概念）
 */
export function getHomeOverview(): Promise<HomeOverviewViewModel> {
  return Promise.all([
    request<ApiDashboard>({ method: 'GET', path: '/analysis/dashboard', query: { timeRange: 'today' } }),
    request<ApiCustomerListItem[]>({ method: 'GET', path: '/analysis/customer/list', query: { timeRange: 'today' } }),
    request<ApiContentListItem[]>({
      method: 'GET',
      path: '/analysis/content/list',
      query: { timeRange: 'today', orderBy: 'forward_count' },
    }),
  ]).then(async ([dashboard, customers, contents]) => {
    const topForwarded = contents.find((item) => (item.forwardCount ?? 0) > 0)
    const intentCustomerCount =
      (dashboard.highIntentCount ?? 0) + (dashboard.mediumIntentCount ?? 0) + (dashboard.lowIntentCount ?? 0)
    const visitorSlice = customers.slice(0, HOME_VISITOR_PREVIEW_LIMIT)
    const avatarUrls = await prepareMediaUrls(visitorSlice.map((customer) => customer.avatar))

    return {
      newVisitors: {
        total: dashboard.totalViewerCount ?? 0,
        highIntentCount: dashboard.highIntentCount ?? 0,
        visitors: visitorSlice.map((customer, index) => ({
          id: String(customer.customerId),
          avatarUrl: avatarUrls[index],
        })),
      },
      reading: {
        total: dashboard.totalViewCount ?? 0,
      },
      sharing: {
        total: dashboard.totalForwardCount ?? 0,
        highlightedContentTitle: topForwarded?.title ?? '',
        highlightedContentShareCount: topForwarded?.forwardCount ?? 0,
      },
      unreadNotificationCount: intentCustomerCount,
    }
  })
}
