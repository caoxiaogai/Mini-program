import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const currentMonthDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
const totalTrendWeeks = 6

const stubTrendState = (period = 'total', points = []) => ({
  activeAnalysisReadRange: period === 'day' ? 'day' : period === 'month' ? 'month' : period === 'total' ? 'total' : 'week',
  visibleAnalysisReadTrend: points,
  analysisTrendSlotCount: period === 'day' ? 24 : period === 'week' ? 7 : period === 'month' ? currentMonthDays : period === 'total' ? totalTrendWeeks : 0,
  chartAxisMax: period === 'day' || period === 'week' || period === 'month' || period === 'total' ? 3 : 1500,
  chartAxisTicks: [],
  chartAxisScale: period === 'day' ? 'hour' : period === 'week' ? 'weekday' : period === 'month' ? 'month' : period === 'total' ? 'week' : '',
})

const trendPageDeps = {
  buildTotalTrendState: stubTrendState,
  getAnalysisReadRange: (period) => (period === 'day' ? 'day' : period === 'month' ? 'month' : period === 'total' ? 'total' : 'week'),
}

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
  assert.match(types, /completeCount: string/)
  assert.doesNotMatch(types, /completeRate/)
  assert.match(service, /export function getHomePageData\(\): Promise<HomePageViewModel>/)
  assert.match(service, /\/analysis\/dashboard/)
  assert.match(service, /\/analysis\/intent\/list/)
  assert.match(service, /\/analysis\/notify\/list/)
  assert.match(service, /\/analysis\/content\/list/)
  assert.doesNotMatch(service, /from '\.\.\/mocks\//)
  assert.doesNotMatch(service, /TODO\(API\)/)
})

test('data access goes through the unified request layer', () => {
  const requestLayer = read('miniprogram/services/request.ts')
  const config = read('miniprogram/config/dev.ts')

  assert.match(requestLayer, /wx\.request\(/)
  assert.match(requestLayer, /DEV_LAN_ORIGIN/)
  assert.doesNotMatch(requestLayer, /PROD_API_ORIGIN/)
  assert.doesNotMatch(requestLayer, /envVersion/)
  assert.match(requestLayer, /\/api\/files\/sales-materials\//)
  assert.match(config, /DEVTOOLS_ORIGIN = 'http:\/\/127\.0\.0\.1:8080'/)
  assert.match(config, /DEV_LAN_ORIGIN = 'http:\/\/192\.168\.31\.225:8080'/)
  assert.doesNotMatch(config, /PROD_API_ORIGIN/)
  assert.match(requestLayer, /export function request</)
  assert.match(requestLayer, /export function ensureLogin/)
  assert.match(requestLayer, /export function hasAuthorizedLogin/)
  assert.match(requestLayer, /export function authorizeLogin/)
  assert.match(requestLayer, /export function patchCachedLogin/)
  assert.match(requestLayer, /\/wechat\/login/)

  for (const name of ['home', 'analysis', 'materials', 'notifications', 'ranking', 'profile', 'tracking', 'user']) {
    const service = read(`miniprogram/services/${name}.ts`)
    assert.doesNotMatch(service, /wx\.request\(/, `${name} service must use the request layer`)
    if (name !== 'ranking') {
      assert.doesNotMatch(service, /from '\.\.\/mocks\//, `${name} service must not import mocks`)
    }
  }
})

test('entry pages require authorized login and first-time profile setup', async () => {
  const { isLoginProfileComplete, isLocalAvatarFile, safeReturnPath, buildAuthPath, buildReturnPath } = await import('../miniprogram/utils/auth.ts')
  const app = JSON.parse(read('miniprogram/app.json'))
  const requestLayer = read('miniprogram/services/request.ts')
  const userService = read('miniprogram/services/user.ts')
  const authService = read('miniprogram/services/auth.ts')
  const authPage = read('miniprogram/pages/auth/index.ts')
  const authMarkup = read('miniprogram/pages/auth/index.wxml')
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const detailLogic = read('miniprogram/pages/material-detail/index.ts')
  const documentLogic = read('miniprogram/pages/document-reader/index.ts')

  assert.ok(app.pages.includes('pages/auth/index'))
  assert.equal(isLoginProfileComplete({ nickname: '阿乐', avatar: 'https://example.com/a.png' }), true)
  assert.equal(isLoginProfileComplete({ nickname: '微信用户', avatar: 'https://example.com/a.png' }), false)
  assert.equal(isLoginProfileComplete({ nickname: '阿乐', avatar: '' }), false)
  assert.equal(isLocalAvatarFile('wxfile://tmp_avatar.png'), true)
  assert.equal(isLocalAvatarFile('https://cdn.example/a.png'), false)
  assert.equal(safeReturnPath('/pages/index/index?materialId=12'), '/pages/index/index?materialId=12')
  assert.equal(safeReturnPath('https://evil.example'), '/pages/index/index')
  assert.match(buildAuthPath('/pages/index/index?materialId=12', 'profile'), /step=profile/)
  assert.equal(buildReturnPath('/pages/material-detail/index', { id: '12', trackingId: 't1' }), '/pages/material-detail/index?id=12&trackingId=t1')

  assert.match(requestLayer, /if \(!hasAuthorizedLogin\(\)\) return rejectUnauthorized/)
  assert.match(authService, /export function requireAuth/)
  assert.match(authService, /export function runAuthed/)
  assert.match(userService, /path: '\/user\/profile'/)
  assert.match(userService, /uploadFile\('\/user\/avatar'/)
  assert.match(authMarkup, /授权登录/)
  assert.match(authMarkup, /open-type="chooseAvatar"/)
  assert.match(authMarkup, /type="nickname"/)
  assert.match(authMarkup, /使用微信头像和昵称/)
  assert.match(authPage, /onAuthorizeTap\(\)/)
  assert.match(authPage, /onUseWechatProfile\(/)
  assert.match(authPage, /updateUserProfile/)
  assert.match(homeLogic, /runAuthed\(buildReturnPath\(HOME_PAGE_PATH, options\)/)
  assert.match(detailLogic, /runAuthed\(returnPath/)
  assert.match(documentLogic, /runAuthed\(buildReturnPath\('\/pages\/document-reader\/index', options\)/)
  assert.match(read('miniprogram/app.ts'), /if \(!hasAuthorizedLogin\(\)\) return/)
})

test('media urls go through the file proxy and are downloaded on device', () => {
  const requestLayer = read('miniprogram/services/request.ts')
  const media = read('miniprogram/utils/media.ts')
  const home = read('miniprogram/services/home.ts')
  const analysis = read('miniprogram/services/analysis.ts')
  const notifications = read('miniprogram/services/notifications.ts')
  const materials = read('miniprogram/services/materials.ts')

  assert.match(requestLayer, /:9000\/sales-materials/)
  assert.match(requestLayer, /\/api\/files\/sales-materials\//)
  assert.match(media, /export function prepareMediaUrl/)
  assert.match(media, /export function prepareMediaUrls/)
  assert.match(media, /wx\.downloadFile/)
  assert.match(home, /prepareMediaUrls/)
  assert.match(analysis, /prepareMediaUrls/)
  assert.match(notifications, /prepareMediaUrls/)
  assert.match(materials, /prepareMediaUrls/)
})

test('home page data comes from backend analysis APIs', () => {
  const service = read('miniprogram/services/home.ts')
  const config = read('miniprogram/config/dev.ts')

  assert.match(service, /path: '\/analysis\/dashboard'/)
  assert.match(service, /path: '\/analysis\/customer\/list'/)
  assert.match(service, /path: '\/analysis\/content\/list'/)
  assert.match(service, /path: '\/analysis\/intent\/list'/)
  assert.match(service, /path: '\/analysis\/notify\/list'/)
  assert.match(service, /completeCount: formatCount\(dashboard\.totalCompleteCount\)/)
  assert.doesNotMatch(service, /completeRate/)
  assert.doesNotMatch(config, /HOME_DATA_SOURCE/)
  assert.doesNotMatch(service, /from '\.\.\/mocks\//)
})

test('viewing a home notification removes only that preview card and decrements its unread badge', async () => {
  const { markHomeNotificationViewed } = await import('../miniprogram/pages/index/home-notification-preview.ts')

  const homeData = {
    unreadNotificationCount: 10,
    notifications: [
      { id: 'home-notification-n1', eventId: 'n1', userId: 'u1' },
      { id: 'home-notification-n2', eventId: 'n2', userId: 'u2' },
      { id: 'home-notification-n3', eventId: 'n3', userId: 'u3' },
    ],
    contents: [],
    intentSummary: { total: '0', highCount: '0', mediumCount: '0', lowCount: '0', previewAvatars: [] },
    today: { viewCount: '0', completeCount: '0', forwardCount: '0', viewerCount: '0' },
  }

  const nextHomeData = markHomeNotificationViewed(homeData, 'n1')

  assert.equal(nextHomeData.unreadNotificationCount, 9)
  assert.equal(nextHomeData.notifications.length, 2)
  assert.equal(nextHomeData.notifications.some((notification) => notification.eventId === 'n1'), false)
  assert.equal(homeData.unreadNotificationCount, 10)
  assert.equal(homeData.notifications.length, 3)
})

test('viewed home notifications stay hidden after reload', async () => {
  const {
    isViewedNotification,
    rememberViewedNotification,
    selectUnviewedNotificationEvents,
  } = await import('../miniprogram/utils/notification-viewed.ts')
  const home = read('miniprogram/services/home.ts')
  const logic = read('miniprogram/pages/index/index.ts')

  const viewed = rememberViewedNotification({}, '101')
  const unread = selectUnviewedNotificationEvents([
    { id: '101', viewTime: '2026-08-26 12:00:00' },
    { id: '102', viewTime: '2026-08-26 11:00:00' },
    { id: '103', viewTime: '2026-08-26 13:00:00' },
  ], viewed)

  assert.equal(isViewedNotification('101', viewed), true)
  assert.equal(isViewedNotification('103', viewed), false)
  assert.deepEqual(unread.map((item) => item.id), ['102', '103'])
  assert.match(home, /selectUnviewedNotificationEvents\(/)
  assert.match(home, /unreadNotificationCount: unreadEvents\.length/)
  assert.match(home, /id: `home-notification-\$\{event\.id\}`/)
  assert.match(logic, /persistViewedNotification\(eventId\)/)
  assert.match(logic, /markHomeNotificationViewed\(this\.data\.homeData, eventId\)/)
})

test('viewing a home notification does not change the notification tab data source', () => {
  const logic = read('miniprogram/pages/index/index.ts')

  assert.match(logic, /markHomeNotificationViewed/)
  assert.match(logic, /persistViewedNotification/)
  assert.match(logic, /loadNotifications\(\) \{\s*return getNotifications\(\)/)
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
  assert.match(page, /class="home-section__more" bindtap="onTodayMostTap">查看更多/)
  assert.match(page, /class="home-content-card__item" bindtap="onTodayMostTap"/)
  assert.match(logic, /onTodayMostTap\(\) \{[\s\S]*this\.setActiveTab\(3\)[\s\S]*this\.setAnalysisTab\(0\)/)
  assert.match(logic, /onIntentSummaryTap\(\) \{[\s\S]*this\.setActiveTab\(3\)[\s\S]*this\.setAnalysisTab\(1\)/)
  assert.match(logic, /onTodayDataTap\(\) \{[\s\S]*this\.setActiveTab\(3\)[\s\S]*this\.setAnalysisTab\(2\)/)
})

test('home today data includes high, medium and low intent metrics', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const styles = read('miniprogram/pages/index/index.less')

  assert.match(page, /class="home-today-card__metrics home-today-card__intent-metrics"[\s\S]*class="home-today-metric__value">\{\{homeData\.intentSummary\.highCount\}\}<\/text><text>高意向[\s\S]*class="home-today-metric__value">\{\{homeData\.intentSummary\.mediumCount\}\}<\/text><text>中意向[\s\S]*class="home-today-metric__value">\{\{homeData\.intentSummary\.lowCount\}\}<\/text><text>低意向/)
  assert.match(styles, /\.home-today-card__intent-metrics \{[\s\S]*margin-top: 40rpx;/)
})

test('home today-most opens work analysis', () => {
  const pageMarkup = read('miniprogram/pages/index/index.wxml')
  const page = loadPageDefinition('miniprogram/pages/index/index.ts', {
    getHomeGreeting: () => '',
    getDefaultDateRange: () => ({ startDate: '2026-08-20', endDate: '2026-08-26' }),
    getDateRangeLimits: () => ({ minDate: '2026-06-26', maxDate: '2026-08-26' }),
    ...trendPageDeps,
  })
  const calls = []
  const context = {
    data: {},
    setActiveTab(index) { calls.push(['tab', index]) },
    setAnalysisTab(index) { calls.push(['analysis', index]) },
  }

  assert.match(pageMarkup, /class="home-section__more" bindtap="onTodayMostTap">查看更多/)
  assert.match(pageMarkup, /class="home-content-card__item" bindtap="onTodayMostTap"/)
  assert.doesNotMatch(pageMarkup, /class="home-content-card" bindtap="onTodayMostTap"/)
  assert.doesNotMatch(pageMarkup, /onTodayMostItemTap/)

  page.onTodayMostTap.call(context)

  assert.deepEqual(calls, [['tab', 3], ['analysis', 0]])
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
  assert.match(page, /class="home-notification-card" data-id="\{\{item\.id\}\}" data-user-id="id:\{\{item\.userId\}\}" bindtap="onNotificationTap"/)
  assert.match(page, /class="home-section__more" bindtap="onTabTap" data-id="notifications">查看更多/)
  assert.match(page, /bindtap="onTodayMostTap"/)
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
  assert.match(page, /<home-profile profile="\{\{profileData\}\}" bind:settingstap="onProfileSettingsTap" \/>/)
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
  const component = read('miniprogram/components/home-profile/index.wxml')

  assert.match(types, /export interface ProfilePageViewModel/)
  assert.match(service, /export function getProfilePageData\(\): Promise<ProfilePageViewModel>/)
  assert.match(service, /ensureLogin/)
  assert.match(service, /user\.nickname/)
  assert.match(service, /user\.avatar/)
  assert.match(service, /prepareMediaUrl/)
  assert.doesNotMatch(service, /from '\.\.\/mocks\//)
  assert.match(service, /balance: '0'/)
  assert.doesNotMatch(service, /870\.39/)
  assert.match(service, /pendingTitle: '尽情期待'/)
  assert.match(service, /pendingDescription: '更多功能，即将呈现'/)
  assert.match(service, /TODO\(API\): 接入「我的余额 \/ 提现 \/ 会员」真实接口/)
  assert.equal(existsSync(new URL('../miniprogram/mocks/profile.ts', import.meta.url)), false)
  assert.match(config, /bottom-tab-bar/)
  assert.match(component, /class="home-profile"/)
  assert.match(component, /class="home-profile__balance"/)
  assert.match(component, /class="home-profile__membership"/)
  assert.match(logic, /getProfilePageData\(\)/)
  assert.match(read('miniprogram/app.ts'), /from '\.\/services\/profile'/)
  assert.match(read('miniprogram/app.ts'), /hasAuthorizedLogin\(\)/)
  assert.match(logic, /runAuthed\(buildReturnPath\(HOME_PAGE_PATH, options\)/)
  assert.match(page, /<home-profile profile="\{\{profileData\}\}" bind:settingstap="onProfileSettingsTap" \/>/)
  assert.match(component, /bindtap="onSettingsTap"/)
  assert.match(component, /class="home-profile__identity"[\s\S]*class="home-profile__nickname"[\s\S]*class="home-profile__settings"/)
  assert.doesNotMatch(component, /slot="right"/)
  assert.match(logic, /onProfileSettingsTap\(\)/)
  assert.match(logic, /\/pages\/settings\/index/)
})

test('profile settings sits on the nickname row with matching side insets', () => {
  const component = read('miniprogram/components/home-profile/index.wxml')
  const styles = read('miniprogram/components/home-profile/index.less')

  assert.match(component, /class="home-profile__identity"[\s\S]*class="home-profile__avatar"[\s\S]*class="home-profile__nickname"[\s\S]*class="home-profile__settings"/)
  assert.match(styles, /.home-profile__content \{[\s\S]*padding: 280rpx 40rpx 360rpx;/)
  assert.match(styles, /.home-profile__identity \{[\s\S]*display: flex;[\s\S]*align-items: center;/)
  assert.match(styles, /.home-profile__nickname \{[\s\S]*flex: 1;/)
  assert.match(styles, /.home-profile__settings \{[\s\S]*margin-left: auto;[\s\S]*padding: 16rpx 0 16rpx 24rpx;/)
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

test('profile settings opens a notify intent threshold page', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const userService = read('miniprogram/services/user.ts')
  const apiTypes = read('miniprogram/types/api.ts')
  const settingTypes = read('miniprogram/types/settings.ts')
  const pageLogic = read('miniprogram/pages/settings/index.ts')
  const pageMarkup = read('miniprogram/pages/settings/index.wxml')
  const pageConfig = JSON.parse(read('miniprogram/pages/settings/index.json'))

  assert.ok(app.pages.includes('pages/settings/index'))
  assert.match(apiTypes, /export type ApiNotifyIntentLevel = 'low' \| 'medium' \| 'high'/)
  assert.match(settingTypes, /DEFAULT_NOTIFY_INTENT_LEVEL: NotifyIntentLevel = 'high'/)
  assert.match(userService, /path: '\/user\/notify-settings'/)
  assert.match(userService, /method: 'PUT'/)
  assert.match(userService, /data: \{ notifyIntentLevel \}/)
  assert.match(userService, /silent: true/)
  assert.doesNotMatch(userService, /wx\.request\(/)
  assert.doesNotMatch(userService, /from '\.\.\/mocks\//)

  assert.equal(pageConfig.enablePullDownRefresh, true)
  assert.match(pageMarkup, /推送意向门槛/)
  assert.match(pageMarkup, /<segmented-filter items="\{\{notifyIntentLevelOptions\}\}" active-id="\{\{activeNotifyIntentLevel\}\}"/)
  assert.match(pageLogic, /getNotifySettings/)
  assert.match(pageLogic, /updateNotifySettings/)
  assert.match(pageLogic, /DEFAULT_NOTIFY_INTENT_LEVEL/)
  assert.match(pageLogic, /onPullDownRefresh/)
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

  assert.match(page, /<scroll-view scroll-y class="home-page__tab-scroll" bindscroll="onHomeScroll"/)
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
  assert.match(styles, /\.bottom-tab-bar__item,\s*\.bottom-tab-bar__create \{[\s\S]*position: relative;/)
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
  const mapper = read('miniprogram/utils/notifications.ts')
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
  assert.match(mapper, /formatMonthDayTime\(event\.viewTime\)/)
  assert.match(mapper, /statusLabel: buildNotificationStatus\(event\)/)
  assert.match(service, /mapNotificationEvent/)
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

test('notifications map each browse from the notify list API', () => {
  const config = read('miniprogram/config/dev.ts')
  const service = read('miniprogram/services/notifications.ts')
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const pageLogic = read('miniprogram/pages/notifications/notifications.ts')

  assert.doesNotMatch(config, /NOTIFICATION_DATA_SOURCE/)
  assert.match(service, /path: '\/analysis\/notify\/list'/)
  assert.match(service, /发布者本人浏览由后端/)
  assert.doesNotMatch(service, /path: '\/analysis\/intent\/list'/)
  assert.doesNotMatch(service, /from '\.\.\/mocks\//)
  assert.match(service, /\(events \?\? \[\]\)\.filter\(\(event\) => event != null\)/)
  assert.doesNotMatch(service, /Boolean\(event\.viewTime\)/)
  assert.match(homeLogic, /if \(id === 'notifications'\) this\.loadNotifications\(\)/)
  assert.match(homeLogic, /if \(rootTabIds\[this\.data\.activeTabIndex\] === 'notifications'\)/)
  assert.match(homeLogic, /this\.loadHomeData\(true\)/)
  assert.match(pageLogic, /onShow\(\) \{[\s\S]*this\.loadNotifications\(\)/)
  assert.match(pageLogic, /authReady/)
})

test('backend datetime strings display as China wall-clock hours', async () => {
  const formatSource = read('miniprogram/utils/format.ts')
  const notificationSource = read('miniprogram/utils/notifications.ts')
  const { formatMonthDayTime, parseDateTime } = await import('../miniprogram/utils/format.ts')
  const { mapNotificationEvent } = await import('../miniprogram/utils/notifications.ts')
  const parsed = parseDateTime('2026-08-27 14:05:00')

  assert.match(formatSource, /Number\(match\[1\]\)/)
  assert.doesNotMatch(formatSource, /replace\(' ', 'T'\)/)
  assert.match(notificationSource, /parseWallClock/)
  assert.doesNotMatch(notificationSource, /replace\(' ', 'T'\)/)
  assert.equal(parsed?.getFullYear(), 2026)
  assert.equal(parsed?.getMonth(), 7)
  assert.equal(parsed?.getDate(), 27)
  assert.equal(parsed?.getHours(), 14)
  assert.equal(parsed?.getMinutes(), 5)
  assert.equal(formatMonthDayTime('2026-08-27 14:05:00'), '8月27日 14:05')
  assert.equal(formatMonthDayTime('2026-08-27T06:00:00'), '8月27日 06:00')
  assert.equal(
    mapNotificationEvent({
      id: '1',
      customerId: 'c1',
      nickname: '用户甲',
      avatar: null,
      materialId: '10',
      materialTitle: '作品A',
      actionType: 'play',
      duration: 8,
      progress: 40,
      completed: 0,
      intentLevel: 'low',
      viewTime: '2026-08-27 14:05:00',
    }, '', '').actionDate,
    '8月27日 14:05',
  )
})

test('notification page keeps one card for each browse of the same user', async () => {
  const { groupNotificationCards, mapNotificationEvent } = await import('../miniprogram/utils/notifications.ts')
  const first = mapNotificationEvent({
    id: '101',
    customerId: 'c1',
    nickname: '用户甲',
    avatar: null,
    materialId: '10',
    materialTitle: '作品A',
    actionType: 'play',
    duration: 8,
    progress: 40,
    completed: 0,
    intentLevel: 'medium',
    viewTime: '2026-08-26 12:00:00',
  }, '', '')
  const second = mapNotificationEvent({
    id: '102',
    customerId: 'c1',
    nickname: '用户甲',
    avatar: null,
    materialId: '10',
    materialTitle: '作品A',
    actionType: 'play',
    duration: 20,
    progress: 100,
    completed: 1,
    intentLevel: 'medium',
    viewTime: '2026-08-26 11:00:00',
  }, '', '')
  const forward = mapNotificationEvent({
    id: '103',
    customerId: 'c1',
    nickname: '用户甲',
    avatar: null,
    materialId: '10',
    materialTitle: '作品A',
    actionType: 'forward',
    duration: 0,
    progress: 0,
    completed: 0,
    intentLevel: 'medium',
    viewTime: '2026-08-25 18:00:00',
  }, '', '')
  const groups = groupNotificationCards([first, second, forward])

  assert.equal(first.userId, second.userId)
  assert.equal(first.eventId, '101')
  assert.equal(second.eventId, '102')
  assert.notEqual(first.id, second.id)
  assert.equal(first.action, 'reading')
  assert.equal(second.statusLabel, '该用户已完成浏览')
  assert.equal(forward.action, 'forward')
  assert.equal(groups.length, 2)
  assert.equal(groups[0].id, '2026-08-26')
  assert.equal(groups[0].items.length, 2)
  assert.equal(groups[1].items.length, 1)
})

test('notification header and filters stay fixed while the card list scrolls', () => {
  const homePage = read('miniprogram/pages/index/index.wxml')
  const page = read('miniprogram/pages/notifications/notifications.wxml')
  const component = read('miniprogram/components/home-notifications/index.wxml')
  const header = read('miniprogram/components/notification-header/index.wxml')
  const styles = read('miniprogram/pages/notifications/notifications.less')
  const homeStyles = read('miniprogram/pages/index/index.less')

  assert.match(page, /<notification-header filters="\{\{notifications\.filters\}\}"/)
  assert.match(page, /data-event-id="\{\{notification\.eventId\}\}"/)
  assert.match(component, /data-event-id="\{\{notification\.eventId\}\}"/)
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

test('user detail page follows Figma 497:4640', () => {
  const markup = read('miniprogram/pages/analysis-user-detail/index.wxml')
  const styles = read('miniprogram/pages/analysis-user-detail/index.less')
  const logic = read('miniprogram/pages/analysis-user-detail/index.ts')
  const service = read('miniprogram/services/analysis.ts')

  assert.match(markup, /<navigation-bar title="用户详情" back="\{\{true\}\}"/)
  assert.match(markup, /class="user-detail__profile-card"/)
  assert.match(markup, /class="user-detail__name" bindtap="onCopyUsername"/)
  assert.match(markup, /class="user-detail__contact" bindtap="onContactTap"/)
  assert.match(markup, /联系用户/)
  assert.match(markup, /class="user-detail__records-card"/)
  assert.match(markup, /class="user-detail__records-section"/)
  assert.match(markup, /class="user-detail__records"/)
  assert.match(markup, /class="user-detail__record" bindtap="onUserRecordTap" data-content-id="\{\{item\.contentId\}\}"/)
  assert.match(markup, /浏览记录/)
  assert.doesNotMatch(markup, /user-detail__record-tabs/)
  assert.match(markup, /微信名称复制成功，/)
  assert.match(markup, /关闭小程序后，前往微信联系用户。/)
  assert.match(markup, /wx:if="\{\{noticeVisible\}\}" class="user-detail__copy-feedback"/)
  assert.match(styles, /\.user-detail-page \{[\s\S]*background: #ffffff;/)
  assert.match(styles, /\.user-detail-page__content \{[\s\S]*padding: 40rpx 40rpx 40rpx;/)
  assert.match(styles, /\.user-detail__profile-card \{[\s\S]*gap: 20rpx;[\s\S]*padding: 40rpx;[\s\S]*border-radius: 40rpx;/)
  assert.match(styles, /\.user-detail__contact \{[\s\S]*height: 72rpx;[\s\S]*background: #0ec8d9;/)
  assert.match(styles, /\.user-detail__record \{[\s\S]*min-height: 176rpx;[\s\S]*background: #f5f5f5;/)
  assert.match(styles, /\.user-detail__record--pressed \{[\s\S]*opacity: 0\.72;/)
  assert.match(styles, /\.user-detail__records-section \{[\s\S]*margin-top: 40rpx;[\s\S]*gap: 10rpx;/)
  assert.match(styles, /\.user-detail__records-card \{[\s\S]*padding: 30rpx;[\s\S]*border: 2rpx solid @content-box-border;[\s\S]*border-radius: 40rpx;/)
  assert.match(styles, /\.user-detail__record-stats view \{[\s\S]*flex-direction: column;/)
  assert.match(styles, /\.user-detail__copy-feedback \{[\s\S]*width: 530rpx;[\s\S]*border-radius: 28rpx;[\s\S]*background: rgba\(0, 0, 0, 0\.8\);/)
  assert.match(logic, /onCopyUsername\(\)/)
  assert.match(logic, /onContactTap\(\)/)
  assert.match(logic, /copyUsername\(\)/)
  assert.match(logic, /noticeVisible: false/)
  assert.match(markup, /微信名称复制成功/)
  assert.match(markup, /#对\{\{detail\.profile\.highIntentContentCount\}\}个作品高意向/)
  assert.match(markup, /user-detail__record-intent user-detail__record-intent--\{\{item\.intentLevel\}\}">#\{\{item\.intentLabel\}\}/)
  assert.match(service, /getAnalysisUserDetail/)
  assert.match(service, /\/analysis\/customer\/history/)
  assert.match(service, /const allRangeQuery = \{ timeRange: 'all' \}/)
  assert.match(service, /asList\(historyRaw\)/)
  assert.match(service, /if \(!customer && !intent && aggregated\.length === 0\) return null/)
  assert.match(service, /aggregateCustomerHistoryByMaterial/)
  assert.match(service, /highIntentContentCount: records\.filter\(\(record\) => record\.intentLevel === 'high'\)\.length/)
  assert.match(service, /intentLevel: recordLevel/)
  assert.match(service, /readCount: formatCount\(record\.viewCount\)/)
  assert.match(service, /completionCount: formatCount\(record\.completeCount\)/)
  assert.match(service, /shareCount: formatCount\(record\.shareCount\)/)
  assert.match(service, /prepareMediaUrls\(aggregated\.map/)
  assert.match(service, /export function enrichAnalysisUserDetailThumbnails/)
  assert.match(logic, /enrichAnalysisUserDetailThumbnails/)
  assert.match(markup, /class="user-detail__record-stats">[\s\S]*观看时长[\s\S]*完播数[\s\S]*浏览次数[\s\S]*转发/)
})

test('user detail contact copies the username', () => {
  const copied = []
  const page = loadPageDefinition('miniprogram/pages/analysis-user-detail/index.ts', {
    getAnalysisUserDetail: () => Promise.resolve(null),
    wx: {
      setClipboardData: ({ data, success }) => {
        copied.push(data)
        success?.()
      },
      hideToast: () => {},
    },
  })
  const context = {
    data: { detail: { profile: { name: '测试用户' } }, noticeVisible: false },
    noticeTimer: null,
    setData(update) { Object.assign(this.data, update) },
    copyUsername: page.copyUsername,
    showNotice() { this.setData({ noticeVisible: true }) },
  }

  page.onContactTap.call(context)

  assert.deepEqual(copied, ['测试用户'])
  assert.equal(context.data.noticeVisible, true)
})

test('user detail history merges the same work into one record', async () => {
  const { aggregateCustomerHistoryByMaterial } = await import('../miniprogram/utils/analysis-users.ts')
  const merged = aggregateCustomerHistoryByMaterial([
    { materialId: 10, title: '作品A', fileType: 'VIDEO', duration: 0, progress: 0, completed: 0, viewTime: '2026-08-26 13:00:00', actionType: 'forward' },
    { materialId: 10, title: '作品A', fileType: 'VIDEO', duration: 10, progress: 40, completed: 0, viewTime: '2026-08-26 12:00:00', actionType: 'play' },
    { materialId: 10, title: '作品A', fileType: 'VIDEO', duration: 20, progress: 80, completed: 1, viewTime: '2026-08-25 12:00:00', actionType: 'play' },
    { materialId: 10, title: '作品A', fileType: 'VIDEO', duration: 5, progress: 10, completed: 0, viewTime: '2026-08-25 11:00:00', actionType: 'end' },
    { materialId: 11, title: '作品B', fileType: 'PDF', duration: 5, progress: 10, completed: 0, viewTime: '2026-08-24 12:00:00', actionType: 'play' },
  ])

  assert.equal(merged.length, 2)
  assert.equal(merged[0].materialId, '10')
  assert.equal(merged[0].progress, 80)
  assert.equal(merged[0].duration, 30)
  assert.equal(merged[0].viewCount, 2)
  assert.equal(merged[0].completeCount, 1)
  assert.equal(merged[0].shareCount, 1)
  assert.equal(merged[0].viewTime, '2026-08-26 13:00:00')
  assert.equal(merged[1].materialId, '11')
  assert.equal(merged[1].viewCount, 1)
  assert.equal(merged[1].shareCount, 0)

  const missingAction = aggregateCustomerHistoryByMaterial([
    { materialId: '9', title: '旧数据', fileType: 'PDF', duration: 3, progress: 15, completed: 0, viewTime: '2026-08-20 10:00:00' },
    { materialId: '9', title: '旧数据', fileType: 'PDF', duration: 4, progress: 20, completed: 0, viewTime: '2026-08-19 10:00:00' },
  ])
  assert.equal(missingAction.length, 1)
  assert.equal(missingAction[0].viewCount, 2)
  assert.equal(missingAction[0].duration, 7)
  assert.equal(missingAction[0].progress, 20)

  const endOnly = aggregateCustomerHistoryByMaterial([
    { materialId: 12, title: '作品C', fileType: 'VIDEO', duration: 8, progress: 90, completed: 1, viewTime: '2026-08-23 12:00:00', actionType: 'end' },
  ])
  assert.equal(endOnly.length, 1)
  assert.equal(endOnly[0].viewCount, 1)
  assert.equal(endOnly[0].completeCount, 1)
  assert.equal(endOnly[0].duration, 8)
  assert.equal(endOnly[0].progress, 90)
})

test('dataset ids keep snowflake customer ids as strings', async () => {
  const { fromDatasetId } = await import('../miniprogram/utils/dataset-id.ts')
  const analysisMarkup = read('miniprogram/pages/analysis/index.wxml')
  const detailMarkup = read('miniprogram/pages/analysis-detail/index.wxml')
  const notificationsMarkup = read('miniprogram/pages/notifications/notifications.wxml')
  const userDetailLogic = read('miniprogram/pages/analysis-user-detail/index.ts')

  assert.equal(fromDatasetId('id:1991234567890123456'), '1991234567890123456')
  assert.equal(fromDatasetId('1991234567890123456'), '1991234567890123456')
  assert.equal(fromDatasetId(''), '')
  assert.match(analysisMarkup, /data-id="id:\{\{item\.id\}\}"/)
  assert.match(detailMarkup, /data-id="id:\{\{item\.id\}\}"/)
  assert.match(notificationsMarkup, /data-id="id:\{\{notification\.userId\}\}"/)
  assert.match(userDetailLogic, /\[analysis-user-detail\] load failed/)
})

test('user detail records resolve per-work intent and high-intent work count', async () => {
  const { resolveIntentLevelFromCounts } = await import('../miniprogram/utils/analysis-users.ts')

  assert.equal(resolveIntentLevelFromCounts(2, 0), 'high')
  assert.equal(resolveIntentLevelFromCounts(1, 1), 'medium')
  assert.equal(resolveIntentLevelFromCounts(1, 0), 'low')
  assert.equal(resolveIntentLevelFromCounts(3, 2), 'high')
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
  assert.match(publishLogic, /returnToMaterialsList/)
  assert.match(read('miniprogram/utils/publish-return.ts'), /wx\.navigateBack/)
  assert.match(read('miniprogram/utils/publish-return.ts'), /\/pages\/index\/index/)
})

test('publish page picks image/video from camera or album and PDF from chat files', () => {
  const markup = read('miniprogram/pages/materials/publish/index.wxml')
  const logic = read('miniprogram/pages/materials/publish/index.ts')
  const picker = read('miniprogram/utils/publish-media.ts')
  const service = read('miniprogram/services/materials.ts')
  const types = read('miniprogram/types/materials.ts')
  const app = JSON.parse(read('miniprogram/app.json'))

  assert.match(markup, /bindtap="onAddMediaTap"/)
  assert.match(markup, /typeSheetVisible/)
  assert.match(markup, /sourceSheetVisible/)
  assert.match(picker, /label: '图片'/)
  assert.match(picker, /label: '视频'/)
  assert.match(picker, /label: 'PDF'/)
  assert.match(picker, /label: '拍摄'/)
  assert.match(picker, /label: '从相册选择'/)
  assert.match(picker, /export function getPublishTypeOptions/)
  assert.match(logic, /getPublishTypeOptions\(this\.data\.media\)/)
  assert.match(logic, /wx\.chooseMedia\(/)
  assert.match(logic, /chooseImageOrVideo\(\['camera'\]\)/)
  assert.match(logic, /chooseImageOrVideo\(\['album'\]\)/)
  assert.match(logic, /this\.pendingMediaType === 'video' \? \['video'\] : \['image'\]/)
  assert.doesNotMatch(logic, /mediaType: \['image', 'video'\]/)
  assert.match(logic, /wx\.chooseMessageFile\(/)
  assert.match(logic, /type: 'file'/)
  assert.match(logic, /extension: \['pdf'\]/)
  assert.doesNotMatch(logic, /wx\.chooseImage\(/)
  assert.match(types, /export interface PublishMediaViewModel/)
  assert.match(service, /fileType: 'VIDEO'/)
  assert.match(service, /fileType: 'PDF'/)
  assert.equal(app.permission['scope.camera'].desc, '用于拍摄照片或视频并发布素材')
})

test('publish copy keeps colorful emoji presentation', async () => {
  const { ensureEmojiPresentation } = await import('../miniprogram/utils/emoji.ts')
  const markup = read('miniprogram/pages/materials/publish/index.wxml')
  const logic = read('miniprogram/pages/materials/publish/index.ts')
  const styles = read('miniprogram/pages/materials/publish/index.less')
  const config = JSON.parse(read('miniprogram/pages/materials/publish/index.json'))

  assert.equal(ensureEmojiPresentation('\u263A'), '\u263A\uFE0F')
  assert.equal(ensureEmojiPresentation('\u263A\uFE0F'), '\u263A\uFE0F')
  assert.equal(ensureEmojiPresentation('\u2639'), '\u2639\uFE0F')
  assert.equal(ensureEmojiPresentation('\uD83D\uDE0A'), '\uD83D\uDE0A')
  assert.equal(ensureEmojiPresentation('卖100份'), '卖100份')
  assert.equal(ensureEmojiPresentation(''), '')

  assert.match(markup, /class="publish-page__copy"/)
  assert.match(markup, /class="publish-page__copy-area" bindtap="onCopyAreaTap"/)
  assert.match(logic, /onCopyAreaTap\(\)/)
  assert.match(logic, /copyFocused: true/)
  assert.match(logic, /onCopyBlur\(\)/)
  assert.match(styles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(styles, /aspect-ratio: 1 \/ 1/)
  assert.match(styles, /\.publish-page__content \{[\s\S]*padding: 10rpx 40rpx 180rpx/)
  assert.doesNotMatch(styles, /width: 140rpx/)
  assert.match(logic, /ensureEmojiPresentation\(event\.detail\.value\)/)
  assert.match(logic, /ensureEmojiPresentation\(this\.data\.copy\)/)
  assert.match(styles, /Apple Color Emoji/)
  assert.match(styles, /Segoe UI Emoji/)
  assert.equal(config.renderer, 'webview')
})

test('publish type sheet only offers the current media kind', async () => {
  const {
    canAddPublishMedia,
    getPublishTypeOptions,
    mergePublishMedia,
  } = await import('../miniprogram/utils/publish-media.ts')
  const image = { id: '1', path: 'a.jpg', kind: 'image', previewPath: '', name: '', duration: 0 }
  const video = { id: '2', path: 'a.mp4', kind: 'video', previewPath: 't.jpg', name: '', duration: 8 }
  const pdf = { id: '3', path: 'a.pdf', kind: 'pdf', previewPath: '', name: 'a.pdf', duration: 0 }

  const nineImages = Array.from({ length: 9 }, (_, index) => ({ ...image, id: String(index) }))

  assert.deepEqual(getPublishTypeOptions([]).map((option) => option.id), ['image', 'video', 'pdf'])
  assert.deepEqual(getPublishTypeOptions([image]).map((option) => option.id), ['image'])
  assert.deepEqual(getPublishTypeOptions([video]).map((option) => option.id), ['video'])
  assert.deepEqual(getPublishTypeOptions([pdf]).map((option) => option.id), ['pdf'])
  assert.equal(canAddPublishMedia([image]), true)
  assert.equal(canAddPublishMedia(nineImages), false)
  assert.equal(canAddPublishMedia([video]), false)
  assert.equal(canAddPublishMedia([pdf]), false)
  assert.equal(mergePublishMedia([video], [{ ...video, id: '2b' }]).items[0].id, '2')
  assert.equal(mergePublishMedia([pdf], [{ ...pdf, id: '3b' }]).items[0].id, '3')
})

test('publish success modal shares to friends and moments', () => {
  const modalMarkup = read('miniprogram/components/publish-success-modal/index.wxml')
  const modalLogic = read('miniprogram/components/publish-success-modal/index.ts')
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const homeConfig = JSON.parse(read('miniprogram/pages/index/index.json'))
  const publishLogic = read('miniprogram/pages/materials/publish/index.ts')
  const shareUtil = read('miniprogram/utils/share-material.ts')

  assert.match(modalMarkup, /open-type="\{\{shareReady \? 'share' : ''\}\}"/)
  assert.match(modalMarkup, /publish-success-modal__share-preview/)
  assert.match(modalMarkup, /bindtap="onShareMomentsTap"/)
  assert.doesNotMatch(modalLogic, /sharefriends/)
  assert.match(publishLogic, /returnToMaterialsList\(\{[\s\S]*showSuccessModal: true/)
  assert.match(publishLogic, /getMaterialShareCard\(/)
  assert.match(publishLogic, /shareTitle: card\.shareTitle/)
  assert.match(publishLogic, /shareImageUrl: card\.shareImageUrl/)
  assert.match(homeMarkup, /share-ready="\{\{shareImageUrl \? true : false\}\}"/)
  assert.match(homeMarkup, /share-image-url="\{\{shareImageUrl\}\}"/)
  assert.match(homeLogic, /applyPendingPublishReturn/)
  assert.match(homeLogic, /onShareAppMessage\(\)/)
  assert.match(homeLogic, /buildMaterialSharePath/)
  assert.match(homeLogic, /showMomentsShareGuide/)
  assert.match(homeLogic, /onShareTimeline\(\)/)
  assert.match(shareUtil, /请点击右上角「···」，选择「分享到朋友圈」/)
  assert.match(shareUtil, /shareTimeline/)
  assert.equal(homeConfig.enableShareAppMessage, true)
  assert.equal(homeConfig.enableShareTimeline, true)
  assert.doesNotMatch(homeLogic, /分享功能待接入/)
  assert.doesNotMatch(shareUtil, /wx\.showShareImageMenu\(/)
})

test('publish success share card uses the material preview instead of a page screenshot', async () => {
  const { getPublishShareImageUrl, pickShareImageUrl } = await import('../miniprogram/utils/share-material.ts')
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const materialsLogic = read('miniprogram/pages/materials/index.ts')

  assert.equal(getPublishShareImageUrl([{ kind: 'image', path: 'wxfile://tmp/a.jpg', previewPath: '' }]), 'wxfile://tmp/a.jpg')
  assert.equal(getPublishShareImageUrl([{ kind: 'video', path: 'wxfile://tmp/a.mp4', previewPath: 'wxfile://tmp/cover.jpg' }]), 'wxfile://tmp/cover.jpg')
  assert.equal(pickShareImageUrl('wxfile://tmp/a.jpg', [], '1'), 'wxfile://tmp/a.jpg')
  assert.equal(pickShareImageUrl('', [{ id: '1', thumbnailUrl: 'wxfile://tmp/list.jpg' }], '1'), 'wxfile://tmp/list.jpg')

  for (const logic of [homeLogic, materialsLogic]) {
    assert.match(logic, /pending\.shareTitle \|\| this\.data\.shareTitle/)
    assert.match(logic, /pending\.shareImageUrl \|\| this\.data\.shareImageUrl/)
    assert.match(logic, /onShareAppMessage\(\)[\s\S]*?pickShareImageUrl/)
    assert.match(logic, /if \(!this\.data\.shareMaterialId \|\| !imageUrl\) return/)
    assert.doesNotMatch(logic, /closePublishSuccessModalAfterShare\(\) \{[\s\S]*?showPublishSuccessModal: false/)
  }
})

test('publish success modal closes after sharing with friends', () => {
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const materialsLogic = read('miniprogram/pages/materials/index.ts')

  for (const logic of [homeLogic, materialsLogic]) {
    assert.match(logic, /closePublishSuccessModalAfterShare\(\)/)
    assert.match(logic, /closePublishSuccessModalAfterShareReturn\(\)/)
    assert.match(logic, /onShareAppMessage\(\)[\s\S]*?closePublishSuccessModalAfterShare\(\)/)
    assert.match(logic, /onShow\(\)[\s\S]*?closePublishSuccessModalAfterShareReturn\(\)/)
  }
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

test('materials home uses the mine API and the Figma striped background', () => {
  const config = read('miniprogram/config/dev.ts')
  const service = read('miniprogram/services/materials.ts')
  const markup = read('miniprogram/pages/materials/index.wxml')
  const styles = read('miniprogram/pages/materials/index.less')

  assert.doesNotMatch(config, /MATERIALS_DATA_SOURCE/)
  assert.match(service, /path: '\/material\/mine'/)
  assert.match(service, /resolveMaterialCopy/)
  assert.match(service, /title: resolveMaterialCopy\(material\)/)
  assert.doesNotMatch(service, /from '\.\.\/mocks\//)
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

test('materials filter buttons stay fixed above the scrolling list', () => {
  const markup = read('miniprogram/pages/materials/index.wxml')
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const styles = read('miniprogram/pages/materials/index.less')
  const pageConfig = JSON.parse(read('miniprogram/pages/materials/index.json'))

  assert.equal(pageConfig.disableScroll, true)
  assert.match(styles, /\.materials-filter\s*\{[\s\S]*?flex-shrink: 0;/)
  assert.match(styles, /\.materials-page__scroll\s*\{[\s\S]*?flex: 1;/)

  for (const source of [markup, homeMarkup]) {
    const filterIndex = source.indexOf('class="materials-filter"')
    const scrollOpen = source.search(/<scroll-view[^>]*class="[^"]*materials-(?:page__)?scroll/)
    assert.ok(filterIndex > -1, 'filter toolbar should exist')
    assert.ok(scrollOpen > filterIndex, 'filter toolbar should sit outside the list scroll-view')
    const scrollClose = source.indexOf('</scroll-view>', scrollOpen)
    assert.doesNotMatch(source.slice(scrollOpen, scrollClose), /class="materials-filter"/)
  }
})

test('materials publish button does not place a blue gradient layer over cards or navigation', () => {
  const pageStyles = read('miniprogram/pages/materials/index.less')
  const navigationStyles = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.less')

  assert.match(navigationStyles, /\.bottom-tab-bar\s*\{[\s\S]*?z-index: 1000;/)
  assert.match(pageStyles, /\.materials-page__content\s*\{[\s\S]*?z-index: 2;/)
  assert.match(pageStyles, /\.materials-publish-bar\s*\{[\s\S]*?z-index: 3;[\s\S]*?background: transparent;/)
  assert.doesNotMatch(pageStyles, /\.materials-publish-bar\s*\{[\s\S]*?background: linear-gradient/)
})

test('material detail opens image preview, video player and PDF reader', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const types = read('miniprogram/types/materials.ts')
  const service = read('miniprogram/services/materials.ts')
  const markup = read('miniprogram/pages/material-detail/index.wxml')
  const logic = read('miniprogram/pages/material-detail/index.ts')
  const documentService = read('miniprogram/services/document.ts')
  const documentLogic = read('miniprogram/pages/document-reader/index.ts')

  assert.ok(app.pages.includes('pages/material-detail/index'))
  assert.ok(app.pages.includes('pages/document-reader/index'))
  assert.match(types, /fileType: string/)
  assert.match(types, /videoUrl: string/)
  assert.match(types, /pdfUrl: string/)
  assert.match(service, /fileType === 'VIDEO'/)
  assert.match(service, /videoUrl = resolveMediaUrl\(material\.fileUrl\)/)
  assert.match(service, /prepareDocumentPageImage\(String\(material\.id\), 0\)/)
  assert.match(service, /fileType === 'PDF' \|\| fileType === 'TABLE'/)
  assert.match(markup, /<video[\s\S]*id="materialVideo"[\s\S]*src="\{\{detail\.videoUrl\}\}"/)
  assert.match(markup, /bindtap="onPdfOpenTap"/)
  assert.match(markup, /class="material-detail__pdf-preview" src="\{\{detail\.previewUrl\}\}"/)
  assert.doesNotMatch(markup, /点击查看/)
  assert.doesNotMatch(markup, /material-detail__pdf-open/)
  assert.match(markup, /bindtap="onImageTap"/)
  assert.match(logic, /wx\.previewImage/)
  assert.match(logic, /\/pages\/document-reader\/index\?/)
  assert.match(logic, /materialId=\$\{encodeURIComponent\(detail\.id\)\}/)
  assert.match(documentService, /path: `\/material\/\$\{materialId\}\/page-count`/)
  assert.match(documentService, /\/material\/\$\{materialId\}\/page\/\$\{pageIndex\}\/image/)
  assert.match(documentLogic, /getDocumentPageCount/)
  assert.match(documentLogic, /prepareDocumentPageImage/)
  assert.match(documentLogic, /pickCurrentDocumentPageByScroll/)
  assert.match(documentLogic, /onDocumentScroll/)
})

test('pdf first-page previews are used wherever thumbnails are shown', () => {
  const materials = read('miniprogram/services/materials.ts')
  const home = read('miniprogram/services/home.ts')
  const notifications = read('miniprogram/services/notifications.ts')
  const analysis = read('miniprogram/services/analysis.ts')

  assert.match(materials, /export function prepareMaterialThumbnail/)
  assert.match(materials, /prepareDocumentPageImage\(String\(material\.id\), 0\)/)
  assert.match(home, /prepareMaterialThumbnailMap/)
  assert.match(notifications, /prepareMaterialThumbnailMap/)
  assert.match(analysis, /prepareMaterialThumbnailMap/)
  assert.match(analysis, /prepareMaterialThumbnail\(/)
  assert.match(analysis, /enrichAnalysisUserDetailThumbnails/)
  assert.doesNotMatch(home, /resolveMediaUrl\(item\.coverUrl\)/)
  assert.doesNotMatch(home, /resolveMediaUrl\(material\.coverUrl\)/)
  assert.doesNotMatch(notifications, /resolveMediaUrl\(material\.coverUrl\)/)
  assert.doesNotMatch(analysis, /resolveMediaUrl\(item\.coverUrl\)/)
  assert.doesNotMatch(analysis, /resolveMediaUrl\(material\?\.coverUrl\)/)
})

test('friend material views report play and forward tracking events', () => {
  const tracking = read('miniprogram/services/tracking.ts')
  const requestLayer = read('miniprogram/services/request.ts')
  const types = read('miniprogram/types/materials.ts')
  const materials = read('miniprogram/services/materials.ts')
  const shareUtil = read('miniprogram/utils/share-material.ts')
  const detailLogic = read('miniprogram/pages/material-detail/index.ts')
  const detailMarkup = read('miniprogram/pages/material-detail/index.wxml')
  const documentLogic = read('miniprogram/pages/document-reader/index.ts')
  const homeLogic = read('miniprogram/pages/index/index.ts')

  assert.match(tracking, /\/tracking\/event/)
  assert.match(tracking, /\/tracking\/forward/)
  assert.match(tracking, /ensureLogin/)
  assert.match(tracking, /visitorId: user\.openid \|\| undefined/)
  assert.match(tracking, /silent: true/)
  assert.doesNotMatch(tracking, /skipAuth:\s*true/)
  assert.doesNotMatch(tracking, /wx\.request\(/)
  assert.doesNotMatch(tracking, /from '\.\.\/mocks\//)

  assert.match(requestLayer, /const showLoading = !options\.silent/)
  assert.match(types, /trackingId: string/)
  assert.match(materials, /trackingId: material\.trackingId \?\? ''/)
  assert.match(shareUtil, /trackingId=\$\{encodeURIComponent\(trackingId\)\}/)

  assert.match(detailLogic, /createTrackingSessionId/)
  assert.match(detailLogic, /reportTrackingEvent/)
  assert.match(detailLogic, /markImageViewed/)
  assert.match(detailLogic, /reportDocumentView/)
  assert.match(detailLogic, /fileType === 'VIDEO'/)
  assert.match(detailLogic, /reportVideoProgress\(false, detail\)/)
  assert.match(detailLogic, /actionType: 'play'/)
  assert.match(detailLogic, /actionType: 'forward'/)
  assert.match(detailLogic, /onShareAppMessage\(\)[\s\S]*?reportForwardTracking\(\)/)
  assert.match(detailLogic, /onShareTimeline\(\)[\s\S]*?reportForwardTracking\(\)/)
  assert.match(detailLogic, /options\.trackingId/)
  assert.match(detailLogic, /sessionId=\$\{encodeURIComponent\(this\.trackingSessionId\)\}/)
  assert.match(detailMarkup, /bindplay="onVideoPlay"/)
  assert.match(detailMarkup, /bindpause="onVideoPause"/)
  assert.match(detailMarkup, /bindended="onVideoEnded"/)

  assert.match(documentLogic, /createTrackingSessionId/)
  assert.match(documentLogic, /reportTrackingEvent/)
  assert.match(documentLogic, /markPageViewed/)
  assert.match(documentLogic, /options\.trackingId/)
  assert.match(documentLogic, /options\.sessionId/)
  assert.match(documentLogic, /isComplete && hasSentPlay \? 'end' : 'play'/)
  assert.doesNotMatch(detailLogic, /from '\.\.\/mocks\//)
  assert.doesNotMatch(documentLogic, /from '\.\.\/mocks\//)

  assert.match(homeLogic, /shareTrackingId/)
  assert.match(homeLogic, /buildMaterialSharePath\(this\.data\.shareMaterialId, this\.data\.shareTrackingId\)/)
})

test('shared material opens home first so back does not leave the mini program', async () => {
  const {
    buildHomeShareQuery,
    buildMaterialDetailPath,
    buildMaterialSharePath,
    buildMaterialShareQuery,
    HOME_PAGE_PATH,
    MATERIAL_DETAIL_PATH,
  } = await import('../miniprogram/utils/share-material.ts')
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const detailLogic = read('miniprogram/pages/material-detail/index.ts')
  const navigationLogic = read('miniprogram/components/navigation-bar/navigation-bar.ts')

  assert.equal(HOME_PAGE_PATH, '/pages/index/index')
  assert.equal(MATERIAL_DETAIL_PATH, '/pages/material-detail/index')
  assert.equal(buildMaterialSharePath('abc', 't1'), '/pages/index/index?materialId=abc&trackingId=t1')
  assert.equal(buildHomeShareQuery('abc', 't1'), 'materialId=abc&trackingId=t1')
  assert.equal(buildMaterialDetailPath('abc', 't1'), '/pages/material-detail/index?id=abc&trackingId=t1')
  assert.equal(buildMaterialShareQuery('abc', 't1'), 'id=abc&trackingId=t1')

  assert.match(homeLogic, /options\.materialId/)
  assert.match(homeLogic, /buildMaterialDetailPath\(options\.materialId, options\.trackingId\)/)
  assert.match(homeLogic, /buildHomeShareQuery\(this\.data\.shareMaterialId, this\.data\.shareTrackingId\)/)
  assert.match(detailLogic, /isRootPageStack\(\)/)
  assert.match(detailLogic, /wx\.reLaunch\(\{ url: buildMaterialSharePath\(materialId, trackingId\) \}\)/)
  assert.match(navigationLogic, /fail: \(\) => \{/)
  assert.match(navigationLogic, /wx\.reLaunch\(\{ url: HOME_PAGE_PATH \}\)/)
})

test('material detail shares to friends and guides moments sharing', () => {
  const markup = read('miniprogram/pages/material-detail/index.wxml')
  const logic = read('miniprogram/pages/material-detail/index.ts')
  const styles = read('miniprogram/pages/material-detail/index.less')
  const pageConfig = JSON.parse(read('miniprogram/pages/material-detail/index.json'))
  const shareUtil = read('miniprogram/utils/share-material.ts')

  assert.match(markup, /open-type="share"/)
  assert.match(markup, /bindtap="onShareMomentsTap"/)
  assert.match(logic, /onShareAppMessage\(\)[\s\S]*?reportForwardTracking\(\)/)
  assert.match(logic, /onShareTimeline\(\)[\s\S]*?reportForwardTracking\(\)/)
  assert.match(logic, /buildMaterialSharePath\(detail\.id, detail\.trackingId/)
  assert.match(logic, /showMomentsShareGuide/)
  assert.match(logic, /enableMaterialShareMenu/)
  assert.match(shareUtil, /请点击右上角「···」，选择「分享到朋友圈」/)
  assert.doesNotMatch(shareUtil, /wx\.showShareImageMenu\(/)
  assert.equal(pageConfig.enableShareAppMessage, true)
  assert.equal(pageConfig.enableShareTimeline, true)
  assert.match(styles, /\.material-detail__share-button::after \{[\s\S]*display: none;/)
})

test('document reader current page follows the top of the reading area', async () => {
  const { pickCurrentDocumentPageByScroll, getDocumentPageBlockHeight } = await import('../miniprogram/utils/document-page.ts')
  const windowWidth = 393
  const pageHeight = getDocumentPageBlockHeight(undefined, windowWidth)

  assert.equal(pickCurrentDocumentPageByScroll(0, 7, [], windowWidth), 0)
  assert.equal(pickCurrentDocumentPageByScroll(pageHeight - 1, 7, [], windowWidth), 0)
  assert.equal(pickCurrentDocumentPageByScroll(pageHeight, 7, [], windowWidth), 1)
  assert.equal(pickCurrentDocumentPageByScroll(pageHeight * 3, 7, [], windowWidth), 3)
  assert.equal(pickCurrentDocumentPageByScroll(0, 0, [], windowWidth), -1)
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
  assert.match(styles, /\.analysis-work-list\s*\{[\s\S]*?border-radius: 40rpx;[\s\S]*?background: #ffffff;/)
  assert.match(styles, /\.analysis-work-row__thumbnail\s*\{[\s\S]*?width: 100rpx;[\s\S]*?height: 136rpx;/)
  assert.match(styles, /\.analysis-work-row__metrics\s*\{[\s\S]*?justify-content: space-between;/)
  assert.match(types, /publishedAt: string/)
  assert.match(types, /compactMetrics: AnalysisMetric\[\]/)
  assert.match(service, /compactMetrics:/)
  assert.match(homeLogic, /activeAnalysisSortLabel: '浏览次数'/)
  assert.match(markup, /\{\{visibleAnalysisCards\}\}/)
})

test('analysis work list re-sorts when the sort option changes', () => {
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const analysisLogic = read('miniprogram/pages/analysis/index.ts')
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const analysisMarkup = read('miniprogram/pages/analysis/index.wxml')

  assert.match(homeLogic, /sortAnalysisUsers\(this\.data\.analysisData\?\.audienceUsers \?\? \[\], option\.id\)/)
  assert.match(analysisLogic, /sortAnalysisUsers\(this\.data\.analysisData\?\.audienceUsers \?\? \[\], sortOption\.id\)/)
  assert.match(homeLogic, /sortAnalysisCards\(this\.data\.visibleAnalysisCards, option\.id\)/)
  assert.match(analysisLogic, /sortAnalysisCards\(this\.data\.visibleAnalysisCards, sortOption\.id\)/)
  assert.match(homeMarkup, /visible-analysis-cards="\{\{visibleAnalysisCards\}\}"/)
  assert.match(analysisMarkup, /\{\{visibleAnalysisCards\}\}/)
})

test('analysis work data comes from backend analysis APIs', () => {
  const config = read('miniprogram/config/dev.ts')
  const service = read('miniprogram/services/analysis.ts')
  const componentStylesPath = new URL('../miniprogram/components/home-analysis/index.less', import.meta.url)
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const analysisLogic = read('miniprogram/pages/analysis/index.ts')

  assert.equal(existsSync(componentStylesPath), true)
  assert.doesNotMatch(config, /ANALYSIS_DATA_SOURCE/)
  assert.match(service, /path: '\/analysis\/dashboard'/)
  assert.match(service, /path: '\/analysis\/content\/list'/)
  assert.match(service, /orderBy: workSortOrderBy\[sortId\]/)
  assert.match(service, /label: '浏览次数', value: formatCount\(viewCount\)/)
  assert.match(service, /label: '转发', value: formatCount\(forwardCount\)/)
  assert.match(service, /label: '完播', value: formatCount\(completeCount\)/)
  assert.match(service, /export function getAnalysisWorkList/)
  assert.match(homeLogic, /getAnalysisWorkList\(period, this\.resolveWorkDateRange\(period, dateRange\), this\.data\.activeAnalysisSort\)/)
  assert.match(analysisLogic, /getAnalysisWorkList\(period, this\.resolveWorkDateRange\(period, dateRange\), this\.data\.activeAnalysisSort\)/)
  assert.doesNotMatch(service, /from '\.\.\/mocks\//)
  assert.match(read('miniprogram/components/home-analysis/index.less'), /@import ['"]\.\.\/\.\.\/pages\/analysis\/index\.less['"]/)
})

test('analysis user mapping uses dashboard intent counts and completion metrics', () => {
  const service = read('miniprogram/services/analysis.ts')
  const types = read('miniprogram/types/analysis.ts')

  assert.match(service, /label: '高意向'/)
  assert.match(service, /label: '中意向'/)
  assert.match(service, /label: '低意向'/)
  assert.match(service, /completionCount: formatCount\(customer\.completeCount\)/)
  assert.match(types, /completionCount: string/)
})

test('analysis user tab follows the Figma 507:1682 list hierarchy', () => {
  const standalone = read('miniprogram/pages/analysis/index.wxml')
  const embedded = read('miniprogram/components/home-analysis/index.wxml')
  const styles = read('miniprogram/pages/analysis/index.less')

  for (const markup of [standalone, embedded]) {
    assert.match(markup, /class="analysis-user__summary"[\s\S]*class="analysis-user__title">意向用户<[\s\S]*class="analysis-user__list-panel"/)
    assert.match(markup, />完播<\/text>/)
    assert.doesNotMatch(markup, />观看作品<\/text>/)
  }

  assert.match(styles, /\.analysis-user__summary-card \{[\s\S]*height: 130rpx;[\s\S]*border: 2rpx solid @content-box-border;[\s\S]*border-radius: 24rpx;[\s\S]*background: #ffffff;/)
  assert.match(styles, /\.analysis-user__list-panel \{[\s\S]*min-height: 946rpx;[\s\S]*padding: 40rpx 40rpx 88rpx;[\s\S]*border: 2rpx solid @content-box-border;[\s\S]*border-radius: 40rpx;[\s\S]*background: #ffffff;/)
  assert.match(styles, /\.analysis-user__tag--high \{[\s\S]*color: #ff4343;[\s\S]*background: #ffd7ce;/)
})

test('analysis user list stacks its filter above the rows', () => {
  const styles = read('miniprogram/pages/analysis/index.less')

  assert.match(styles, /\.analysis-user__list-panel \{[^}]*display: flex;[^}]*flex-direction: column;/)
})

test('analysis user filters stay visible when the current filter is empty', () => {
  const standalone = read('miniprogram/pages/analysis/index.wxml')
  const embedded = read('miniprogram/components/home-analysis/index.wxml')

  for (const markup of [standalone, embedded]) {
    assert.match(markup, /<view class="analysis-user__list-panel">/)
    assert.doesNotMatch(markup, /wx:if="\{\{hasAnalysisUsers\}\}" class="analysis-user__list-panel"/)
    assert.match(markup, /class="analysis-user__list-panel">[\s\S]*<segmented-filter items="\{\{analysisPeriods\}\}"[\s\S]*class="analysis-sort"[\s\S]*wx:if="\{\{hasAnalysisUsers\}\}" class="analysis-user__list"[\s\S]*analysis-empty-state--user/)
  }
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
  assert.match(styles, /\.analysis-sort \{[\s\S]*height: 64rpx;[\s\S]*padding: @segmented-filter-vertical-inset;[\s\S]*border-radius: 20rpx;[\s\S]*background: #e0e0e0;/)
  assert.match(styles, /\.analysis-sort__inner \{[\s\S]*gap: 8rpx;[\s\S]*padding: 0 20rpx;[\s\S]*border-radius: 16rpx;[\s\S]*font-size: 26rpx;/)
  assert.match(styles, /\.analysis-filters--redesign \.analysis-sort \{[\s\S]*border: 0;[\s\S]*background: #e0e0e0;/)
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

test('analysis detail page follows Figma 497:5232', () => {
  const markup = read('miniprogram/pages/analysis-detail/index.wxml')
  const styles = read('miniprogram/pages/analysis-detail/index.less')
  const service = read('miniprogram/services/analysis.ts')

  assert.doesNotMatch(markup, /detail-page__texture/)
  assert.match(styles, /page \{[^}]*background: #ffffff;/)
  assert.match(styles, /\.detail-card \{[^}]*height: 332rpx;[^}]*padding: 40rpx;[^}]*border: 2rpx solid @content-box-border;[^}]*border-radius: 40rpx;/)
  assert.match(styles, /\.detail-card__thumbnail \{[^}]*width: 100rpx;[^}]*height: 136rpx;/)
  assert.match(styles, /\.detail-intent__title \{[^}]*color: #8a8e94;[^}]*font-size: 28rpx;/)
  assert.match(styles, /\.detail-intent__panel \{[^}]*height: auto;[^}]*padding: 40rpx;[^}]*border: 2rpx solid @content-box-border;[^}]*border-radius: 40rpx;/)
  assert.match(styles, /\.detail-user__tag--high \{[^}]*color: #ff4343;[^}]*background: #ffd7ce;/)
  assert.match(service, /getAnalysisDetail/)
  assert.match(service, /\/analysis\/content\/detail/)
  assert.match(service, /if \(!detail && !material\) return null/)
  assert.match(service, /detail\?\.audienceList \?\? \[\]/)
  assert.doesNotMatch(service, /if \(!detail\) return null/)
  assert.match(markup, /wx:if="\{\{hasVisibleIntentUsers\}\}"/)
  assert.match(markup, /class="detail-intent__empty-state"/)
  assert.match(markup, /没有意向用户/)
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
  const service = read('miniprogram/services/analysis.ts')
  const types = read('miniprogram/types/analysis.ts')

  for (const markup of [pageMarkup, homeMarkup]) {
    assert.match(markup, /<segmented-filter[^>]*items="\{\{totalAnalysisPeriods\}\}" active-id="\{\{activeTotalPeriod\}\}" bind:change="onTotalPeriodTap"/)
    assert.match(markup, /数据总览/)
    assert.match(markup, /analysisData\.totalData\.heroMetrics/)
    assert.match(markup, /浏览峰值/)
    assert.match(markup, /<analysis-trend-chart host-class="analysis-total__trend-chart" points="\{\{visibleAnalysisReadTrend\}\}" slot-count="\{\{analysisTrendSlotCount\}\}" axis-max="\{\{chartAxisMax\}\}" axis-scale="\{\{chartAxisScale\}\}" \/>/)
    assert.doesNotMatch(markup, /chartHourLabels|analysis-total__chart-hours|analysis-total__chart-hour|hour-scale|chartHourScale|analysis-total__chart--month/)
    assert.doesNotMatch(markup, /class="analysis-total__chart-labels"|class="analysis-total__chart-label"/)
    assert.doesNotMatch(markup, /analysis-total__chart-bars|analysis-total__chart-bar|analysis-total__chart-line-dot|read-trend-line\.svg/)
    assert.doesNotMatch(markup, /阅读数据/)
    assert.doesNotMatch(markup, /analysis-total__range-tabs/)
  }

  assert.match(pageLogic, /const totalAnalysisPeriods: AnalysisPeriodOption\[\]/)
  assert.match(pageLogic, /onTotalPeriodTap/)
  assert.match(pageStyles, /\.analysis-total__overview-card\s*\{[\s\S]*?padding: 40rpx;[\s\S]*?border: 2rpx solid @content-box-border;[\s\S]*?border-radius: 40rpx;/)
  assert.match(pageStyles, /\.analysis-total__chart-card\s*\{[\s\S]*?padding: 40rpx;[\s\S]*?border: 2rpx solid @content-box-border;[\s\S]*?border-radius: 40rpx;/)
  assert.match(pageStyles, /\.analysis-total__trend-chart\s*\{[\s\S]*?position: relative;[\s\S]*?height: 304rpx;/)
  assert.match(pageStyles, /\.analysis-total__chart--axis \{[\s\S]*height: 336rpx;/)
  assert.match(pageStyles, /\.analysis-total__chart--axis \.analysis-total__trend-chart \{[\s\S]*height: 336rpx;/)
  assert.doesNotMatch(pageStyles, /analysis-total__chart-hours|analysis-total__chart-hour|analysis-total__chart--day/)
  assert.match(types, /heroMetrics: AnalysisTotalHeroMetric\[\]/)
  assert.match(types, /export type AnalysisReadRange = 'day' \| 'week' \| 'month' \| 'total'/)
  assert.match(service, /heroMetrics:/)
  assert.match(service, /path: '\/analysis\/trend'/)
  assert.match(service, /timeRange: 'today'/)
  assert.match(service, /timeRange: 'week'/)
  assert.match(service, /timeRange: 'month'/)
  assert.match(service, /timeRange: 'all'/)
  assert.match(service, /label: String\(weekday\)/)
  assert.match(service, /label: String\(day\)/)
  assert.match(service, /label: String\(week\)/)
})

test('analysis total hero metrics are direct flex items', () => {
  const markups = [
    read('miniprogram/pages/analysis/index.wxml'),
    read('miniprogram/components/home-analysis/index.wxml'),
  ]
  const styles = read('miniprogram/pages/analysis/index.less')

  for (const markup of markups) {
    assert.match(markup, /wx:for="\{\{analysisData\.totalData\.heroMetrics\}\}"[\s\S]*class="analysis-total__hero-metric/)
    assert.doesNotMatch(markup, /<block wx:for="\{\{analysisData\.totalData\.heroMetrics\}\}"/)
  }

  assert.match(styles, /\.analysis-total__hero-metric--secondary \{[\s\S]*border-left: 2rpx solid #f0f0f0;/)
})

test('analysis trend chart renders its day ticks inside the scrolling SVG layer', () => {
  const componentMarkup = read('miniprogram/components/analysis-trend-chart/index.wxml')
  const componentLogic = read('miniprogram/components/analysis-trend-chart/index.ts')
  const componentStyles = read('miniprogram/components/analysis-trend-chart/index.less')
  const componentConfig = read('miniprogram/components/analysis-trend-chart/index.json')

  assert.match(componentMarkup, /<image wx:if="\{\{chartSource\}\}" class="analysis-trend-chart__image" src="\{\{chartSource\}\}" mode="scaleToFill" \/>/)
  assert.match(componentMarkup, /analysis-trend-chart--axis/)
  assert.doesNotMatch(componentMarkup, /<canvas|analysis-trend-chart__labels|analysis-trend-chart__label/)
  assert.doesNotMatch(componentLogic, /createSelectorQuery|getContext\(['"]2d['"]\)|bezierCurveTo/)
  assert.match(componentLogic, /externalClasses:\s*\['host-class'\]/)
  assert.doesNotMatch(componentLogic, /showLabels/)
  assert.match(componentStyles, /\.analysis-trend-chart--axis\s*\{[\s\S]*?height: 336rpx;/)
  assert.match(componentStyles, /\.analysis-trend-chart__image\s*\{[\s\S]*?width: 100%;[\s\S]*?height: 100%;/)
  assert.match(componentConfig, /"component":\s*true/)
})

test('analysis trend chart converts supplied values into a smooth Figma-sized SVG path', async () => {
  const originalComponent = globalThis.Component
  let componentDefinition = null
  globalThis.Component = (definition) => { componentDefinition = definition }

  try {
    const chartModule = await import('../miniprogram/components/analysis-trend-chart/index.ts?svg-source')
    assert.equal(typeof chartModule.buildAnalysisTrendSvgSource, 'function')

    const source = chartModule.buildAnalysisTrendSvgSource([
      { id: 'low', label: '低', value: '0' },
      { id: 'middle', label: '中', value: '750' },
      { id: 'high', label: '高', value: '1,500' },
    ])
    const svg = decodeURIComponent(source.slice(source.indexOf(',') + 1))

    assert.match(source, /^data:image\/svg\+xml;charset=utf-8,/)
    assert.match(svg, /viewBox="0 0 270 151"/)
    assert.match(svg, /<path d="M0 150\.5 C22\.5 138 90 100\.5 135 75\.5 C180 50\.5 247\.5 13 270 0\.5"/)
    assert.match(svg, /stroke="#0EC8D9" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/)
    assert.doesNotMatch(svg, /<circle|<text/)

    const halfDaySource = chartModule.buildAnalysisTrendSvgSource(
      Array.from({ length: 12 }, (_, index) => ({ id: `hour-${index}`, label: String(index), value: '750' })),
      24,
    )
    const halfDaySvg = decodeURIComponent(halfDaySource.slice(halfDaySource.indexOf(',') + 1))
    const halfDayPath = halfDaySvg.match(/<path d="([^"]+)"/)?.[1] ?? ''

    assert.match(halfDayPath, /135 75\.5$/)

    const overflowSource = chartModule.buildAnalysisTrendSvgSource(
      Array.from({ length: 25 }, (_, index) => ({ id: `overflow-${index}`, label: String(index), value: '750' })),
      24,
    )
    const overflowSvg = decodeURIComponent(overflowSource.slice(overflowSource.indexOf(',') + 1))
    const overflowPath = overflowSvg.match(/<path d="([^"]+)"/)?.[1] ?? ''

    assert.match(overflowPath, /270 75\.5$/)

    assert.ok(componentDefinition.properties.slotCount)
    assert.equal(componentDefinition.properties.slotCount.value, 0)
    assert.ok(componentDefinition.properties.axisMax)
    assert.ok(componentDefinition.properties.axisScale)
    assert.equal(componentDefinition.properties.axisScale.value, '')
    assert.equal(typeof componentDefinition.observers['points, slotCount, axisMax, axisScale'], 'function')

    const updates = []
    componentDefinition.observers['points, slotCount, axisMax, axisScale'].call(
      { setData(update) { updates.push(update) } },
      Array.from({ length: 12 }, (_, index) => ({ id: `component-hour-${index}`, label: String(index), value: '750' })),
      24,
      1500,
      '',
    )
    const componentSvg = decodeURIComponent(updates[0].chartSource.slice(updates[0].chartSource.indexOf(',') + 1))
    const componentPath = componentSvg.match(/<path d="([^"]+)"/)?.[1] ?? ''

    assert.match(componentPath, /135 75\.5$/)

    const hourScaleSource = chartModule.buildAnalysisTrendSvgSource(
      Array.from({ length: 13 }, (_, index) => ({ id: `noon-${index}`, label: String(index), value: '750' })),
      24,
      1500,
      'hour',
    )
    const hourScaleSvg = decodeURIComponent(hourScaleSource.slice(hourScaleSource.indexOf(',') + 1))
    const hourScalePath = hourScaleSvg.match(/<path d="([^"]+)"/)?.[1] ?? ''

    assert.match(hourScalePath, /135 75\.5$/)
    assert.match(hourScaleSvg, /viewBox="0 0 270 168"/)
    assert.match(hourScaleSvg, /<text x="0" y="165"[^>]*text-anchor="start">0<\/text>/)
    assert.match(hourScaleSvg, /<text x="45" y="165"[^>]*text-anchor="middle">4<\/text>/)
    assert.match(hourScaleSvg, /<text x="135" y="165"[^>]*text-anchor="middle">12<\/text>/)
    assert.match(hourScaleSvg, /<text x="270" y="165"[^>]*text-anchor="end">24<\/text>/)

    const scaledSource = chartModule.buildAnalysisTrendSvgSource(
      [
        { id: 'low', label: '0', value: '0' },
        { id: 'high', label: '12', value: '9' },
      ],
      24,
      9,
      'hour',
    )
    const scaledSvg = decodeURIComponent(scaledSource.slice(scaledSource.indexOf(',') + 1))
    const scaledPath = scaledSvg.match(/<path d="([^"]+)"/)?.[1] ?? ''

    assert.match(scaledPath, /135 0\.5$/)

    const alignedTickSource = chartModule.buildAnalysisTrendSvgSource(
      [
        { id: 'hour-4', label: '4', value: '750' },
        { id: 'hour-20', label: '20', value: '750' },
      ],
      24,
      1500,
      'hour',
    )
    const alignedTickSvg = decodeURIComponent(alignedTickSource.slice(alignedTickSource.indexOf(',') + 1))
    const alignedTickPath = alignedTickSvg.match(/<path d="([^"]+)"/)?.[1] ?? ''

    assert.match(alignedTickPath, /^M45 75\.5 .+ 225 75\.5$/)

    const weekScaleSource = chartModule.buildAnalysisTrendSvgSource(
      [
        { id: 'mon', label: '1', value: '0' },
        { id: 'wed', label: '3', value: '750' },
        { id: 'sun', label: '7', value: '0' },
      ],
      7,
      1500,
      'weekday',
    )
    const weekScaleSvg = decodeURIComponent(weekScaleSource.slice(weekScaleSource.indexOf(',') + 1))
    const weekScalePath = weekScaleSvg.match(/<path d="([^"]+)"/)?.[1] ?? ''

    assert.match(weekScaleSvg, /viewBox="0 0 270 168"/)
    assert.match(weekScaleSvg, /<text x="0" y="165"[^>]*text-anchor="start">1<\/text>/)
    assert.match(weekScaleSvg, /<text x="135" y="165"[^>]*text-anchor="middle">4<\/text>/)
    assert.match(weekScaleSvg, /<text x="270" y="165"[^>]*text-anchor="end">7<\/text>/)
    assert.match(weekScalePath, /^M0 150\.5 .+ 90 75\.5 .+ 270 150\.5$/)

    const monthScaleSource = chartModule.buildAnalysisTrendSvgSource(
      [
        { id: 'd1', label: '1', value: '0' },
        { id: 'd16', label: '16', value: '750' },
        { id: 'd31', label: '31', value: '0' },
      ],
      31,
      1500,
      'month',
    )
    const monthScaleSvg = decodeURIComponent(monthScaleSource.slice(monthScaleSource.indexOf(',') + 1))
    const monthScalePath = monthScaleSvg.match(/<path d="([^"]+)"/)?.[1] ?? ''

    assert.match(monthScaleSvg, /viewBox="0 0 270 168"/)
    assert.match(monthScaleSvg, /<text x="0" y="165"[^>]*text-anchor="start">1<\/text>/)
    assert.match(monthScaleSvg, /<text x="45" y="165"[^>]*text-anchor="middle">6<\/text>/)
    assert.match(monthScaleSvg, /<text x="135" y="165"[^>]*text-anchor="middle">16<\/text>/)
    assert.match(monthScaleSvg, /<text x="270" y="165"[^>]*text-anchor="end">31<\/text>/)
    assert.doesNotMatch(monthScaleSvg, />2<\/text>/)
    assert.doesNotMatch(monthScaleSvg, />7<\/text>/)
    assert.match(monthScalePath, /^M0 150\.5 .+ 135 75\.5 .+ 270 150\.5$/)

    const shortMonthSource = chartModule.buildAnalysisTrendSvgSource(
      [
        { id: 'd1', label: '1', value: '750' },
        { id: 'd30', label: '30', value: '750' },
      ],
      30,
      1500,
      'month',
    )
    const shortMonthSvg = decodeURIComponent(shortMonthSource.slice(shortMonthSource.indexOf(',') + 1))

    assert.match(shortMonthSvg, /<text x="0" y="165"[^>]*text-anchor="start">1<\/text>/)
    assert.match(shortMonthSvg, /<text x="232\.76" y="165"[^>]*text-anchor="middle">26<\/text>/)
    assert.doesNotMatch(shortMonthSvg, />30<\/text>/)
    assert.doesNotMatch(shortMonthSvg, />31<\/text>/)

    const totalWeekSource = chartModule.buildAnalysisTrendSvgSource(
      [
        { id: 'w1', label: '1', value: '0' },
        { id: 'w4', label: '4', value: '750' },
        { id: 'w6', label: '6', value: '0' },
      ],
      6,
      1500,
      'week',
    )
    const totalWeekSvg = decodeURIComponent(totalWeekSource.slice(totalWeekSource.indexOf(',') + 1))
    const totalWeekPath = totalWeekSvg.match(/<path d="([^"]+)"/)?.[1] ?? ''

    assert.match(totalWeekSvg, /viewBox="0 0 270 168"/)
    assert.match(totalWeekSvg, /<text x="0" y="165"[^>]*text-anchor="start">1<\/text>/)
    assert.match(totalWeekSvg, /<text x="54" y="165"[^>]*text-anchor="middle">2<\/text>/)
    assert.match(totalWeekSvg, /<text x="108" y="165"[^>]*text-anchor="middle">3<\/text>/)
    assert.match(totalWeekSvg, /<text x="162" y="165"[^>]*text-anchor="middle">4<\/text>/)
    assert.match(totalWeekSvg, /<text x="216" y="165"[^>]*text-anchor="middle">5<\/text>/)
    assert.match(totalWeekSvg, /<text x="270" y="165"[^>]*text-anchor="end">6<\/text>/)
    assert.doesNotMatch(totalWeekSvg, />7<\/text>|>10<\/text>/)
    assert.match(totalWeekPath, /^M0 150\.5 .+ 162 75\.5 .+ 270 150\.5$/)

    const emptyWeekSource = chartModule.buildAnalysisTrendSvgSource([], 6, 3, 'week')
    const emptyWeekSvg = decodeURIComponent(emptyWeekSource.slice(emptyWeekSource.indexOf(',') + 1))
    assert.match(emptyWeekSvg, /<text x="0" y="165"[^>]*text-anchor="start">1<\/text>/)
    assert.match(emptyWeekSvg, /<text x="270" y="165"[^>]*text-anchor="end">6<\/text>/)
    assert.doesNotMatch(emptyWeekSvg, /<path /)
  } finally {
    globalThis.Component = originalComponent
  }
})

test('home analysis keeps the total period control above its scroll view', () => {
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const componentMarkup = read('miniprogram/components/home-analysis/index.wxml')
  const homeStyles = read('miniprogram/pages/index/index.less')

  assert.match(homeMarkup, /<analysis-header[\s\S]*home-page__analysis-total-filter[\s\S]*<segmented-filter items="\{\{totalAnalysisPeriods\}\}" active-id="\{\{activeTotalPeriod\}\}" bind:change="onTotalAnalysisPeriodTap" \/>[\s\S]*<scroll-view scroll-y class="home-page__tab-scroll home-page__analysis-scroll"/)
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

test('navigation bar clears the status bar and WeChat capsule on every platform', async () => {
  const { resolveNavigationBarLayout, isMenuButtonRectValid, toNavigationBarStyle } = await import('../miniprogram/utils/navigation-layout.ts')
  const logic = read('miniprogram/components/navigation-bar/navigation-bar.ts')
  const styles = read('miniprogram/components/navigation-bar/navigation-bar.less')
  const appStyles = read('miniprogram/app.less')

  const iphone = resolveNavigationBarLayout({
    windowWidth: 393,
    statusBarHeight: 54,
    safeAreaTop: 54,
    platform: 'ios',
    menuButton: { top: 58, left: 296, width: 87, height: 32 },
  })
  const android = resolveNavigationBarLayout({
    windowWidth: 360,
    statusBarHeight: 28,
    safeAreaTop: 28,
    platform: 'android',
    menuButton: { top: 32, left: 263, width: 87, height: 32 },
  })
  const missingCapsule = resolveNavigationBarLayout({
    windowWidth: 375,
    statusBarHeight: 47,
    safeAreaTop: 47,
    platform: 'ios',
    menuButton: { top: 0, left: 0, width: 0, height: 0 },
  })

  assert.equal(iphone.statusBarHeight, 54)
  assert.equal(iphone.totalHeight, 94)
  assert.equal(iphone.capsuleOffset, 97)
  assert.equal(iphone.ios, true)
  assert.equal(android.ios, false)
  assert.equal(android.totalHeight, 68)
  assert.equal(isMenuButtonRectValid({ top: 0, left: 0, width: 0, height: 0 }), false)
  assert.equal(missingCapsule.capsuleOffset, 94)
  assert.match(toNavigationBarStyle(iphone).safeAreaTop, /padding-top: 54px/)
  assert.match(toNavigationBarStyle(iphone).innerPaddingRight, /padding-right: 97px/)

  assert.match(logic, /getNavigationBarLayout\(\)/)
  assert.doesNotMatch(logic, /isDevtools \|\| isAndroid/)
  assert.match(styles, /align-items: center;/)
  assert.match(appStyles, /@notification-header-height: calc\(env\(safe-area-inset-top, 47px\) \+ 44px \+ @page-top-tab-height\);/)
})

test('navigation titles use one explicit Chinese typography token', () => {
  const styles = read('miniprogram/components/navigation-bar/navigation-bar.less')

  assert.match(styles, /\.weui-navigation-bar__center\s*\{[\s\S]*?font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;[\s\S]*?font-size: 17px;[\s\S]*?font-weight: 700;/)
})

test('static assets stay below the preview package budget', () => {
  const bytes = getFileBytes(new URL('../miniprogram/assets/', import.meta.url))
  assert.ok(bytes < 20 * 1024 * 1024, `static assets are ${Math.round(bytes / 1024)}KB`)
})

test('home today data opens total analysis with the day period selected', () => {
  const page = loadPageDefinition('miniprogram/pages/index/index.ts', {
    getHomeGreeting: () => '',
    getDefaultDateRange: () => ({ startDate: '2026-08-20', endDate: '2026-08-26' }),
    getDateRangeLimits: () => ({ minDate: '2026-06-26', maxDate: '2026-08-26' }),
    ...trendPageDeps,
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
  assert.equal(context.data.activeAnalysisReadRange, 'day')
  assert.equal(context.data.analysisTrendSlotCount, 24)
  assert.equal(context.data.chartAxisScale, 'hour')
  assert.deepEqual(calls, [['tab', 3], ['analysis', 2], ['period', 'day']])
})

test('analysis total daily range reserves 24 hourly chart positions', () => {
  const page = loadPageDefinition('miniprogram/pages/analysis/index.ts', {
    getDefaultDateRange: () => ({ startDate: '2026-08-20', endDate: '2026-08-26' }),
    getDateRangeLimits: () => ({ minDate: '2026-06-26', maxDate: '2026-08-26' }),
    ...trendPageDeps,
  })
  const calls = []
  const context = {
    data: {},
    setData(update) { Object.assign(this.data, update) },
    loadAnalysis(period) { calls.push(period) },
  }

  page.onTotalPeriodTap.call(context, { detail: { id: 'day', index: 0 } })

  assert.equal(context.data.activeTotalPeriod, 'day')
  assert.equal(context.data.activeAnalysisReadRange, 'day')
  assert.equal(context.data.analysisTrendSlotCount, 24)
  assert.equal(context.data.chartAxisScale, 'hour')
  assert.deepEqual(calls, ['day'])
})

test('analysis total weekly range uses weekday axis 1 to 7', () => {
  const page = loadPageDefinition('miniprogram/pages/analysis/index.ts', {
    getDefaultDateRange: () => ({ startDate: '2026-08-20', endDate: '2026-08-26' }),
    getDateRangeLimits: () => ({ minDate: '2026-06-26', maxDate: '2026-08-26' }),
    ...trendPageDeps,
  })
  const calls = []
  const context = {
    data: {},
    setData(update) { Object.assign(this.data, update) },
    loadAnalysis(period) { calls.push(period) },
  }

  page.onTotalPeriodTap.call(context, { detail: { id: 'week', index: 1 } })

  assert.equal(context.data.activeTotalPeriod, 'week')
  assert.equal(context.data.activeAnalysisReadRange, 'week')
  assert.equal(context.data.analysisTrendSlotCount, 7)
  assert.equal(context.data.chartAxisScale, 'weekday')
  assert.deepEqual(calls, ['week'])
})

test('analysis total monthly range uses calendar-month axis 1 to last day', () => {
  const page = loadPageDefinition('miniprogram/pages/analysis/index.ts', {
    getDefaultDateRange: () => ({ startDate: '2026-08-20', endDate: '2026-08-26' }),
    getDateRangeLimits: () => ({ minDate: '2026-06-26', maxDate: '2026-08-26' }),
    ...trendPageDeps,
  })
  const calls = []
  const context = {
    data: {},
    setData(update) { Object.assign(this.data, update) },
    loadAnalysis(period) { calls.push(period) },
  }

  page.onTotalPeriodTap.call(context, { detail: { id: 'month', index: 2 } })

  assert.equal(context.data.activeTotalPeriod, 'month')
  assert.equal(context.data.activeAnalysisReadRange, 'month')
  assert.equal(context.data.analysisTrendSlotCount, currentMonthDays)
  assert.equal(context.data.chartAxisScale, 'month')
  assert.deepEqual(calls, ['month'])
})

test('analysis total all-time range uses weekly axis for the latest two months', () => {
  const page = loadPageDefinition('miniprogram/pages/analysis/index.ts', {
    getDefaultDateRange: () => ({ startDate: '2026-08-20', endDate: '2026-08-26' }),
    getDateRangeLimits: () => ({ minDate: '2026-06-26', maxDate: '2026-08-26' }),
    ...trendPageDeps,
  })
  const calls = []
  const context = {
    data: {},
    setData(update) { Object.assign(this.data, update) },
    loadAnalysis(period) { calls.push(period) },
  }

  page.onTotalPeriodTap.call(context, { detail: { id: 'total', index: 3 } })

  assert.equal(context.data.activeTotalPeriod, 'total')
  assert.equal(context.data.activeAnalysisReadRange, 'total')
  assert.equal(context.data.analysisTrendSlotCount, totalTrendWeeks)
  assert.equal(context.data.chartAxisScale, 'week')
  assert.deepEqual(calls, ['total'])
})

test('day peak chart axis scales with view volume', async () => {
  const { buildChartAxisMax, buildChartAxisTicks, buildTotalTrendState } = await import('../miniprogram/utils/analysis-trend.ts')

  assert.equal(buildChartAxisMax([]), 3)
  assert.equal(buildChartAxisMax([0]), 3)
  assert.equal(buildChartAxisMax([7]), 9)
  assert.equal(buildChartAxisMax([1500]), 1500)
  assert.deepEqual(buildChartAxisTicks(9).map((tick) => tick.value), ['9', '6', '3', '0'])

  const dayState = buildTotalTrendState('day', [
    { id: 'h0', label: '0', value: '1' },
    { id: 'h12', label: '12', value: '7' },
  ])
  assert.equal(dayState.chartAxisScale, 'hour')
  assert.equal(dayState.chartAxisMax, 9)
  assert.equal(dayState.analysisTrendSlotCount, 24)

  const weekState = buildTotalTrendState('week', [
    { id: 'd1', label: '1', value: '0' },
    { id: 'd3', label: '3', value: '7' },
  ])
  assert.equal(weekState.chartAxisScale, 'weekday')
  assert.equal(weekState.chartAxisMax, 9)
  assert.equal(weekState.analysisTrendSlotCount, 7)

  const monthState = buildTotalTrendState('month', [{ id: 'd1', label: '1', value: '20' }])
  assert.equal(monthState.chartAxisScale, 'month')
  assert.equal(monthState.chartAxisMax, 30)
  assert.equal(monthState.analysisTrendSlotCount, currentMonthDays)

  const totalState = buildTotalTrendState('total', [{ id: 'w1', label: '1', value: '7' }])
  assert.equal(totalState.chartAxisScale, 'week')
  assert.equal(totalState.chartAxisMax, 9)
  assert.equal(totalState.activeAnalysisReadRange, 'total')
  assert.equal(totalState.analysisTrendSlotCount, 6)
})

test('home today data card follows Figma 478:1262', async () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const styles = read('miniprogram/pages/index/index.less')
  assert.equal(existsSync(new URL('../miniprogram/assets/analysis/total-metric-divider.svg', import.meta.url)), true)
  assert.match(page, /class="home-today-card__metadata"/)
  assert.match(page, /<text>完播数<\/text>/)
  assert.match(page, /homeData\.today\.completeCount/)
  assert.doesNotMatch(page, /homeData\.today\.completeRate/)
  assert.match(page, /wx:if="\{\{homeData\.today\.comparison\}\}" class="home-today-card__comparison"/)
  assert.match(page, /class="home-today-card__comparison-divider" src="\/assets\/analysis\/total-metric-divider\.svg"/)
  assert.match(styles, /\.home-today-card__primary \{[\s\S]*gap: 8rpx;/)
  assert.match(styles, /\.home-today-card__comparison \{[\s\S]*gap: 0;[\s\S]*color: @home-muted-light;[\s\S]*font-size: 24rpx;/)
  assert.match(styles, /\.home-today-card__comparison-divider \{[\s\S]*width: 2rpx;[\s\S]*height: 14rpx;/)
  assert.match(styles, /\.home-today-card__comparison-value \{[\s\S]*color: @home-accent;/)
  assert.match(styles, /\.home-today-card__metrics \{[\s\S]*margin-top: 40rpx;/)
  assert.match(styles, /\.home-today-metric \{[\s\S]*gap: 8rpx;[\s\S]*width: 187rpx;/)
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

  const incomplete = [
    { id: 'missing' },
    { id: 'counted', readCount: '8', completionCount: '3', shareCount: '1' },
  ]
  const incompleteContext = {
    data: { detail: { records: incomplete }, activeRecordSort: 'shares' },
    setData(update) { Object.assign(this.data, update) },
  }

  page.onRecordSortChange.call(incompleteContext, { detail: { id: 'views' } })

  assert.deepEqual(incompleteContext.data.visibleUserRecords.map((record) => record.id), ['counted', 'missing'])
})

test('analysis work period filter sits inside and filters only the work list', () => {
  const standaloneMarkup = read('miniprogram/pages/analysis/index.wxml')
  const embeddedMarkup = read('miniprogram/components/home-analysis/index.wxml')
  const standaloneLogic = read('miniprogram/pages/analysis/index.ts')
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const componentLogic = read('miniprogram/components/home-analysis/index.ts')
  const styles = read('miniprogram/pages/analysis/index.less')

  for (const markup of [standaloneMarkup, embeddedMarkup]) {
    assert.ok(markup.indexOf('analysis-summary analysis-summary--redesign') < markup.indexOf('analysis-work-list'))
    assert.match(markup, /class="analysis-work-list">[\s\S]*class="analysis-filters analysis-filters--redesign[^"]*"[\s\S]*<segmented-filter items="\{\{analysisPeriods\}\}"[\s\S]*class="analysis-work-list__inner"/)
    assert.match(markup, /wx:for="\{\{visibleAnalysisCards\}\}"/)
    assert.doesNotMatch(markup, /wx:for="\{\{analysisData\.cards\}\}"/)
  }

  assert.match(homeMarkup, /visible-analysis-cards="\{\{visibleAnalysisCards\}\}"/)
  assert.match(componentLogic, /visibleAnalysisCards: \{ type: Array, value: \[\] \}/)
  assert.match(standaloneLogic, /this\.loadWorkCards\(periodId\)/)
  assert.match(homeLogic, /this\.loadWorkCards\(event\.detail\.id\)/)
  assert.match(styles, /\.analysis-work-list \{[\s\S]*display: flex;[\s\S]*flex-direction: column;[\s\S]*gap: 40rpx;[\s\S]*margin-top: 40rpx;[\s\S]*padding: 40rpx;/)
  assert.doesNotMatch(styles, /\.analysis-work-list__inner\s*\{[^}]*margin-top:/)
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

test('pull refresh always settles the refresher after success or failure', async () => {
  const { runPullRefresh } = await import('../miniprogram/utils/pull-refresh.ts')
  const settled = []

  await new Promise((resolve) => {
    runPullRefresh(Promise.resolve('ok'), () => {
      settled.push('ok')
      resolve()
    })
  })
  await new Promise((resolve) => {
    runPullRefresh(Promise.reject(new Error('fail')), () => {
      settled.push('fail')
      resolve()
    })
  })

  assert.deepEqual(settled, ['ok', 'fail'])
})

test('every page can pull from the top to refresh', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const scrollViewPages = [
    'pages/index/index',
    'pages/materials/index',
    'pages/document-reader/index',
    'pages/logs/logs',
  ]
  const pageRefreshPages = [
    'pages/material-detail/index',
    'pages/materials/publish/index',
    'pages/ranking/index',
    'pages/notifications/notifications',
    'pages/analysis/index',
    'pages/analysis-detail/index',
    'pages/analysis-user-detail/index',
    'pages/settings/index',
  ]
  const ungatedPages = [
    'pages/auth/index',
  ]

  assert.deepEqual([...app.pages].sort(), [...scrollViewPages, ...pageRefreshPages, ...ungatedPages].sort())

  for (const page of scrollViewPages) {
    const markup = read(`miniprogram/${page}.wxml`)
    const logic = read(`miniprogram/${page}.ts`)
    assert.match(markup, /refresher-enabled="\{\{true\}\}"/, `${page} should enable scroll-view refresher`)
    assert.match(markup, /bindrefresherrefresh="onPullRefresh"/, `${page} should bind refresher`)
    assert.match(logic, /onPullRefresh\(\)/, `${page} should handle refresher`)
  }

  for (const page of pageRefreshPages) {
    const config = JSON.parse(read(`miniprogram/${page}.json`))
    const logic = read(`miniprogram/${page}.ts`)
    assert.equal(config.enablePullDownRefresh, true, `${page} should enable page pull-down refresh`)
    assert.match(logic, /onPullDownRefresh\(\)/, `${page} should handle pull-down refresh`)
  }

  const publishLogic = read('miniprogram/pages/materials/publish/index.ts')
  assert.match(publishLogic, /onPullDownRefresh\(\) \{\s*wx\.stopPullDownRefresh\(\)/)
})

test('wechat preview source stays under the 2MB upload limit', () => {
  const bytes = getFileBytes(new URL('../miniprogram/', import.meta.url))
  assert.ok(bytes < 2 * 1024 * 1024, `miniprogram source is ${Math.round(bytes / 1024)}KB`)
})
