import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const loadPageDefinition = (path, dependencies = {}) => {
  const source = read(path)
    .replace(/^import[^\n]+\n/gm, '')
    .replace(/^Page\(/m, 'capturePage(')
  const executable = stripTypeScriptTypes(source, { mode: 'strip' })
  let definition = null
  const names = [...Object.keys(dependencies), 'capturePage']
  const values = [...Object.values(dependencies), (pageDefinition) => { definition = pageDefinition }]

  new Function(...names, executable)(...values)
  return definition
}

const getPngDimensions = (path) => {
  const bytes = readFileSync(new URL(`../${path}`, import.meta.url))
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

const getFileBytes = (directoryUrl) => readdirSync(directoryUrl, { withFileTypes: true }).reduce((total, entry) => {
  const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directoryUrl)
  return total + (entry.isDirectory() ? getFileBytes(entryUrl) : statSync(entryUrl).size)
}, 0)

test('home data layer exposes the new typed service seam', () => {
  const types = read('miniprogram/types/home.ts')
  const service = read('miniprogram/services/home.ts')

  assert.match(types, /export interface HomePageViewModel/)
  assert.match(types, /export interface HomeNotificationViewModel/)
  assert.match(types, /export interface HomeContentViewModel/)
  assert.match(service, /export function getHomePageData\(\): Promise<HomePageViewModel>/)
  assert.match(service, /\/analysis\/dashboard/)
  assert.match(service, /\/analysis\/intent\/list/)
  assert.match(service, /\/analysis\/content\/list/)
  assert.match(service, /from '\.\.\/mocks\/home'/)
  assert.match(service, /HOME_DATA_SOURCE/)
  assert.doesNotMatch(service, /TODO\(API\)/)
})

test('data access goes through the unified request layer', () => {
  const requestLayer = read('miniprogram/services/request.ts')

  assert.match(requestLayer, /wx\.request\(/)
  assert.match(requestLayer, /DEV_LAN_ORIGIN/)
  assert.match(requestLayer, /export function request</)
  assert.match(requestLayer, /export function ensureLogin/)
  assert.match(requestLayer, /\/wechat\/login/)

  for (const name of ['home', 'analysis', 'materials', 'notifications', 'ranking']) {
    const service = read(`miniprogram/services/${name}.ts`)
    assert.doesNotMatch(service, /wx\.request\(/, `${name} service must use the request layer`)
    if (!['home', 'analysis', 'notifications', 'materials', 'ranking'].includes(name)) {
      assert.doesNotMatch(service, /from '\.\.\/mocks\//, `${name} service must not import mocks`)
    }
  }
})

test('home style preview uses typed Figma mock data', () => {
  const mock = read('miniprogram/mocks/home.ts')
  const config = read('miniprogram/config/dev.ts')

  assert.match(mock, /getHomeStyleMock\(\): HomePageViewModel/)
  assert.match(mock, /unreadNotificationCount: 10/)
  assert.match(mock, /id: 'mock-notification-lin-xiaoman'/)
  assert.match(mock, /id: 'mock-material-ai-full-stack'/)
  assert.match(mock, /previewAvatars:/)
  assert.match(config, /HOME_DATA_SOURCE: 'mock' \| 'api' = 'mock'/)
})

test('home style preview exposes populated notification, content and summary data', async () => {
  const { getHomeStyleMock } = await import('../miniprogram/mocks/home.ts')

  const homeData = getHomeStyleMock()

  assert.equal(homeData.unreadNotificationCount, 10)
  assert.equal(homeData.notifications.length, 3)
  assert.equal(homeData.contents.length, 2)
  assert.deepEqual(homeData.today, {
    viewCount: '840',
    comparison: { label: '较昨日', value: '+30' },
    completeRate: '423',
    forwardCount: '21',
    viewerCount: '34',
  })
  assert.deepEqual(
    {
      total: homeData.intentSummary.total,
      highCount: homeData.intentSummary.highCount,
      mediumCount: homeData.intentSummary.mediumCount,
      lowCount: homeData.intentSummary.lowCount,
    },
    { total: '50', highCount: '12', mediumCount: '18', lowCount: '20' },
  )
})

test('viewing a home notification removes only that preview card and decrements its unread badge', async () => {
  const { getHomeStyleMock } = await import('../miniprogram/mocks/home.ts')
  const { markHomeNotificationViewed } = await import('../miniprogram/pages/index/home-notification-preview.ts')

  const homeData = getHomeStyleMock()
  const viewedNotificationId = 'mock-notification-lin-xiaoman'
  const nextHomeData = markHomeNotificationViewed(homeData, viewedNotificationId)

  assert.equal(nextHomeData.unreadNotificationCount, 9)
  assert.equal(nextHomeData.notifications.length, 2)
  assert.equal(nextHomeData.notifications.some((notification) => notification.id === viewedNotificationId), false)
  assert.equal(homeData.unreadNotificationCount, 10)
  assert.equal(homeData.notifications.length, 3)
})

test('notification tab retains every home preview record after it is viewed', async () => {
  const { getHomeStyleMock } = await import('../miniprogram/mocks/home.ts')
  const { getNotificationsMock } = await import('../miniprogram/mocks/notifications.ts')

  const homeData = getHomeStyleMock()
  const notificationUserIds = new Set(getNotificationsMock().groups.flatMap((group) => group.items.map((item) => item.userId)))

  for (const notification of homeData.notifications) {
    assert.equal(notificationUserIds.has(notification.userId), true)
  }
})

test('home empty preview exposes the complete zero-data view model', async () => {
  const { getHomeEmptyMock } = await import('../miniprogram/mocks/home.ts')

  const homeData = getHomeEmptyMock()

  assert.equal(homeData.unreadNotificationCount, 0)
  assert.deepEqual(homeData.notifications, [])
  assert.deepEqual(homeData.contents, [])
  assert.deepEqual(
    {
      total: homeData.intentSummary.total,
      highCount: homeData.intentSummary.highCount,
      mediumCount: homeData.intentSummary.mediumCount,
      lowCount: homeData.intentSummary.lowCount,
    },
    { total: '0', highCount: '0', mediumCount: '0', lowCount: '0' },
  )
  assert.equal(homeData.intentSummary.previewAvatars.length, 5)
  assert.deepEqual(homeData.today, {
    viewCount: '0',
    completeRate: '0',
    forwardCount: '0',
    viewerCount: '0',
  })
})

test('home greeting follows the device local time', async () => {
  const { getHomeGreeting } = await import('../miniprogram/utils/greeting.ts')
  const cases = [
    [5, '早上好'],
    [12, '中午好'],
    [14, '下午好'],
    [19, '晚上好'],
  ]

  for (const [hour, expected] of cases) {
    assert.equal(getHomeGreeting(new Date(2026, 0, 1, hour)), expected)
  }
})

test('home page declares the new Figma sections and state branches', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const component = read('miniprogram/components/home-profile/index.wxml')
  const logic = read('miniprogram/pages/index/index.ts')
  const styles = read('miniprogram/pages/index/index.less')

  assert.match(page, /class="home-page"/)
  assert.match(page, /class="home-hero"/)
  assert.match(page, /class="home-notification-card"/)
  assert.match(page, /class="home-section home-section--notifications"[\s\S]*<text class="home-section__title">互动消息<\/text>/)
  assert.doesNotMatch(page, /class="home-section home-section--notifications"[\s\S]*<text class="home-section__title">实时通知<\/text>/)
  assert.match(page, /class="home-content-card"/)
  assert.match(page, /class="home-intent-card"/)
  assert.match(page, /class="home-today-card"/)
  assert.match(logic, /greetingSubtitle: '今日阳光明媚，祝你好运☀️'/)
  assert.match(page, /wx:if="\{\{isLoading\}\}"/)
  assert.match(page, /wx:elif="\{\{loadError\}\}"/)
  assert.match(page, /bindtap="onRetryTap"/)
  assert.match(logic, /getHomePageData\(\)/)
  assert.match(logic, /greetingHeadline: getHomeGreeting\(\)/)
  assert.match(logic, /this\.setData\(\{ greetingHeadline: getHomeGreeting\(\) \}\)/)
  assert.match(styles, /\.home-hero__headline \{[\s\S]*font-size: 44rpx;[\s\S]*font-weight: 500;[\s\S]*line-height: 68rpx;/)
  assert.match(styles, /\.home-hero__subtitle \{[\s\S]*font-size: 44rpx;[\s\S]*font-weight: 500;[\s\S]*line-height: 68rpx;/)
})

test('home hero aligns the greeting and notification start with Figma 619:9173', () => {
  const styles = read('miniprogram/pages/index/index.less')

  assert.match(styles, /\.home-hero \{[\s\S]*height: 520rpx;/)
  assert.match(styles, /\.home-hero__copy \{[\s\S]*top: 310rpx;/)
})

test('home summary cards open the matching analysis tabs', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const logic = read('miniprogram/pages/index/index.ts')

  assert.match(page, /class="home-intent-card" bindtap="onIntentSummaryTap"/)
  assert.match(page, /class="home-today-card" bindtap="onTodayDataTap"/)
  assert.match(logic, /onIntentSummaryTap\(\) \{[\s\S]*this\.setActiveTab\(3\)[\s\S]*this\.setAnalysisTab\(1\)/)
  assert.match(logic, /onTodayDataTap\(\) \{[\s\S]*this\.setActiveTab\(3\)[\s\S]*this\.setAnalysisTab\(2\)/)
})

test('home today data opens total analysis with the day period selected', () => {
  const page = loadPageDefinition('miniprogram/pages/index/index.ts', {
    getHomeGreeting: () => '',
    getDefaultDateRange: () => ({ startDate: '2026-08-20', endDate: '2026-08-26' }),
    getDateRangeLimits: () => ({ minDate: '2026-06-26', maxDate: '2026-08-26' }),
  })
  const calls = []
  const context = {
    data: { analysisData: {} },
    setData(update) { Object.assign(this.data, update) },
    setActiveTab(index) { calls.push(['tab', index]) },
    setAnalysisTab(index) { calls.push(['analysis', index]) },
    loadAnalysis(period) { calls.push(['period', period]) },
  }

  page.onTodayDataTap.call(context)

  assert.equal(context.data.activeTotalPeriod, 'day')
  assert.equal(context.data.activeAnalysisReadRange, 'week')
  assert.deepEqual(calls, [['tab', 3], ['analysis', 2], ['period', 'day']])
})

test('home today data card follows Figma 478:1262', async () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const styles = read('miniprogram/pages/index/index.less')
  const { getHomeStyleMock } = await import('../miniprogram/mocks/home.ts')

  assert.deepEqual(getHomeStyleMock().today.comparison, { label: '较昨日', value: '+30' })
  assert.equal(existsSync(new URL('../miniprogram/assets/analysis/total-metric-divider.svg', import.meta.url)), true)
  assert.match(page, /class="home-today-card__metadata"/)
  assert.match(page, /<text>完播数<\/text>/)
  assert.match(page, /wx:if="\{\{homeData\.today\.comparison\}\}" class="home-today-card__comparison"/)
  assert.match(page, /class="home-today-card__comparison-divider" src="\/assets\/analysis\/total-metric-divider\.svg"/)
  assert.match(styles, /\.home-today-card__primary \{[\s\S]*gap: 8rpx;/)
  assert.match(styles, /\.home-today-card__comparison \{[\s\S]*gap: 0;[\s\S]*color: @home-muted-light;[\s\S]*font-size: 24rpx;/)
  assert.match(styles, /\.home-today-card__comparison-divider \{[\s\S]*width: 2rpx;[\s\S]*height: 14rpx;/)
  assert.match(styles, /\.home-today-card__comparison-value \{[\s\S]*color: @home-accent;/)
  assert.match(styles, /\.home-today-card__metrics \{[\s\S]*margin-top: 40rpx;/)
  assert.match(styles, /\.home-today-metric \{[\s\S]*gap: 8rpx;[\s\S]*width: 187rpx;/)
})

test('home today data includes high, medium and low intent metrics', async () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const styles = read('miniprogram/pages/index/index.less')
  const { getHomeStyleMock } = await import('../miniprogram/mocks/home.ts')

  assert.match(page, /class="home-today-card__metrics home-today-card__intent-metrics"[\s\S]*class="home-today-metric__value">\{\{homeData\.intentSummary\.highCount\}\}<\/text><text>高意向[\s\S]*class="home-today-metric__value">\{\{homeData\.intentSummary\.mediumCount\}\}<\/text><text>中意向[\s\S]*class="home-today-metric__value">\{\{homeData\.intentSummary\.lowCount\}\}<\/text><text>低意向/)
  assert.match(styles, /\.home-today-card__intent-metrics \{[\s\S]*margin-top: 40rpx;/)
  assert.deepEqual(
    [getHomeStyleMock().intentSummary.highCount, getHomeStyleMock().intentSummary.mediumCount, getHomeStyleMock().intentSummary.lowCount],
    ['12', '18', '20'],
  )
})

test('home today-most records open their content analysis details', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const navigatedUrls = []
  const homePage = loadPageDefinition('miniprogram/pages/index/index.ts', {
    getHomeGreeting: () => '',
    getDefaultDateRange: () => ({ startDate: '2026-08-20', endDate: '2026-08-26' }),
    getDateRangeLimits: () => ({ minDate: '2026-06-26', maxDate: '2026-08-26' }),
    wx: {
      navigateTo: ({ url }) => navigatedUrls.push(url),
    },
  })

  assert.match(page, /class="home-section__more" bindtap="onTabTap" data-id="analysis">查看更多/)
  assert.match(page, /class="home-content-card__item" data-id="\{\{item\.id\}\}" bindtap="onTodayMostItemTap"/)
  assert.doesNotMatch(page, /class="home-content-card" bindtap="onTodayMostTap"/)

  homePage.onTodayMostItemTap({ currentTarget: { dataset: { id: 'mock-material-ai-full-stack' } } })

  assert.deepEqual(navigatedUrls, ['/pages/analysis-detail/index?id=mock-material-ai-full-stack'])
})

test('home empty state follows Figma 486:2569', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const styles = read('miniprogram/pages/index/index.less')

  assert.match(page, /class="home-empty home-empty--notification(?: home-notification-empty-card)?"[\s\S]*暂时还没有人浏览你的作品/)
  assert.match(page, /class="home-content-card home-content-card--empty"[\s\S]*还没有作品，你可以发布一个[\s\S]*立即发布/)
  assert.match(page, /class="home-section home-section--ranking"><view class="home-section__header"><text class="home-section__title">排行榜<\/text><\/view><view class="home-ranking-entry" bindtap="onRankingEntryTap"/)
  assert.doesNotMatch(page, /home-section--ranking" wx:if=/)
  assert.match(page, /今日有个新增用户/)
  assert.match(page, /src="\/assets\/analysis\/empty-state-cloud\.png"/)
  assert.match(styles, /\.home-empty--notification \{[\s\S]*height: 172rpx;[\s\S]*gap: 20rpx;/)
  assert.match(styles, /\.home-content-card--empty \{[\s\S]*padding: 30rpx 40rpx;/)
  assert.match(styles, /\.home-empty-publish \{[\s\S]*height: 64rpx;[\s\S]*background: @home-accent;/)
})

test('home real-time notification empty card follows Figma 611:9128', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const styles = read('miniprogram/pages/index/index.less')

  assert.match(page, /class="home-empty home-empty--notification home-notification-empty-card"/)
  assert.match(page, /class="home-notification-empty-card__cloud" src="\/assets\/analysis\/empty-state-cloud\.png"/)
  assert.match(page, /class="home-notification-empty-card__message">暂时还没有人浏览你的作品/)
  assert.match(styles, /\.home-notification-empty-card \{[\s\S]*border: 2rpx solid #f0f0f0;[\s\S]*border-radius: 40rpx;[\s\S]*background: #ffffff;[\s\S]*box-shadow: 0 4rpx 20rpx rgba\(0, 0, 0, 0\.03\);/)
  assert.match(styles, /\.home-notification-empty-card__cloud \{[\s\S]*width: 78rpx;[\s\S]*height: 78rpx;/)
  assert.match(styles, /\.home-notification-empty-card__message \{[\s\S]*color: #8a8e94;[\s\S]*font-size: 26rpx;/)
})

test('home page wires the intended navigation actions', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const logic = read('miniprogram/pages/index/index.ts')

  assert.match(page, /bindtap="onNotificationTap"/)
  assert.match(page, /class="home-notification-card" data-id="\{\{item\.id\}\}" data-user-id="\{\{item\.userId\}\}" bindtap="onNotificationTap"/)
  assert.match(page, /class="home-section__more" bindtap="onTabTap" data-id="notifications">查看更多/)
  assert.match(page, /bindtap="onTodayMostItemTap"/)
  assert.match(page, /bind:plus="onPlusTap"/)
  assert.match(logic, /pages\/analysis-user-detail\/index\?id=/)
  assert.match(logic, /const id = event\.detail\?\.id \?\? \(event\.currentTarget\.dataset\.id as HomeTabId \| undefined\)/)
  assert.doesNotMatch(page, /class="home-content-card" bindtap="onTodayMostTap"/)
  assert.match(logic, /getMaterials\(\)/)
  assert.match(logic, /getNotifications\(\)/)
  assert.match(logic, /getAnalysisOverview\(/)
  assert.doesNotMatch(logic, /onTabTap[\s\S]*pages\/notifications\/notifications/)
  assert.doesNotMatch(logic, /onTabTap[\s\S]*pages\/analysis\/index/)
})

test('home bottom navigation switches primary pages without a swipe container', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const logic = read('miniprogram/pages/index/index.ts')
  const config = read('miniprogram/pages/index/index.json')

  assert.match(page, /<view class="home-page__tabs">/)
  assert.doesNotMatch(page, /<swiper class="home-page__tabs"/)
  assert.match(page, /class="home-page__tab-panel" hidden="\{\{activeTabIndex !== 0\}\}"/)
  assert.match(page, /class="home-page__tab-panel home-page__notification-panel" hidden="\{\{activeTabIndex !== 1\}\}"/)
  assert.match(page, /class="home-page__tab-panel home-page__analysis-panel" hidden="\{\{activeTabIndex !== 3\}\}"/)
  assert.match(page, /<notification-header[\s\S]*bind:filtertap="onNotificationFilterTap"/)
  assert.match(page, /<home-analysis[\s\S]*bind:periodtap="onAnalysisPeriodTap"/)
  assert.match(page, /<home-profile profile="\{\{profileData\}\}" \/>/)
  assert.match(logic, /activeTabIndex: 0/)
  assert.doesNotMatch(logic, /onTabChange/)
  assert.match(logic, /activeTabIndex: nextIndex/)
  assert.doesNotMatch(logic, /event.detail.id === 'notifications'[\s\S]*navigateTo/)
  assert.doesNotMatch(logic, /event.detail.id === 'analysis'[\s\S]*navigateTo/)
  assert.match(config, /home-notifications/)
  assert.match(config, /home-analysis/)
})

test('profile tab exposes the Figma 519:5031 structure through a typed service seam', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const logic = read('miniprogram/pages/index/index.ts')
  const config = read('miniprogram/pages/index/index.json')
  const types = read('miniprogram/types/profile.ts')
  const service = read('miniprogram/services/profile.ts')
  const mock = read('miniprogram/mocks/profile.ts')
  const component = read('miniprogram/components/home-profile/index.wxml')

  assert.match(types, /export interface ProfilePageViewModel/)
  assert.match(service, /export function getProfilePageData\(\): Promise<ProfilePageViewModel>/)
  assert.match(service, /from '\.\.\/mocks\/profile'/)
  assert.match(mock, /balance: '870\.39'/)
  assert.match(mock, /avatarUrl: '\/assets\/profile\/profile-avatar\.png'/)
  assert.match(mock, /pendingTitle: '尽情期待'/)
  assert.match(mock, /pendingDescription: '更多功能，即将呈现'/)
  assert.match(config, /bottom-tab-bar/)
  assert.match(component, /class="home-profile"/)
  assert.match(component, /class="home-profile__balance"/)
  assert.match(component, /class="home-profile__membership"/)
  assert.match(logic, /getProfilePageData\(\)/)
})

test('profile pending module centers the Figma 594:8711 content group', () => {
  const component = read('miniprogram/components/home-profile/index.wxml')
  const styles = read('miniprogram/components/home-profile/index.less')

  assert.match(component, /class="home-profile__pending" data-node-id="594:8711"/)
  assert.match(styles, /.home-profile__pending \{[\s\S]*width: 252rpx;[\s\S]*align-items: center;/)
  assert.match(styles, /.home-profile__pending \{[\s\S]*margin: 16rpx auto 0;/)
  assert.match(styles, /.home-profile__pending-button \{[\s\S]*padding: 0 48rpx;[\s\S]*border-radius: 84rpx;/)
})

test('profile pending module stays above the locked content overlay', () => {
  const styles = read('miniprogram/components/home-profile/index.less')

  assert.match(styles, /.home-profile__locked-overlay \{[\s\S]*z-index: 2;/)
  assert.match(styles, /.home-profile__locked-overlay \{[\s\S]*top: 442rpx;/)
  assert.match(styles, /.home-profile__content \{[\s\S]*z-index: auto;/)
  assert.match(styles, /.home-profile__pending \{[\s\S]*position: relative;[\s\S]*z-index: 3;/)
})

test('home analysis passes the selected analysis tab to its content view', () => {
  const page = read('miniprogram/pages/index/index.wxml')

  assert.match(page, /<home-analysis[\s\S]*active-analysis-tab="\{\{activeAnalysisTab\}\}"/)
})

test('home navigation title and background fade in over 100px of scroll', async () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const logic = read('miniprogram/pages/index/index.ts')
  const styles = read('miniprogram/pages/index/index.less')
  const { getHomeHeaderOpacity } = await import('../miniprogram/utils/home-header.ts')

  assert.match(page, /<scroll-view scroll-y class="home-page__tab-scroll" bindscroll="onHomeScroll">/)
  assert.match(page, /<navigation-bar back="\{\{false\}\}" title="首页" color="rgba\(0,0,0, \{\{homeHeaderOpacity\}\}\)"/)
  assert.match(page, /background="rgba\(255,255,255, \{\{homeHeaderOpacity\}\}\)"/)
  assert.match(logic, /homeHeaderOpacity: 0/)
  assert.match(logic, /onHomeScroll\(event: WechatMiniprogram\.ScrollViewScrollEvent\)/)
  assert.equal(getHomeHeaderOpacity(0), 0)
  assert.equal(getHomeHeaderOpacity(50), 0.5)
  assert.equal(getHomeHeaderOpacity(100), 1)
  assert.equal(getHomeHeaderOpacity(180), 1)
  assert.match(styles, /\.home-page__hero-background\s*\{[^}]*position: fixed;/)
})

test('primary page backgrounds stay fixed while first-screen content pulls down', () => {
  const materialsStyles = read('miniprogram/pages/materials/index.less')
  const rankingStyles = read('miniprogram/pages/ranking/index.less')
  const profileStyles = read('miniprogram/components/home-profile/index.less')

  assert.match(materialsStyles, /\.materials-page__base\s*\{[^}]*position: fixed;/)
  assert.match(materialsStyles, /\.materials-page__status-glow\s*\{[^}]*position: fixed;/)
  assert.match(rankingStyles, /\.ranking-page__base\s*\{[^}]*position: fixed;/)
  assert.match(rankingStyles, /\.ranking-page__status-glow\s*\{[^}]*position: fixed;/)
  assert.match(profileStyles, /\.home-profile__stripes\s*\{[^}]*position: fixed;/)
})

test('home page places a high-resolution ranking entry between notifications and today-most', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const logic = read('miniprogram/pages/index/index.ts')
  const styles = read('miniprogram/pages/index/index.less')

  const notificationsIndex = page.indexOf('home-section--notifications')
  const rankingIndex = page.indexOf('home-section--ranking')
  const todayMostIndex = page.indexOf('今日浏览最多')

  assert.ok(notificationsIndex >= 0)
  assert.ok(rankingIndex > notificationsIndex)
  assert.ok(todayMostIndex > rankingIndex)
  assert.match(page, /class="home-ranking-entry" bindtap="onRankingEntryTap"/)
  assert.match(page, /src="\/assets\/ranking\/ranking-title\.png"/)
  assert.match(page, /src="\/assets\/ranking\/ranking-trophy\.png"/)
  assert.match(page, /看看谁的内容更受欢迎/)
  assert.match(logic, /onRankingEntryTap()[\s\S]*pages\/ranking\/index/)
  assert.match(styles, /\.home-ranking-entry \{[\s\S]*height: 200rpx;[\s\S]*border-radius: 40rpx;/)
  assert.match(styles, /\.home-ranking-entry__subtitle \{[\s\S]*white-space: nowrap;/)

  const title = getPngDimensions('miniprogram/assets/ranking/ranking-title.png')
  const trophy = getPngDimensions('miniprogram/assets/ranking/ranking-trophy.png')
  assert.ok(title.width >= 576 && title.height >= 150, 'ranking title should be a 3x-or-higher asset')
  assert.ok(trophy.width >= 294 && trophy.height >= 351, 'ranking trophy should be a 3x-or-higher asset')
})

test('ranking reuses the profile striped background and fades its content to white', () => {
  const markup = read('miniprogram/pages/ranking/index.wxml')
  const styles = read('miniprogram/pages/ranking/index.less')

  assert.match(markup, /<view class="ranking-page__status-glow" \/>/)
  assert.doesNotMatch(markup, /ranking-stripes\.svg/)
  assert.match(styles, /@ranking-background: #ffffff;/)
  assert.match(styles, /\.ranking-page__status-glow \{[\s\S]*left: 4rpx;[\s\S]*height: 260rpx;[\s\S]*background: repeating-linear-gradient\(90deg, transparent 0 4rpx, #f0f0f0 4rpx 8rpx\);[\s\S]*mask-image: linear-gradient\(180deg, #000000 0%, rgba\(0, 0, 0, 0\) 100%\);[\s\S]*opacity: 0\.9;/)
  assert.match(styles, /\.ranking-page__content \{[\s\S]*background: linear-gradient\(180deg, rgba\(255, 255, 255, 0\) 0%, #ffffff 13\.976%, #ffffff 100%\);/)
  assert.match(styles, /\.ranking-panel \{[\s\S]*padding: 40rpx;[\s\S]*border: 2rpx solid @content-box-border;[\s\S]*border-radius: 40rpx;[\s\S]*background: #ffffff;[\s\S]*box-shadow: 0 4rpx 20rpx rgba\(0, 0, 0, 0\.03\);/)
  assert.match(markup, /class="ranking-panel \{\{hasRankingEntries \? '' : 'ranking-panel--empty'\}\}"/)
  assert.match(styles, /\.ranking-page \{[\s\S]*display: flex;[\s\S]*flex-direction: column;/)
  assert.match(styles, /\.ranking-page__content \{[\s\S]*display: flex;[\s\S]*flex: 1;[\s\S]*flex-direction: column;[\s\S]*padding: 70rpx 40rpx 48rpx;/)
  assert.match(styles, /\.ranking-panel--empty \{[\s\S]*flex: 1;/)
  assert.match(styles, /\.ranking-list \{[\s\S]*margin-top: 20rpx;/)
})

test('content cards share the global EBEBEB border token', () => {
  const appStyles = read('miniprogram/app.less')
  const homeStyles = read('miniprogram/pages/index/index.less')
  const notificationStyles = read('miniprogram/pages/notifications/notifications.less')
  const profileStyles = read('miniprogram/components/home-profile/index.less')
  const analysisStyles = read('miniprogram/pages/analysis/index.less')
  const detailStyles = read('miniprogram/pages/analysis-detail/index.less')
  const userDetailStyles = read('miniprogram/pages/analysis-user-detail/index.less')
  const materialStyles = read('miniprogram/pages/materials/index.less')

  assert.match(appStyles, /@content-box-border: #ebebeb;/)
  assert.match(homeStyles, /@home-border: @content-box-border;/)
  assert.match(notificationStyles, /@notification-card-border: @content-box-border;/)
  assert.match(profileStyles, /\.home-profile__balance \{[\s\S]*border: 1px solid @content-box-border;/)
  assert.match(analysisStyles, /\.analysis-user__summary-card \{[\s\S]*border: 2rpx solid @content-box-border;/)
  assert.match(analysisStyles, /\.analysis-total__overview-item \{[\s\S]*border: 2rpx solid @content-box-border;/)
  assert.match(detailStyles, /\.detail-card \{[^}]*border: 2rpx solid @content-box-border;/)
  assert.match(userDetailStyles, /\.user-detail__profile-card \{[\s\S]*border: 2rpx solid @content-box-border;/)
  assert.match(materialStyles, /\.materials-card__info \{[\s\S]*border: 2rpx solid @content-box-border;/)
})

test('ranking and analysis periods use the shared segmented filter control', () => {
  const rankingMarkup = read('miniprogram/pages/ranking/index.wxml')
  const rankingConfig = JSON.parse(read('miniprogram/pages/ranking/index.json'))
  const analysisMarkup = read('miniprogram/pages/analysis/index.wxml')
  const analysisConfig = JSON.parse(read('miniprogram/pages/analysis/index.json'))
  const componentMarkup = read('miniprogram/components/segmented-filter/index.wxml')
  const componentLogic = read('miniprogram/components/segmented-filter/index.ts')
  const componentStyles = read('miniprogram/components/segmented-filter/index.less')

  assert.equal(rankingConfig.usingComponents['segmented-filter'], '/components/segmented-filter/index')
  assert.equal(analysisConfig.usingComponents['segmented-filter'], '/components/segmented-filter/index')
  assert.match(rankingMarkup, /<segmented-filter items="\{\{rankingTabs\}\}" active-id="\{\{activeRankingMetric\}\}" bind:change="onRankingTabTap" \/>/)
  assert.match(analysisMarkup, /<segmented-filter items="\{\{analysisPeriods\}\}" active-id="\{\{activePeriod\}\}" item-width="68" bind:change="onPeriodTap" \/>/)
  assert.match(componentMarkup, /wx:for="\{\{items\}\}"/)
  assert.match(componentMarkup, /bindtap="onItemTap"/)
  assert.match(componentLogic, /triggerEvent\('change', \{ id, index \}\)/)
  assert.match(componentStyles, /height: 64rpx;/)
  assert.match(componentStyles, /padding: @segmented-filter-vertical-inset;/)
  assert.match(componentStyles, /top: @segmented-filter-vertical-inset;/)
  assert.match(componentStyles, /bottom: @segmented-filter-vertical-inset;/)
})

test('ranking preview uses the fixed Figma leaderboard mock and sorts each metric', async () => {
  const { getRankingStyleMock } = await import('../miniprogram/mocks/ranking.ts')
  const service = read('miniprogram/services/ranking.ts')

  const ranking = getRankingStyleMock()

  assert.match(service, /from '\.\.\/mocks\/ranking'/)
  assert.match(service, /return Promise\.resolve\(getRankingStyleMock\(\)\)/)
  assert.equal(ranking.entries.length, 8)
  assert.deepEqual(ranking.entries.map((entry) => [entry.name, entry.views]), [
    ['快乐小鹅', 20984],
    ['来财来财', 18930],
    ['金钱豹到', 18032],
    ['恭喜暴富', 16098],
    ['给个生活比个耶', 15093],
    ['你瞅啥', 14093],
    ['橘里橘气', 12938],
    ['黑色幽默', 11098],
  ])
  assert.deepEqual([...ranking.entries].sort((left, right) => right.shares - left.shares).slice(0, 3).map((entry) => [entry.name, entry.shares]), [
    ['黑色幽默', 1120],
    ['快乐小鹅', 980],
    ['给个生活比个耶', 860],
  ])
  assert.deepEqual([...ranking.entries].sort((left, right) => right.completions - left.completions).slice(0, 3).map((entry) => [entry.name, entry.completions]), [
    ['来财来财', 920],
    ['恭喜暴富', 880],
    ['快乐小鹅', 840],
  ])
})

test('new homepage assets are local and sized for the target frame', () => {
  const assets = [
    'miniprogram/assets/home-new/home-hero-glow.svg',
    'miniprogram/assets/home-new/today-most-01.jpg',
    'miniprogram/assets/home-new/today-most-02.jpg',
    'miniprogram/assets/home-new/action-forward.svg',
    'miniprogram/assets/home-new/action-reading.svg',
    'miniprogram/assets/home-new/tab-home.svg',
    'miniprogram/assets/home-new/tab-home-active.svg',
    'miniprogram/assets/home-new/tab-notification.svg',
    'miniprogram/assets/home-new/tab-notification-active.svg',
    'miniprogram/assets/home-new/tab-analysis.svg',
    'miniprogram/assets/home-new/tab-analysis-active.svg',
    'miniprogram/assets/home-new/tab-profile.svg',
    'miniprogram/assets/home-new/tab-profile-active.svg',
    'miniprogram/assets/home-new/tab-publish-frame-61.svg',
    'miniprogram/assets/home-new/bottom-nav-scrim.svg',
    'miniprogram/assets/home-new/intent-avatar-01.png',
    'miniprogram/assets/home-new/intent-avatar-02.png',
    'miniprogram/assets/home-new/intent-avatar-03.png',
    'miniprogram/assets/home-new/intent-avatar-04.png',
    'miniprogram/assets/home-new/intent-avatar-05.png',
  ]

  for (const asset of assets) {
    assert.equal(existsSync(new URL(`../${asset}`, import.meta.url)), true, asset)
  }
})

test('home hero uses the supplied glow SVG instead of the cat illustration', () => {
  const markup = read('miniprogram/pages/index/index.wxml')
  const styles = read('miniprogram/pages/index/index.less')

  assert.match(markup, /class="home-hero__glow" src="\/assets\/home-new\/home-hero-glow\.svg"/)
  assert.doesNotMatch(markup, /hero-lounge\.png/)
  assert.doesNotMatch(markup, /home-hero__image-frame/)
  assert.match(styles, /\.home-hero__glow \{[\s\S]*position: absolute;[\s\S]*width: 538rpx;[\s\S]*height: 538rpx;/)
})

test('bottom navigation matches the new floating Figma treatment', () => {
  const component = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.wxml')
  const logic = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.ts')
  const styles = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.less')

  assert.match(component, /wx:for="\{\{items\}\}"/)
  assert.match(component, /class="bottom-tab-bar__icon" src="\{\{item\.active \? item\.activeIconPath : item\.iconPath\}\}"/)
  assert.doesNotMatch(component, /bottom-tab-bar__analysis-icon/)
  assert.match(component, /class="bottom-tab-bar__create-icon"/)
  assert.doesNotMatch(styles, /bottom-tab-bar__plus/)
  assert.match(component, /bindtap="onPlusTap"/)
  assert.match(component, /wx:if="\{\{item\.badgeCount\}\}"/)
  assert.match(logic, /triggerEvent\('tabtap'/)
  assert.match(logic, /triggerEvent\('plus'/)
  assert.match(styles, /position: fixed;/)
  assert.match(component, /bottom-tab-bar \{\{isAndroid \? 'bottom-tab-bar--android' : ''\}\}/)
  assert.match(logic, /wx\.getSystemInfoSync\(\)/)
  assert.match(logic, /isAndroid: platform === 'android' \|\| platform === 'devtools'/)
  assert.match(styles, /bottom: max\(24px, env\(safe-area-inset-bottom\)\);/)
  assert.match(styles, /\.bottom-tab-bar--android \.bottom-tab-bar__inner\s*\{[\s\S]*bottom: 16px;/)
  assert.match(styles, /border-radius: 112rpx;/)
  assert.doesNotMatch(styles, /backdrop-filter: blur\(7\.7px\);/)
  assert.match(styles, /background: rgba\(255, 255, 255, 0\.4\);/)
  assert.match(styles, /backdrop-filter: blur\(5px\);/)
  assert.match(component, /bottom-nav-scrim\.svg/)
  assert.match(styles, /width: 40rpx;/)
})

test('bottom navigation uses selected cyan states and the supplied publish icon', () => {
  const component = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.wxml')
  const logic = read('miniprogram/pages/index/index.ts')
  const styles = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.less')

  assert.match(component, /src="\{\{item\.active \? item\.activeIconPath : item\.iconPath\}\}"/)
  assert.match(component, /class="bottom-tab-bar__create-icon" src="\/assets\/home-new\/tab-publish-frame-61\.svg"/)
  const publishIcon = read('miniprogram/assets/home-new/tab-publish-frame-61.svg')
  assert.match(component, /class="bottom-tab-bar__label">发布<\/text>/)
  assert.match(logic, /activeIconPath: '\/assets\/home-new\/tab-home-active\.svg'/)
  assert.match(logic, /activeIconPath: '\/assets\/home-new\/tab-notification-active\.svg'/)
  assert.match(logic, /activeIconPath: '\/assets\/home-new\/tab-analysis-active\.svg'/)
  assert.match(logic, /activeIconPath: '\/assets\/home-new\/tab-profile-active\.svg'/)
  assert.match(styles, /\.bottom-tab-bar__create \{[\s\S]*flex-direction: column;[\s\S]*gap: 2rpx;/)
  assert.match(styles, /\.bottom-tab-bar__create-icon \{[\s\S]*width: 48rpx;[\s\S]*height: 48rpx;/)
  assert.doesNotMatch(styles, /\.bottom-tab-bar__item--active \{[\s\S]*background: #e0e0e0;/)
  assert.match(styles, /\.bottom-tab-bar__label \{[\s\S]*color: #666666;/)
  assert.match(styles, /\.bottom-tab-bar__item--active \.bottom-tab-bar__label \{[\s\S]*color: #0ec8d9;/)
  assert.match(publishIcon, /width="20" height="20"/)
  assert.match(publishIcon, /fill="#666666"/)
})

test('bottom navigation slides one shared selection surface to the tapped destination', () => {
  const component = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.wxml')
  const logic = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.ts')
  const styles = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.less')

  assert.match(component, /class="bottom-tab-bar__selection" style="transform: translateX\(\{\{activeIndicatorOffset\}\}\);"/)
  assert.match(logic, /activeIndicatorIndex: 0/)
  assert.match(logic, /activeIndicatorOffset: '0%'/)
  assert.match(logic, /activeIndicatorIndex[\s\S]*plusActive[\s\S]*findIndex/)
  assert.match(styles, /\.bottom-tab-bar__selection \{[\s\S]*position: absolute;[\s\S]*width: calc\(\(100% - 16rpx\) \/ 5\);[\s\S]*background: #e0e0e0;[\s\S]*transition: transform 220ms ease-out;/)
  assert.match(styles, /\.bottom-tab-bar__item,\n\.bottom-tab-bar__create \{[\s\S]*position: relative;/)
})

test('bottom navigation provides light haptic feedback for tab and publish taps', () => {
  const logic = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.ts')

  assert.match(logic, /onTabTap\(event[\s\S]*wx\.vibrateShort\(\{ type: 'light' \}\)[\s\S]*triggerEvent\('tabtap'/)
  assert.match(logic, /onPlusTap\(\)[\s\S]*wx\.vibrateShort\(\{ type: 'light' \}\)[\s\S]*triggerEvent\('plus'/)
})

test('publish navigation receives the same selected state as the other root tabs', () => {
  const component = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.wxml')
  const styles = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.less')
  const page = read('miniprogram/pages/materials/index.wxml')
  const logic = read('miniprogram/pages/materials/index.ts')
  const activePublishIcon = read('miniprogram/assets/home-new/tab-publish-active.svg')

  assert.match(component, /plusActive/)
  assert.match(component, /bottom-tab-bar__create--active/)
  assert.match(component, /tab-publish-active\.svg/)
  assert.doesNotMatch(styles, /\.bottom-tab-bar__create--active\s*\{[\s\S]*background: #e0e0e0;/)
  assert.match(styles, /\.bottom-tab-bar__create--active \.bottom-tab-bar__label\s*\{[\s\S]*color: #0ec8d9;/)
  assert.doesNotMatch(styles, /\.bottom-tab-bar__create--active \.bottom-tab-bar__create-icon\s*\{[\s\S]*filter:/)
  assert.match(page, /plus-active="\{\{true\}\}"/)
  assert.match(logic, /id: 'home'[\s\S]*active: false/)
  assert.match(activePublishIcon, /fill="#0EC8D9"/)
  assert.match(activePublishIcon, /fill="white"/)
})

test('notification screen follows the revised Figma 486:1850 card treatment', () => {
  const appStyles = read('miniprogram/app.less')
  const page = read('miniprogram/pages/notifications/notifications.wxml')
  const component = read('miniprogram/components/home-notifications/index.wxml')
  const header = read('miniprogram/components/notification-header/index.wxml')
  const styles = read('miniprogram/pages/notifications/notifications.less')
  const service = read('miniprogram/services/notifications.ts')
  const types = read('miniprogram/types/notifications.ts')
  const config = JSON.parse(read('miniprogram/pages/notifications/notifications.json'))

  assert.match(page, /<notification-header filters="\{\{notifications\.filters\}\}"/)
  assert.match(page, /<bottom-tab-bar items="\{\{tabItems\}\}"/)
  assert.match(page, /class="notification-card__status notification-card__status--\{\{notification\.intent\}\}"/)
  assert.doesNotMatch(page, /联系用户/)
  assert.match(component, /class="notification-card__status notification-card__status--\{\{notification\.intent\}\}"/)
  assert.doesNotMatch(component, /联系用户/)
  assert.match(header, /<navigation-bar back="\{\{false\}\}" title="通知"/)
  assert.match(appStyles, /@page-top-tab-height: 64rpx;/)
  assert.match(styles, /\.notification-filter__item \{[\s\S]*height: @page-top-tab-height;[\s\S]*border-bottom: 4rpx solid transparent;/)
  assert.match(styles, /\.notification-card \{[\s\S]*min-height: 216rpx;[\s\S]*border-radius: 40rpx;[\s\S]*background: #ffffff;/)
  assert.match(styles, /\.notification-card__thumbnail \{[\s\S]*width: 100rpx;[\s\S]*height: 136rpx;/)
  assert.match(styles, /\.notification-card__status--high \{[\s\S]*background: #ffd7ce;[\s\S]*color: #ff4343;/)
  assert.match(service, /formatMonthDayTime\(item\.lastViewTime\)/)
  assert.match(service, /statusLabel: buildNotificationStatus\(item\)/)
  assert.match(types, /statusLabel: string/)
  assert.equal(config.usingComponents['bottom-tab-bar'], '/components/bottom-tab-bar/bottom-tab-bar')

  for (const asset of [
    'miniprogram/assets/notifications/avatar-duck.png',
    'miniprogram/assets/notifications/avatar-cat.png',
    'miniprogram/assets/notifications/thumb-river.png',
    'miniprogram/assets/notifications/thumb-aquatic.png',
  ]) {
    assert.equal(existsSync(new URL(`../${asset}`, import.meta.url)), true, asset)
  }
})

test('notifications use fixed Figma preview mock data until the API is enabled', () => {
  const config = read('miniprogram/config/dev.ts')
  const service = read('miniprogram/services/notifications.ts')
  const mockPath = 'miniprogram/mocks/notifications.ts'

  assert.match(config, /NOTIFICATION_DATA_SOURCE: 'mock' \| 'api' = 'mock'/)
  assert.match(service, /NOTIFICATION_DATA_SOURCE/)
  assert.match(service, /getNotificationsMock/)
  assert.equal(existsSync(new URL(`../${mockPath}`, import.meta.url)), true, mockPath)

  const mock = read(mockPath)
  assert.match(mock, /getNotificationsMock\(\): NotificationsViewModel/)
  assert.match(mock, /label: '8月17日'/)
  assert.match(mock, /未滑动看完所有图片/)
  assert.match(mock, /该用户浏览进度80%/)
  assert.match(mock, /该用户转发了你的作品，查看2次以上/)
  assert.match(mock, /avatar-duck\.png/)
  assert.match(mock, /thumb-river\.png/)
})

test('notification header and filters stay fixed while the card list scrolls', () => {
  const homePage = read('miniprogram/pages/index/index.wxml')
  const page = read('miniprogram/pages/notifications/notifications.wxml')
  const component = read('miniprogram/components/home-notifications/index.wxml')
  const header = read('miniprogram/components/notification-header/index.wxml')
  const styles = read('miniprogram/pages/notifications/notifications.less')
  const homeStyles = read('miniprogram/pages/index/index.less')

  assert.match(page, /<notification-header filters="\{\{notifications\.filters\}\}"/)
  assert.match(homePage, /<notification-header embedded="\{\{true\}\}"[\s\S]*<scroll-view[^>]*class="home-page__tab-scroll home-page__notification-scroll"/)
  assert.match(header, /class="notification-page__header \{\{embedded \? 'notification-page__header--embedded' : ''\}\}"/)
  assert.doesNotMatch(component, /notification-page__header/)
  assert.match(component, /class="notification-page notification-page--embedded"/)
  assert.match(styles, /\.notification-page__header \{[\s\S]*position: fixed;[\s\S]*top: 0;[\s\S]*left: 0;[\s\S]*width: 100%;/)
  assert.match(styles, /\.notification-page__header \{[\s\S]*z-index: 1001;/)
  assert.match(styles, /\.notification-page__header--embedded \{[\s\S]*position: relative;/)
  assert.match(styles, /\.notification-page__content \{[\s\S]*padding: @notification-header-height 40rpx 220rpx;/)
  assert.match(styles, /\.notification-page--embedded \.notification-page__content \{[\s\S]*padding-top: 0;/)
  assert.match(styles, /\.notification-page--embedded \{[\s\S]*background: #fff;/)
  assert.match(homeStyles, /\.home-page__notification-panel \{[\s\S]*background: #fff;/)
  assert.match(homeStyles, /\.home-page__notification-scroll \{[\s\S]*background: #fff;/)
})

test('home analysis keeps the notification-style header outside its scroll area', () => {
  const headerPath = 'miniprogram/components/analysis-header/index.wxml'
  const headerStylesPath = 'miniprogram/components/analysis-header/index.less'
  const home = read('miniprogram/pages/index/index.wxml')
  const component = read('miniprogram/components/home-analysis/index.wxml')
  const styles = read('miniprogram/pages/analysis/index.less')
  const config = JSON.parse(read('miniprogram/pages/index/index.json'))

  assert.equal(existsSync(new URL(`../${headerPath}`, import.meta.url)), true, headerPath)
  assert.equal(existsSync(new URL(`../${headerStylesPath}`, import.meta.url)), true, headerStylesPath)

  const header = read(headerPath)
  const headerStyles = read(headerStylesPath)

  assert.equal(config.usingComponents['analysis-header'], '/components/analysis-header/index')
  assert.match(home, /home-page__analysis-panel[\s\S]*<analysis-header embedded="\{\{true\}\}"[\s\S]*<scroll-view[^>]*home-page__analysis-scroll[\s\S]*<home-analysis embedded="\{\{true\}\}"/)
  assert.match(component, /class="analysis-page \{\{embedded \? 'analysis-page--embedded' : ''\}\}"/)
  assert.match(component, /wx:if="\{\{!embedded\}\}" class="analysis-page__header"/)
  assert.match(header, /class="analysis-page__header \{\{embedded \? 'analysis-page__header--embedded' : ''\}\}"/)
  assert.match(styles, /\.analysis-page__header--embedded \{[\s\S]*position: relative;[\s\S]*top: auto;[\s\S]*left: auto;/)
  assert.match(styles, /\.analysis-page--embedded \.analysis-page__content--work \{[\s\S]*padding-top: 40rpx;/)
  assert.match(headerStyles, /\.analysis-tabs \{[\s\S]*border-bottom: 2rpx solid #f4f5f5;/)
  assert.match(headerStyles, /\.analysis-tabs__selection \{[\s\S]*background: #000000;/)
})

test('home page uses the 20px content inset and scroll-safe bottom space', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const styles = read('miniprogram/pages/index/index.less')

  assert.match(styles, /padding: 0 40rpx 200rpx;/)
  assert.match(styles, /\.home-hero__glow \{[\s\S]*top: -106rpx;[\s\S]*left: 375rpx;[\s\S]*width: 538rpx;[\s\S]*height: 538rpx;/)
  assert.match(styles, /background: linear-gradient\(180deg, #b5ebfe 0%, @home-page-background 100%\);/)
  assert.match(styles, /border-radius: 40rpx;/)
  assert.match(page, /class="home-content-card__divider"/)
  assert.match(page, />浏览次数<\/text>/)
  assert.match(styles, /\.home-content-card \{[\s\S]*padding: 30rpx 40rpx;/)
})

test('low-intent status pill follows Figma 478:1612 colors', () => {
  const styles = read('miniprogram/pages/index/index.less')

  assert.match(styles, /\.home-status-tag--low \{[\s\S]*background: #f0f0f0;[\s\S]*color: #8a8e94;/)
  assert.match(styles, /border-radius: 48rpx;/)
})

test('intent summary card follows Figma 478:1568 layout tokens', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const styles = read('miniprogram/pages/index/index.less')

  assert.match(page, /今日新增 <text class="home-accent">\{\{homeData\.intentSummary\.total\}\}<\/text> 个客户/)
  assert.match(styles, /\.home-intent-card__headline \{[\s\S]*font-size: 32rpx;[\s\S]*font-weight: 500;/)
  assert.match(styles, /\.home-intent-card__avatar \{[\s\S]*width: 48rpx;[\s\S]*height: 48rpx;[\s\S]*margin-right: -24rpx;/)
  assert.match(styles, /\.home-intent-card__metrics \{[\s\S]*margin-top: 40rpx;/)
  assert.match(styles, /\.home-intent-card \.home-accent \{[\s\S]*color: #00a5b4;/)
})

test('project enables compile hot reload for live UI updates', () => {
  const project = JSON.parse(read('project.config.json'))
  assert.equal(project.setting.compileHotReLoad, true)
})

test('unaffected navigation and analysis pages remain registered', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const analysis = read('miniprogram/services/analysis.ts')
  const notifications = read('miniprogram/services/notifications.ts')
  const materials = read('miniprogram/services/materials.ts')

  assert.ok(app.pages.includes('pages/analysis/index'))
  assert.ok(app.pages.includes('pages/analysis-detail/index'))
  assert.ok(app.pages.includes('pages/analysis-user-detail/index'))
  assert.ok(app.pages.includes('pages/notifications/notifications'))
  assert.ok(app.pages.includes('pages/materials/publish/index'))
  assert.match(analysis, /getAnalysisOverview/)
  assert.match(notifications, /getNotifications/)
  assert.match(materials, /getMaterials/)
})

test('user detail page follows Figma 490:3386 and 490:3823 through the analysis mock seam', () => {
  const markup = read('miniprogram/pages/analysis-user-detail/index.wxml')
  const styles = read('miniprogram/pages/analysis-user-detail/index.less')
  const config = JSON.parse(read('miniprogram/pages/analysis-user-detail/index.json'))
  const logic = read('miniprogram/pages/analysis-user-detail/index.ts')
  const service = read('miniprogram/services/analysis.ts')
  const mock = read('miniprogram/mocks/analysis.ts')

  assert.match(markup, /<navigation-bar title="用户详情" back="\{\{true\}\}"/)
  assert.match(markup, /class="user-detail__profile-card"/)
  assert.match(markup, /class="user-detail__name" bindtap="onCopyUsername"/)
  assert.match(markup, /class="user-detail__metrics">\s*<view class="user-detail__metric"><text>浏览次数<\/text>/)
  assert.match(markup, /#对\{\{detail\.profile\.highIntentContentCount\}\}个高意向/)
  assert.match(markup, /class="user-detail__contact" bindtap="onContactTap"/)
  assert.doesNotMatch(markup, /user-detail__contact--compact/)
  assert.match(markup, /联系用户/)
  assert.match(markup, /class="user-detail__records-card"/)
  assert.match(markup, /class="user-detail__records-section"/)
  assert.match(markup, /<segmented-filter items="\{\{recordSortOptions\}\}" active-id="\{\{activeRecordSort\}\}" bind:change="onRecordSortChange"/)
  assert.equal(config.usingComponents['segmented-filter'], '/components/segmented-filter/index')
  assert.match(markup, /class="user-detail__records"/)
  assert.match(markup, /class="user-detail__record" bindtap="onUserRecordTap" data-content-id="\{\{item\.contentId\}\}"/)
  assert.match(markup, /class="user-detail__record-intent user-detail__record-intent--\{\{item\.intentLevel\}\}"/)
  assert.match(markup, /浏览记录/)
  assert.match(markup, /微信名称复制成功，/)
  assert.match(markup, /关闭小程序后，前往微信联系用户。/)
  assert.match(markup, /wx:if="\{\{noticeVisible\}\}" class="user-detail__copy-feedback"/)
  assert.match(styles, /\.user-detail-page \{[\s\S]*background: #ffffff;/)
  assert.match(styles, /\.user-detail-page__content \{[\s\S]*padding: 40rpx 40rpx 40rpx;/)
  assert.match(styles, /\.user-detail__profile-card \{[\s\S]*gap: 20rpx;[\s\S]*padding: 40rpx;[\s\S]*border-radius: 40rpx;/)
  assert.match(styles, /\.user-detail__contact \{[\s\S]*height: 72rpx;[\s\S]*background: #0ec8d9;/)
  assert.match(styles, /\.user-detail__records-card \{[\s\S]*gap: 20rpx;[\s\S]*padding: 30rpx;[\s\S]*border-radius: 40rpx;/)
  assert.match(styles, /\.user-detail__record \{[\s\S]*min-height: 176rpx;[\s\S]*padding: 20rpx;[\s\S]*background: #f5f5f5;/)
  assert.match(styles, /\.user-detail__record--pressed \{[\s\S]*opacity: 0\.72;/)
  assert.match(styles, /\.user-detail__records-section \{[\s\S]*margin-top: 40rpx;[\s\S]*gap: 10rpx;/)
  assert.match(styles, /\.user-detail__record-intent--high \{[\s\S]*color: #ff4343;[\s\S]*background: #ffd7ce;/)
  assert.match(styles, /\.user-detail__high-intent,[\s\S]*\.user-detail__record-intent \{[^}]*padding: 0 20rpx;/)
  assert.match(styles, /\.user-detail__record-intent \{[^}]*align-self: flex-start;/)
  assert.doesNotMatch(styles, /\.user-detail__contact--compact/)
  assert.match(styles, /\.user-detail__record-stats view \{[\s\S]*flex-direction: column;/)
  assert.match(styles, /\.user-detail__copy-feedback \{[\s\S]*width: 530rpx;[\s\S]*border-radius: 28rpx;[\s\S]*background: rgba\(0, 0, 0, 0\.8\);/)
  assert.match(logic, /onCopyUsername\(\)/)
  assert.match(logic, /onContactTap\(\)/)
  assert.match(logic, /onRecordSortChange\(/)
  assert.match(logic, /sortUserRecords\(/)
  assert.match(logic, /noticeVisible: false/)
  assert.match(markup, /微信名称复制成功/)
  assert.match(service, /if \(ANALYSIS_DATA_SOURCE === 'mock'\) return Promise\.resolve\(getAnalysisUserDetailStyleMock\(userId\)\)/)
  assert.match(mock, /getAnalysisUserDetailStyleMock\(userId: string\): AnalysisUserDetailViewModel/)
  assert.match(mock, /highIntentContentCount: 4/)
  assert.match(mock, /intentLevel: 'high'/)
  assert.match(mock, /createUserRecord\(/)
})

test('user detail record sorting updates the visible list only', () => {
  const page = loadPageDefinition('miniprogram/pages/analysis-user-detail/index.ts', {
    getAnalysisUserDetail: () => Promise.resolve(null),
  })
  const records = [
    { id: 'first', readCount: '4', completionCount: '1', shareCount: '2' },
    { id: 'second', readCount: '8', completionCount: '3', shareCount: '1' },
  ]
  const context = {
    data: { detail: { records }, activeRecordSort: 'views' },
    setData(update) { Object.assign(this.data, update) },
  }

  page.onRecordSortChange.call(context, { detail: { id: 'shares' } })

  assert.equal(context.data.activeRecordSort, 'shares')
  assert.deepEqual(context.data.visibleUserRecords.map((record) => record.id), ['first', 'second'])
})

test('tapping a user reading record navigates to that content analysis detail', () => {
  const navigatedUrls = []
  const page = loadPageDefinition('miniprogram/pages/analysis-user-detail/index.ts', {
    getAnalysisUserDetail: () => Promise.resolve(null),
    wx: {
      navigateTo: ({ url }) => navigatedUrls.push(url),
    },
  })

  assert.equal(typeof page.onUserRecordTap, 'function')

  page.onUserRecordTap({ currentTarget: { dataset: { contentId: 'material-56' } } })

  assert.deepEqual(navigatedUrls, ['/pages/analysis-detail/index?id=material-56'])
})

test('publish belongs to the root swiper and does not navigate to a separate materials page', () => {
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const homeConfig = read('miniprogram/pages/index/index.json')
  const publishLogic = read('miniprogram/pages/materials/publish/index.ts')

  assert.match(homeMarkup, /home-page__materials-panel/)
  assert.match(homeMarkup, /bindtap="onMaterialPublishTap"/)
  assert.match(homeLogic, /const rootTabIds: HomeTabId\[\] = \['home', 'notifications', 'materials', 'analysis', 'profile'\]/)
  assert.match(homeLogic, /onPlusTap\(\)\s*\{\s*this\.setActiveTab\(2\)\s*}/)
  assert.doesNotMatch(homeLogic, /onPlusTap\(\)\s*\{[\s\S]*?wx\.navigateTo/)
  assert.match(homeLogic, /loadMaterials\(\)/)
  assert.match(homeConfig, /publish-success-modal/)
  assert.match(publishLogic, /\/pages\/index\/index\?tab=materials/)
})

test('materials home uses the Figma publish navigation and reserves space above it', () => {
  const markup = read('miniprogram/pages/materials/index.wxml')
  const logic = read('miniprogram/pages/materials/index.ts')
  const styles = read('miniprogram/pages/materials/index.less')
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const pageConfig = JSON.parse(read('miniprogram/pages/materials/index.json'))

  assert.equal(pageConfig.usingComponents['bottom-tab-bar'], '/components/bottom-tab-bar/bottom-tab-bar')
  assert.match(markup, /<bottom-tab-bar items="\{\{tabItems\}\}" plus-active="\{\{true\}\}" bind:tabtap="onTabTap" bind:plus="onPlusTap" \/>/)
  assert.match(logic, /label: '首页'/)
  assert.match(logic, /label: '通知'/)
  assert.match(logic, /label: '分析'/)
  assert.match(logic, /label: '我的'/)
  assert.match(markup, /<view class="materials-page \{\{isAndroid \? 'materials-page--android' : ''\}\}">/)
  assert.match(homeMarkup, /<view class="materials-page \{\{isAndroid \? 'materials-page--android' : ''\}\}">/)
  assert.match(logic, /isAndroid: false/)
  assert.match(homeLogic, /isAndroid: false/)
  assert.match(logic, /platform === 'android' \|\| platform === 'devtools'/)
  assert.match(homeLogic, /platform === 'android' \|\| platform === 'devtools'/)
  assert.match(styles, /\.materials-page__content\s*\{[\s\S]*?padding: 0 40rpx calc\(336rpx \+ env\(safe-area-inset-bottom\)\);/)
  assert.match(styles, /\.materials-publish-bar\s*\{[\s\S]*?bottom: 112rpx;/)
  assert.match(styles, /\.materials-publish-button\s*\{[\s\S]*?bottom: calc\(max\(24px, env\(safe-area-inset-bottom\)\) \+ 20rpx\);/)
  assert.match(styles, /\.materials-page--android \.materials-publish-button\s*\{[\s\S]*?bottom: calc\(16px \+ 20rpx\);/)
})

test('materials home uses fixed preview data and the Figma striped background', async () => {
  const config = read('miniprogram/config/dev.ts')
  const service = read('miniprogram/services/materials.ts')
  const markup = read('miniprogram/pages/materials/index.wxml')
  const styles = read('miniprogram/pages/materials/index.less')

  assert.match(config, /MATERIALS_DATA_SOURCE: 'mock' \| 'api' = 'mock'/)
  assert.match(service, /MATERIALS_DATA_SOURCE/)
  assert.match(service, /getMaterialsStyleMock/)
  assert.match(service, /if \(MATERIALS_DATA_SOURCE === 'mock'\) return Promise\.resolve\(getMaterialsStyleMock\(\)\)/)
  assert.match(markup, /src="\/assets\/materials\/materials-stripes\.svg"/)
  assert.match(markup, /class="materials-card__image" src="\{\{item\.thumbnailUrl\}\}" mode="aspectFill"/)
  assert.match(styles, /\.materials-page__base\s*\{[\s\S]*?background: #ffffff;/)
  assert.match(styles, /\.materials-page__content\s*\{[\s\S]*?background: transparent;/)
})

test('materials card information follows Figma 519:4383', () => {
  const styles = read('miniprogram/pages/materials/index.less')

  assert.match(styles, /\.materials-card__info\s*\{[\s\S]*gap: 20rpx;[\s\S]*padding: 16rpx 20rpx;[\s\S]*border: 2rpx solid @content-box-border;[\s\S]*border-top: 0;[\s\S]*border-radius: 0 0 24rpx 24rpx;[\s\S]*background: #ffffff;[\s\S]*box-shadow: 0 0 20rpx rgba\(0, 0, 0, 0\.05\);/)
  assert.match(styles, /\.materials-card__title\s*\{[\s\S]*font-size: 28rpx;[\s\S]*font-weight: 400;/)
  assert.match(styles, /\.materials-card__date\s*\{[\s\S]*color: @materials-muted;[\s\S]*font-size: 28rpx;/)
})

test('materials header fades to white while the list scrolls', () => {
  const markup = read('miniprogram/pages/materials/index.wxml')

  assert.match(markup, /background: rgba\(255, 255, 255, \{\{materialsHeaderOpacity\}\}\);/)
})

test('materials publish button does not place a blue gradient layer over cards or navigation', () => {
  const pageStyles = read('miniprogram/pages/materials/index.less')
  const navigationStyles = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.less')

  assert.match(navigationStyles, /\.bottom-tab-bar\s*\{[\s\S]*?z-index: 1000;/)
  assert.match(pageStyles, /\.materials-page__content\s*\{[\s\S]*?z-index: 2;/)
  assert.match(pageStyles, /\.materials-publish-bar\s*\{[\s\S]*?z-index: 3;[\s\S]*?background: transparent;/)
  assert.doesNotMatch(pageStyles, /\.materials-publish-bar\s*\{[\s\S]*?background: linear-gradient/)
})

test('analysis tabs use the F4F5F5 divider line', () => {
  const appStyles = read('miniprogram/app.less')
  const styles = read('miniprogram/pages/analysis/index.less')

  assert.match(styles, /\.analysis-page__header \{[^}]*position: fixed;[^}]*top: 0;[^}]*left: 0;[^}]*z-index: 1001;[^}]*width: 100%;/)
  assert.match(styles, /\.analysis-page__content \{[^}]*position: relative;[^}]*z-index: 1;[^}]*padding: @notification-header-height 40rpx 220rpx;/)
  assert.match(appStyles, /@page-top-tab-height: 64rpx;/)
  assert.match(styles, /\.analysis-tabs \{[^}]*height: @page-top-tab-height;/)
  assert.match(styles, /\.analysis-tabs__item \{[^}]*height: @page-top-tab-height;[^}]*line-height: @page-top-tab-height;/)
  assert.match(styles, /\.analysis-tabs \{[^}]*border-bottom: 2rpx solid #f4f5f5;/)
  assert.match(styles, /\.analysis-tabs__selection \{[^}]*background: #000000;/)
})

test('analysis sort sheet hides the root tab bar while it is open', () => {
  const markup = read('miniprogram/pages/index/index.wxml')
  const logic = read('miniprogram/pages/index/index.ts')

  assert.match(markup, /<bottom-tab-bar wx:if="\{\{!analysisSortSheetVisible\}\}" items="\{\{tabItems\}\}"/)
  assert.match(logic, /onAnalysisSortTap\(\) \{ this\.setData\(\{ analysisSortSheetVisible: !this\.data\.analysisSortSheetVisible \}\) \}/)
  assert.match(logic, /onAnalysisSortMaskTap\(\) \{ this\.setData\(\{ analysisSortSheetVisible: false \}\) \}/)
})

test('analysis work tab matches the revised Figma compact work list', () => {
  const markup = read('miniprogram/components/home-analysis/index.wxml')
  const styles = read('miniprogram/pages/analysis/index.less')
  const types = read('miniprogram/types/analysis.ts')
  const service = read('miniprogram/services/analysis.ts')
  const homeLogic = read('miniprogram/pages/index/index.ts')

  assert.match(markup, /analysis-page__content--work/)
  assert.match(markup, /analysis-summary--redesign/)
  assert.match(markup, /analysis-work-list/)
  assert.match(markup, /analysis-work-row/)
  assert.match(markup, /\{\{item\.publishedAt\}\}/)
  assert.match(markup, /\{\{item\.compactMetrics\}\}/)
  assert.match(styles, /\.analysis-page__content--work\s*\{[\s\S]*?background: #ffffff;/)
  assert.match(styles, /\.analysis-summary--redesign\s*\{[\s\S]*?margin-top: 0;/)
  assert.match(styles, /\.analysis-work-list\s*\{[\s\S]*?border-radius: 40rpx;[\s\S]*?background: #ffffff;/)
  assert.match(styles, /\.analysis-work-row__thumbnail\s*\{[\s\S]*?width: 100rpx;[\s\S]*?height: 136rpx;/)
  assert.match(styles, /\.analysis-work-row__metrics\s*\{[\s\S]*?justify-content: space-between;/)
  assert.match(types, /publishedAt: string/)
  assert.match(types, /compactMetrics: AnalysisMetric\[\]/)
  assert.match(service, /compactMetrics:/)
  assert.match(homeLogic, /activeAnalysisSortLabel: '浏览次数'/)
})

test('analysis work period filter sits inside and filters only the work list', () => {
  const standaloneMarkup = read('miniprogram/pages/analysis/index.wxml')
  const embeddedMarkup = read('miniprogram/components/home-analysis/index.wxml')
  const standaloneLogic = read('miniprogram/pages/analysis/index.ts')
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const componentLogic = read('miniprogram/components/home-analysis/index.ts')
  const styles = read('miniprogram/pages/analysis/index.less')
  const standalonePeriodHandler = standaloneLogic.match(/onPeriodTap[\s\S]*?\n  \},\n  onAnalysisSortTap/)?.[0] ?? ''
  const homePeriodHandler = homeLogic.match(/onAnalysisPeriodTap[\s\S]*?\n  \},\n  onTotalAnalysisPeriodTap/)?.[0] ?? ''

  for (const markup of [standaloneMarkup, embeddedMarkup]) {
    assert.ok(markup.indexOf('analysis-summary analysis-summary--redesign') < markup.indexOf('analysis-work-list'))
    assert.match(markup, /class="analysis-work-list">[\s\S]*class="analysis-filters analysis-filters--redesign[^"]*"[\s\S]*<segmented-filter items="\{\{analysisPeriods\}\}"[\s\S]*class="analysis-work-list__inner"/)
    assert.match(markup, /wx:for="\{\{visibleAnalysisCards\}\}"/)
    assert.doesNotMatch(markup, /wx:for="\{\{analysisData\.cards\}\}"/)
  }

  assert.match(homeMarkup, /visible-analysis-cards="\{\{visibleAnalysisCards\}\}"/)
  assert.match(componentLogic, /visibleAnalysisCards: \{ type: Array, value: \[\] \}/)
  assert.match(standalonePeriodHandler, /this\.loadWorkCards\(periodId\)/)
  assert.doesNotMatch(standalonePeriodHandler, /this\.loadAnalysis\(periodId\)/)
  assert.match(homePeriodHandler, /this\.loadWorkCards\(event\.detail\.id\)/)
  assert.doesNotMatch(homePeriodHandler, /this\.loadAnalysis\(event\.detail\.id\)/)
  assert.match(styles, /\.analysis-work-list \{[\s\S]*display: flex;[\s\S]*flex-direction: column;[\s\S]*gap: 40rpx;[\s\S]*margin-top: 40rpx;[\s\S]*padding: 40rpx;/)
  assert.doesNotMatch(styles, /\.analysis-work-list__inner\s*\{[^}]*margin-top:/)
})

test('analysis work preview uses fixed local mock data and component styles', () => {
  const config = read('miniprogram/config/dev.ts')
  const service = read('miniprogram/services/analysis.ts')
  const mock = read('miniprogram/mocks/analysis.ts')
  const componentStylesPath = new URL('../miniprogram/components/home-analysis/index.less', import.meta.url)

  assert.equal(existsSync(componentStylesPath), true)
  assert.match(config, /ANALYSIS_DATA_SOURCE: 'mock'/)
  assert.match(service, /getAnalysisStyleMock/)
  assert.match(service, /ANALYSIS_DATA_SOURCE === 'mock'/)
  assert.match(mock, /export function getAnalysisStyleMock\(\)/)
  assert.equal((mock.match(/mock-analysis-card-\d+/g) ?? []).length, 5)
  assert.match(mock, /\/assets\/analysis\/content-01\.jpg/)
  assert.match(mock, /总浏览次数.*24,234/)
  assert.match(componentStylesPath ? read('miniprogram/components/home-analysis/index.less') : '', /@import ['\"]\.\.\/\.\.\/pages\/analysis\/index\.less['\"]/)
})

test('analysis work list calls the view metric 浏览次数', async () => {
  const { getAnalysisStyleMock } = await import('../miniprogram/mocks/analysis.ts')
  const mock = getAnalysisStyleMock()
  const service = read('miniprogram/services/analysis.ts')

  assert.deepEqual(mock.cards.map((card) => card.compactMetrics[0]), mock.cards.map(() => ({ label: '浏览次数', value: '1,231' })))
  assert.match(service, /compact:[\s\S]*\{ label: '浏览次数', value: formatCount\(viewCount\) \}/)
})

test('analysis user preview exposes the Figma 507:1682 intent summary and completion metrics', async () => {
  const { getAnalysisStyleMock } = await import('../miniprogram/mocks/analysis.ts')

  const analysisData = getAnalysisStyleMock()

  assert.deepEqual(analysisData.userSummary, [
    { label: '高意向', value: '3' },
    { label: '中意向', value: '24,234' },
    { label: '低意向', value: '1,223' },
  ])
  assert.deepEqual(
    analysisData.audienceUsers.map((user) => ({ name: user.name, level: user.level, completionCount: user.completionCount })),
    [
      { name: 'xiaogai', level: 'high', completionCount: '4' },
      { name: 'xiaogai', level: 'high', completionCount: '4' },
      { name: 'xiaogai', level: 'high', completionCount: '4' },
      { name: '快乐小鹅', level: 'medium', completionCount: '1' },
      { name: '来财来财', level: 'low', completionCount: '2' },
    ],
  )
})

test('analysis user tab follows the Figma 507:1682 list hierarchy', () => {
  const standalone = read('miniprogram/pages/analysis/index.wxml')
  const embedded = read('miniprogram/components/home-analysis/index.wxml')
  const styles = read('miniprogram/pages/analysis/index.less')

  for (const markup of [standalone, embedded]) {
    assert.match(markup, /class="analysis-user__summary"[\s\S]*class="analysis-user__title">意向用户<[\s\S]*class="analysis-user__list-panel"[\s\S]*<segmented-filter items="\{\{analysisPeriods\}\}" active-id="\{\{activePeriod\}\}" item-width="68" bind:change="onPeriodTap" \/>/)
    assert.match(markup, />完播<\/text>/)
    assert.doesNotMatch(markup, />观看作品<\/text>/)
  }

  assert.match(styles, /\.analysis-user__summary-card \{[\s\S]*height: 130rpx;[\s\S]*border: 2rpx solid @content-box-border;[\s\S]*border-radius: 24rpx;[\s\S]*background: #ffffff;/)
  assert.match(styles, /\.analysis-user__list-panel \{[\s\S]*min-height: 946rpx;[\s\S]*padding: 40rpx 40rpx 88rpx;[\s\S]*border: 2rpx solid @content-box-border;[\s\S]*border-radius: 40rpx;[\s\S]*background: #ffffff;/)
  assert.match(styles, /\.analysis-user__tag--high \{[\s\S]*color: #ff4343;[\s\S]*background: #ffd7ce;/)
})

test('analysis user tab follows the Figma 581:8521 user-list rhythm', () => {
  const standalone = read('miniprogram/pages/analysis/index.wxml')
  const embedded = read('miniprogram/components/home-analysis/index.wxml')
  const styles = read('miniprogram/pages/analysis/index.less')

  for (const markup of [standalone, embedded]) {
    assert.match(markup, /class="analysis-user__stat-label">浏览次数<\/text>/)
    assert.match(markup, /class="analysis-user__stat-label">完播<\/text>[\s\S]*class="analysis-user__stat-label">转发<\/text>/)
  }

  assert.match(styles, /\.analysis-user__summary-label \{[\s\S]*color: #8a8e94;[\s\S]*font-size: 28rpx;/)
  assert.match(styles, /\.analysis-user__list-panel \{[\s\S]*gap: 40rpx;/)
  assert.match(styles, /\.analysis-user__list \{[\s\S]*margin-top: 0;/)
})

test('user analysis reuses the work time and metric filters', async () => {
  const standalone = read('miniprogram/pages/analysis/index.wxml')
  const embedded = read('miniprogram/components/home-analysis/index.wxml')
  const standaloneLogic = read('miniprogram/pages/analysis/index.ts')
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const { sortAnalysisUsers } = await import('../miniprogram/utils/analysis-users.ts')
  const users = [
    { id: 'first', readCount: '4', completionCount: '8', shareCount: '1' },
    { id: 'second', readCount: '12', completionCount: '2', shareCount: '5' },
  ]

  for (const markup of [standalone, embedded]) {
    assert.match(markup, /class="analysis-user__list-panel"[\s\S]*<segmented-filter items="\{\{analysisPeriods\}\}" active-id="\{\{activePeriod\}\}" item-width="68" bind:change="onPeriodTap" \/>[\s\S]*class="analysis-sort" bindtap="onAnalysisSortTap"/)
    assert.doesNotMatch(markup, /analysisIntentTabs|onAnalysisIntentTap/)
  }

  for (const logic of [standaloneLogic, homeLogic]) {
    assert.match(logic, /if \(this\.data\.activeAnalysisTab === 'user'\) \{[\s\S]*this\.loadAudienceUsers\(/)
    assert.doesNotMatch(logic, /analysisIntentTabs|setAnalysisIntentFilter/)
  }

  assert.deepEqual(sortAnalysisUsers(users, 'view').map((user) => user.id), ['second', 'first'])
  assert.deepEqual(sortAnalysisUsers(users, 'completion').map((user) => user.id), ['first', 'second'])
  assert.deepEqual(sortAnalysisUsers(users, 'share').map((user) => user.id), ['second', 'first'])
})

test('analysis user list stacks its filter above the rows', () => {
  const styles = read('miniprogram/pages/analysis/index.less')

  assert.match(styles, /\.analysis-user__list-panel \{[^}]*display: flex;[^}]*flex-direction: column;/)
})

test('analysis work filters match Figma 517:3836', () => {
  const markup = read('miniprogram/pages/analysis/index.wxml')
  const styles = read('miniprogram/pages/analysis/index.less')
  const componentStyles = read('miniprogram/components/segmented-filter/index.less')

  assert.match(styles, /\.analysis-page__content--work \{[\s\S]*padding-top: calc\(@notification-header-height \+ 40rpx\);[\s\S]*background: #ffffff;/)
  assert.match(styles, /\.analysis-filters--redesign\s*\{[\s\S]*margin-top: 0;[\s\S]*justify-content: flex-start;[\s\S]*gap: 40rpx;/)
  assert.match(markup, /<segmented-filter items="\{\{analysisPeriods\}\}" active-id="\{\{activePeriod\}\}" item-width="68" bind:change="onPeriodTap" \/>/)
  assert.match(componentStyles, /\.segmented-filter \{[\s\S]*height: 64rpx;[\s\S]*padding: @segmented-filter-vertical-inset;[\s\S]*border-radius: 20rpx;[\s\S]*background: #e0e0e0;/)
  assert.match(componentStyles, /\.segmented-filter__selection \{[\s\S]*border-radius: 16rpx;[\s\S]*background: #ffffff;/)
  assert.match(componentStyles, /\.segmented-filter__item \{[\s\S]*height: 56rpx;[\s\S]*font-size: 26rpx;/)
  assert.match(componentStyles, /\.segmented-filter__icon \{[\s\S]*width: 68rpx;[\s\S]*height: 56rpx;/)
  assert.match(styles, /\.analysis-sort \{[\s\S]*height: 64rpx;[\s\S]*padding: @segmented-filter-vertical-inset;[\s\S]*border-radius: 20rpx;[\s\S]*background: #e0e0e0;/)
  assert.match(styles, /\.analysis-sort__inner \{[\s\S]*gap: 8rpx;[\s\S]*padding: 0 20rpx;[\s\S]*border-radius: 16rpx;[\s\S]*font-size: 26rpx;/)
  assert.match(styles, /\.analysis-filters--redesign \.analysis-sort \{[\s\S]*border: 0;[\s\S]*background: #e0e0e0;/)
})

test('work analysis calendar filter collects and applies a custom date range', () => {
  const standaloneLogic = read('miniprogram/pages/analysis/index.ts')
  const standaloneMarkup = read('miniprogram/pages/analysis/index.wxml')
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const filterMarkup = read('miniprogram/components/segmented-filter/index.wxml')

  for (const logic of [standaloneLogic, homeLogic]) {
    assert.match(logic, /\{ id: 'custom'(?: as AnalysisPeriodId)?, label: '', iconPath: '\/assets\/analysis\/calendar-filter\.svg' \}/)
    assert.match(logic, /onDateRangeConfirm\(event: WechatMiniprogram\.CustomEvent<\{ startDate: string; endDate: string \}>\)[\s\S]*activePeriod: 'custom'[\s\S]*loadWorkCards\('custom', dateRange\)/)
  }

  assert.match(standaloneLogic, /if \(periodId === 'custom'\) \{[\s\S]*dateRangePickerVisible: true/)
  assert.match(homeLogic, /if \(event\.detail\.id === 'custom'\) \{[\s\S]*dateRangePickerVisible: true/)

  for (const markup of [standaloneMarkup, homeMarkup]) {
    assert.match(markup, /<date-range-picker[\s\S]*visible="\{\{dateRangePickerVisible\}\}"[\s\S]*min-date="\{\{twoMonthsAgoDate\}\}"[\s\S]*max-date="\{\{todayDate\}\}"[\s\S]*bind:confirm="onDateRangeConfirm"/)
  }

  assert.match(filterMarkup, /wx:if="\{\{item\.iconPath\}\}"[\s\S]*src="\{\{item\.iconPath\}\}"/)
})

test('custom date wheel only renders dates within the latest two months', async () => {
  const { getDatePickerState, getDateRangeLimits } = await import('../miniprogram/utils/date-range.ts')
  const pickerMarkup = read('miniprogram/components/date-range-picker/index.wxml')
  const pickerStyles = read('miniprogram/components/date-range-picker/index.less')
  const pickerState = getDatePickerState('2026-08-26', '2026-08-26', '2026-06-26')
  const earliestPickerState = getDatePickerState('2026-06-26', '2026-08-26', '2026-06-26')

  assert.deepEqual(getDateRangeLimits(new Date(2026, 7, 26)), { minDate: '2026-06-26', maxDate: '2026-08-26' })
  assert.deepEqual(pickerState.range[0], ['2026年'])
  assert.deepEqual(pickerState.range[1].slice(-3), ['06月', '07月', '08月'])
  assert.deepEqual(pickerState.range[2].slice(-3), ['24日', '25日', '26日'])
  assert.deepEqual(earliestPickerState.range[2].slice(0, 3), ['26日', '27日', '28日'])
  assert.match(pickerMarkup, /mode="multiSelector"[\s\S]*range="\{\{startPickerRange\}\}"/)
  assert.match(pickerMarkup, /mode="multiSelector"[\s\S]*range="\{\{endPickerRange\}\}"/)
  assert.match(pickerMarkup, /最长可查询时间2个月/)
  assert.match(pickerStyles, /\.date-range-picker__hint \{[\s\S]*color: #999999;[\s\S]*font-size: 24rpx;/)
  assert.doesNotMatch(pickerMarkup, /mode="date"/)
})

test('date range picker uses the same entrance motion and backdrop opacity as the analysis sort sheet', () => {
  const pickerStyles = read('miniprogram/components/date-range-picker/index.less')

  assert.match(pickerStyles, /\.date-range-picker__mask \{[\s\S]*background: rgba\(0, 0, 0, 0\.8\);[\s\S]*animation: date-range-picker-mask-in 300ms ease-out both;/)
  assert.match(pickerStyles, /\.date-range-picker__panel \{[\s\S]*animation: date-range-picker-panel-in 300ms ease-out both;/)
  assert.match(pickerStyles, /@keyframes date-range-picker-mask-in \{[\s\S]*from \{ background: rgba\(0, 0, 0, 0\); \}[\s\S]*to \{ background: rgba\(0, 0, 0, 0\.8\); \}/)
  assert.match(pickerStyles, /@keyframes date-range-picker-panel-in \{[\s\S]*from \{ transform: translateY\(100%\); \}[\s\S]*to \{ transform: translateY\(0\); \}/)
})

test('home analysis compiles the Figma 517:3836 filters in its own stylesheet', () => {
  const markup = read('miniprogram/components/home-analysis/index.wxml')
  const styles = read('miniprogram/components/home-analysis/index.less')
  const config = JSON.parse(read('miniprogram/components/home-analysis/index.json'))

  assert.match(markup, /analysis-filters analysis-filters--redesign home-analysis__filters/)
  assert.match(markup, /<segmented-filter items="\{\{analysisPeriods\}\}" active-id="\{\{activePeriod\}\}" item-width="68" bind:change="onPeriodTap" \/>/)
  assert.equal(config.usingComponents['segmented-filter'], '/components/segmented-filter/index')
  assert.match(styles, /\.home-analysis__filters \{[\s\S]*margin-top: 0;[\s\S]*justify-content: flex-start;[\s\S]*gap: 40rpx;/)
  assert.match(styles, /\.home-analysis__filters \.analysis-sort \{[\s\S]*height: 64rpx;[\s\S]*border: 0;[\s\S]*border-radius: 20rpx;[\s\S]*background: #e0e0e0;/)
  assert.match(styles, /\.home-analysis__filters \.analysis-sort__inner \{[\s\S]*border-radius: 16rpx;[\s\S]*font-size: 26rpx;/)
})

test('analysis detail page follows Figma 497:5232 with fixed preview data', () => {
  const markup = read('miniprogram/pages/analysis-detail/index.wxml')
  const styles = read('miniprogram/pages/analysis-detail/index.less')
  const service = read('miniprogram/services/analysis.ts')
  const mock = read('miniprogram/mocks/analysis.ts')

  assert.doesNotMatch(markup, /detail-page__texture/)
  assert.match(styles, /page \{[^}]*background: #ffffff;/)
  assert.match(styles, /\.detail-card \{[^}]*height: 332rpx;[^}]*padding: 40rpx;[^}]*border: 2rpx solid @content-box-border;[^}]*border-radius: 40rpx;/)
  assert.match(styles, /\.detail-card__thumbnail \{[^}]*width: 100rpx;[^}]*height: 136rpx;/)
  assert.match(styles, /\.detail-intent__title \{[^}]*color: #8a8e94;[^}]*font-size: 28rpx;/)
  assert.match(styles, /\.detail-intent__panel \{[^}]*height: auto;[^}]*padding: 40rpx;[^}]*border: 2rpx solid @content-box-border;[^}]*border-radius: 40rpx;/)
  assert.match(styles, /\.detail-user__tag--high \{[^}]*color: #ff4343;[^}]*background: #ffd7ce;/)
  assert.match(service, /getAnalysisDetailStyleMock/)
  assert.match(service, /ANALYSIS_DATA_SOURCE === 'mock'/)
  assert.match(mock, /export function getAnalysisDetailStyleMock\(cardId: string\)/)
  assert.equal((mock.match(/mock-detail-user-/g) ?? []).length, 5)
})

test('analysis detail reuses the analysis header title typography', () => {
  const headerMarkup = read('miniprogram/components/analysis-header/index.wxml')
  const headerLogic = read('miniprogram/components/analysis-header/index.ts')
  const detailMarkup = read('miniprogram/pages/analysis-detail/index.wxml')
  const detailConfig = JSON.parse(read('miniprogram/pages/analysis-detail/index.json'))

  assert.match(headerMarkup, /<navigation-bar title="\{\{title\}\}"/)
  assert.match(headerLogic, /title: \{ type: String, value: '分析' \}/)
  assert.match(detailMarkup, /<analysis-header title="内容分析" back="\{\{true\}\}" title-weight="600" \/>/)
  assert.doesNotMatch(detailMarkup, /<navigation-bar/)
  assert.equal(detailConfig.usingComponents['analysis-header'], '/components/analysis-header/index')
  assert.equal(detailConfig.usingComponents['navigation-bar'], undefined)
})

test('analysis detail title uses the lighter detail weight only', () => {
  const navigationLogic = read('miniprogram/components/navigation-bar/navigation-bar.ts')
  const navigationMarkup = read('miniprogram/components/navigation-bar/navigation-bar.wxml')
  const headerLogic = read('miniprogram/components/analysis-header/index.ts')
  const headerMarkup = read('miniprogram/components/analysis-header/index.wxml')
  const detailMarkup = read('miniprogram/pages/analysis-detail/index.wxml')

  assert.match(navigationLogic, /titleWeight:\s*\{\s*type: Number,\s*value: 700\s*\}/)
  assert.match(navigationMarkup, /weui-navigation-bar__center' style="font-weight: \{\{titleWeight\}\};"/)
  assert.match(headerLogic, /titleWeight: \{ type: Number, value: 700 \}/)
  assert.match(headerMarkup, /title-weight="\{\{titleWeight\}\}"/)
  assert.match(detailMarkup, /<analysis-header title="内容分析" back="\{\{true\}\}" title-weight="600" \/>/)
})

test('analysis total tab follows Figma 587:8623 overview and peak layout', () => {
  const pageMarkup = read('miniprogram/pages/analysis/index.wxml')
  const pageLogic = read('miniprogram/pages/analysis/index.ts')
  const pageStyles = read('miniprogram/pages/analysis/index.less')
  const homeMarkup = read('miniprogram/components/home-analysis/index.wxml')
  const mock = read('miniprogram/mocks/analysis.ts')
  const service = read('miniprogram/services/analysis.ts')
  const types = read('miniprogram/types/analysis.ts')

  for (const markup of [pageMarkup, homeMarkup]) {
    assert.match(markup, /<segmented-filter[^>]*items="\{\{totalAnalysisPeriods\}\}" active-id="\{\{activeTotalPeriod\}\}" bind:change="onTotalPeriodTap"/)
    assert.match(markup, /数据总览/)
    assert.match(markup, /analysisData\.totalData\.heroMetrics/)
    assert.match(markup, /浏览峰值/)
    assert.doesNotMatch(markup, /浏览数据/)
    assert.doesNotMatch(markup, /analysis-total__range-tabs/)
  }

  assert.match(pageLogic, /const totalAnalysisPeriods: AnalysisPeriodOption\[\]/)
  assert.match(pageLogic, /onTotalPeriodTap/)
  assert.match(pageStyles, /\.analysis-total__overview-card\s*\{[\s\S]*?padding: 40rpx;[\s\S]*?border: 2rpx solid @content-box-border;[\s\S]*?border-radius: 40rpx;/)
  assert.match(pageStyles, /\.analysis-total__chart-card\s*\{[\s\S]*?padding: 40rpx;[\s\S]*?border: 2rpx solid @content-box-border;[\s\S]*?border-radius: 40rpx;/)
  assert.match(types, /heroMetrics: AnalysisTotalHeroMetric\[\]/)
  assert.match(mock, /value: '122,100次'/)
  assert.match(mock, /value: '920人'/)
  assert.match(service, /heroMetrics:/)
})

test('analysis total hero metrics are direct flex items', () => {
  const markups = [
    read('miniprogram/pages/analysis/index.wxml'),
    read('miniprogram/components/home-analysis/index.wxml'),
  ]
  const styles = read('miniprogram/pages/analysis/index.less')

  for (const markup of markups) {
    assert.match(markup, /wx:for="\{\{analysisData\.totalData\.heroMetrics\}\}"[\s\S]*class="analysis-total__hero-metric/)
    assert.match(markup, /class="analysis-total__hero-meta"><text>\{\{item\.label\}\}<\/text><image class="analysis-total__hero-divider" src="\/assets\/analysis\/total-metric-divider\.svg" mode="aspectFit" \/><view class="analysis-total__hero-comparison"><text>较昨日<\/text><text class="analysis-total__hero-delta">\{\{item\.delta\}\}<\/text><\/view>/)
    assert.doesNotMatch(markup, /<block wx:for="\{\{analysisData\.totalData\.heroMetrics\}\}"/)
  }

  assert.equal(existsSync(new URL('../miniprogram/assets/analysis/total-metric-divider.svg', import.meta.url)), true)
  assert.match(styles, /\.analysis-total__hero-meta \{[\s\S]*gap: 16rpx;/)
  assert.match(styles, /\.analysis-total__hero-divider \{[\s\S]*width: 2rpx;[\s\S]*height: 14rpx;/)
  assert.match(styles, /\.analysis-total__hero-comparison \{[\s\S]*gap: 0;/)
})

test('home analysis keeps the total period control above its scroll view', () => {
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const componentMarkup = read('miniprogram/components/home-analysis/index.wxml')
  const homeStyles = read('miniprogram/pages/index/index.less')

  assert.match(homeMarkup, /<analysis-header[\s\S]*home-page__analysis-total-filter[\s\S]*<segmented-filter items="\{\{totalAnalysisPeriods\}\}" active-id="\{\{activeTotalPeriod\}\}" bind:change="onTotalAnalysisPeriodTap" \/>[\s\S]*<scroll-view scroll-y class="home-page__tab-scroll home-page__analysis-scroll">/)
  assert.match(componentMarkup, /<segmented-filter wx:if="\{\{!embedded\}\}" items="\{\{totalAnalysisPeriods\}\}" active-id="\{\{activeTotalPeriod\}\}" bind:change="onTotalPeriodTap" \/>/)
  assert.match(homeStyles, /\.home-page__analysis-total-filter \{[\s\S]*padding: 32rpx 40rpx 0;/)
})

test('home analysis sort sheet is rendered above the fixed analysis header', () => {
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const componentMarkup = read('miniprogram/components/home-analysis/index.wxml')

  assert.match(homeMarkup, /<view wx:if="\{\{analysisSortSheetVisible\}\}" class="analysis-sort-sheet">[\s\S]*catchtap="onAnalysisSortMaskTap"[\s\S]*bindtap="onHomeAnalysisSortOptionTap"/)
  assert.match(homeLogic, /onHomeAnalysisSortOptionTap\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(componentMarkup, /wx:if="\{\{analysisSortSheetVisible && !embedded\}\}" class="analysis-sort-sheet"/)
})

test('navigation titles use one explicit Chinese typography token', () => {
  const styles = read('miniprogram/components/navigation-bar/navigation-bar.less')

  assert.match(styles, /\.weui-navigation-bar__center\s*\{[\s\S]*?font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;[\s\S]*?font-size: 17px;[\s\S]*?font-weight: 700;/)
})

test('static assets stay below the preview package budget', () => {
  const bytes = getFileBytes(new URL('../miniprogram/assets/', import.meta.url))
  assert.ok(bytes < 20 * 1024 * 1024, `static assets are ${Math.round(bytes / 1024)}KB`)
})

test('wechat preview source stays under the 2MB upload limit', () => {
  const bytes = getFileBytes(new URL('../miniprogram/', import.meta.url))
  assert.ok(bytes < 2 * 1024 * 1024, `miniprogram source is ${Math.round(bytes / 1024)}KB`)
})
