import type {
  ApiAudience,
  ApiContentDetail,
  ApiContentListItem,
  ApiCustomerListItem,
  ApiCustomerViewHistory,
  ApiDailyView,
  ApiDashboard,
  ApiIntentCustomer,
  ApiMaterial,
  ApiNotificationEvent,
} from '../types/api'
import type {
  AnalysisCard,
  AnalysisChartPoint,
  AnalysisAudienceUser,
  AnalysisContentDetailViewModel,
  AnalysisIntentLevel,
  AnalysisMetric,
  AnalysisReadRange,
  AnalysisUserDetailViewModel,
  AnalysisViewModel,
  AnalysisWorkListViewModel,
  AnalysisWorkSortId,
} from '../types/analysis'
import {
  buildCustomRangeQuery,
  formatCount,
  formatDateKey,
  formatDateTime,
  formatMonthDay,
  formatSeconds,
  formatSignedCountDelta,
} from '../utils/format'
import type { DateRange } from '../utils/date-range'
import { getTotalRangeStart, startOfWeekMonday } from '../utils/date-range'
import { aggregateCustomerHistoryByMaterial, resolveIntentLevelFromCounts } from '../utils/analysis-users'
import { prepareMediaUrls } from '../utils/media'
import { DEV_UI_PREVIEW } from '../config/dev'
import { getAnalysisContentDetailPreview, getAnalysisOverviewPreview, getAnalysisWorkListPreview } from './analysis-preview'
import { getMembershipAccessSilent } from './membership'
import {
  enrichThumbnailsByIds,
  prepareMaterialThumbnail,
  rememberMaterialThumbnailSources,
  resolveMaterialListThumbnail,
} from './materials'
import { request, resolveMediaUrl } from './request'

/** 分析页时间筛选：日/周/月对应后端 today/week/month；日历自定义走 custom，范围限制为最近 62 天。 */
export type AnalysisTimeRange = 'day' | 'week' | 'month' | 'total' | 'custom'

const MAX_QUERY_RANGE_DAYS = 62

const TREND_CACHE_TTL_MS = 60000
const TOTAL_TREND_WEEKS = 6

const intentLevelLabels: Record<AnalysisIntentLevel, string> = {
  high: '高意向',
  medium: '中意向',
  low: '低意向',
}

const fileTypeLabels: Record<string, string> = {
  PDF: 'PDF',
  IMAGE: '图片',
  VIDEO: '视频',
  TABLE: '表格',
}

function asList<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
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
  return resolveIntentLevelFromCounts(viewCount, completed)
}

function buildMaterialIntentMap(intentCustomers: ApiIntentCustomer[], customerId: string): Map<string, AnalysisIntentLevel> {
  const map = new Map<string, AnalysisIntentLevel>()
  for (const item of intentCustomers) {
    if (String(item.customerId) !== customerId) continue
    if (item.materialId == null || String(item.materialId) === '') continue
    map.set(String(item.materialId), item.intentLevel)
  }
  return map
}

const workSortOrderBy: Record<AnalysisWorkSortId, string> = {
  view: 'view_count',
  share: 'forward_count',
  completion: 'complete_count',
}

function mapContentCard(
  item: ApiContentListItem,
  thumbnailUrl: string,
  intentSummary?: ContentDetailIntentSummary,
): AnalysisCard {
  const metrics = buildCardMetrics(item.viewCount, item.forwardCount, item.completeCount, item.viewerCount)

  return {
    id: String(item.materialId),
    thumbnailUrl,
    title: item.title ?? '',
    date: formatDateKey(item.createTime),
    publishedAt: formatPublishedAt(item.createTime),
    ...getContentDetailIntent(intentSummary),
    metrics: metrics.full,
    compactMetrics: metrics.compact,
    sortCounts: buildCardSortCounts(item.viewCount, item.forwardCount, item.completeCount),
  }
}

function buildWorkSummary(dashboard: ApiDashboard): AnalysisMetric[] {
  return [
    { label: '总浏览次数', value: formatCount(dashboard.totalViewCount), iconPath: '/assets/analysis/total-view-icon.svg' },
    { label: '总转发', value: formatCount(dashboard.totalForwardCount), iconPath: '/assets/analysis/total-forward-icon.svg' },
  ]
}

function mapContentCards(
  contents: ApiContentListItem[] | null | undefined,
  sortId: AnalysisWorkSortId,
  intentCustomers: ApiIntentCustomer[] = [],
): AnalysisCard[] {
  const items = contents ?? []
  const intentByMaterial = buildContentDetailIntentMap(intentCustomers)
  const sources = items.map((item) => ({
    id: String(item.materialId),
    fileType: item.fileType,
    coverUrl: item.coverUrl,
  }))
  rememberMaterialThumbnailSources(sources)

  return sortAnalysisCards(
    items.map((item, index) => mapContentCard(
      item,
      resolveMaterialListThumbnail(sources[index]),
      intentByMaterial.get(String(item.materialId)),
    )),
    sortId,
  )
}

/** 作品分析列表：走 GET /analysis/content/list 的浏览/转发/完播，并按当前排序字段请求 */
export function getAnalysisWorkList(
  period: AnalysisTimeRange = 'day',
  customRange?: DateRange,
  sortId: AnalysisWorkSortId = 'view',
): Promise<AnalysisWorkListViewModel> {
  if (DEV_UI_PREVIEW) return Promise.resolve(getAnalysisWorkListPreview())

  const query = {
    ...buildPeriodQuery(period, customRange),
    orderBy: workSortOrderBy[sortId],
  }

  return Promise.all([
    request<ApiDashboard>({ method: 'GET', path: '/analysis/dashboard', query }),
    request<ApiContentListItem[]>({ method: 'GET', path: '/analysis/content/list', query }),
    request<ApiIntentCustomer[]>({ method: 'GET', path: '/analysis/intent/list', query, silent: true }).catch(
      () => [] as ApiIntentCustomer[],
    ),
  ]).then(async ([dashboard, contents, intentCustomers]) => ({
    summary: buildWorkSummary(dashboard),
    cards: mapContentCards(contents, sortId, intentCustomers),
    workCount: formatCount(dashboard.totalPublishCount),
  }))
}

function buildCardSortCounts(
  viewCount: number | null | undefined,
  forwardCount: number | null | undefined,
  completeCount: number | null | undefined,
): AnalysisCard['sortCounts'] {
  return {
    view: viewCount ?? 0,
    share: forwardCount ?? 0,
    completion: completeCount ?? 0,
  }
}

export function sortAnalysisCards(cards: AnalysisCard[], sortId: AnalysisWorkSortId): AnalysisCard[] {
  return [...cards].sort((left, right) => right.sortCounts[sortId] - left.sortCounts[sortId])
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

let monthTrendCache: { expiresAt: number; monthKey: string; value: AnalysisChartPoint[] } | null = null
let dayTrendCache: { expiresAt: number; dateKey: string; value: AnalysisChartPoint[] } | null = null
let weekTrendCache: { expiresAt: number; weekKey: string; value: AnalysisChartPoint[] } | null = null
let totalTrendCache: { expiresAt: number; rangeKey: string; value: AnalysisChartPoint[] } | null = null

function isoWeekday(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

function toDateKey(date: Date): string {
  return formatDateTime(date).slice(0, 10)
}

function mapTrendRowsByDate(rows: ApiDailyView[] | null | undefined): Map<string, number> {
  const byDate = new Map<string, number>()
  for (const row of rows ?? []) {
    if (!row.date) continue
    byDate.set(row.date.slice(0, 10), row.viewCount ?? 0)
  }
  return byDate
}

function buildWeekTrendPoints(rows: ApiDailyView[], now = new Date()): AnalysisChartPoint[] {
  const byDate = mapTrendRowsByDate(rows)
  const monday = startOfWeekMonday(now)
  const todayWeekday = isoWeekday(now)
  const points: AnalysisChartPoint[] = []

  for (let weekday = 1; weekday <= todayWeekday; weekday += 1) {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + weekday - 1)
    const key = toDateKey(date)
    points.push({
      id: `week-${key}`,
      label: String(weekday),
      value: formatCount(byDate.get(key) ?? 0),
    })
  }

  return points
}

function buildMonthTrendPoints(rows: ApiDailyView[], now = new Date()): AnalysisChartPoint[] {
  const byDate = mapTrendRowsByDate(rows)
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const points: AnalysisChartPoint[] = []

  for (let day = 1; day <= today; day += 1) {
    const date = new Date(year, month, day)
    const key = toDateKey(date)
    points.push({
      id: `month-${key}`,
      label: String(day),
      value: formatCount(byDate.get(key) ?? 0),
    })
  }

  return points
}

function buildTotalTrendPoints(rows: ApiDailyView[], now = new Date()): AnalysisChartPoint[] {
  const byDate = mapTrendRowsByDate(rows)
  const rangeStart = getTotalRangeStart(now)
  const thisMonday = startOfWeekMonday(now)
  const firstMonday = new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() - (TOTAL_TREND_WEEKS - 1) * 7)
  const startKey = toDateKey(rangeStart)
  const todayKey = toDateKey(now)
  const points: AnalysisChartPoint[] = []

  for (let week = 1; week <= TOTAL_TREND_WEEKS; week += 1) {
    const weekMonday = new Date(firstMonday.getFullYear(), firstMonday.getMonth(), firstMonday.getDate() + (week - 1) * 7)
    let viewCount = 0

    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date(weekMonday.getFullYear(), weekMonday.getMonth(), weekMonday.getDate() + offset)
      const key = toDateKey(date)
      if (key < startKey || key > todayKey) continue
      viewCount += byDate.get(key) ?? 0
    }

    points.push({
      id: `total-${toDateKey(weekMonday)}`,
      label: String(week),
      value: formatCount(viewCount),
    })
  }

  return points
}

function emptyReadTrends(): Record<AnalysisReadRange, AnalysisChartPoint[]> {
  return { day: [], week: [], month: [], total: [] }
}

export function getTotalComparisonLabel(period: AnalysisTimeRange): string {
  if (period === 'day') return '较昨日'
  if (period === 'week') return '较上周'
  if (period === 'month') return '较上月'
  return '较上两月'
}

function buildHeroMetric(
  id: string,
  label: string,
  value: number | null | undefined,
  delta: number | null | undefined,
  comparisonLabel: string,
): AnalysisViewModel['totalData']['heroMetrics'][number] {
  const signedDelta = Math.trunc(Number(delta) || 0)
  const deltaTone = signedDelta < 0 ? 'down' : 'up'
  return {
    id,
    renderKey: `${id}-${deltaTone}-${signedDelta}`,
    label,
    value: formatCount(value),
    comparisonLabel,
    delta: formatSignedCountDelta(signedDelta),
    deltaTone,
  }
}

function buildHeroMetrics(totalDashboard: ApiDashboard, period: AnalysisTimeRange): AnalysisViewModel['totalData']['heroMetrics'] {
  const comparisonLabel = getTotalComparisonLabel(period)
  const viewDelta = Math.trunc(Number(totalDashboard.totalViewCountDelta) || 0)
  const viewerDelta = Math.trunc(Number(totalDashboard.totalViewerCountDelta) || 0)
  return [
    {
      label: '阅读总次数', value: `${formatCount(totalDashboard.totalViewCount)}次`, id: 'views', renderKey: `views-${viewDelta}`,
      comparisonLabel, delta: formatSignedCountDelta(viewDelta), deltaTone: viewDelta < 0 ? 'down' : 'up',
    },
    {
      label: '阅读总人数', value: `${formatCount(totalDashboard.totalViewerCount)}人`, id: 'viewers', renderKey: `viewers-${viewerDelta}`,
      comparisonLabel, delta: formatSignedCountDelta(viewerDelta), deltaTone: viewerDelta < 0 ? 'down' : 'up',
    },
  ]
}

function getDayReadTrend(): Promise<AnalysisChartPoint[]> {
  const now = new Date()
  const dateKey = formatDateTime(now).slice(0, 10)

  if (dayTrendCache && dayTrendCache.dateKey === dateKey && dayTrendCache.expiresAt > Date.now()) {
    return Promise.resolve(dayTrendCache.value)
  }

  return request<ApiDailyView[]>({
    method: 'GET',
    path: '/analysis/trend',
    query: { timeRange: 'today' },
    silent: true,
  })
    .then((rows) => {
      const value = (rows ?? []).map((row, index) => {
        const hour = row.hour ?? index
        return {
          id: `day-${row.date ?? dateKey}-${hour}`,
          label: String(hour),
          value: formatCount(row.viewCount),
        }
      })
      dayTrendCache = { expiresAt: Date.now() + TREND_CACHE_TTL_MS, dateKey, value }
      return value
    })
    .catch(() => [])
}

function getWeekReadTrend(): Promise<AnalysisChartPoint[]> {
  const now = new Date()
  const weekKey = toDateKey(startOfWeekMonday(now))

  if (weekTrendCache && weekTrendCache.weekKey === weekKey && weekTrendCache.expiresAt > Date.now()) {
    return Promise.resolve(weekTrendCache.value)
  }

  return request<ApiDailyView[]>({
    method: 'GET',
    path: '/analysis/trend',
    query: { timeRange: 'week' },
    silent: true,
  })
    .then((rows) => {
      const value = buildWeekTrendPoints(rows, now)
      weekTrendCache = { expiresAt: Date.now() + TREND_CACHE_TTL_MS, weekKey, value }
      return value
    })
    .catch(() => [])
}

function getMonthReadTrend(): Promise<AnalysisChartPoint[]> {
  const now = new Date()
  const monthKey = toDateKey(now)

  if (monthTrendCache && monthTrendCache.monthKey === monthKey && monthTrendCache.expiresAt > Date.now()) {
    return Promise.resolve(monthTrendCache.value)
  }

  return request<ApiDailyView[]>({
    method: 'GET',
    path: '/analysis/trend',
    query: { timeRange: 'month' },
    silent: true,
  })
    .then((rows) => {
      const value = buildMonthTrendPoints(rows, now)
      monthTrendCache = { expiresAt: Date.now() + TREND_CACHE_TTL_MS, monthKey, value }
      return value
    })
    .catch(() => [])
}

function getTotalReadTrend(): Promise<AnalysisChartPoint[]> {
  const now = new Date()
  const rangeKey = `${toDateKey(getTotalRangeStart(now))}_${toDateKey(now)}`

  if (totalTrendCache && totalTrendCache.rangeKey === rangeKey && totalTrendCache.expiresAt > Date.now()) {
    return Promise.resolve(totalTrendCache.value)
  }

  return request<ApiDailyView[]>({
    method: 'GET',
    path: '/analysis/trend',
    query: { timeRange: 'all' },
    silent: true,
  })
    .then((rows) => {
      const value = buildTotalTrendPoints(rows, now)
      totalTrendCache = { expiresAt: Date.now() + TREND_CACHE_TTL_MS, rangeKey, value }
      return value
    })
    .catch(() => [])
}

function getReadTrends(): Promise<Record<AnalysisReadRange, AnalysisChartPoint[]>> {
  return Promise.all([getDayReadTrend(), getWeekReadTrend(), getMonthReadTrend(), getTotalReadTrend()]).then(
    ([day, week, month, total]) => ({
      ...emptyReadTrends(),
      day,
      week,
      month,
      total,
    }),
  )
}

export function getAnalysisOverview(
  period: AnalysisTimeRange = 'day',
  customRange?: DateRange,
  sortId: AnalysisWorkSortId = 'view',
  totalPeriod: AnalysisTimeRange = 'total',
): Promise<AnalysisViewModel> {
  if (DEV_UI_PREVIEW) return Promise.resolve(getAnalysisOverviewPreview())

  const periodQuery = buildPeriodQuery(period, customRange)
  const contentQuery = { ...periodQuery, orderBy: workSortOrderBy[sortId] }
  const resolvedTotalPeriod = totalPeriod === 'custom' ? 'total' : totalPeriod
  const totalQuery = buildPeriodQuery(resolvedTotalPeriod)
  const reusePeriodDashboard = period === resolvedTotalPeriod && period !== 'custom'

  return Promise.all([
    request<ApiDashboard>({ method: 'GET', path: '/analysis/dashboard', query: periodQuery }),
    request<ApiContentListItem[]>({ method: 'GET', path: '/analysis/content/list', query: contentQuery }),
    request<ApiCustomerListItem[]>({ method: 'GET', path: '/analysis/customer/list', query: periodQuery }),
    request<ApiIntentCustomer[]>({ method: 'GET', path: '/analysis/intent/list', query: periodQuery }),
    reusePeriodDashboard
      ? Promise.resolve(null)
      : request<ApiDashboard>({ method: 'GET', path: '/analysis/dashboard', query: totalQuery }),
    getReadTrends(),
    getMembershipAccessSilent(),
  ]).then(async ([dashboard, contents, customers, intentCustomers, totalDashboard, readTrends, membershipAccess]) => {
    const intentByCustomer = new Map(intentCustomers.map((item) => [String(item.customerId), item]))
    const cards = mapContentCards(contents, sortId, intentCustomers)
    const heroDashboard = totalDashboard ?? dashboard

    return {
      summary: buildWorkSummary(dashboard),
      cards,
      workCount: formatCount(dashboard.totalPublishCount),
      userSummary: [
        { label: '高意向', value: formatCount(dashboard.highIntentCount), iconPath: '/assets/analysis/intent-high-icon.svg' },
        { label: '中意向', value: formatCount(dashboard.mediumIntentCount), iconPath: '/assets/analysis/intent-middle-icon.svg' },
        { label: '低意向', value: formatCount(dashboard.lowIntentCount), iconPath: '/assets/analysis/intent-low-icon.svg' },
      ],
      audienceUsers: (customers ?? []).map((customer) => {
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
      visitorLimit: membershipAccess.visitorLimit,
      totalData: {
        heroMetrics: buildHeroMetrics(heroDashboard, resolvedTotalPeriod),
        overview: [
          { label: '总发布', value: formatCount(heroDashboard.totalPublishCount) },
          { label: '总转发', value: formatCount(heroDashboard.totalForwardCount) },
          { label: '总完播', value: formatCount(heroDashboard.totalCompleteCount) },
          { label: '高意向', value: formatCount(heroDashboard.highIntentCount) },
          { label: '中意向', value: formatCount(heroDashboard.mediumIntentCount) },
          { label: '低意向', value: formatCount(heroDashboard.lowIntentCount) },
        ],
        readTrends,
      },
    }
  })
}

type ContentDetailIntentSummary = Record<AnalysisIntentLevel, number>

function buildContentDetailIntentMap(intentCustomers: ApiIntentCustomer[]): Map<string, ContentDetailIntentSummary> {
  const byMaterial = new Map<string, ContentDetailIntentSummary>()
  for (const item of intentCustomers) {
    if (!item.materialId || !['high', 'medium', 'low'].includes(item.intentLevel)) continue
    const materialId = String(item.materialId)
    const counts = byMaterial.get(materialId) ?? { high: 0, medium: 0, low: 0 }
    counts[item.intentLevel] += 1
    byMaterial.set(materialId, counts)
  }
  return byMaterial
}

function getContentDetailIntent(summary?: ContentDetailIntentSummary): Pick<AnalysisCard, 'intentLevel' | 'intentLabel'> {
  if (!summary || (summary.high === 0 && summary.medium === 0 && summary.low === 0)) {
    return { intentLevel: 'empty', intentLabel: '暂无高意向' }
  }
  if (summary.high > 0) return { intentLevel: 'high', intentLabel: `${summary.high} 个高意向` }
  if (summary.medium > 0) return { intentLevel: 'medium', intentLabel: `${summary.medium} 个中意向` }
  return { intentLevel: 'low', intentLabel: `${summary.low} 个低意向` }
}

function asIntentLevel(value: string | null | undefined): AnalysisIntentLevel | null {
  if (value === 'high' || value === 'medium' || value === 'low') return value
  return null
}

function shareCountByCustomer(items: ApiIntentCustomer[], materialId: string): Map<string, string> {
  const shares = new Map<string, string>()
  for (const item of items) {
    if (String(item.materialId ?? '') !== materialId) continue
    shares.set(String(item.customerId), item.hasForwarded === 1 ? '1' : '0')
  }
  return shares
}

function mapContentIntentUsers(
  audienceList: ApiAudience[],
  avatarUrls: string[],
  shareByCustomer: Map<string, string>,
): AnalysisAudienceUser[] {
  return audienceList.map((audience, index) => {
    const userId = String(audience.customerId)
    const level = asIntentLevel(audience.intentLevel)
      ?? resolveIntentLevelFromCounts(audience.viewCount ?? 0, audience.completed ?? 0)

    return {
      id: userId,
      userId,
      avatarUrl: avatarUrls[index] ?? '',
      name: audience.nickname ?? '微信用户',
      level,
      levelLabel: intentLevelLabels[level],
      readCount: formatCount(audience.viewCount),
      completionCount: formatCount(audience.completed),
      shareCount: shareByCustomer.get(userId) ?? '0',
    }
  })
}

/** 单条作品的内容分析：GET /analysis/content/detail */
export function getAnalysisContentDetail(materialId: string): Promise<AnalysisContentDetailViewModel | null> {
  if (!materialId) return Promise.resolve(null)
  if (DEV_UI_PREVIEW) return Promise.resolve(getAnalysisContentDetailPreview())

  const query = { timeRange: 'all', materialId }

  return Promise.all([
    request<ApiContentDetail | null>({ method: 'GET', path: '/analysis/content/detail', query }).catch(() => null),
    request<ApiMaterial>({ method: 'GET', path: `/material/${materialId}`, silent: true }).catch(() => null),
    request<ApiIntentCustomer[]>({ method: 'GET', path: '/analysis/intent/list', query, silent: true }).catch(
      () => [] as ApiIntentCustomer[],
    ),
  ]).then(async ([detail, material, intentCustomers]) => {
    if (!detail && !material) return null

    const audienceList = detail?.audienceList ?? []
    const thumbnailUrl = await prepareMaterialThumbnail({
      id: materialId,
      fileType: material?.fileType ?? detail?.fileType,
      coverUrl: material?.coverUrl ?? null,
      fileUrl: material?.fileUrl ?? null,
    })

    return {
      card: {
        id: String(detail?.materialId ?? material?.id ?? materialId),
        thumbnailUrl,
        title: detail?.title ?? material?.title ?? '',
        date: formatDateKey(material?.createTime),
        metrics: buildCardMetrics(
          detail?.viewCount,
          detail?.forwardCount,
          detail?.completeCount,
          detail?.viewerCount,
        ).full,
      },
      intentUsers: mapContentIntentUsers(
        audienceList,
        audienceList.map((item) => resolveMediaUrl(item.avatar)),
        shareCountByCustomer(asList(intentCustomers), materialId),
      ),
    }
  })
}

export function getAnalysisUserDetail(userId: string): Promise<AnalysisUserDetailViewModel | null> {
  const allRangeQuery = { timeRange: 'all' }

  return Promise.all([
    request<ApiCustomerListItem[]>({ method: 'GET', path: '/analysis/customer/list', query: allRangeQuery }).catch(
      () => [] as ApiCustomerListItem[],
    ),
    request<ApiCustomerViewHistory[]>({
      method: 'GET',
      path: '/analysis/customer/history',
      query: { ...allRangeQuery, customerId: userId },
    }).catch(() => [] as ApiCustomerViewHistory[]),
    request<ApiIntentCustomer[]>({ method: 'GET', path: '/analysis/intent/list', query: allRangeQuery, silent: true }).catch(
      () => [] as ApiIntentCustomer[],
    ),
    request<ApiMaterial[]>({ method: 'GET', path: '/material/mine', silent: true }).catch(() => [] as ApiMaterial[]),
  ]).then(async ([customersRaw, historyRaw, intentRaw, materialsRaw]) => {
    const customers = asList(customersRaw)
    const history = asList(historyRaw)
    const intentCustomers = asList(intentRaw)
    const materials = asList(materialsRaw)
    const customer = customers.find((item) => String(item.customerId) === userId) ?? null
    const intent = intentCustomers.find((item) => String(item.customerId) === userId) ?? null
    const aggregated = aggregateCustomerHistoryByMaterial(history)
    if (!customer && !intent && aggregated.length === 0) return null

    const intentByCustomer = new Map(intentCustomers.map((item) => [String(item.customerId), item]))
    const materialById = new Map(materials.map((material) => [String(material.id), material]))
    const level = resolveIntentLevel(
      intentByCustomer,
      userId,
      customer?.viewCount ?? intent?.viewCount ?? 0,
      customer?.completeCount ?? intent?.completed ?? 0,
    )
    const intentByMaterial = buildMaterialIntentMap(intentCustomers, userId)
    rememberMaterialThumbnailSources(materials.map((material) => ({
      id: String(material.id),
      fileType: material.fileType,
      coverUrl: material.coverUrl,
      fileUrl: material.fileUrl,
    })))
    const avatarUrl = await prepareMediaUrls([customer?.avatar ?? intent?.avatar]).then((urls) => urls[0] ?? '').catch(() => '')
    const records = aggregated.map((record) => {
      const material = materialById.get(record.materialId)
      const recordLevel = intentByMaterial.get(record.materialId)
        ?? resolveIntentLevelFromCounts(record.viewCount, record.completeCount)

      return {
        id: record.materialId,
        contentId: record.materialId,
        thumbnailUrl: resolveMaterialListThumbnail({
          id: record.materialId,
          fileType: material?.fileType ?? record.fileType,
          coverUrl: material?.coverUrl,
          fileUrl: material?.fileUrl,
        }),
        title: record.title,
        date: formatMonthDay(record.viewTime),
        type: fileTypeLabels[record.fileType ?? ''] ?? '内容',
        fileType: record.fileType ?? '',
        progress: `${record.progress}%`,
        viewDuration: formatSeconds(record.duration),
        readCount: formatCount(record.viewCount),
        completionCount: formatCount(record.completeCount),
        shareCount: formatCount(record.shareCount),
        intentLevel: recordLevel,
        intentLabel: intentLevelLabels[recordLevel],
      }
    })

    return {
      profile: {
        id: userId,
        avatarUrl,
        name: customer?.nickname ?? intent?.nickname ?? '微信用户',
        level,
        levelLabel: intentLevelLabels[level],
        readCount: formatCount(customer?.viewCount ?? intent?.viewCount),
        completionCount: formatCount(customer?.completeCount ?? intent?.completed),
        shareCount: intent?.hasForwarded === 1 ? '1' : '0',
        viewDuration: formatSeconds(customer?.totalDuration),
        highIntentContentCount: records.filter((record) => record.intentLevel === 'high').length,
      },
      records,
    }
  })
}

/** 浏览记录先用封面尽快展示；可见窗口内再补第一页或本地下载，失败不影响已有列表 */
export function enrichAnalysisUserDetailThumbnails(
  detail: AnalysisUserDetailViewModel,
  contentIds?: string[],
): Promise<AnalysisUserDetailViewModel> {
  const ids = contentIds ?? detail.records.map((record) => record.contentId)
  if (ids.length === 0) return Promise.resolve(detail)

  return enrichThumbnailsByIds(ids)
    .then((thumbnailByMaterial) => ({
      ...detail,
      records: detail.records.map((record) => ({
        ...record,
        thumbnailUrl: thumbnailByMaterial.get(record.contentId) || record.thumbnailUrl,
      })),
    }))
    .catch(() => detail)
}

export function enrichAudienceUsers(users: AnalysisAudienceUser[]): Promise<AnalysisAudienceUser[]> {
  if (users.length === 0) return Promise.resolve(users)
  return prepareMediaUrls(users.map((user) => user.avatarUrl)).then((urls) => (
    users.map((user, index) => ({ ...user, avatarUrl: urls[index] || user.avatarUrl }))
  ))
}

export function enrichAnalysisCards(cards: AnalysisCard[]): Promise<AnalysisCard[]> {
  if (cards.length === 0) return Promise.resolve(cards)
  return enrichThumbnailsByIds(cards.map((card) => card.id)).then((thumbs) => (
    cards.map((card) => ({
      ...card,
      thumbnailUrl: thumbs.get(card.id) || card.thumbnailUrl,
    }))
  ))
}
