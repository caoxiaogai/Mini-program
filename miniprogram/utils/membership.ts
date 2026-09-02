import type { ApiMembershipPlan, ApiMembershipStatus } from '../types/api'
import type {
  MembershipBenefitViewModel,
  MembershipPageViewModel,
  MembershipPlanId,
  MembershipPlanViewModel,
  MembershipTier,
} from '../types/membership'

const MEMBERSHIP_BENEFITS: Record<MembershipTier, MembershipBenefitViewModel[]> = {
  standard: [
    { id: 'publish', label: '作品发布' },
    { id: 'analysis', label: '作品数据分析' },
    { id: 'notification', label: '作品互动消息，及时通知' },
    { id: 'overview', label: '作品数据总览' },
    { id: 'intent', label: '意向用户分类' },
    { id: 'tracking', label: '追踪人数 80 人' },
  ],
  premium: [
    { id: 'publish', label: '作品发布' },
    { id: 'analysis', label: '作品数据分析' },
    { id: 'notification', label: '作品互动消息，及时通知' },
    { id: 'overview', label: '作品数据总览' },
    { id: 'intent', label: '意向用户分类' },
    { id: 'tracking', label: '追踪人数无限' },
  ],
}

const PLAN_DISPLAY: Record<MembershipPlanId, { title: string; discountLabel: string }> = {
  month: { title: '一个月', discountLabel: '优惠力度 0%' },
  quarter: { title: '三个月', discountLabel: '优惠力度 14%' },
  half_year: { title: '半年', discountLabel: '优惠力度 20%' },
}

export function getMembershipBenefits(tier: MembershipTier): MembershipBenefitViewModel[] {
  return MEMBERSHIP_BENEFITS[tier].map((benefit) => ({ ...benefit }))
}

function isPlanId(value: string | null | undefined): value is MembershipPlanId {
  return value === 'month' || value === 'quarter' || value === 'half_year'
}

export function formatMembershipExpireDate(value: string | null | undefined): string {
  if (!value) return ''
  const date = value.trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : value.trim()
}

export function mapMembershipPlan(plan: ApiMembershipPlan): MembershipPlanViewModel | null {
  if (!isPlanId(plan.id) || !plan.title || !plan.priceYuan) return null
  const display = PLAN_DISPLAY[plan.id]
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
): MembershipPlanViewModel | null {
  if (planId) return plans.find((plan) => plan.id === planId) ?? plans[0] ?? null
  return plans.find((plan) => plan.id === 'quarter') ?? plans[0] ?? null
}

export function mapMembershipPage(data: ApiMembershipStatus): MembershipPageViewModel {
  const active = data.active === true
  const expireLabel = formatMembershipExpireDate(data.expireAt)
  const plans = (data.plans ?? []).map(mapMembershipPlan).filter((plan): plan is MembershipPlanViewModel => plan !== null)

  return {
    active,
    expireAt: data.expireAt,
    expireLabel,
    statusTitle: active ? '言界阿乐会员' : '尚未开通会员',
    statusSubtitle: active && expireLabel ? `有效期至 ${expireLabel}` : '开通后即可使用会员能力',
    actionLabel: active ? '续费会员' : '开通会员',
    lastPaidOutTradeNo: data.lastPaidOutTradeNo?.trim() || '',
    plans,
  }
}
