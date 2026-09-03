import type { ApiMembershipPlan, ApiMembershipStatus } from '../types/api'
import type {
  MembershipAccess,
  MembershipBenefitViewModel,
  MembershipPageViewModel,
  MembershipPlanId,
  MembershipPlanViewModel,
  MembershipTier,
  MembershipUiTier,
} from '../types/membership'

export const MEMBERSHIP_VISITOR_LIMIT_NONE = 8
/** 正式为 80；联调暂改为 10，方便验证普通会员上限 */
export const MEMBERSHIP_VISITOR_LIMIT_REGULAR = 10

function trackingBenefitLabel(limit: number | null): string {
  return limit == null ? '追踪人数无限' : `追踪人数 ${limit} 人`
}

const MEMBERSHIP_BENEFITS: Record<MembershipUiTier, MembershipBenefitViewModel[]> = {
  standard: [
    { id: 'publish', label: '作品发布' },
    { id: 'analysis', label: '作品数据分析' },
    { id: 'notification', label: '作品互动消息，及时通知' },
    { id: 'overview', label: '作品数据总览' },
    { id: 'intent', label: '意向用户分类' },
    { id: 'tracking', label: trackingBenefitLabel(MEMBERSHIP_VISITOR_LIMIT_REGULAR) },
  ],
  premium: [
    { id: 'publish', label: '作品发布' },
    { id: 'analysis', label: '作品数据分析' },
    { id: 'notification', label: '作品互动消息，及时通知' },
    { id: 'overview', label: '作品数据总览' },
    { id: 'intent', label: '意向用户分类' },
    { id: 'tracking', label: trackingBenefitLabel(null) },
  ],
}

const PLAN_DISPLAY: Record<MembershipPlanId, { title: string; discountLabel: string }> = {
  month: { title: '一个月', discountLabel: '优惠力度 0%' },
  quarter: { title: '三个月', discountLabel: '优惠力度 14%' },
  half_year: { title: '半年', discountLabel: '优惠力度 20%' },
  month_pro: { title: '一个月', discountLabel: '优惠力度 0%' },
  quarter_pro: { title: '三个月', discountLabel: '优惠力度 14%' },
  half_year_pro: { title: '半年', discountLabel: '优惠力度 20%' },
}

const STANDARD_PLAN_IDS: readonly MembershipPlanId[] = ['month', 'quarter', 'half_year']
const PREMIUM_PLAN_IDS: readonly MembershipPlanId[] = ['month_pro', 'quarter_pro', 'half_year_pro']
const DEFAULT_PLAN_ID: Record<MembershipUiTier, MembershipPlanId> = {
  standard: 'quarter',
  premium: 'quarter_pro',
}
export function uiTierForPlanId(planId: MembershipPlanId): MembershipUiTier {
  return PREMIUM_PLAN_IDS.includes(planId) ? 'premium' : 'standard'
}

export function plansForUiTier(
  plans: readonly MembershipPlanViewModel[],
  tier: MembershipUiTier,
): MembershipPlanViewModel[] {
  const allowed = tier === 'premium' ? PREMIUM_PLAN_IDS : STANDARD_PLAN_IDS
  return plans.filter((plan) => allowed.includes(plan.id))
}

export function getMembershipBenefits(tier: MembershipUiTier): MembershipBenefitViewModel[] {
  return MEMBERSHIP_BENEFITS[tier].map((benefit) => ({ ...benefit }))
}

export function normalizeMembershipTier(tier: string | null | undefined, active?: boolean): MembershipTier {
  if (active === false) return 'none'
  if (tier === 'pro') return 'pro'
  if (tier === 'regular') return 'regular'
  if (active === true) return 'regular'
  return 'none'
}

export function visitorLimitForTier(tier: MembershipTier): number | null {
  if (tier === 'pro') return null
  if (tier === 'regular') return MEMBERSHIP_VISITOR_LIMIT_REGULAR
  return MEMBERSHIP_VISITOR_LIMIT_NONE
}

/** null 表示不限制；只有字段缺失时才按非会员封顶 */
export function resolveVisitorLimit(limit: number | null | undefined): number | null {
  return limit === undefined ? MEMBERSHIP_VISITOR_LIMIT_NONE : limit
}

export function membershipAccessFromStatus(
  data: Pick<ApiMembershipStatus, 'active' | 'tier' | 'visitorLimit' | 'hasUnshownVisitors'> | null | undefined,
): MembershipAccess {
  const tier = normalizeMembershipTier(data?.tier, data?.active)
  const visitorLimit = visitorLimitForTier(tier)
  return {
    tier,
    visitorLimit,
    hasUnshownVisitors: visitorLimit != null && data?.hasUnshownVisitors === true,
  }
}

/** 追踪人数已用完且仍有未展示访客时，才展示上限提示卡。 */
export function shouldShowVisitorLimitPrompt(access: Pick<MembershipAccess, 'visitorLimit' | 'hasUnshownVisitors'>): boolean {
  return access.visitorLimit != null && access.hasUnshownVisitors
}

export function visitorLimitPromptActionLabel(tier: MembershipTier): string {
  return tier === 'regular' ? '立即升级' : '立即开通'
}

/** 立即升级进尊享档；立即开通进标准档。 */
export function visitorLimitPromptTargetTier(tier: MembershipTier): MembershipUiTier {
  return tier === 'regular' ? 'premium' : 'standard'
}

export function membershipPayLabel(tier: MembershipTier, uiTier: MembershipUiTier): string {
  if (uiTier === 'premium') return tier === 'pro' ? '立即续费' : '立即开通'
  return tier === 'regular' ? '立即续费' : '立即开通'
}

export function isStandardMembershipLocked(tier: MembershipTier, uiTier: MembershipUiTier): boolean {
  return tier === 'pro' && uiTier === 'standard'
}

/** 保留最先出现的 N 个独立访客的全部事件；limit 为 null 时不截断。 */
export function keepEventsForVisitorLimit<T extends { customerId?: string | number | null; viewTime?: string | null }>(
  events: readonly T[],
  limit: number | null | undefined,
): T[] {
  if (limit == null) return [...events]
  if (limit <= 0) return []

  const ranked = [...events].sort((left, right) => String(left.viewTime ?? '').localeCompare(String(right.viewTime ?? '')))
  const allowed = new Set<string>()
  for (const event of ranked) {
    const customerId = String(event.customerId ?? '').trim()
    if (!customerId || allowed.has(customerId)) continue
    allowed.add(customerId)
    if (allowed.size >= limit) break
  }

  return events.filter((event) => allowed.has(String(event.customerId ?? '').trim()))
}

/** 排序完成后截取访客列表；limit 为 null 时不截断。 */
export function capAudienceUsers<T>(users: readonly T[], limit: number | null | undefined): T[] {
  if (limit == null) return [...users]
  if (limit <= 0) return []
  return users.slice(0, limit)
}

const MEMBERSHIP_PLAN_ID_SET: readonly MembershipPlanId[] = [
  'month',
  'quarter',
  'half_year',
  'month_pro',
  'quarter_pro',
  'half_year_pro',
]

export function isMembershipPlanId(value: string | null | undefined): value is MembershipPlanId {
  return typeof value === 'string' && (MEMBERSHIP_PLAN_ID_SET as readonly string[]).includes(value)
}

export function formatMembershipExpireDate(value: string | null | undefined): string {
  if (!value) return ''
  const date = value.trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : value.trim()
}

export function mapMembershipPlan(plan: ApiMembershipPlan): MembershipPlanViewModel | null {
  if (!isMembershipPlanId(plan.id) || !plan.title || !plan.priceYuan) return null
  const display = PLAN_DISPLAY[plan.id] ?? { title: plan.title, discountLabel: '' }
  return {
    id: plan.id,
    title: plan.title,
    displayTitle: display.title,
    discountLabel: display.discountLabel,
    durationMonths: plan.durationMonths,
    amountFen: plan.amountFen,
    priceYuan: plan.priceYuan,
    priceLabel: `¥${plan.priceYuan}`,
  }
}

export function pickMembershipPlan(
  plans: MembershipPlanViewModel[],
  planId: MembershipPlanId | '',
  tier: MembershipUiTier = 'standard',
): MembershipPlanViewModel | null {
  const scoped = plansForUiTier(plans, tier)
  const preferredId = planId && uiTierForPlanId(planId) === tier ? planId : DEFAULT_PLAN_ID[tier]
  return scoped.find((plan) => plan.id === preferredId) ?? scoped[0] ?? null
}

export function membershipStatusTitle(tier: MembershipTier, active: boolean): string {
  if (active && tier === 'pro') return '尊享会员'
  if (active && tier === 'regular') return '标准会员'
  return '尚未开通会员'
}

export function profileMembershipTitle(tier: MembershipTier, active: boolean): string {
  if (active && tier === 'pro') return '尊享会员'
  if (active && tier === 'regular') return '标准会员'
  return '解锁言界阿乐会员'
}

export function mapMembershipPage(data: ApiMembershipStatus): MembershipPageViewModel {
  const active = data.active === true
  const expireLabel = formatMembershipExpireDate(data.expireAt)
  const plans = (data.plans ?? []).map(mapMembershipPlan).filter((plan): plan is MembershipPlanViewModel => plan !== null)

  const access = membershipAccessFromStatus(data)
  const usedFromApi = Number(data.usedVisitorCount)
  const usedVisitorCount = Number.isFinite(usedFromApi) && usedFromApi >= 0 ? Math.floor(usedFromApi) : 0
  const cappedUsed = access.visitorLimit == null ? usedVisitorCount : Math.min(usedVisitorCount, access.visitorLimit)

  return {
    active,
    tier: access.tier,
    visitorLimit: access.visitorLimit,
    usedVisitorCount: cappedUsed,
    showVisitorQuota: access.tier !== 'pro',
    expireAt: data.expireAt,
    expireLabel,
    statusTitle: membershipStatusTitle(access.tier, active),
    statusSubtitle: active && expireLabel ? `有效期至 ${expireLabel}` : '开通后即可使用会员能力',
    actionLabel: active ? '续费会员' : '开通会员',
    lastPaidOutTradeNo: data.lastPaidOutTradeNo?.trim() || '',
    plans,
  }
}
