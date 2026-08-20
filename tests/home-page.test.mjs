import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const getPngDimensions = (path) => {
  const bytes = readFileSync(new URL(`../${path}`, import.meta.url))

  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  }
}

const getFileBytes = (directoryUrl) => readdirSync(directoryUrl, { withFileTypes: true }).reduce((total, entry) => {
  const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directoryUrl)
  return total + (entry.isDirectory() ? getFileBytes(entryUrl) : statSync(entryUrl).size)
}, 0)

const createHomeOverview = ({ newVisitorsTotal = 5, readingTotal = 2983, sharingTotal = 98 } = {}) => ({
  newVisitors: {
    total: newVisitorsTotal,
    highIntentCount: 2,
    visitors: [{ id: 'visitor-01', avatarUrl: '/assets/home/avatar-01.png' }],
  },
  reading: { total: readingTotal },
  sharing: {
    total: sharingTotal,
    highlightedContentTitle: 'AI 教程...',
    highlightedContentShareCount: 80,
  },
  unreadNotificationCount: 2,
})

test('home data layer exposes one typed service seam', () => {
  const types = read('miniprogram/types/home.ts')
  const service = read('miniprogram/services/home.ts')

  assert.match(types, /export interface HomeOverviewViewModel/)
  assert.match(service, /export function getHomeOverview\(\): Promise<HomeOverviewViewModel>/)
  assert.match(service, /\/analysis\/dashboard/)
  assert.doesNotMatch(service, /TODO\(API\)/)
  assert.doesNotMatch(service, /mocks\//)
})

test('data access goes through the unified request layer', () => {
  const requestLayer = read('miniprogram/services/request.ts')

  assert.match(requestLayer, /wx\.request\(/)
  assert.match(requestLayer, /DEV_LAN_ORIGIN/)
  assert.match(requestLayer, /platform === 'devtools'/)
  assert.match(requestLayer, /'X-User-Id'/)
  assert.match(requestLayer, /\/wechat\/login/)
  assert.match(requestLayer, /export function request</)
  assert.match(requestLayer, /export function ensureLogin/)

  const serviceFiles = ['home', 'analysis', 'materials', 'notifications', 'ranking']
  for (const name of serviceFiles) {
    const service = read(`miniprogram/services/${name}.ts`)
    assert.doesNotMatch(service, /wx\.request\(/, `${name} service must use the request layer`)
    assert.doesNotMatch(service, /from '\.\.\/mocks\//, `${name} service must not import mocks`)
  }
})

test('home greeting follows the device local time across four periods', async () => {
  const { getHomeGreeting } = await import('../miniprogram/utils/greeting.ts')
  const cases = [
    [5, 0, '早上好，有什么可以帮助你的吗'],
    [11, 59, '早上好，有什么可以帮助你的吗'],
    [12, 0, '中午好，有什么可以帮助你的吗'],
    [13, 59, '中午好，有什么可以帮助你的吗'],
    [14, 0, '下午好，有什么可以帮助你的吗'],
    [18, 59, '下午好，有什么可以帮助你的吗'],
    [19, 0, '晚上好，有什么可以帮助你的吗'],
    [4, 59, '晚上好，有什么可以帮助你的吗'],
  ]

  for (const [hour, minute, expected] of cases) {
    assert.equal(getHomeGreeting(new Date(2026, 0, 1, hour, minute)), expected)
  }
})

test('home greeting refreshes when the page becomes visible', () => {
  const logic = read('miniprogram/pages/index/index.ts')

  assert.match(logic, /onShow\(\)/)
  assert.match(logic, /this\.setData\(\{ greeting: getHomeGreeting\(\) \}\)/)
})

test('home summary converts a single zero metric into its friendly empty state', async () => {
  const { buildHomeSummaryViewModel } = await import('../miniprogram/utils/home.ts')
  const summary = buildHomeSummaryViewModel(createHomeOverview({ newVisitorsTotal: 0 }))

  assert.deepEqual(summary.newVisitors, {
    state: 'empty',
    isEmpty: true,
    primaryPrefix: '今日暂无新增用户',
    primaryValue: '',
    primarySuffix: '',
    secondaryPrefix: '分享素材后，客户进入小程序即可开始记录',
    secondaryValue: '',
    secondarySuffix: '',
    showVisitors: false,
    visitors: [],
  })
  assert.equal(summary.reading.state, 'data')
  assert.equal(summary.sharing.state, 'data')
})

test('home summary shows all three friendly empty states when all metrics are zero', async () => {
  const { buildHomeSummaryViewModel } = await import('../miniprogram/utils/home.ts')
  const summary = buildHomeSummaryViewModel(createHomeOverview({
    newVisitorsTotal: 0,
    readingTotal: 0,
    sharingTotal: 0,
  }))

  assert.deepEqual(summary.newVisitors, {
    state: 'empty',
    isEmpty: true,
    primaryPrefix: '今日暂无新增用户',
    primaryValue: '',
    primarySuffix: '',
    secondaryPrefix: '分享素材后，客户进入小程序即可开始记录',
    secondaryValue: '',
    secondarySuffix: '',
    showVisitors: false,
    visitors: [],
  })
  assert.deepEqual(summary.reading, {
    state: 'empty',
    isEmpty: true,
    primaryPrefix: '今日暂无阅读',
    primaryValue: '',
    primarySuffix: '',
    secondaryPrefix: '去素材库选择一份内容分享给客户',
    secondaryValue: '',
    secondarySuffix: '',
  })
  assert.deepEqual(summary.sharing, {
    state: 'empty',
    isEmpty: true,
    primaryPrefix: '今日暂无转发',
    primaryValue: '',
    primarySuffix: '',
    secondaryPrefix: '优质内容被客户转发后，这里会显示数据',
    secondaryValue: '',
    secondarySuffix: '',
  })
})

test('home summary keeps normal copy for non-zero metrics in a partial-data state', async () => {
  const { buildHomeSummaryViewModel } = await import('../miniprogram/utils/home.ts')
  const summary = buildHomeSummaryViewModel(createHomeOverview({ readingTotal: 0 }))

  assert.deepEqual(summary.newVisitors, {
    state: 'data',
    isEmpty: false,
    primaryPrefix: '今日有 ',
    primaryValue: '5',
    primarySuffix: ' 个新增用户',
    secondaryPrefix: '其中有 ',
    secondaryValue: '2',
    secondarySuffix: ' 位高意向用户',
    showVisitors: true,
    visitors: [{ id: 'visitor-01', avatarUrl: '/assets/home/avatar-01.png' }],
  })
  assert.deepEqual(summary.reading, {
    state: 'empty',
    isEmpty: true,
    primaryPrefix: '今日暂无阅读',
    primaryValue: '',
    primarySuffix: '',
    secondaryPrefix: '去素材库选择一份内容分享给客户',
    secondaryValue: '',
    secondarySuffix: '',
  })
  assert.deepEqual(summary.sharing, {
    state: 'data',
    isEmpty: false,
    primaryPrefix: '今日累计转发次数 ',
    primaryValue: '98',
    primarySuffix: ' 次',
    secondaryPrefix: '“AI 教程...”被转发了 80 次',
    secondaryValue: '',
    secondarySuffix: '',
  })
})

test('home cards bind display fields and allow empty helper copy to wrap', () => {
  const markup = read('miniprogram/pages/index/index.wxml')
  const styles = read('miniprogram/pages/index/index.less')

  assert.match(markup, /homeSummary\.newVisitors\.primaryPrefix/)
  assert.match(markup, /homeSummary\.reading\.secondaryPrefix/)
  assert.match(markup, /homeSummary\.sharing\.secondaryPrefix/)
  assert.doesNotMatch(markup, /homeData\.(newVisitors|reading|sharing)\.(total|highlightedContent)/)
  assert.match(styles, /\.home-summary__secondary--empty\s*\{[\s\S]*?white-space: normal;[\s\S]*?word-break: break-all;/)
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

test('home ranking tab uses the supplied Group 55 vector artwork', () => {
  const rankingIcon = read('miniprogram/assets/home/tab-ranking.svg')

  assert.match(rankingIcon, /M30 22\.75C31\.2426 22\.75 32\.25 23\.7574 32\.25 25V33\.25/)
  assert.match(rankingIcon, /M21\.5 12\.75H23\.5C24\.7426 12\.75 25\.75 13\.7574 25\.75 15V33\.25/)
  assert.doesNotMatch(rankingIcon, /<rect x="11\.75" y="12\.75" width="22\.5" height="20\.5"/)
})

test('home page declares the Figma primary regions', () => {
  const page = read('miniprogram/pages/index/index.wxml')

  assert.match(page, /class="home-page"/)
  assert.match(page, /class="home-assistant"/)
  assert.match(page, /class="home-summary"/)
  assert.match(page, /bottom-tab-bar/)
  assert.match(page, /阿乐/)
  assert.match(page, /class="home-assistant__greeting">\{\{greeting\}\}/)
  assert.doesNotMatch(page, /homeData\.greeting/)
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
  const service = read('miniprogram/services/notifications.ts')

  assert.match(types, /export interface NotificationsViewModel/)
  assert.match(service, /export function getNotifications\(\): Promise<NotificationsViewModel>/)
  assert.match(service, /\/analysis\/intent\/list/)
  assert.doesNotMatch(service, /TODO\(API\)/)
})

test('notification page matches the Figma screen structure', () => {
  const markup = read('miniprogram/pages/notifications/notifications.wxml')
  const styles = read('miniprogram/pages/notifications/notifications.less')

  assert.match(markup, /<navigation-bar back="\{\{true\}\}"/)
  assert.match(markup, /通知/)
  assert.match(markup, /notification-filter/)
  assert.match(markup, /notification-group/)
  assert.match(markup, /notification-card/)
  assert.match(markup, /hover-class="notification-card--pressed"/)
  assert.doesNotMatch(markup, /nav-action\.svg/)
  assert.match(styles, /background: linear-gradient\(/)
  assert.match(styles, /height: 300rpx;/)
  assert.match(styles, /padding: 24rpx;/)
  assert.match(styles, /gap: 32rpx;/)
  assert.match(styles, /\.notification-card__action-icon \{[\s\S]*?\n  right: 0;[\s\S]*?\n  bottom: 0;/)
  assert.match(styles, /\.notification-card__thumbnails[\s\S]*?width: 100rpx;[\s\S]*?height: 136rpx;/)
  assert.match(styles, /border-radius: 24rpx/)
})

test('notification page keeps a definite minimum viewport', () => {
  const styles = read('miniprogram/pages/notifications/notifications.less')

  assert.match(styles, /\.notification-page \{[\s\S]*?\n  min-height: 100vh;/)
})

test('notification card uses the Figma contact action treatment', () => {
  const styles = read('miniprogram/pages/notifications/notifications.less')

  assert.match(styles, /\.notification-card__intent \{[\s\S]*?\n  padding: 0 20rpx;/)
  assert.match(styles, /\.notification-card__name \{[\s\S]*?\n  font-size: 32rpx;[\s\S]*?\n  line-height: 44rpx;/)
  assert.match(styles, /\.notification-card__action \{[\s\S]*?\n  font-size: 24rpx;[\s\S]*?\n  line-height: 44rpx;/)
  assert.match(styles, /\.notification-card__date \{[\s\S]*?\n  font-size: 20rpx;[\s\S]*?\n  line-height: 44rpx;/)
  assert.doesNotMatch(styles, /\.notification-card__recommendation \{[\s\S]*?\n  width: 40%;/)
  assert.match(styles, /\.notification-card__contact-action-v2 \{[\s\S]*?\n  flex: none;[\s\S]*?\n  width: 128rpx;/)
  assert.match(styles, /\.notification-card__contact-action-v2 \{[\s\S]*?\n  background: #9d9d9d;/)
  assert.match(styles, /\.notification-card__contact-action-v2 \{[\s\S]*?\n  color: #ffffff;/)
  assert.match(styles, /\.notification-card__contact-action-v2 \{[\s\S]*?\n  font-weight: 400;/)
  const markup = read('miniprogram/pages/notifications/notifications.wxml')
  assert.match(markup, /notification-card__contact-action-v2/)
  assert.match(markup, /background:#9d9d9d/)
})

test('notification card uses one thumbnail and pins the badge to the avatar corner', () => {
  const markup = read('miniprogram/pages/notifications/notifications.wxml')
  const styles = read('miniprogram/pages/notifications/notifications.less')
  const types = read('miniprogram/types/notifications.ts')

  assert.match(markup, /src="\{\{notification\.thumbnailUrl\}\}"/)
  assert.doesNotMatch(markup, /wx:for="\{\{notification\.thumbnailItems\}\}"/)
  assert.doesNotMatch(markup, /notification-card__thumbnail--1|notification-card__thumbnail--2/)
  assert.match(types, /thumbnailUrl: string/)
  assert.match(styles, /\.notification-card__action-icon \{[\s\S]*?\n  right: 0;[\s\S]*?\n  bottom: 0;/)
  assert.doesNotMatch(styles, /\.notification-card__thumbnail--1|\.notification-card__thumbnail--2/)
})

test('notification page shares ranking header layers and scroll fade', async () => {
  const markup = read('miniprogram/pages/notifications/notifications.wxml')
  const logic = read('miniprogram/pages/notifications/notifications.ts')
  const styles = read('miniprogram/pages/notifications/notifications.less')
  const { calculateRankingHeaderOpacity } = await import('../miniprogram/utils/ranking.ts')

  assert.match(markup, /<view class="notification-page__base"><\/view>[\s\S]*?notification-page__status-glow[\s\S]*?class="notification-page__header"[^>]*>[\s\S]*?navigation-bar/)
  assert.match(markup, /background: rgba\(232, 237, 245, \{\{notificationHeaderOpacity\}\}\);/)
  assert.doesNotMatch(markup, /<scroll-view/)
  assert.match(logic, /notificationHeaderOpacity: 0/)
  assert.match(logic, /calculateRankingHeaderOpacity\(event\.scrollTop\)/)
  assert.match(styles, /\.notification-page__header\s*\{[\s\S]*?position: sticky;[\s\S]*?top: 0;[\s\S]*?z-index: 1002;/)
  assert.match(styles, /\.notification-page__status-glow\s*\{[\s\S]*?position: fixed;[\s\S]*?z-index: 1000;/)
  assert.match(styles, /\.notification-page__content\s*\{[\s\S]*?z-index: 1001;/)
  assert.doesNotMatch(styles, /\.notification-page\s*\{[^}]*?overflow: hidden;/)
  assert.equal(calculateRankingHeaderOpacity(0), 0)
  assert.equal(calculateRankingHeaderOpacity(25), 1)
})

test('notification filters match the Figma sizing and switch visible groups', () => {
  const markup = read('miniprogram/pages/notifications/notifications.wxml')
  const logic = read('miniprogram/pages/notifications/notifications.ts')
  const styles = read('miniprogram/pages/notifications/notifications.less')

  assert.match(markup, /wx:for="\{\{visibleGroups\}\}"/)
  assert.match(logic, /visibleGroups/)
  assert.match(logic, /\.filter\(/)
  assert.match(styles, /\.notification-filter \{[\s\S]*?\n  gap: 20rpx;/)
  assert.match(styles, /\.notification-filter__item \{[\s\S]*?\n  flex: 1;[\s\S]*?\n  width: auto;/)
  assert.match(styles, /\.notification-filter__item \{[\s\S]*?\n  height: 64rpx;/)
})

test('notification empty state uses the shared cloud icon and intent copy', () => {
  const markup = read('miniprogram/pages/notifications/notifications.wxml')
  const logic = read('miniprogram/pages/notifications/notifications.ts')
  const styles = read('miniprogram/pages/notifications/notifications.less')

  assert.match(markup, /wx:if="\{\{hasVisibleGroups\}\}"/)
  assert.match(markup, /wx:else class="notification-empty-state"/)
  assert.match(markup, /src="\/assets\/analysis\/empty-state-cloud\.png"/)
  assert.match(markup, /暂无意向用户/)
  assert.match(logic, /hasVisibleGroups: false/)
  assert.match(logic, /hasVisibleGroups: visibleGroups\.length > 0/)
  assert.match(styles, /\.notification-empty-state \{[\s\S]*?display: flex;[\s\S]*?align-items: center;[\s\S]*?gap: 10rpx;/)
  assert.match(styles, /\.notification-empty-state__icon \{[\s\S]*?width: 78rpx;[\s\S]*?height: 78rpx;/)
})

test('notification cards navigate to the existing user detail page', () => {
  const markup = read('miniprogram/pages/notifications/notifications.wxml')
  const logic = read('miniprogram/pages/notifications/notifications.ts')
  const types = read('miniprogram/types/notifications.ts')

  assert.match(markup, /class="notification-card"[\s\S]*?bindtap="onNotificationCardTap"/)
  assert.match(markup, /data-id="\{\{notification\.userId\}\}"/)
  assert.match(markup, /catchtap="onContactActionTap"/)
  assert.match(logic, /onNotificationCardTap\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(logic, /\/pages\/analysis-user-detail\/index\?id=\$\{userId\}/)
  assert.match(logic, /onContactActionTap\(\)/)
  assert.match(types, /userId: string/)
})

test('home notification tab navigates to the second page', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const homeLogic = read('miniprogram/pages/index/index.ts')

  assert.ok(app.pages.includes('pages/notifications/notifications'))
  assert.match(homeMarkup, /bind:tabtap="onTabTap"/)
  assert.match(homeLogic, /navigateTo\([\s\S]*?\/pages\/notifications\/notifications/)
})

test('home ranking tab navigates to the ranking page', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const homeLogic = read('miniprogram/pages/index/index.ts')

  assert.ok(app.pages.includes('pages/ranking/index'))
  assert.match(homeLogic, /event\.detail\.id === 'ranking'/)
  assert.match(homeLogic, /navigateTo\([\s\S]*?\/pages\/ranking\/index/)
})

test('materials cards navigate to the work detail page with a stable material id', () => {
  const markup = read('miniprogram/pages/materials/index.wxml')
  const logic = read('miniprogram/pages/materials/index.ts')

  assert.match(markup, /class="materials-card"[\s\S]*?bindtap="onMaterialCardTap"/)
  assert.match(markup, /data-id="\{\{item\.id\}\}"/)
  assert.match(logic, /onMaterialCardTap\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(logic, /\/pages\/material-detail\/index\?id=\$\{materialId\}/)
})

test('material detail page exposes a typed service seam and the Figma share layout', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const page = read('miniprogram/pages/material-detail/index.wxml')
  const logic = read('miniprogram/pages/material-detail/index.ts')
  const service = read('miniprogram/services/materials.ts')
  const types = read('miniprogram/types/materials.ts')

  assert.ok(app.pages.includes('pages/material-detail/index'))
  assert.match(types, /export interface MaterialDetailViewModel/)
  assert.match(service, /export function getMaterialDetail\(materialId: string\): Promise<MaterialDetailViewModel \| null>/)
  assert.match(logic, /getMaterialDetail\(materialId\)/)
  assert.match(page, /navigation-bar[^>]*title="作品"/)
  assert.match(page, /swiper/)
  assert.match(page, /分享给好友/)
  assert.match(page, /分享到朋友圈/)
})

test('material detail uses local Figma share assets', () => {
  const page = read('miniprogram/pages/material-detail/index.wxml')

  assert.equal(existsSync(new URL('../miniprogram/assets/materials/detail-share.svg', import.meta.url)), true)
  assert.equal(existsSync(new URL('../miniprogram/assets/materials/detail-moments.png', import.meta.url)), true)
  assert.match(page, /\/assets\/materials\/detail-share\.svg/)
  assert.match(page, /\/assets\/materials\/detail-moments\.png/)
})

test('material detail share bar has no separator line above the buttons', () => {
  const styles = read('miniprogram/pages/material-detail/index.less')

  assert.doesNotMatch(styles, /\.material-detail__share-bar\s*\{[\s\S]*?border-top:/)
})

test('material images fit by width with the shared letterbox background', () => {
  const materialsMarkup = read('miniprogram/pages/materials/index.wxml')
  const materialsStyles = read('miniprogram/pages/materials/index.less')
  const detailMarkup = read('miniprogram/pages/material-detail/index.wxml')
  const detailStyles = read('miniprogram/pages/material-detail/index.less')

  assert.match(materialsMarkup, /class="materials-card__image"[^>]*mode="aspectFit"/)
  assert.match(detailMarkup, /class="material-detail__image"[^>]*mode="aspectFit"/)
  assert.doesNotMatch(materialsMarkup, /materials-card__image"[^>]*mode="aspectFill"/)
  assert.doesNotMatch(detailMarkup, /material-detail__image"[^>]*mode="aspectFill"/)
  assert.match(materialsStyles, /\.materials-card__preview\s*\{[\s\S]*?background: #DEE2E7;/)
  assert.match(detailStyles, /\.material-detail__swiper\s*\{[\s\S]*?background: #DEE2E7;/)
})

test('ranking page exposes typed data and three metric sort tabs', () => {
  const markup = read('miniprogram/pages/ranking/index.wxml')
  const logic = read('miniprogram/pages/ranking/index.ts')
  const service = read('miniprogram/services/ranking.ts')
  const types = read('miniprogram/types/ranking.ts')

  assert.match(markup, /navigation-bar[^>]*title="排行榜"/)
  assert.match(markup, /ranking-hero/)
  assert.match(markup, /wx:for="\{\{rankingTabs\}\}"/)
  assert.match(markup, /bindtap="onRankingTabTap"/)
  assert.match(markup, /wx:for="\{\{visibleRankingEntries\}\}"/)
  assert.match(logic, /activeRankingMetric/)
  assert.match(logic, /visibleRankingEntries/)
  assert.match(logic, /sortRankingEntries/)
  assert.match(types, /export type RankingMetric/)
  assert.match(types, /export type RankingEntry/)
  assert.match(service, /getRankingOverview\(\): Promise<RankingViewModel>/)
  assert.match(service, /TODO\(API\): 接入排行榜真实接口/)
})

test('ranking panel replaces an empty result set with the Figma empty state', () => {
  const markup = read('miniprogram/pages/ranking/index.wxml')
  const styles = read('miniprogram/pages/ranking/index.less')
  const logic = read('miniprogram/pages/ranking/index.ts')

  assert.equal(existsSync(new URL('../miniprogram/assets/analysis/empty-state-cloud.png', import.meta.url)), true)
  assert.match(markup, /wx:if="\{\{hasRankingEntries\}\}" class="ranking-list"/)
  assert.match(markup, /wx:else class="ranking-empty-state"/)
  assert.match(markup, /src="\/assets\/analysis\/empty-state-cloud\.png"/)
  assert.match(markup, /暂无数据/)
  assert.match(logic, /hasRankingEntries: false/)
  assert.match(logic, /hasRankingEntries: visibleRankingEntries\.length > 0/)
  assert.match(styles, /\.ranking-empty-state\s*\{[\s\S]*?align-items: center;[\s\S]*?gap: 10rpx;[\s\S]*?margin-top: 120rpx;/)
  assert.match(styles, /\.ranking-empty-state__icon\s*\{[\s\S]*?width: 78rpx;[\s\S]*?height: 78rpx;/)
})

test('ranking hero uses the supplied three-times-resolution title and trophy assets', () => {
  assert.deepEqual(getPngDimensions('miniprogram/assets/ranking/ranking-title.png'), { width: 576, height: 150 })
  assert.deepEqual(getPngDimensions('miniprogram/assets/ranking/ranking-trophy.png'), { width: 294, height: 351 })
})

test('ranking page keeps native page scrolling for Skyline device compatibility', () => {
  const markup = read('miniprogram/pages/ranking/index.wxml')
  const styles = read('miniprogram/pages/ranking/index.less')
  const config = JSON.parse(read('miniprogram/pages/ranking/index.json'))

  assert.match(markup, /ranking-page__status-glow[\s\S]*?class="ranking-page__header[^\"]*"[\s\S]*?navigation-bar/)
  assert.doesNotMatch(markup, /<scroll-view/)
  assert.equal(config.disableScroll, undefined)
  assert.match(styles, /\.ranking-page__header\s*\{[\s\S]*?position: sticky;[\s\S]*?top: 0;[\s\S]*?z-index: 1002;[\s\S]*?background:/)
  assert.match(styles, /\.ranking-page__status-glow\s*\{[^}]*?position: fixed;/)
  assert.match(styles, /\.ranking-page\s*\{[^}]*?min-height: 100vh;/)
  assert.doesNotMatch(styles, /\.ranking-page\s*\{[^}]*?overflow: hidden;/)
})

test('ranking background stripes stay between navigation and ranking content', () => {
  const markup = read('miniprogram/pages/ranking/index.wxml')
  const styles = read('miniprogram/pages/ranking/index.less')

  assert.match(markup, /<view class="ranking-page">\s*<view class="ranking-page__base"><\/view>\s*<image class="ranking-page__status-glow" src="\/assets\/analysis\/group-40\.svg" mode="scaleToFill" \/>\s*<view class="ranking-page__header"[^>]*>/)
  assert.equal(existsSync(new URL('../miniprogram/assets/analysis/group-40.svg', import.meta.url)), true)
  assert.match(styles, /\.ranking-page__base\s*\{[^}]*?position: absolute;[^}]*?inset: 0;[^}]*?z-index: 999;[^}]*?background: @ranking-background;/)
  assert.match(styles, /\.ranking-page__status-glow\s*\{[^}]*?position: fixed;[^}]*?z-index: 1000;/)
  assert.doesNotMatch(styles, /\.ranking-page__status-glow\s*\{[^}]*?repeating-linear-gradient/)
  assert.match(styles, /\.ranking-page__content\s*\{[^}]*?z-index: 1001;/)
  assert.match(styles, /\.ranking-page__header\s*\{[\s\S]*?z-index: 1002;/)
})

test('ranking layers keep navigation above content and stripes', () => {
  const styles = read('miniprogram/pages/ranking/index.less')

  assert.match(styles, /\.ranking-page__header\s*\{[^}]*?z-index: 1002;/)
  assert.match(styles, /\.ranking-page__content\s*\{[^}]*?z-index: 1001;/)
  assert.match(styles, /\.ranking-page__status-glow\s*\{[^}]*?z-index: 1000;/)
  assert.match(styles, /\.ranking-page__base\s*\{[^}]*?z-index: 999;/)
})

test('ranking navigation fades from transparent to opaque over the first 25px', async () => {
  const markup = read('miniprogram/pages/ranking/index.wxml')
  const logic = read('miniprogram/pages/ranking/index.ts')
  const styles = read('miniprogram/pages/ranking/index.less')
  const { calculateRankingHeaderOpacity } = await import('../miniprogram/utils/ranking.ts')

  assert.match(markup, /style="background: rgba\(232, 237, 245, \{\{rankingHeaderOpacity\}\}\);"/)
  assert.match(logic, /rankingHeaderOpacity: 0/)
  assert.match(logic, /onPageScroll\(event: WechatMiniprogram\.PageScrollOption\)/)
  assert.match(logic, /calculateRankingHeaderOpacity\(event\.scrollTop\)/)
  assert.match(styles, /\.ranking-page__header\s*\{[^}]*?background: transparent;/)
  assert.equal(calculateRankingHeaderOpacity(-5), 0)
  assert.equal(calculateRankingHeaderOpacity(0), 0)
  assert.equal(calculateRankingHeaderOpacity(12.5), 0.5)
  assert.equal(calculateRankingHeaderOpacity(25), 1)
  assert.equal(calculateRankingHeaderOpacity(30), 1)
})

test('ranking panel uses the Figma gradient and keeps 40px bottom space', () => {
  const markup = read('miniprogram/pages/ranking/index.wxml')
  const styles = read('miniprogram/pages/ranking/index.less')

  assert.match(styles, /page\s*\{[^}]*?background: #ffffff;/)
  assert.doesNotMatch(markup, /ranking-page__content-background/)
  assert.match(styles, /\.ranking-page__content\s*\{[^}]*?background: linear-gradient\(180deg, rgba\(232, 237, 245, 0\) 0%, #e8edf5 13\.976%, #e8edf5 100%\);/)
  assert.match(styles, /\.ranking-panel\s*\{[\s\S]*?padding: 30rpx 30rpx 80rpx;/)
  assert.match(styles, /\.ranking-panel\s*\{[\s\S]*?background: linear-gradient\(180deg, #ffffff 0%, #f0f5fa 100%\);/)
  assert.doesNotMatch(styles, /\.ranking-panel\s*\{[^}]*?height:/)
})

test('analysis page exposes typed mock data and the Figma card structure', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const markup = read('miniprogram/pages/analysis/index.wxml')
  const service = read('miniprogram/services/analysis.ts')

  assert.ok(app.pages.includes('pages/analysis/index'))
  assert.match(service, /getAnalysisOverview\(period: AnalysisTimeRange = 'day'\): Promise<AnalysisViewModel>/)
  assert.doesNotMatch(service, /TODO\(API\)/)
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

test('analysis work and user panels expose the Figma empty states', () => {
  const markup = read('miniprogram/pages/analysis/index.wxml')
  const styles = read('miniprogram/pages/analysis/index.less')
  const logic = read('miniprogram/pages/analysis/index.ts')

  assert.equal(existsSync(new URL('../miniprogram/assets/analysis/empty-state-cloud.png', import.meta.url)), true)
  assert.match(markup, /wx:if="\{\{hasAnalysisCards\}\}"/)
  assert.match(markup, /还没有作品，你可以发布一个/)
  assert.match(markup, /wx:if="\{\{hasAnalysisUsers\}\}"/)
  assert.match(markup, /还没用户，快去发布作品吧/)
  assert.match(markup, /empty-state-cloud\.png/)
  assert.match(logic, /hasAnalysisCards: false/)
  assert.match(logic, /hasAnalysisUsers: false/)
  assert.match(logic, /hasAnalysisCards: analysisData\.cards\.length > 0/)
  assert.match(logic, /hasAnalysisUsers: visibleUsers\.length > 0/)
  assert.match(styles, /\.analysis-empty-state\s*\{[\s\S]*?align-items: center;[\s\S]*?gap: 10rpx;/)
  assert.match(styles, /\.analysis-empty-state__icon\s*\{[\s\S]*?width: 78rpx;[\s\S]*?height: 78rpx;/)
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

test('analysis detail shows an empty state when no intent users are visible', () => {
  const markup = read('miniprogram/pages/analysis-detail/index.wxml')
  const logic = read('miniprogram/pages/analysis-detail/index.ts')
  const styles = read('miniprogram/pages/analysis-detail/index.less')

  assert.match(markup, /wx:if="\{\{hasVisibleIntentUsers\}\}"/)
  assert.match(markup, /wx:else class="detail-intent__empty-state"/)
  assert.match(markup, /src="\/assets\/analysis\/empty-state-cloud\.png"/)
  assert.match(markup, /没有意向用户/)
  assert.match(logic, /hasVisibleIntentUsers: false/)
  assert.match(logic, /hasVisibleIntentUsers: visibleUsers\.length > 0/)
  assert.match(styles, /\.detail-intent__empty-state\s*\{[\s\S]*?display: flex;[\s\S]*?align-items: center;[\s\S]*?gap: 10rpx;/)
  assert.match(styles, /\.detail-intent__empty-state__icon\s*\{[\s\S]*?width: 78rpx;[\s\S]*?height: 78rpx;/)
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

test('analysis user tap clears that user unread marker before navigation', () => {
  const logic = read('miniprogram/pages/analysis/index.ts')

  assert.match(logic, /const updatedUsers = this\.data\.visibleAnalysisUsers\.map\(/)
  assert.match(logic, /showMarker: false/)
  assert.match(logic, /visibleAnalysisUsers: updatedUsers/)
  assert.match(logic, /wx\.navigateTo\(\{ url: `\/pages\/analysis-user-detail\/index\?id=\$\{userId\}` \}\)/)
})

test('analysis user detail matches the Figma profile and reading records', () => {
  const markup = read('miniprogram/pages/analysis-user-detail/index.wxml')
  const styles = read('miniprogram/pages/analysis-user-detail/index.less')
  const logic = read('miniprogram/pages/analysis-user-detail/index.ts')
  const types = read('miniprogram/types/analysis.ts')

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
  assert.match(styles, /\.analysis-sort__inner\s*\{[\s\S]*?height: auto;[\s\S]*?padding: 0 20rpx;[\s\S]*?background: #ffffff;/)
  assert.match(styles, /\.analysis-sort__arrow\s*\{[\s\S]*?width: 14rpx;[\s\S]*?height: 8rpx;/)
})

test('analysis work sort opens the Figma bottom sheet and defaults to views', () => {
  const markup = read('miniprogram/pages/analysis/index.wxml')
  const styles = read('miniprogram/pages/analysis/index.less')
  const logic = read('miniprogram/pages/analysis/index.ts')

  assert.match(markup, /bindtap="onAnalysisSortTap"/)
  assert.match(markup, /\{\{activeAnalysisSortLabel\}\}/)
  assert.match(markup, /wx:if="\{\{analysisSortSheetVisible\}\}"/)
  assert.match(markup, /wx:for="\{\{analysisSortOptions\}\}"/)
  assert.match(markup, /catchtap="onAnalysisSortMaskTap"/)
  assert.match(markup, /bindtap="onAnalysisSortOptionTap"/)
  assert.match(markup, /data-id="\{\{item\.id\}\}"/)
  assert.match(logic, /activeAnalysisSortLabel: '浏览量'/)
  assert.match(logic, /analysisSortSheetVisible: false/)
  assert.match(logic, /analysisSortOptions/)
  assert.match(logic, /onAnalysisSortTap\(\)/)
  assert.match(logic, /onAnalysisSortOptionTap\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(logic, /onAnalysisSortMaskTap\(\)/)
  assert.match(styles, /\.analysis-sort-sheet\s*\{[\s\S]*?position: fixed;[\s\S]*?z-index: 1100;[\s\S]*?align-items: flex-end;/)
  assert.match(styles, /\.analysis-sort-sheet__mask\s*\{[\s\S]*?background: rgba\(0, 0, 0, 0\.8\);/)
  assert.match(styles, /\.analysis-sort-sheet__panel\s*\{[\s\S]*?border-radius: 40rpx 40rpx 0 0;[\s\S]*?background: #ffffff;/)
  assert.match(styles, /\.analysis-sort-sheet__option\s*\{[\s\S]*?height: 100rpx;[\s\S]*?border-bottom: 2rpx solid #f4f5f5;/)
})

test('analysis sort sheet enters from the bottom with a synchronized 300ms fade', () => {
  const styles = read('miniprogram/pages/analysis/index.less')

  assert.match(styles, /\.analysis-sort-sheet__mask\s*\{[\s\S]*?animation: analysis-sort-mask-in 300ms ease-out both;/)
  assert.match(styles, /\.analysis-sort-sheet__panel\s*\{[\s\S]*?animation: analysis-sort-panel-in 300ms ease-out both;/)
  assert.match(styles, /@keyframes analysis-sort-mask-in\s*\{[\s\S]*?from\s*\{[\s\S]*?background: rgba\(0, 0, 0, 0\);[\s\S]*?\}[\s\S]*?to\s*\{[\s\S]*?background: rgba\(0, 0, 0, 0\.8\);/)
  assert.match(styles, /@keyframes analysis-sort-panel-in\s*\{[\s\S]*?from\s*\{[\s\S]*?transform: translateY\(100%\);[\s\S]*?\}[\s\S]*?to\s*\{[\s\S]*?transform: translateY\(0\);/)
})

test('segmented filters share an exact two-pixel vertical inset', () => {
  const appStyles = read('miniprogram/app.less')
  const selectorStyles = [
    read('miniprogram/pages/ranking/index.less'),
    read('miniprogram/pages/analysis/index.less'),
    read('miniprogram/pages/analysis-detail/index.less'),
    read('miniprogram/pages/analysis-user-detail/index.less'),
  ]
  const selectors = [
    'ranking-tabs__selection',
    'analysis-periods__selection',
    'analysis-user__intent-selection',
    'detail-intent__selection',
    'user-detail__record-selection',
  ]

  assert.match(appStyles, /@segmented-filter-vertical-inset: 4rpx;/)

  selectors.forEach((selector) => {
    const styles = selectorStyles.find((style) => style.includes(`.${selector}`))
    assert.ok(styles, `missing styles for ${selector}`)
    assert.match(styles, new RegExp(`\\.${selector}\\s*\\{[\\s\\S]*?top: @segmented-filter-vertical-inset;[\\s\\S]*?bottom: @segmented-filter-vertical-inset;[\\s\\S]*?height: auto;`))
  })

  const analysisStyles = selectorStyles[1]
  assert.match(analysisStyles, /\.analysis-sort__inner\s*\{[\s\S]*?height: auto;/)
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
  assert.match(styles, /\.analysis-total-panel\s*\{[\s\S]*?gap: 30rpx;/)
  assert.match(styles, /\.analysis-total__overview-grid\s*\{[\s\S]*?display: grid;[\s\S]*?grid-template-columns: repeat\(3, 1fr\);/)
  assert.match(styles, /\.analysis-total__chart-bar\s*\{[\s\S]*?width: 40rpx;[\s\S]*?background: linear-gradient\(/)
})

test('user analysis matches Figma summary, filters, and user list assets', () => {
  const markup = read('miniprogram/pages/analysis/index.wxml')
  const styles = read('miniprogram/pages/analysis/index.less')
  const types = read('miniprogram/types/analysis.ts')
  const service = read('miniprogram/services/analysis.ts')

  assert.match(markup, /analysis-user__intent-tabs/)
  assert.match(markup, /visibleAnalysisUsers/)
  assert.match(markup, /analysisData.userSummary/)
  assert.match(service, /总用户/)
  assert.match(markup, /观看作品/)
  assert.match(types, /export type AnalysisAudienceUser/)
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

test('home summary cards navigate to their matching analysis tabs', () => {
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const analysisLogic = read('miniprogram/pages/analysis/index.ts')

  assert.match(homeMarkup, /class="home-summary__card home-summary__card--visitors"[^>]*bindtap="onSummaryCardTap"[^>]*data-analysis-tab="user"/)
  assert.equal((homeMarkup.match(/class="home-summary__card home-summary__card--compact"[^>]*bindtap="onSummaryCardTap"[^>]*data-analysis-tab="work"/g) ?? []).length, 2)
  assert.match(homeLogic, /onSummaryCardTap\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(homeLogic, /\/pages\/analysis\/index\?tab=\$\{analysisTab\}/)
  assert.match(analysisLogic, /options\.tab/)
  assert.match(analysisLogic, /activeAnalysisTabIndex: analysisTabIndex/)
})

test('materials data layer exposes one typed service seam', () => {
  const types = read('miniprogram/types/materials.ts')
  const service = read('miniprogram/services/materials.ts')

  assert.match(types, /export interface MaterialsViewModel/)
  assert.match(service, /export function getMaterials\(\): Promise<MaterialsViewModel>/)
  assert.match(service, /\/material\/mine/)
  assert.match(service, /export function publishMaterial/)
  assert.match(service, /export function saveMaterialDraft/)
  assert.doesNotMatch(service, /TODO\(API\)/)
})

test('materials page matches the Figma screen structure and uses local assets', () => {
  const markup = read('miniprogram/pages/materials/index.wxml')
  const styles = read('miniprogram/pages/materials/index.less')
  const publishIcon = read('miniprogram/assets/materials/material-plus.svg')

  assert.match(markup, /<navigation-bar back="\{\{true\}\}" title="素材"/)
  assert.match(markup, /materials-filter/)
  assert.match(markup, /materials-grid/)
  assert.match(markup, /materials-card/)
  assert.match(markup, /发布素材/)
  assert.doesNotMatch(markup, /发布作品/)
  assert.match(publishIcon, /<svg width="14" height="12"/)
  assert.match(markup, /bindtap="onFilterTap"/)
  assert.match(markup, /hover-class="materials-card--pressed"/)
  assert.equal(existsSync(new URL('../miniprogram/assets/materials/material-play.svg', import.meta.url)), true)
  assert.match(styles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(styles, /height: 460rpx;/)
})

test('materials list only shows the supplied play icon for video cards', async () => {
  const markup = read('miniprogram/pages/materials/index.wxml')
  const icon = read('miniprogram/assets/materials/material-play.svg')

  assert.match(markup, /wx:if="\{\{item\.kind === 'video'\}\}"[\s\S]*?class="materials-card__play"/)
  assert.match(icon, /<circle cx="9" cy="9" r="9" fill="black" fill-opacity="0\.5"\/>/)
})

test('draft material cards open the publish editor with draft data', () => {
  const materialsLogic = read('miniprogram/pages/materials/index.ts')
  const publishLogic = read('miniprogram/pages/materials/publish/index.ts')
  const service = read('miniprogram/services/materials.ts')
  const types = read('miniprogram/types/materials.ts')

  assert.match(materialsLogic, /const material = this\.data\.visibleMaterials\.find\(/)
  assert.match(materialsLogic, /material\?\.isDraft/)
  assert.match(materialsLogic, /\/pages\/materials\/publish\/index\?id=\$\{materialId\}/)
  assert.match(types, /export interface MaterialDraftEditViewModel/)
  assert.match(service, /export function getMaterialDraft\(materialId: string\): Promise<MaterialDraftEditViewModel \| null>/)
  assert.match(publishLogic, /getMaterialDraft\(materialId\)/)
  assert.match(publishLogic, /onLoad\(options: Record<string, string \| undefined>\)/)
})

test('publish actions submit through the materials service', () => {
  const publishLogic = read('miniprogram/pages/materials/publish/index.ts')

  assert.match(publishLogic, /saveMaterialDraft\(this\.buildSubmitInput\(\)\)/)
  assert.match(publishLogic, /publishMaterial\(this\.buildSubmitInput\(\)\)/)
  assert.match(publishLogic, /this\.onPublishSuccess\(\)/)
  assert.doesNotMatch(publishLogic, /草稿功能待接入/)
  assert.doesNotMatch(publishLogic, /发表功能待接入/)
})

test('materials page shares ranking header layers and scroll fade', async () => {
  const markup = read('miniprogram/pages/materials/index.wxml')
  const logic = read('miniprogram/pages/materials/index.ts')
  const styles = read('miniprogram/pages/materials/index.less')
  const { calculateRankingHeaderOpacity } = await import('../miniprogram/utils/ranking.ts')

  assert.match(markup, /<view class="materials-page__base"><\/view>[\s\S]*?materials-page__status-glow[\s\S]*?class="materials-page__header"[^>]*>[\s\S]*?navigation-bar/)
  assert.match(markup, /background: rgba\(232, 237, 245, \{\{materialsHeaderOpacity\}\}\);/)
  assert.match(logic, /materialsHeaderOpacity: 0/)
  assert.match(logic, /calculateRankingHeaderOpacity\(event\.scrollTop\)/)
  assert.match(styles, /\.materials-page__header\s*\{[\s\S]*?position: sticky;[\s\S]*?top: 0;[\s\S]*?z-index: 1002;/)
  assert.match(styles, /\.materials-page__content\s*\{[\s\S]*?z-index: 1001;/)
  assert.match(styles, /\.materials-page__status-glow\s*\{[\s\S]*?position: fixed;[\s\S]*?z-index: 1000;/)
  assert.match(styles, /\.materials-page__base\s*\{[\s\S]*?z-index: 999;/)
  assert.equal(calculateRankingHeaderOpacity(0), 0)
  assert.equal(calculateRankingHeaderOpacity(25), 1)
})

test('home materials tab navigates to the materials page', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const homeLogic = read('miniprogram/pages/index/index.ts')

  assert.ok(app.pages.includes('pages/materials/index'))
  assert.match(homeLogic, /event\.detail\.id === 'materials'/)
  assert.match(homeLogic, /navigateTo\([\s\S]*?\/pages\/materials\/index/)
})

test('materials publish entry navigates to the publish page', () => {
  const markup = read('miniprogram/pages/materials/index.wxml')
  const logic = read('miniprogram/pages/materials/index.ts')
  const app = JSON.parse(read('miniprogram/app.json'))

  assert.ok(app.pages.includes('pages/materials/publish/index'))
  assert.match(markup, /bindtap="onPublishTap"/)
  assert.match(logic, /onPublishTap\(\)/)
  assert.match(logic, /navigateTo\([\s\S]*?\/pages\/materials\/publish/)
})

test('publish page supports nine images and unlimited copy input', () => {
  const pagePath = 'miniprogram/pages/materials/publish/index.wxml'
  const logicPath = 'miniprogram/pages/materials/publish/index.ts'
  const stylesPath = 'miniprogram/pages/materials/publish/index.less'

  assert.equal(existsSync(new URL(`../${pagePath}`, import.meta.url)), true)
  if (!existsSync(new URL(`../${pagePath}`, import.meta.url))) return

  const markup = read(pagePath)
  const logic = read(logicPath)
  const styles = read(stylesPath)

  assert.match(markup, /navigation-bar[^>]*back="\{\{true\}\}"/)
  assert.match(markup, /wx:for="\{\{images\}\}"/)
  assert.match(markup, /maxlength="-1"/)
  assert.match(markup, /添加文案/)
  assert.match(markup, /存草稿/)
  assert.match(markup, /发表/)
  assert.match(logic, /MAX_IMAGE_COUNT = 9/)
  assert.match(logic, /canAddImage: initialImages.length < MAX_IMAGE_COUNT/)
  assert.match(logic, /chooseImage/)
  assert.match(logic, /const count = MAX_IMAGE_COUNT - this\.data\.images\.length/)
  assert.match(logic, /count,/)
  assert.match(styles, /\.publish-page__image-slot\s*\{[\s\S]*?width: 140rpx;[\s\S]*?height: 140rpx;/)
  assert.match(styles, /\.publish-page__copy\s*\{[\s\S]*?min-height: 80rpx;/)
})

test('publish page starts empty and lets a selected image be removed', () => {
  const markup = read('miniprogram/pages/materials/publish/index.wxml')
  const logic = read('miniprogram/pages/materials/publish/index.ts')
  const styles = read('miniprogram/pages/materials/publish/index.less')

  assert.match(logic, /const initialImages: PublishImageViewModel\[\] = \[\s*\]/)
  assert.match(markup, /catchtap="onDeleteImageTap"/)
  assert.match(markup, /data-id="\{\{item\.id\}\}"/)
  assert.match(markup, /\/assets\/materials\/publish-delete\.svg/)
  assert.match(logic, /onDeleteImageTap\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(logic, /filter\(\(image\) => image\.id !== imageId\)/)
  assert.match(styles, /\.publish-page__image-delete\s*\{[\s\S]*?position: absolute;[\s\S]*?top: -6rpx;[\s\S]*?right: -6rpx;/)
  assert.equal(existsSync(new URL('../miniprogram/assets/materials/publish-delete.svg', import.meta.url)), true)
})

test('publish page exposes the Figma success modal state and share actions', () => {
  const markup = read('miniprogram/pages/materials/publish/index.wxml')
  const logic = read('miniprogram/pages/materials/publish/index.ts')
  const styles = read('miniprogram/pages/materials/publish/index.less')

  assert.match(markup, /wx:if="\{\{showPublishSuccessModal\}\}"/)
  assert.match(markup, /发布成功/)
  assert.match(markup, /快去分享给微信好友把/)
  assert.match(markup, /分享给好友/)
  assert.match(markup, /分享到朋友圈/)
  assert.match(markup, /bindtap="onPublishSuccessClose"/)
  assert.match(markup, /bindtap="onShareFriendsTap"/)
  assert.match(markup, /bindtap="onShareMomentsTap"/)
  assert.match(markup, /\/assets\/materials\/detail-share\.svg/)
  assert.match(markup, /\/assets\/materials\/detail-moments\.png/)
  assert.equal(existsSync(new URL('../miniprogram/assets/materials/detail-share.svg', import.meta.url)), true)
  assert.equal(existsSync(new URL('../miniprogram/assets/materials/detail-moments.png', import.meta.url)), true)
  assert.match(logic, /showPublishSuccessModal: false/)
  assert.match(logic, /onPublishSuccess\(\)/)
  assert.match(logic, /this\.setData\(\{ showPublishSuccessModal: true \}\)/)
  assert.match(styles, /\.publish-success-modal\s*\{[\s\S]*?position: fixed;/)
  assert.match(styles, /\.publish-success-modal__card\s*\{[\s\S]*?width: 706rpx;/)
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
