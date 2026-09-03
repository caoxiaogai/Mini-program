import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (relativePath) => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8')

test('membership page is registered and uses the typed service seam', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const page = read('miniprogram/pages/membership/index.wxml')
  const logic = read('miniprogram/pages/membership/index.ts')
  const config = JSON.parse(read('miniprogram/pages/membership/index.json'))
  const styles = read('miniprogram/pages/membership/index.less')
  const navigationStyles = read('miniprogram/components/navigation-bar/navigation-bar.less')
  const service = read('miniprogram/services/membership.ts')
  const types = read('miniprogram/types/membership.ts')
  const api = read('miniprogram/types/api.ts')

  assert.ok(app.pages.includes('pages/membership/index'))
  assert.equal(config.enablePullDownRefresh, true)
  assert.match(logic, /onPullDownRefresh\(\)/)
  assert.match(logic, /runAuthed\(membershipPageUrl\(requestedTier\)/)
  assert.match(logic, /parseMembershipUiTier\(options\[MEMBERSHIP_TIER_QUERY\]\)/)
  assert.match(logic, /requestedTier \|\| \(membership\.tier === 'pro' \? 'premium' : 'standard'\)/)
  assert.match(logic, /getMembershipPageData\(\)/)
  assert.match(logic, /createMembershipOrder\(/)
  assert.match(logic, /wx\.login\(/)
  assert.match(logic, /wx\.requestVirtualPayment\(/)
  assert.match(logic, /signData: pay\.signData/)
  assert.doesNotMatch(logic, /wx\.requestPayment\(/)
  assert.doesNotMatch(logic, /JSON\.stringify\(pay/)
  assert.match(logic, /syncMembershipOrder\(/)
  assert.match(logic, /membership\.lastPaidOutTradeNo/)
  assert.match(page, /class="membership-page(?:\s|")/)
  assert.match(page, /class="membership-tier-tabs"/)
  assert.match(page, /标准会员/)
  assert.match(page, /尊享会员/)
  assert.match(page, /bindtap="onTierTap"/)
  assert.match(page, /membershipTier === 'premium'/)
  assert.match(page, /class="membership-benefits(?:\s|\")/)
  assert.match(page, /wx:for="\{\{visiblePlans\}\}"/)
  assert.match(logic, /plansForUiTier/)
  assert.match(logic, /selectedStandardPlanId/)
  assert.match(logic, /selectedPremiumPlanId/)
  assert.doesNotMatch(logic, /pairedPlanId/)
  assert.match(logic, /visiblePlans/)
  assert.match(page, /\{\{item\.discountLabel\}\}/)
  assert.match(page, /bindtap="onPayTap"/)
  assert.match(page, /bindtap="onAgreementTap"/)
  assert.match(page, /《言界阿乐付费协议》/)
  assert.match(logic, /agreementChecked: false/)
  assert.match(logic, /请先阅读并同意付费协议/)
  assert.match(logic, /frontColor: '#ffffff'/)
  assert.match(logic, /setNavigationBarColor\('#ffffff', '#040404'\)/)
  assert.match(logic, /onUnload\(\)/)
  assert.match(styles, /@membership-page-dark/)
  assert.match(styles, /linear-gradient\(/)
  assert.match(styles, /border-radius: 56rpx 56rpx 0 0/)
  assert.equal(config.disableScroll, true)
  assert.match(page, /class="membership-page__body"/)
  assert.match(styles, /\.membership-page\s*\{[\s\S]*?height: 100vh;[\s\S]*?overflow: hidden;/)
  assert.match(styles, /\.membership-page__body\s*\{[\s\S]*?flex: 1 1 auto;/)
  assert.match(styles, /\.membership-page__hero\s*\{[\s\S]*?flex: 1 1 auto;/)
  assert.match(styles, /\.membership-page__surface\s*\{[\s\S]*?max-height: 58%;/)
  assert.doesNotMatch(styles, /878rpx/)
  assert.match(styles, /\.membership-page__header\s*\{[\s\S]*background: transparent;/)
  assert.match(navigationStyles, /\.weui-navigation-bar__btn_goback\s*\{[\s\S]*background-color: currentColor;/)
  assert.match(types, /export const MEMBERSHIP_PAGE_PATH = '\/pages\/membership\/index'/)
  assert.match(types, /export const MEMBERSHIP_TIER_QUERY = 'tier'/)
  assert.match(types, /export function membershipPageUrl/)
  assert.match(types, /month_pro/)
  assert.match(types, /quarter_pro/)
  assert.match(types, /half_year_pro/)
  assert.match(logic, /isMembershipPlanId/)
  assert.match(logic, /standardActionsDisabled/)
  assert.match(page, /membership-plan--disabled/)
  assert.match(page, /selectedPlanId === item.id && !standardActionsDisabled/)
  assert.match(styles, /\.membership-plan--disabled/)
  assert.match(styles, /\.membership-plan--disabled \{[\s\S]*background: #ffffff;/) 
  assert.match(service, /path: '\/membership\/me'/)
  assert.match(service, /path: '\/membership\/order'/)
  assert.match(service, /data: \{ planId, code \}/)
  assert.match(service, /\/membership\/orders\/\$\{encodeURIComponent\(outTradeNo\)\}\/sync/)
  assert.doesNotMatch(service, /wx\.request\(/)
  assert.doesNotMatch(service, /from '\.\.\/mocks\//)
  assert.match(api, /export interface ApiMembershipStatus/)
  assert.match(api, /tier\?: string \| null/)
  assert.match(types, /export type MembershipTier = 'none' \| 'regular' \| 'pro'/)
  assert.match(api, /export interface ApiMembershipPayParams/)
  assert.match(api, /signData: string/)
  assert.match(api, /paySig: string/)
  assert.match(api, /signature: string/)
})

test('membership plans keep API prices and add the confirmed Figma display labels', async () => {
  const { mapMembershipPage } = await import('../miniprogram/utils/membership.ts')

  const page = mapMembershipPage({
    active: false,
    expireAt: null,
    plans: [
      { id: 'month', title: '一个月', durationMonths: 1, amountFen: 1, priceYuan: '0.01' },
      { id: 'quarter', title: '三个月', durationMonths: 3, amountFen: 2, priceYuan: '0.02' },
      { id: 'half_year', title: '半年', durationMonths: 6, amountFen: 101, priceYuan: '1.01' },
      { id: 'month_pro', title: '一个月', durationMonths: 1, amountFen: 3, priceYuan: '0.03' },
      { id: 'quarter_pro', title: '三个月', durationMonths: 3, amountFen: 4, priceYuan: '0.04' },
      { id: 'half_year_pro', title: '半年', durationMonths: 6, amountFen: 5, priceYuan: '0.05' },
    ],
  })

  assert.equal(page.active, false)
  assert.equal(page.tier, 'none')
  assert.equal(page.statusTitle, '尚未开通会员')
  assert.equal(page.visitorLimit, 8)
  assert.equal(page.showVisitorQuota, true)
  assert.equal(page.statusTitle, '尚未开通会员')
  assert.equal(page.actionLabel, '开通会员')
  assert.deepEqual(
    page.plans.map((plan) => [plan.id, plan.displayTitle, plan.discountLabel, plan.priceLabel, plan.amountFen]),
    [
      ['month', '一个月', '优惠力度 0%', '¥0.01', 1],
      ['quarter', '三个月', '优惠力度 14%', '¥0.02', 2],
      ['half_year', '半年', '优惠力度 20%', '¥1.01', 101],
      ['month_pro', '一个月', '优惠力度 0%', '¥0.03', 3],
      ['quarter_pro', '三个月', '优惠力度 14%', '¥0.04', 4],
      ['half_year_pro', '半年', '优惠力度 20%', '¥0.05', 5],
    ],
  )
})

test('active membership shows expire date and renew copy', async () => {
  const { mapMembershipPage } = await import('../miniprogram/utils/membership.ts')

  const page = mapMembershipPage({
    active: true,
    expireAt: '2026-10-01 12:00:00',
    plans: [{ id: 'month', title: '1个月', durationMonths: 1, amountFen: 1, priceYuan: '0.01' }],
  })

  assert.equal(page.active, true)
  assert.equal(page.expireLabel, '2026-10-01')
  assert.equal(page.statusTitle, '标准会员')
  assert.equal(page.statusSubtitle, '有效期至 2026-10-01')
  assert.equal(page.actionLabel, '续费会员')
  assert.equal(page.tier, 'regular')
  assert.equal(page.visitorLimit, 10)
  assert.equal(page.showVisitorQuota, true)
  assert.equal(page.usedVisitorCount, 0)
})

test('membership page defaults to the Figma-selected three-month plan', async () => {
  const { mapMembershipPage, pickMembershipPlan, plansForUiTier } = await import('../miniprogram/utils/membership.ts')
  const page = mapMembershipPage({
    active: false,
    expireAt: null,
    plans: [
      { id: 'month', title: '1个月', durationMonths: 1, amountFen: 1, priceYuan: '0.01' },
      { id: 'quarter', title: '3个月', durationMonths: 3, amountFen: 2, priceYuan: '0.02' },
      { id: 'half_year', title: '半年', durationMonths: 6, amountFen: 3, priceYuan: '0.03' },
      { id: 'month_pro', title: '一个月会员pro', durationMonths: 1, amountFen: 3, priceYuan: '0.03' },
      { id: 'quarter_pro', title: '季度会员pro', durationMonths: 3, amountFen: 4, priceYuan: '0.04' },
      { id: 'half_year_pro', title: '半年会员pro', durationMonths: 6, amountFen: 5, priceYuan: '0.05' },
    ],
  })

  assert.deepEqual(
    plansForUiTier(page.plans, 'standard').map((plan) => plan.id),
    ['month', 'quarter', 'half_year'],
  )
  assert.deepEqual(
    plansForUiTier(page.plans, 'premium').map((plan) => plan.id),
    ['month_pro', 'quarter_pro', 'half_year_pro'],
  )
  assert.equal(pickMembershipPlan(page.plans, '')?.id, 'quarter')
  assert.equal(pickMembershipPlan(page.plans, 'half_year')?.id, 'half_year')
  assert.equal(pickMembershipPlan(page.plans, '', 'premium')?.id, 'quarter_pro')
  assert.equal(pickMembershipPlan(page.plans, 'month', 'premium')?.id, 'quarter_pro')
  assert.equal(pickMembershipPlan(page.plans, 'month_pro', 'premium')?.id, 'month_pro')
})

test('premium membership switches to its confirmed unlimited tracking benefits', async () => {
  const { getMembershipBenefits, MEMBERSHIP_VISITOR_LIMIT_REGULAR } = await import('../miniprogram/utils/membership.ts')

  assert.deepEqual(
    getMembershipBenefits('standard').map((benefit) => benefit.label),
    ['作品发布', '作品数据分析', '作品互动消息，及时通知', '作品数据总览', '意向用户分类', `追踪人数 ${MEMBERSHIP_VISITOR_LIMIT_REGULAR} 人`],
  )
  assert.deepEqual(
    getMembershipBenefits('premium').map((benefit) => benefit.label),
    ['作品发布', '作品数据分析', '作品互动消息，及时通知', '作品数据总览', '意向用户分类', '追踪人数无限'],
  )
})

test('premium membership uses the confirmed Figma background gradient without changing standard styling', () => {
  const page = read('miniprogram/pages/membership/index.wxml')
  const styles = read('miniprogram/pages/membership/index.less')

  assert.match(page, /class="membership-page\s/)
  assert.match(page, /membership-page--premium/)
  assert.match(styles, /\.membership-page\s*\{[\s\S]*linear-gradient\(165deg, @membership-page-dark 0%, #583700 54%, #2e1d00 100%\)/)
  assert.match(styles, /\.membership-page--premium\s*\{[\s\S]*linear-gradient\(162\.385969deg, (?:@membership-page-dark|#040404) 0%, #774422 46\.816%, #8473b2 96\.018%\)/)
})

test('membership page does not invent payment success or feature gating', () => {
  const logic = read('miniprogram/pages/membership/index.ts')
  const service = read('miniprogram/services/membership.ts')
  const profile = read('miniprogram/services/profile.ts')

  assert.match(logic, /showMembershipResult/)
  assert.match(logic, /开通成功/)
  assert.match(logic, /开通失败/)
  assert.match(logic, /支付已提交，但暂未确认会员是否开通成功/)
  assert.match(logic, /已取消支付，会员未开通/)
  assert.match(logic, /虚拟支付尚未配置/)
  assert.match(logic, /道具未发布到现网/)
  assert.match(logic, /month_pro \/ quarter_pro \/ half_year_pro/)
  assert.match(logic, /发布到现网/)
  assert.match(logic, /道具刚发布还未生效/)
  assert.match(logic, /苹果支付最低 1 元/)
  assert.match(logic, /苹果支付未完成/)
  assert.match(logic, /MEMBERSHIP_IOS_MIN_AMOUNT_FEN/)
  assert.doesNotMatch(logic, /setData\(\{[\s\S]*active:\s*true/)
  assert.doesNotMatch(logic, /wx\.requestPayment/)
  assert.doesNotMatch(service, /wx\.requestPayment/)
  assert.doesNotMatch(service, /wx\.requestVirtualPayment/)
  assert.doesNotMatch(profile, /分析功能已解锁/)
})

test('membership visitor limits follow none / regular / pro', async () => {
  const {
    capAudienceUsers,
    keepEventsForVisitorLimit,
    membershipAccessFromStatus,
    resolveVisitorLimit,
    shouldShowVisitorLimitPrompt,
    visitorLimitPromptActionLabel,
    visitorLimitPromptTargetTier,
    membershipPayLabel,
    isStandardMembershipLocked,
    visitorLimitForTier,
  } = await import('../miniprogram/utils/membership.ts')

  assert.equal(visitorLimitForTier('none'), 8)
  assert.equal(visitorLimitForTier('regular'), 10)
  assert.equal(visitorLimitForTier('pro'), null)
  assert.equal(resolveVisitorLimit(null), null)
  assert.equal(resolveVisitorLimit(undefined), 8)
  assert.equal(resolveVisitorLimit(10), 10)
  assert.deepEqual(membershipAccessFromStatus(null), { tier: 'none', visitorLimit: 8, hasUnshownVisitors: false })
  assert.deepEqual(membershipAccessFromStatus({ active: true, tier: 'pro' }), { tier: 'pro', visitorLimit: null, hasUnshownVisitors: false })
  assert.deepEqual(membershipAccessFromStatus({ active: false, tier: 'pro' }), { tier: 'none', visitorLimit: 8, hasUnshownVisitors: false })
  assert.equal(
    membershipAccessFromStatus({ active: false, tier: 'none', hasUnshownVisitors: true }).hasUnshownVisitors,
    true,
  )
  assert.equal(
    membershipAccessFromStatus({ active: true, tier: 'pro', hasUnshownVisitors: true }).hasUnshownVisitors,
    false,
  )
  assert.equal(shouldShowVisitorLimitPrompt({ visitorLimit: 8, hasUnshownVisitors: true }), true)
  assert.equal(shouldShowVisitorLimitPrompt({ visitorLimit: 8, hasUnshownVisitors: false }), false)
  assert.equal(shouldShowVisitorLimitPrompt({ visitorLimit: null, hasUnshownVisitors: true }), false)
  assert.equal(visitorLimitPromptActionLabel('regular'), '立即升级')
  assert.equal(visitorLimitPromptActionLabel('none'), '立即开通')
  assert.equal(visitorLimitPromptActionLabel('pro'), '立即开通')
  assert.equal(visitorLimitPromptTargetTier('regular'), 'premium')
  assert.equal(visitorLimitPromptTargetTier('none'), 'standard')
  assert.equal(visitorLimitPromptTargetTier('pro'), 'standard')
  assert.equal(membershipPayLabel('regular', 'standard'), '立即续费')
  assert.equal(membershipPayLabel('regular', 'premium'), '立即开通')
  assert.equal(membershipPayLabel('none', 'standard'), '立即开通')
  assert.equal(membershipPayLabel('none', 'premium'), '立即开通')
  assert.equal(membershipPayLabel('pro', 'premium'), '立即续费')
  assert.equal(membershipPayLabel('pro', 'standard'), '立即开通')
  assert.equal(isStandardMembershipLocked('pro', 'standard'), true)
  assert.equal(isStandardMembershipLocked('pro', 'premium'), false)
  assert.equal(isStandardMembershipLocked('regular', 'standard'), false)

  const { mapMembershipPage, profileMembershipTitle } = await import('../miniprogram/utils/membership.ts')
  const proPage = mapMembershipPage({
    active: true,
    tier: 'pro',
    expireAt: '2026-02-03 12:00:00',
    usedVisitorCount: 12,
    plans: [],
  })
  assert.equal(proPage.statusTitle, '尊享会员')
  assert.equal(proPage.showVisitorQuota, false)
  assert.equal(profileMembershipTitle('regular', true), '标准会员')
  assert.equal(profileMembershipTitle('pro', true), '尊享会员')
  assert.equal(profileMembershipTitle('none', false), '解锁言界阿乐会员')

  const quotaPage = mapMembershipPage({
    active: false,
    expireAt: null,
    usedVisitorCount: 5,
    plans: [],
  })
  assert.equal(quotaPage.usedVisitorCount, 5)
  assert.equal(quotaPage.visitorLimit, 8)

  const events = Array.from({ length: 12 }, (_, index) => ({
    id: `event-${index}`,
    customerId: `visitor-${index}`,
    viewTime: `2026-09-02 10:${String(index).padStart(2, '0')}:00`,
  }))
  events.push({ id: 'event-11-old', customerId: 'visitor-11', viewTime: '2026-09-02 09:00:00' })

  const noneEvents = keepEventsForVisitorLimit(events, 8)
  assert.equal(new Set(noneEvents.map((event) => event.customerId)).size, 8)
  assert.ok(noneEvents.some((event) => event.id === 'event-11-old'))
  assert.ok(noneEvents.some((event) => event.customerId === 'visitor-0'))
  assert.equal(noneEvents.some((event) => event.customerId === 'visitor-7'), false)
  assert.equal(noneEvents.some((event) => event.customerId === 'visitor-10'), false)
  assert.equal(keepEventsForVisitorLimit(events, null).length, events.length)
  assert.deepEqual(capAudienceUsers(['a', 'b', 'c'], 2), ['a', 'b'])
  assert.deepEqual(capAudienceUsers(['a', 'b', 'c'], null), ['a', 'b', 'c'])
})

test('membership access service fails closed to the free visitor limit', () => {
  const service = read('miniprogram/services/membership.ts')
  const home = read('miniprogram/services/home.ts')
  const notifications = read('miniprogram/services/notifications.ts')
  const analysis = read('miniprogram/services/analysis.ts')

  assert.match(service, /export function getMembershipAccessSilent/)
  assert.match(service, /FALLBACK_MEMBERSHIP_ACCESS/)
  assert.match(service, /hasUnshownVisitors: false/)
  assert.match(service, /MEMBERSHIP_VISITOR_LIMIT_NONE/)
  assert.match(home, /keepEventsForVisitorLimit/)
  assert.match(home, /getMembershipAccessSilent/)
  assert.match(notifications, /keepEventsForVisitorLimit/)
  assert.match(notifications, /showVisitorLimitPrompt: shouldShowVisitorLimitPrompt/)
  assert.match(notifications, /getMembershipAccessSilent/)
  assert.match(analysis, /getMembershipAccessSilent/)
  assert.match(analysis, /visitorLimit: membershipAccess\.visitorLimit/)
})
