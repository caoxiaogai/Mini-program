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
  assert.match(logic, /runAuthed\(MEMBERSHIP_PAGE_PATH/)
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
  assert.match(page, /class="membership-plan/)
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
  assert.match(styles, /\.membership-page__header\s*\{[\s\S]*position: sticky;[\s\S]*top: 0;/)
  assert.doesNotMatch(styles, /\.membership-page\s*\{[\s\S]*?overflow: hidden;/)
  assert.match(styles, /\.membership-page__header\s*\{[\s\S]*background: transparent;/)
  assert.match(navigationStyles, /\.weui-navigation-bar__btn_goback\s*\{[\s\S]*background-color: currentColor;/)
  assert.match(types, /export const MEMBERSHIP_PAGE_PATH = '\/pages\/membership\/index'/)
  assert.match(service, /path: '\/membership\/me'/)
  assert.match(service, /path: '\/membership\/order'/)
  assert.match(service, /data: \{ planId, code \}/)
  assert.match(service, /\/membership\/orders\/\$\{encodeURIComponent\(outTradeNo\)\}\/sync/)
  assert.doesNotMatch(service, /wx\.request\(/)
  assert.doesNotMatch(service, /from '\.\.\/mocks\//)
  assert.match(api, /export interface ApiMembershipStatus/)
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
      { id: 'month', title: '1个月', durationMonths: 1, amountFen: 1, priceYuan: '0.01' },
      { id: 'quarter', title: '3个月', durationMonths: 3, amountFen: 2, priceYuan: '0.02' },
      { id: 'half_year', title: '半年', durationMonths: 6, amountFen: 3, priceYuan: '0.03' },
    ],
  })

  assert.equal(page.active, false)
  assert.equal(page.statusTitle, '尚未开通会员')
  assert.equal(page.actionLabel, '开通会员')
  assert.deepEqual(
    page.plans.map((plan) => [plan.id, plan.displayTitle, plan.discountLabel, plan.priceLabel, plan.amountFen]),
    [
      ['month', '一个月', '优惠力度 0%', '¥0.01', 1],
      ['quarter', '三个月', '优惠力度 14%', '¥0.02', 2],
      ['half_year', '半年', '优惠力度 20%', '¥0.03', 3],
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
  assert.equal(page.statusTitle, '言界阿乐会员')
  assert.equal(page.statusSubtitle, '有效期至 2026-10-01')
  assert.equal(page.actionLabel, '续费会员')
})

test('membership page defaults to the Figma-selected three-month plan', async () => {
  const { mapMembershipPage, pickMembershipPlan } = await import('../miniprogram/utils/membership.ts')
  const page = mapMembershipPage({
    active: false,
    expireAt: null,
    plans: [
      { id: 'month', title: '1个月', durationMonths: 1, amountFen: 1, priceYuan: '0.01' },
      { id: 'quarter', title: '3个月', durationMonths: 3, amountFen: 2, priceYuan: '0.02' },
      { id: 'half_year', title: '半年', durationMonths: 6, amountFen: 3, priceYuan: '0.03' },
    ],
  })

  assert.equal(pickMembershipPlan(page.plans, '')?.id, 'quarter')
  assert.equal(pickMembershipPlan(page.plans, 'half_year')?.id, 'half_year')
})

test('premium membership switches to its confirmed unlimited tracking benefits', async () => {
  const { getMembershipBenefits } = await import('../miniprogram/utils/membership.ts')

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

  assert.match(logic, /开通成功/)
  assert.match(logic, /支付已提交，请稍后刷新查看开通状态/)
  assert.match(logic, /已取消支付/)
  assert.match(logic, /虚拟支付尚未配置/)
  assert.match(logic, /道具未发布到现网/)
  assert.match(logic, /month \/ quarter \/ half_year/)
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
