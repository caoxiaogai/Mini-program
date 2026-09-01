import type { ApiMembershipPlan, ApiMembershipStatus } from '../types/api'
import type { MembershipPageViewModel, MembershipPlanId, MembershipPlanViewModel } from '../types/membership'

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
  return {
    id: plan.id,
    title: plan.title,
    durationMonths: plan.durationMonths,
    amountFen: plan.amountFen,
    priceYuan: plan.priceYuan,
    priceLabel: `¥${plan.priceYuan}`,
  }
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
