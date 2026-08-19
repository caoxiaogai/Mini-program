import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const getFileBytes = (directoryUrl) => readdirSync(directoryUrl, { withFileTypes: true }).reduce((total, entry) => {
  const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directoryUrl)
  return total + (entry.isDirectory() ? getFileBytes(entryUrl) : statSync(entryUrl).size)
}, 0)

test('home data layer exposes one typed service seam', () => {
  const types = read('miniprogram/types/home.ts')
  const mock = read('miniprogram/mocks/home.ts')
  const service = read('miniprogram/services/home.ts')

  assert.match(types, /export interface HomeOverviewViewModel/)
  assert.match(mock, /export const homeOverviewMock/)
  assert.match(service, /export function getHomeOverview\(\): Promise<HomeOverviewViewModel>/)
  assert.match(service, /TODO\(API\): 接入首页摘要真实接口/)
})

test('bottom navigation renders tab labels and optional unread badges', () => {
  const component = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.wxml')
  const logic = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.ts')

  assert.match(component, /wx:for="{{items}}"/)
  assert.match(component, /wx:if="{{item.badgeCount}}"/)
  assert.match(logic, /triggerEvent\('tabtap'/)
})

test('bottom navigation uses the supplied vector card icons', () => {
  const component = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.wxml')
  const iconPaths = [
    'miniprogram/assets/home/tab-notification.svg',
    'miniprogram/assets/home/tab-analysis.svg',
    'miniprogram/assets/home/tab-material.svg',
    'miniprogram/assets/home/tab-ranking.svg',
  ]

  assert.match(component, /src="{{item.iconPath}}"/)

  for (const iconPath of iconPaths) {
    assert.equal(existsSync(new URL(`../${iconPath}`, import.meta.url)), true)
    assert.match(read(iconPath), /viewBox="0 0 45 45"/)
  }
})

test('home page declares the Figma primary regions', () => {
  const page = read('miniprogram/pages/index/index.wxml')

  assert.match(page, /class="home-page"/)
  assert.match(page, /class="home-assistant"/)
  assert.match(page, /class="home-summary"/)
  assert.match(page, /bottom-tab-bar/)
  assert.match(page, /阿宝AI/)
})

test('summary cards match the Figma typography and provide a 2 percent press state', () => {
  const markup = read('miniprogram/pages/index/index.wxml')
  const styles = read('miniprogram/pages/index/index.less')

  assert.match(markup, /hover-class="home-summary__card--pressed"/)
  assert.match(styles, /font-size: 32rpx;[\s\S]*?line-height: 44rpx;/)
  assert.match(styles, /font-size: 28rpx;[\s\S]*?line-height: 44rpx;/)
  assert.match(styles, /width: 56rpx;[\s\S]*?height: 56rpx;/)
  assert.match(styles, /transform: scale\(1\.02\)/)
})

test('home content shares a 20px horizontal alignment inset', () => {
  const styles = read('miniprogram/pages/index/index.less')
  assert.match(styles, /padding: 514rpx 40rpx 36rpx;/)
})

test('project enables compile hot reload for live UI updates', () => {
  const project = JSON.parse(read('project.config.json'))
  assert.equal(project.setting.compileHotReLoad, true)
})

test('notification button aligns to the home content baseline', () => {
  const styles = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.less')
  assert.match(styles, /padding: 0 40rpx env\(safe-area-inset-bottom\)/)
  assert.match(styles, /\.bottom-tab-bar__inner[\s\S]*?justify-content: space-between;/)
  assert.match(styles, /\.bottom-tab-bar__item[\s\S]*?flex: none;/)
})

test('notification data layer exposes one typed service seam', () => {
  const types = read('miniprogram/types/notifications.ts')
  const mock = read('miniprogram/mocks/notifications.ts')
  const service = read('miniprogram/services/notifications.ts')

  assert.match(types, /export interface NotificationsViewModel/)
  assert.match(mock, /export const notificationsMock/)
  assert.match(service, /export function getNotifications\(\): Promise<NotificationsViewModel>/)
  assert.match(service, /TODO\(API\): 接入通知列表真实接口/)
})

test('notification page matches the Figma screen structure', () => {
  const markup = read('miniprogram/pages/notifications/notifications.wxml')
  const styles = read('miniprogram/pages/notifications/notifications.less')
  const mock = read('miniprogram/mocks/notifications.ts')

  assert.match(markup, /<navigation-bar back="\{\{true\}\}"/)
  assert.match(markup, /通知/)
  assert.match(markup, /notification-filter/)
  assert.match(markup, /notification-group/)
  assert.match(markup, /notification-card/)
  assert.match(mock, /notifications\/avatar-/)
  assert.match(mock, /notifications\/thumb-/)
  assert.match(markup, /hover-class="notification-card--pressed"/)
  assert.doesNotMatch(markup, /nav-action\.svg/)
  assert.match(styles, /background: linear-gradient\(/)
  assert.match(styles, /height: 300rpx;/)
  assert.match(styles, /padding: 24rpx;/)
  assert.match(styles, /gap: 32rpx;/)
  assert.match(styles, /top: 30rpx;/)
  assert.match(styles, /left: 22rpx;/)
  assert.match(styles, /\.notification-card__thumbnails[\s\S]*?width: 100rpx;[\s\S]*?height: 136rpx;/)
  assert.match(styles, /border-radius: 24rpx/)
})

test('home notification tab navigates to the second page', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const homeLogic = read('miniprogram/pages/index/index.ts')

  assert.ok(app.pages.includes('pages/notifications/notifications'))
  assert.match(homeMarkup, /bind:tabtap="onTabTap"/)
  assert.match(homeLogic, /navigateTo\([\s\S]*?\/pages\/notifications\/notifications/)
})

test('analysis page exposes typed mock data and the Figma card structure', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const markup = read('miniprogram/pages/analysis/index.wxml')
  const service = read('miniprogram/services/analysis.ts')

  assert.ok(app.pages.includes('pages/analysis/index'))
  assert.match(service, /getAnalysisOverview\(\): Promise<AnalysisViewModel>/)
  assert.match(service, /TODO\(API\): 接入分析页真实接口/)
  assert.match(markup, /analysis-tabs/)
  assert.match(markup, /analysis-summary__card/)
  assert.match(markup, /analysis-card__thumbnail/)
  assert.match(markup, /hover-class="analysis-card--pressed"/)
})

test('analysis content cards match the Figma card and supplied open icon', () => {
  const markup = read('miniprogram/pages/analysis/index.wxml')
  const styles = read('miniprogram/pages/analysis/index.less')

  assert.match(markup, /src="\/assets\/analysis\/frame-2137\.svg"/)
  assert.equal(existsSync(new URL('../miniprogram/assets/analysis/frame-2137.svg', import.meta.url)), true)
  assert.match(styles, /\.analysis-card\s*\{[\s\S]*?min-height: 324rpx;[\s\S]*?padding: 30rpx;[\s\S]*?border-radius: 32rpx;/)
  assert.match(styles, /\.analysis-card__head[\s\S]*?justify-content: space-between;/)
  assert.match(styles, /\.analysis-card__thumbnail[\s\S]*?width: 120rpx;[\s\S]*?height: 160rpx;[\s\S]*?border-radius: 16rpx;/)
  assert.match(styles, /\.analysis-card__identity[\s\S]*?gap: 32rpx;[\s\S]*?margin-left: 20rpx;/)
  assert.match(styles, /\.analysis-card__title[\s\S]*?min-height: 92rpx;[\s\S]*?font-weight: 500;/)
  assert.match(styles, /\.analysis-card__date[\s\S]*?color: #999;[\s\S]*?font-size: 28rpx;[\s\S]*?line-height: normal;/)
  assert.match(styles, /\.analysis-card__open[\s\S]*?width: 56rpx;[\s\S]*?height: 56rpx;/)
  assert.match(styles, /\.analysis-card__metrics[\s\S]*?margin-top: 32rpx;/)
  assert.match(styles, /\.analysis-card__metric-label[\s\S]*?color: #8a8e94;[\s\S]*?font-size: 24rpx;/)
  assert.match(styles, /\.analysis-card__metric-value[\s\S]*?font-size: 28rpx;/)
})

test('analysis cards navigate to the Figma detail page', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const markup = read('miniprogram/pages/analysis/index.wxml')
  const logic = read('miniprogram/pages/analysis/index.ts')

  assert.ok(app.pages.includes('pages/analysis-detail/index'))
  assert.match(markup, /bindtap="onCardTap"/)
  assert.match(markup, /data-id="\{\{item\.id\}\}"/)
  assert.match(logic, /onCardTap\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(logic, /pages\/analysis-detail\/index\?id=/)
})

test('analysis detail page uses the supplied dark top texture and Figma sections', () => {
  const markup = read('miniprogram/pages/analysis-detail/index.wxml')
  const styles = read('miniprogram/pages/analysis-detail/index.less')
  const logic = read('miniprogram/pages/analysis-detail/index.ts')

  assert.match(markup, /navigation-bar[^>]*title="内容分析"/)
  assert.match(markup, /\/assets\/analysis\/group-40\.svg/)
  assert.match(markup, /detail-card__thumbnail/)
  assert.match(markup, /detail-intent__title/) 
  assert.match(markup, /detail-intent__tabs/)
  assert.match(markup, /detail-user/)
  assert.equal(existsSync(new URL('../miniprogram/assets/analysis/group-40.svg', import.meta.url)), true)
  assert.match(logic, /getAnalysisDetail/)
  assert.match(styles, /\.detail-page\s*\{[\s\S]*?background: #eef3fb;/)
  assert.match(styles, /\.detail-card\s*\{[\s\S]*?height: 338rpx;[\s\S]*?padding: 30rpx;[\s\S]*?border-radius: 32rpx;/)
  assert.match(styles, /\.detail-card__thumbnail[\s\S]*?width: 120rpx;[\s\S]*?height: 160rpx;/)
  assert.match(styles, /\.detail-intent__panel[\s\S]*?height: 944rpx;[\s\S]*?padding: 30rpx 30rpx 56rpx;/)
  assert.match(styles, /\.detail-intent__tabs[\s\S]*?height: 64rpx;[\s\S]*?background: #d3d8e0;/)
  assert.match(styles, /\.detail-user__avatar[\s\S]*?width: 88rpx;[\s\S]*?height: 88rpx;/)
})

test('analysis detail intent users support all-tab filtering and horizontal switching', () => {
  const markup = read('miniprogram/pages/analysis-detail/index.wxml')
  const logic = read('miniprogram/pages/analysis-detail/index.ts')
  const styles = read('miniprogram/pages/analysis-detail/index.less')

  assert.match(markup, /wx:for="\{\{intentTabs\}\}"/)
  assert.match(markup, /{{item\.label}}/)
  assert.match(markup, /bindtap="onIntentTabTap"/)
  assert.match(markup, /bindtouchstart="onIntentTouchStart"/)
  assert.match(markup, /bindtouchend="onIntentTouchEnd"/)
  assert.match(markup, /wx:for="\{\{visibleIntentUsers\}\}"/)
  assert.match(logic, /activeIntentLevel/)
  assert.match(logic, /visibleIntentUsers/)
  assert.match(logic, /onIntentTouchStart\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(logic, /onIntentTouchEnd\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(styles, /\.detail-intent__selection\s*\{[\s\S]*?transition: transform 180ms ease-out;/)
})

test('analysis user rows navigate to the Figma user detail page', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const analysisMarkup = read('miniprogram/pages/analysis/index.wxml')
  const detailMarkup = read('miniprogram/pages/analysis-detail/index.wxml')
  const analysisLogic = read('miniprogram/pages/analysis/index.ts')
  const detailLogic = read('miniprogram/pages/analysis-detail/index.ts')
  const service = read('miniprogram/services/analysis.ts')

  assert.ok(app.pages.includes('pages/analysis-user-detail/index'))
  assert.match(analysisMarkup, /bindtap="onAnalysisUserTap"/)
  assert.match(detailMarkup, /bindtap="onDetailUserTap"/)
  assert.match(analysisLogic, /onAnalysisUserTap\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(detailLogic, /onDetailUserTap\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(service, /getAnalysisUserDetail\(userId: string\)/)
})

test('analysis user detail matches the Figma profile and reading records', () => {
  const markup = read('miniprogram/pages/analysis-user-detail/index.wxml')
  const styles = read('miniprogram/pages/analysis-user-detail/index.less')
  const logic = read('miniprogram/pages/analysis-user-detail/index.ts')
  const types = read('miniprogram/types/analysis.ts')
  const mock = read('miniprogram/mocks/analysis.ts')

  assert.match(markup, /navigation-bar[^>]*title="分析"/)
  assert.match(markup, /user-detail__profile-card/)
  assert.match(markup, /复制用户名/)
  assert.match(markup, /阅读记录/)
  assert.match(markup, /user-detail__record-tabs/)
  assert.match(markup, /visibleUserRecords/)
  assert.match(markup, /进度/)
  assert.match(markup, /观看时长/)
  assert.match(logic, /getAnalysisUserDetail/)
  assert.match(types, /export type AnalysisUserDetailViewModel/)
  assert.match(mock, /analysisUserDetailMock/)
  assert.equal(existsSync(new URL('../miniprogram/assets/analysis/user-detail-avatar.jpg', import.meta.url)), true)
  assert.equal(existsSync(new URL('../miniprogram/assets/analysis/user-detail-record-01.jpg', import.meta.url)), true)
  assert.match(styles, /\.user-detail-page\s*\{[\s\S]*?background: #e8edf5;/)
  assert.match(styles, /\.user-detail__profile-card, \.user-detail__records-card[\s\S]*?border-radius: 32rpx;/)
  assert.match(styles, /\.user-detail__profile-card\s*\{[\s\S]*?min-height: 268rpx;/)
  assert.match(styles, /\.user-detail__records-card\s*\{[\s\S]*?margin-top: 30rpx;/)
  assert.match(styles, /\.user-detail__record\s*\{[\s\S]*?height: 188rpx;[\s\S]*?border-radius: 16rpx;/)
})

test('analysis user detail copies the username and shows a centered one-second success notice', () => {
  const markup = read('miniprogram/pages/analysis-user-detail/index.wxml')
  const styles = read('miniprogram/pages/analysis-user-detail/index.less')
  const logic = read('miniprogram/pages/analysis-user-detail/index.ts')

  assert.match(markup, /class="user-detail__copy"[^>]*bindtap="onCopyUsername"/)
  assert.match(markup, /wx:if="\{\{copyNoticeVisible\}\}"/)
  assert.match(markup, /user-detail__copy-feedback[^>]*>复制成功/)
  assert.match(logic, /onCopyUsername\(\)/)
  assert.match(logic, /wx\.setClipboardData\(/)
  assert.match(logic, /wx\.hideToast\(\)/)
  assert.match(logic, /copyNoticeVisible: false/)
  assert.match(logic, /setTimeout\([\s\S]*?1000\)/)
  assert.match(logic, /onUnload\(\)/)
  assert.match(styles, /\.user-detail__copy-feedback\s*\{[\s\S]*?position: fixed;/)
  assert.match(styles, /\.user-detail__copy-feedback\s*\{[\s\S]*?left: 50%;/)
  assert.match(styles, /\.user-detail__copy-feedback\s*\{[\s\S]*?top: 50%;/)
  assert.match(styles, /\.user-detail__copy-feedback\s*\{[\s\S]*?transform: translate\(-50%, -50%\);/)
  assert.match(styles, /\.user-detail__copy-feedback\s*\{[\s\S]*?background: #000000;/)
  assert.match(styles, /border-radius: 100rpx;/)
})

test('analysis user detail record tabs can switch their selected state', () => {
  const markup = read('miniprogram/pages/analysis-user-detail/index.wxml')
  const styles = read('miniprogram/pages/analysis-user-detail/index.less')
  const logic = read('miniprogram/pages/analysis-user-detail/index.ts')

  assert.match(markup, /bindtap="onRecordTabTap"/)
  assert.match(markup, /data-id="\{\{item\.id\}\}"/)
  assert.match(markup, /user-detail__record-selection--\{\{activeRecordTab\}\}/)
  assert.match(logic, /onRecordTabTap\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(logic, /activeRecordTab: tabId/)
  assert.match(logic, /visibleUserRecords:/)
  assert.match(styles, /\.user-detail__record-selection\s*\{[\s\S]*?transition: transform 180ms ease-out;/)
  assert.match(styles, /\.user-detail__record-selection--read\s*\{[\s\S]*?transform: translateX\(100%\);/)
  assert.match(styles, /\.user-detail__record-selection--share\s*\{[\s\S]*?transform: translateX\(200%\);/)
})

test('analysis summary cards match Figma spacing, sizing, and typography', () => {
  const styles = read('miniprogram/pages/analysis/index.less')
  assert.match(styles, /background: #e8edf5;/)
  assert.match(styles, /\.analysis-summary\s*\{[\s\S]*?gap: 20rpx;/)
  assert.match(styles, /\.analysis-summary__card[\s\S]*?flex: 1;/)
  assert.match(styles, /\.analysis-summary__card[\s\S]*?min-width: 0;/)
  assert.match(styles, /\.analysis-summary__card[\s\S]*?height: 132rpx;/)
  assert.match(styles, /\.analysis-summary__card[\s\S]*?padding: 20rpx;/)
  assert.match(styles, /\.analysis-summary__label[\s\S]*?color: #666;[\s\S]*?font-size: 26rpx;/)
  assert.match(styles, /\.analysis-summary__value[\s\S]*?font-size: 40rpx;[\s\S]*?font-weight: 500;/)
})

test('analysis page keeps its top navigation area white', () => {
  const markup = read('miniprogram/pages/analysis/index.wxml')
  const styles = read('miniprogram/pages/analysis/index.less')

  assert.match(markup, /<navigation-bar[^>]*background="#ffffff"/)
  assert.match(styles, /\.analysis-tabs\s*\{[\s\S]*?padding: 0 40rpx;[\s\S]*?background: #ffffff;/)
  assert.match(markup, /class="analysis-page__header"/)
  assert.match(styles, /\.analysis-page__header\s*\{[\s\S]*?position: sticky;[\s\S]*?top: 0;/)
})

test('analysis filters keep only day, week, month, and total periods', () => {
  const markup = read('miniprogram/pages/analysis/index.wxml')
  const styles = read('miniprogram/pages/analysis/index.less')
  const logic = read('miniprogram/pages/analysis/index.ts')

  assert.match(markup, /wx:for="\{\{analysisPeriods\}\}"/)
  assert.match(markup, /bindtap="onPeriodTap"/)
  assert.match(markup, /data-id="\{\{item\.id\}\}"/)
  assert.match(markup, /analysis-periods__selection/)
  assert.doesNotMatch(logic, /frame-23\.svg/)
  assert.match(markup, /\/assets\/analysis\/polygon-2\.svg/)
  assert.equal(existsSync(new URL('../miniprogram/assets/analysis/polygon-2.svg', import.meta.url)), true)
  assert.equal(existsSync(new URL('../miniprogram/assets/analysis/frame-23.svg', import.meta.url)), false)
  assert.match(logic, /analysisPeriods/)
  assert.doesNotMatch(logic, /custom/)
  assert.match(logic, /activePeriod/)
  assert.match(logic, /onPeriodTap\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(styles, /\.analysis-periods[\s\S]*?height: 64rpx;[\s\S]*?border-radius: 12rpx;[\s\S]*?background: #d3d8e0;/)
  assert.match(styles, /\.analysis-period\s*\{[\s\S]*?width: 68rpx;[\s\S]*?height: 56rpx;[\s\S]*?font-size: 26rpx;/)
  assert.match(styles, /\.analysis-periods__selection\s*\{[\s\S]*?position: absolute;[\s\S]*?transition: transform 180ms ease-out;/)
  assert.match(styles, /\.analysis-sort__inner\s*\{[\s\S]*?height: 56rpx;[\s\S]*?padding: 0 20rpx;[\s\S]*?background: #ffffff;/)
  assert.match(styles, /\.analysis-sort__arrow\s*\{[\s\S]*?width: 14rpx;[\s\S]*?height: 8rpx;/)
})

test('analysis top tabs switch between work, user, and total analysis', () => {
  const markup = read('miniprogram/pages/analysis/index.wxml')
  const logic = read('miniprogram/pages/analysis/index.ts')
  const styles = read('miniprogram/pages/analysis/index.less')

  assert.match(markup, /wx:for="\{\{analysisTabs\}\}"/)
  assert.match(markup, /bindtap="onAnalysisTabTap"/)
  assert.match(markup, /bindtouchstart="onAnalysisTouchStart"/)
  assert.match(markup, /bindtouchend="onAnalysisTouchEnd"/)
  assert.match(markup, /analysis-tabs__selection/)
  assert.match(markup, /analysis-user-panel/)
  assert.match(logic, /activeAnalysisTab/)
  assert.match(logic, /onAnalysisTabTap\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(logic, /onAnalysisTouchStart\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(logic, /onAnalysisTouchEnd\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(styles, /\.analysis-tabs__selection\s*\{[\s\S]*?transition: transform 180ms ease-out;/)
})

test('total analysis matches the Figma overview cards and reading chart', () => {
  const markup = read('miniprogram/pages/analysis/index.wxml')
  const logic = read('miniprogram/pages/analysis/index.ts')
  const styles = read('miniprogram/pages/analysis/index.less')
  const types = read('miniprogram/types/analysis.ts')
  const mock = read('miniprogram/mocks/analysis.ts')

  assert.match(markup, /activeAnalysisTab === 'total'/)
  assert.match(markup, /analysis-total-panel/)
  assert.match(markup, /作品数据总览/)
  assert.match(markup, /analysis-total__overview-card/)
  assert.match(markup, /阅读数据/)
  assert.match(markup, /analysis-total__chart-bar/)
  assert.match(markup, /analysisData\.totalData/)
  assert.match(markup, /visibleAnalysisReadTrend/)
  assert.match(markup, /bindtap="onAnalysisRangeTap"/)
  assert.match(logic, /activeAnalysisTab: 'work'/)
  assert.match(logic, /activeAnalysisReadRange/)
  assert.match(logic, /onAnalysisRangeTap\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(types, /export type AnalysisChartPoint/)
  assert.match(mock, /analysisTotalDataMock/)
  assert.equal((mock.match(/id: 'month-/g) ?? []).length, 30)
  assert.match(styles, /\.analysis-total-panel\s*\{[\s\S]*?gap: 30rpx;/)
  assert.match(styles, /\.analysis-total__overview-grid\s*\{[\s\S]*?display: grid;[\s\S]*?grid-template-columns: repeat\(3, 1fr\);/)
  assert.match(styles, /\.analysis-total__chart-bar\s*\{[\s\S]*?width: 40rpx;[\s\S]*?background: linear-gradient\(/)
})

test('user analysis matches Figma summary, filters, and user list assets', () => {
  const markup = read('miniprogram/pages/analysis/index.wxml')
  const styles = read('miniprogram/pages/analysis/index.less')
  const types = read('miniprogram/types/analysis.ts')
  const mock = read('miniprogram/mocks/analysis.ts')

  assert.match(markup, /analysis-user__intent-tabs/)
  assert.match(markup, /visibleAnalysisUsers/)
  assert.match(markup, /analysisData.userSummary/)
  assert.match(mock, /总用户/)
  assert.match(markup, /观看作品/)
  assert.match(types, /export type AnalysisAudienceUser/)
  assert.match(mock, /analysisAudienceUsersMock/)
  assert.equal(existsSync(new URL('../miniprogram/assets/analysis/user-avatar-01.jpg', import.meta.url)), true)
  assert.match(styles, /\.analysis-user-panel\s*\{[\s\S]*?margin-top: 40rpx;/)
  assert.match(styles, /\.analysis-user__summary-card[\s\S]*?height: 140rpx;[\s\S]*?flex: 1;/)
  assert.match(styles, /\.analysis-user__list-panel[\s\S]*?height: auto;[\s\S]*?padding: 30rpx 30rpx 56rpx;/)
})

test('user analysis list container grows with rows and matches the Figma user row', () => {
  const markup = read('miniprogram/pages/analysis/index.wxml')
  const styles = read('miniprogram/pages/analysis/index.less')

  assert.match(markup, /analysis-user__stat-label/)
  assert.match(markup, /analysis-user__stat-value/)
  assert.match(markup, /#\{\{item\.levelLabel\}\}/)
  assert.match(styles, /\.analysis-user__list-panel\s*\{[\s\S]*?height: auto;[\s\S]*?padding: 30rpx 30rpx 56rpx;/)
  assert.doesNotMatch(styles, /\.analysis-user__list-panel\s*\{[^}]*height: 1038rpx;/)
  assert.match(styles, /\.analysis-user__summary-line\s*\{[\s\S]*?gap: 0;/)
  assert.match(styles, /\.analysis-user__tag\s*\{[\s\S]*?height: 40rpx;[\s\S]*?border-radius: 96rpx;/)
  assert.match(styles, /\.analysis-user__stats\s*\{[\s\S]*?gap: 40rpx;/)
})

test('home analysis tab navigates to the analysis page', () => {
  const homeLogic = read('miniprogram/pages/index/index.ts')
  assert.match(homeLogic, /event\.detail\.id === 'analysis'/)
  assert.match(homeLogic, /navigateTo\([\s\S]*?\/pages\/analysis\/index/)
})

test('global navigation stays pinned while page content scrolls', () => {
  const styles = read('miniprogram/components/navigation-bar/navigation-bar.less')

  assert.match(styles, /\.weui-navigation-bar\s*\{[\s\S]*?position: sticky;/)
  assert.match(styles, /\.weui-navigation-bar\s*\{[\s\S]*?top: 0;/)
  assert.match(styles, /\.weui-navigation-bar\s*\{[\s\S]*?z-index: 1000;/)
})

test('static assets stay below the preview package budget', () => {
  const assetBytes = getFileBytes(new URL('../miniprogram/assets/', import.meta.url))
  assert.ok(assetBytes < 1_800 * 1024, `static assets are ${Math.ceil(assetBytes / 1024)}KB`)
})
