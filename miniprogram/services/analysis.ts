import type {
  ApiContentDetail,
  ApiContentListItem,
  ApiCustomerListItem,
  ApiCustomerViewHistory,
  ApiDashboard,
  ApiIntentCustomer,
  ApiMaterial,
} from '../types/api'
import type {
  AnalysisCard,
  AnalysisChartPoint,
  AnalysisDetailViewModel,
  AnalysisIntentLevel,
  AnalysisReadRange,
  AnalysisUserDetailViewModel,
  AnalysisViewModel,
} from '../types/analysis'
import { ANALYSIS_DATA_SOURCE } from '../config/dev'
import { getAnalysisDetailStyleMock, getAnalysisStyleMock, getAnalysisUserDetailStyleMock } from '../mocks/analysis'
import {
  buildCustomRangeQuery,
  formatCount,
  formatDateKey,
  formatDateTime,
  formatMonthDay,
  formatSeconds,
} from '../utils/format'
import type { DateRange } from '../utils/date-range'
import { request, resolveMediaUrl, runRequestQueue } from './request'

/** 分析页时间筛选：日/周/月对应后端 today/week/month；「总」受后端 custom 上限约束取最近 62 天（待后端确认全量口径） */
export type AnalysisTimeRange = 'day' | 'week' | 'month' | 'total' | 'custom'

const MAX_QUERY_RANGE_DAYS = 62

const WEEK_TREND_DAYS = 7
const MONTH_TREND_DAYS = 30
const TREND_CACHE_TTL_MS = 60000
const REQUEST_CONCURRENCY = 6

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

const intentLevelLabels: Record<AnalysisIntentLevel, string> = {
  high: '高意向',
  medium: '中意向',
  low: '低意向',
}

function buildPeriodQuery(period: AnalysisTimeRange, customRange?: DateRange): Record<string, string> {
  if (period === 'day') return { timeRange: 'today' }
  if (period === 'week') return { timeRange: 'week' }
  if (period === 'month') return { timeRange: 'month' }
  if (period === 'custom' && customRange) {
    return {
      timeRange: 'custom',
      startDate: `${customRange.startDate} 00:00:00`,
      endDate: `${customRange.endDate} 23:59:59`,
    }
  }
  return { ...buildCustomRangeQuery(MAX_QUERY_RANGE_DAYS) }
}

/** 意向等级：优先取后端意向列表结果，缺失时按后端同款规则本地推导 */
function resolveIntentLevel(
  intentByCustomer: Map<string, ApiIntentCustomer>,
  customerId: string,
  viewCount: number,
  completed: number,
): AnalysisIntentLevel {
  const intent = intentByCustomer.get(customerId)
  if (intent) return intent.intentLevel
  if (viewCount >= 2) return 'high'
  if (completed > 0) return 'medium'
  return 'low'
}

function mapContentCard(item: ApiContentListItem): AnalysisCard {
  const metrics = buildCardMetrics(item.viewCount, item.forwardCount, item.completeCount, item.viewerCount)

  return {
    id: String(item.materialId),
    thumbnailUrl: resolveMediaUrl(item.coverUrl),
    title: item.title ?? '',
    date: formatDateKey(item.createTime),
    publishedAt: formatPublishedAt(item.createTime),
    metrics: metrics.full,
    compactMetrics: metrics.compact,
  }
}

function buildCardMetrics(viewCount: number | null | undefined, forwardCount: number | null | undefined, completeCount: number | null | undefined, viewerCount: number | null | undefined) {
  return {
    full: [
      { label: '转发', value: formatCount(forwardCount) },
      { label: '播完', value: formatCount(completeCount) },
      { label: '浏览', value: formatCount(viewCount) },
      { label: '观看人数', value: formatCount(viewerCount) },
    ],
    compact: [
      { label: '浏览次数', value: formatCount(viewCount) },
      { label: '转发', value: formatCount(forwardCount) },
      { label: '完播', value: formatCount(completeCount) },
    ],
  }
}

function formatPublishedAt(value: string | null | undefined): string {
  if (!value) return ''

  const normalized = value.replace('T', ' ')
  return normalized.length >= 16 ? `${normalized.slice(0, 16)} 发布` : normalized
}

interface DailyViewCount {
  date: Date
  viewCount: number
}

let readTrendsCache: { expiresAt: number; value: Record<AnalysisReadRange, AnalysisChartPoint[]> } | null = null

/** 后端无按日趋势接口，按天聚合 dashboard 浏览数得到趋势；单日失败按 0 降级 */
function fetchDailyViewCounts(days: number): Promise<DailyViewCount[]> {
  const now = new Date()
  const tasks: Array<() => Promise<DailyViewCount>> = []

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
    const dayEnd = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), 23, 59, 59)

    tasks.push(() =>
      request<ApiDashboard>({
        method: 'GET',
        path: '/analysis/dashboard',
        query: { timeRange: 'custom', startDate: formatDateTime(dayStart), endDate: formatDateTime(dayEnd) },
        silent: true,
      })
        .then((dashboard) => ({ date: dayStart, viewCount: dashboard.totalViewCount ?? 0 }))
        .catch(() => ({ date: dayStart, viewCount: 0 })),
    )
  }

  return runRequestQueue(tasks, REQUEST_CONCURRENCY)
}

function buildChartPoints(days: DailyViewCount[], range: AnalysisReadRange): AnalysisChartPoint[] {
  return days.map((day) => ({
    id: `${range}-${formatDateTime(day.date).slice(0, 10)}`,
    label: range === 'week' ? WEEKDAY_LABELS[day.date.getDay()] : String(day.date.getDate()),
    value: formatCount(day.viewCount),
  }))
}

function getReadTrends(): Promise<Record<AnalysisReadRange, AnalysisChartPoint[]>> {
  if (readTrendsCache && readTrendsCache.expiresAt > Date.now()) {
    return Promise.resolve(readTrendsCache.value)
  }

  return fetchDailyViewCounts(MONTH_TREND_DAYS).then((monthDays) => {
    const value: Record<AnalysisReadRange, AnalysisChartPoint[]> = {
      week: buildChartPoints(monthDays.slice(-WEEK_TREND_DAYS), 'week'),
      month: buildChartPoints(monthDays, 'month'),
    }
    readTrendsCache = { expiresAt: Date.now() + TREND_CACHE_TTL_MS, value }
    return value
  })
}

export function getAnalysisOverview(period: AnalysisTimeRange = 'day', customRange?: DateRange): Promise<AnalysisViewModel> {
  if (ANALYSIS_DATA_SOURCE === 'mock') return Promise.resolve(getAnalysisStyleMock())

  const periodQuery = buildPeriodQuery(period, customRange)
  const totalQuery = buildPeriodQuery('total')

  return Promise.all([
    request<ApiDashboard>({ method: 'GET', path: '/analysis/dashboard', query: periodQuery }),
    request<ApiContentListItem[]>({ method: 'GET', path: '/analysis/content/list', query: periodQuery }),
    request<ApiCustomerListItem[]>({ method: 'GET', path: '/analysis/customer/list', query: periodQuery }),
    request<ApiIntentCustomer[]>({ method: 'GET', path: '/analysis/intent/list', query: periodQuery }),
    request<ApiDashboard>({ method: 'GET', path: '/analysis/dashboard', query: totalQuery }),
    getReadTrends(),
  ]).then(([dashboard, contents, customers, intentCustomers, totalDashboard, readTrends]) => {
      const intentByCustomer = new Map(intentCustomers.map((item) => [String(item.customerId), item]))

      return {
        summary: [
          { label: '总发布', value: formatCount(dashboard.totalPublishCount) },
          { label: '总浏览次数', value: formatCount(dashboard.totalViewCount) },
          { label: '总转发', value: formatCount(dashboard.totalForwardCount) },
        ],
        cards: contents.map(mapContentCard),
        userSummary: [
          { label: '高意向', value: formatCount(dashboard.highIntentCount) },
          { label: '中意向', value: formatCount(dashboard.mediumIntentCount) },
          { label: '低意向', value: formatCount(dashboard.lowIntentCount) },
        ],
        audienceUsers: customers.map((customer) => {
          const customerId = String(customer.customerId)
          const level = resolveIntentLevel(intentByCustomer, customerId, customer.viewCount ?? 0, customer.completeCount ?? 0)
          const intent = intentByCustomer.get(customerId)

          return {
            id: customerId,
            avatarUrl: resolveMediaUrl(customer.avatar),
            name: customer.nickname ?? '微信用户',
            level,
            levelLabel: intentLevelLabels[level],
            readCount: formatCount(customer.viewCount),
            completionCount: formatCount(customer.completeCount),
            shareCount: intent?.hasForwarded === 1 ? '1' : '0',
          }
        }),
        totalData: {
          heroMetrics: [
            { label: '浏览总次数', value: formatCount(totalDashboard.totalViewCount), delta: '+0' },
            { label: '浏览总人数', value: formatCount(totalDashboard.totalViewerCount), delta: '+0' },
          ],
          overview: [
            { label: '总发布', value: formatCount(totalDashboard.totalPublishCount) },
            { label: '总转发', value: formatCount(totalDashboard.totalForwardCount) },
            { label: '总完播', value: formatCount(totalDashboard.totalCompleteCount) },
            { label: '高意向', value: formatCount(totalDashboard.highIntentCount) },
            { label: '中意向', value: formatCount(totalDashboard.mediumIntentCount) },
            { label: '低意向', value: formatCount(totalDashboard.lowIntentCount) },
          ],
          readTrends,
        },
      }
    })
}

export function getAnalysisDetail(cardId: string): Promise<AnalysisDetailViewModel | null> {
  if (ANALYSIS_DATA_SOURCE === 'mock') return Promise.resolve(getAnalysisDetailStyleMock(cardId))

  const rangeQuery = buildPeriodQuery('total')

  return Promise.all([
    request<ApiContentDetail | null>({
      method: 'GET',
      path: '/analysis/content/detail',
      query: { ...rangeQuery, materialId: cardId },
    }),
    request<ApiMaterial>({ method: 'GET', path: `/material/${cardId}`, silent: true }).catch(() => null),
    request<ApiIntentCustomer[]>({ method: 'GET', path: '/analysis/intent/list', query: rangeQuery, silent: true }).catch(
      () => [] as ApiIntentCustomer[],
    ),
  ]).then(([detail, material, intentCustomers]) => {
    if (!detail) return null

    const intentByCustomer = new Map(intentCustomers.map((item) => [String(item.customerId), item]))

    return {
      card: {
        id: String(detail.materialId),
        thumbnailUrl: resolveMediaUrl(material?.coverUrl),
        title: detail.title ?? '',
        date: formatDateKey(material?.createTime),
        publishedAt: formatPublishedAt(material?.createTime),
        metrics: buildCardMetrics(detail.viewCount, detail.forwardCount, detail.completeCount, detail.viewerCount).full,
        compactMetrics: buildCardMetrics(detail.viewCount, detail.forwardCount, detail.completeCount, detail.viewerCount).compact,
      },
      intentUsers: (detail.audienceList ?? []).map((audience) => {
        const customerId = String(audience.customerId)
        const level = resolveIntentLevel(intentByCustomer, customerId, audience.viewCount ?? 0, audience.completed ?? 0)
        const intent = intentByCustomer.get(customerId)

        return {
          id: customerId,
          avatarUrl: resolveMediaUrl(audience.avatar),
          name: audience.nickname ?? '微信用户',
          level,
          levelLabel: intentLevelLabels[level],
          readCount: formatCount(audience.viewCount),
          completionCount: audience.completed === 1 ? '1' : '0',
          shareCount: intent?.hasForwarded === 1 ? '1' : '0',
        }
      }),
    }
  })
}

export function getAnalysisUserDetail(userId: string): Promise<AnalysisUserDetailViewModel | null> {
  if (ANALYSIS_DATA_SOURCE === 'mock') return Promise.resolve(getAnalysisUserDetailStyleMock(userId))

  const rangeQuery = buildPeriodQuery('total')

  return Promise.all([
    request<ApiCustomerListItem[]>({ method: 'GET', path: '/analysis/customer/list', query: rangeQuery }),
    request<ApiCustomerViewHistory[]>({
      method: 'GET',
      path: '/analysis/customer/history',
      query: { ...rangeQuery, customerId: userId },
    }),
    request<ApiIntentCustomer[]>({ method: 'GET', path: '/analysis/intent/list', query: rangeQuery, silent: true }).catch(
      () => [] as ApiIntentCustomer[],
    ),
    request<ApiMaterial[]>({ method: 'GET', path: '/material/mine', silent: true }).catch(() => [] as ApiMaterial[]),
  ]).then(([customers, history, intentCustomers, materials]) => {
    const customer = customers.find((item) => String(item.customerId) === userId) ?? null
    const intent = intentCustomers.find((item) => String(item.customerId) === userId) ?? null
    if (!customer && !intent) return null

    const intentByCustomer = new Map(intentCustomers.map((item) => [String(item.customerId), item]))
    const coverByMaterial = new Map(
      materials.map((material) => [String(material.id), resolveMediaUrl(material.coverUrl)]),
    )
    const level = resolveIntentLevel(
      intentByCustomer,
      userId,
      customer?.viewCount ?? intent?.viewCount ?? 0,
      customer?.completeCount ?? intent?.completed ?? 0,
    )

    return {
      profile: {
        id: userId,
        avatarUrl: resolveMediaUrl(customer?.avatar ?? intent?.avatar),
        name: customer?.nickname ?? intent?.nickname ?? '微信用户',
        level,
        levelLabel: intentLevelLabels[level],
        readCount: formatCount(customer?.viewCount ?? intent?.viewCount),
        completionCount: formatCount(customer?.completeCount ?? intent?.completed),
        shareCount: intent?.hasForwarded === 1 ? '1' : '0',
        viewDuration: formatSeconds(customer?.totalDuration),
        // TODO(API): 后端确认用户对单个作品的意向标签后，映射高意向作品数。
        highIntentContentCount: undefined,
      },
      // 后端观看历史暂不含单条转发数，shareCount 固定为 0（「转发」筛选相应为空）
      records: history.map((record, index) => ({
        id: `${record.materialId}-${index}`,
        contentId: String(record.materialId),
        thumbnailUrl: coverByMaterial.get(String(record.materialId)) ?? '',
        title: record.title ?? '',
        date: formatMonthDay(record.viewTime),
        progress: `${record.progress ?? 0}%`,
        viewDuration: formatSeconds(record.duration),
        readCount: '1',
        completionCount: record.completed === 1 ? '1' : '0',
        shareCount: '0',
      })),
    }
  })
}
