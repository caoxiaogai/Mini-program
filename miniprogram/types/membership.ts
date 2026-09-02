export const MEMBERSHIP_PAGE_PATH = '/pages/membership/index'
export const MEMBERSHIP_TIER_QUERY = 'tier'

/** iOS 走 Apple 支付，官方最低 1 元 */
export const MEMBERSHIP_IOS_MIN_AMOUNT_FEN = 100

export type MembershipUiTier = 'standard' | 'premium'

export function parseMembershipUiTier(value: string | null | undefined): MembershipUiTier | '' {
  return value === 'standard' || value === 'premium' ? value : ''
}

export function membershipPageUrl(tier?: MembershipUiTier | '' | null): string {
  const parsed = parseMembershipUiTier(tier)
  return parsed ? `${MEMBERSHIP_PAGE_PATH}?${MEMBERSHIP_TIER_QUERY}=${parsed}` : MEMBERSHIP_PAGE_PATH
}

export interface MembershipBenefitViewModel {
  id: string
  label: string
}

export const MEMBERSHIP_PLAN_IDS = [
  'month',
  'quarter',
  'half_year',
  'month_pro',
  'quarter_pro',
  'half_year_pro',
] as const

export type MembershipPlanId = (typeof MEMBERSHIP_PLAN_IDS)[number]

export type MembershipOrderStatus = 'pending' | 'paid' | 'closed'

/** none：非会员；regular：普通会员；pro：Pro 会员 */
export type MembershipTier = 'none' | 'regular' | 'pro'

export type MembershipAccess = {
  tier: MembershipTier
  /** 可展示的独立访客上限；null 表示不限制 */
  visitorLimit: number | null
  /** 有被档位截掉、尚未展示的独立访客 */
  hasUnshownVisitors: boolean
}

export interface MembershipPlanViewModel {
  id: MembershipPlanId
  title: string
  displayTitle: string
  discountLabel: string
  durationMonths: number
  amountFen: number
  priceYuan: string
  priceLabel: string
}

export interface MembershipPageViewModel {
  active: boolean
  tier: MembershipTier
  visitorLimit: number | null
  usedVisitorCount: number
  showVisitorQuota: boolean
  expireAt: string | null
  expireLabel: string
  statusTitle: string
  statusSubtitle: string
  actionLabel: string
  lastPaidOutTradeNo: string
  plans: MembershipPlanViewModel[]
}
