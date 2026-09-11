export const MEMBERSHIP_PAGE_PATH = '/pages/membership/index'
export const MEMBERSHIP_TIER_QUERY = 'tier'
export const HOME_PAGE_ROUTE = 'pages/index/index'
export const HOME_PROFILE_TAB = 'profile'

let pendingHomeProfileTab = false

/** 开通成功后先记下要打开「我的」，再返回首页；首页 onShow 再切 Tab，避免 setData 还没落地。 */
export function markOpenHomeProfileTab(): void {
  pendingHomeProfileTab = true
}

export function takeOpenHomeProfileTab(): boolean {
  const pending = pendingHomeProfileTab
  pendingHomeProfileTab = false
  return pending
}

export function homeProfileTabUrl(): string {
  return `/${HOME_PAGE_ROUTE}?tab=${HOME_PROFILE_TAB}`
}

/** 回到首页「我的」并立刻让首页实例刷新会员卡，不依赖 onShow（Skyline 下底层页可能一直显示）。 */
export function openHomeProfileTab(): void {
  markOpenHomeProfileTab()
  const pages = getCurrentPages()
  const homeIndex = pages.findIndex((page) => (page.route ?? '') === HOME_PAGE_ROUTE)
  if (homeIndex >= 0) {
    const home = pages[homeIndex] as { showProfileTab?: () => void }
    if (typeof home.showProfileTab === 'function') home.showProfileTab()
    const delta = pages.length - 1 - homeIndex
    if (delta > 0) {
      wx.navigateBack({
        delta,
        fail: () => wx.reLaunch({ url: homeProfileTabUrl() }),
      })
      return
    }
    return
  }
  wx.reLaunch({ url: homeProfileTabUrl() })
}

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
  /** 被挡住的独立访客人数 */
  hiddenVisitorCount: number
  hiddenVisitors: Array<{ customerId: string; avatar: string | null }>
}

export interface VisitorLimitPromptAvatarViewModel {
  id: string
  url: string
  shouldBlur: boolean
}

export interface VisitorLimitPromptViewModel {
  visitorCount: number
  avatars: VisitorLimitPromptAvatarViewModel[]
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
