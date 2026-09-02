export const MEMBERSHIP_PAGE_PATH = '/pages/membership/index'

/** iOS 走 Apple 支付，官方最低 1 元 */
export const MEMBERSHIP_IOS_MIN_AMOUNT_FEN = 100

export type MembershipTier = 'standard' | 'premium'

export interface MembershipBenefitViewModel {
  id: string
  label: string
}

export type MembershipPlanId = 'month' | 'quarter' | 'half_year'

export type MembershipOrderStatus = 'pending' | 'paid' | 'closed'

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
  expireAt: string | null
  expireLabel: string
  statusTitle: string
  statusSubtitle: string
  actionLabel: string
  lastPaidOutTradeNo: string
  plans: MembershipPlanViewModel[]
}
