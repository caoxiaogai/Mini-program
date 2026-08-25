import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

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
  assert.doesNotMatch(service, /from '\.\.\/mocks\//)
  assert.doesNotMatch(service, /TODO\(API\)/)
})

test('data access goes through the unified request layer', () => {
  const requestLayer = read('miniprogram/services/request.ts')
  const config = read('miniprogram/config/dev.ts')

  assert.match(requestLayer, /wx\.request\(/)
  assert.match(requestLayer, /DEVTOOLS_ORIGIN/)
  assert.match(requestLayer, /DEV_LAN_ORIGIN/)
  assert.match(config, /DEVTOOLS_ORIGIN = 'http:\/\/127\.0\.0\.1:8080'/)
  assert.match(requestLayer, /export function request</)
  assert.match(requestLayer, /export function ensureLogin/)
  assert.match(requestLayer, /\/wechat\/login/)

  for (const name of ['home', 'analysis', 'materials', 'notifications', 'ranking']) {
    const service = read(`miniprogram/services/${name}.ts`)
    assert.doesNotMatch(service, /wx\.request\(/, `${name} service must use the request layer`)
    assert.doesNotMatch(service, /from '\.\.\/mocks\//, `${name} service must not import mocks`)
  }
})

test('home page data comes from backend analysis APIs', () => {
  const service = read('miniprogram/services/home.ts')
  const config = read('miniprogram/config/dev.ts')

  assert.match(service, /path: '\/analysis\/dashboard'/)
  assert.match(service, /path: '\/analysis\/customer\/list'/)
  assert.match(service, /path: '\/analysis\/content\/list'/)
  assert.match(service, /path: '\/analysis\/intent\/list'/)
  assert.doesNotMatch(config, /HOME_DATA_SOURCE/)
  assert.equal(existsSync(new URL('../miniprogram/mocks/home.ts', import.meta.url)), false)
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
  const logic = read('miniprogram/pages/index/index.ts')
  const styles = read('miniprogram/pages/index/index.less')

  assert.match(page, /class="home-page"/)
  assert.match(page, /class="home-hero"/)
  assert.match(page, /class="home-notification-card"/)
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

test('home page wires the intended navigation actions', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const logic = read('miniprogram/pages/index/index.ts')

  assert.match(page, /bindtap="onNotificationTap"/)
  assert.match(page, /bindtap="onContentTap"/)
  assert.match(page, /bind:plus="onPlusTap"/)
  assert.match(logic, /pages\/analysis-user-detail\/index\?id=/)
  assert.match(logic, /pages\/analysis-detail\/index\?id=/)
  assert.match(logic, /pages\/materials\/publish\/index/)
  assert.match(logic, /getNotifications\(\)/)
  assert.match(logic, /getAnalysisOverview\(/)
  assert.doesNotMatch(logic, /onTabTap[\s\S]*pages\/notifications\/notifications/)
  assert.doesNotMatch(logic, /onTabTap[\s\S]*pages\/analysis\/index/)
})

test('home bottom navigation switches instantly in one swiper container', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const logic = read('miniprogram/pages/index/index.ts')
  const config = read('miniprogram/pages/index/index.json')

  assert.match(page, /<swiper class="home-page__tabs" current="\{\{activeTabIndex\}\}" duration="0" bindchange="onTabChange">/)
  assert.match(page, /<notification-header[\s\S]*bind:filtertap="onNotificationFilterTap"/)
  assert.match(page, /<home-analysis[\s\S]*bind:periodtap="onAnalysisPeriodTap"/)
  assert.match(page, /我的页面待设计/)
  assert.match(logic, /activeTabIndex: 0/)
  assert.match(logic, /onTabChange\(event: WechatMiniprogram.CustomEvent<{ current: string }>\)/)
  assert.match(logic, /activeTabIndex: nextIndex/)
  assert.doesNotMatch(logic, /event.detail.id === 'notifications'[\s\S]*navigateTo/)
  assert.doesNotMatch(logic, /event.detail.id === 'analysis'[\s\S]*navigateTo/)
  assert.match(config, /home-notifications/)
  assert.match(config, /home-analysis/)
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
  assert.match(styles, /\.home-page__hero-background \{[\s\S]*position: absolute;/)
})

test('home page places a high-resolution ranking entry between notifications and today-most', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const logic = read('miniprogram/pages/index/index.ts')
  const styles = read('miniprogram/pages/index/index.less')

  const notificationsIndex = page.indexOf('home-section--notifications')
  const rankingIndex = page.indexOf('home-section--ranking')
  const todayMostIndex = page.indexOf('今日最多')

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

test('new homepage assets are local and sized for the target frame', () => {
  const assets = [
    'miniprogram/assets/home-new/hero-lounge.png',
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

  const hero = getPngDimensions('miniprogram/assets/home-new/hero-lounge.png')
  assert.ok(hero.width >= 500 && hero.height >= 300)
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
  assert.match(styles, /bottom: max\(32px, env\(safe-area-inset-bottom\)\);/)
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
  assert.match(styles, /\.bottom-tab-bar__item--active \{[\s\S]*background: #e0e0e0;/)
  assert.match(styles, /\.bottom-tab-bar__label \{[\s\S]*color: #666666;/)
  assert.match(styles, /\.bottom-tab-bar__item--active \.bottom-tab-bar__label \{[\s\S]*color: #0ec8d9;/)
  assert.match(publishIcon, /width="20" height="20"/)
  assert.match(publishIcon, /fill="#666666"/)
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

test('notifications load from the intent customer API', () => {
  const config = read('miniprogram/config/dev.ts')
  const service = read('miniprogram/services/notifications.ts')

  assert.match(service, /path: '\/analysis\/intent\/list'/)
  assert.match(service, /path: '\/material\/mine'/)
  assert.doesNotMatch(service, /getNotificationsMock/)
  assert.doesNotMatch(config, /NOTIFICATION_DATA_SOURCE/)
  assert.equal(existsSync(new URL('../miniprogram/mocks/notifications.ts', import.meta.url)), false)
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
  assert.match(styles, /left: 56rpx;/)
  assert.match(styles, /width: 674rpx;/)
  assert.match(styles, /height: 414rpx;/)
  assert.match(styles, /background: linear-gradient\(180deg, #b5ebfe 0%, @home-page-background 100%\);/)
  assert.match(styles, /border-radius: 40rpx;/)
  assert.match(page, /class="home-content-card__divider"/)
  assert.match(page, />阅读<\/text>/)
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

  assert.match(page, /今日有 <text class="home-accent">\{\{homeData\.intentSummary\.total\}\}<\/text> 个新增用户/)
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
  assert.match(styles, /\.analysis-work-list\s*\{[\s\S]*?border-radius: 32rpx;[\s\S]*?background: #ffffff;/)
  assert.match(styles, /\.analysis-work-row__thumbnail\s*\{[\s\S]*?width: 100rpx;[\s\S]*?height: 136rpx;/)
  assert.match(styles, /\.analysis-work-row__metrics\s*\{[\s\S]*?justify-content: space-between;/)
  assert.match(types, /publishedAt: string/)
  assert.match(types, /compactMetrics: AnalysisMetric\[\]/)
  assert.match(service, /compactMetrics:/)
  assert.match(homeLogic, /activeAnalysisSortLabel: '阅读量'/)
})

test('analysis overview loads from backend APIs and keeps component styles', () => {
  const config = read('miniprogram/config/dev.ts')
  const service = read('miniprogram/services/analysis.ts')
  const componentStylesPath = new URL('../miniprogram/components/home-analysis/index.less', import.meta.url)

  assert.equal(existsSync(componentStylesPath), true)
  assert.match(service, /path: '\/analysis\/dashboard'/)
  assert.match(service, /path: '\/analysis\/content\/list'/)
  assert.match(service, /path: '\/analysis\/customer\/list'/)
  assert.match(service, /path: '\/analysis\/intent\/list'/)
  assert.doesNotMatch(service, /getAnalysisStyleMock/)
  assert.doesNotMatch(config, /ANALYSIS_DATA_SOURCE/)
  assert.equal(existsSync(new URL('../miniprogram/mocks/analysis.ts', import.meta.url)), false)
  assert.match(read('miniprogram/components/home-analysis/index.less'), /@import ['\"]\.\.\/\.\.\/pages\/analysis\/index\.less['\"]/)
})

test('analysis work filters match Figma 517:3836', () => {
  const styles = read('miniprogram/pages/analysis/index.less')

  assert.match(styles, /\.analysis-page__content--work \{[\s\S]*padding-top: calc\(@notification-header-height \+ 40rpx\);[\s\S]*background: #ffffff;/)
  assert.match(styles, /\.analysis-filters--redesign\s*\{[\s\S]*margin-top: 0;[\s\S]*justify-content: flex-start;[\s\S]*gap: 40rpx;/)
  assert.match(styles, /\.analysis-periods \{[\s\S]*height: 64rpx;[\s\S]*padding: @segmented-filter-vertical-inset;[\s\S]*border-radius: 20rpx;[\s\S]*background: #e0e0e0;/)
  assert.match(styles, /\.analysis-periods__selection \{[\s\S]*width: 68rpx;[\s\S]*border-radius: 16rpx;[\s\S]*background: #ffffff;/)
  assert.match(styles, /\.analysis-period \{[\s\S]*height: 56rpx;[\s\S]*font-size: 26rpx;/)
  assert.match(styles, /\.analysis-sort \{[\s\S]*height: 64rpx;[\s\S]*padding: @segmented-filter-vertical-inset;[\s\S]*border-radius: 20rpx;[\s\S]*background: #e0e0e0;/)
  assert.match(styles, /\.analysis-sort__inner \{[\s\S]*gap: 8rpx;[\s\S]*padding: 0 20rpx;[\s\S]*border-radius: 16rpx;[\s\S]*font-size: 26rpx;/)
  assert.match(styles, /\.analysis-filters--redesign \.analysis-sort \{[\s\S]*border: 0;[\s\S]*background: #e0e0e0;/)
})

test('home analysis compiles the Figma 517:3836 filters in its own stylesheet', () => {
  const markup = read('miniprogram/components/home-analysis/index.wxml')
  const styles = read('miniprogram/components/home-analysis/index.less')

  assert.match(markup, /analysis-filters analysis-filters--redesign home-analysis__filters/)
  assert.match(styles, /\.home-analysis__filters \{[\s\S]*margin-top: 0;[\s\S]*justify-content: flex-start;[\s\S]*gap: 40rpx;/)
  assert.match(styles, /\.home-analysis__filters \.analysis-periods \{[\s\S]*height: 64rpx;[\s\S]*border-radius: 20rpx;[\s\S]*background: #e0e0e0;/)
  assert.match(styles, /\.home-analysis__filters \.analysis-sort \{[\s\S]*height: 64rpx;[\s\S]*border: 0;[\s\S]*border-radius: 20rpx;[\s\S]*background: #e0e0e0;/)
  assert.match(styles, /\.home-analysis__filters \.analysis-sort__inner \{[\s\S]*border-radius: 16rpx;[\s\S]*font-size: 26rpx;/)
})

test('static assets stay below the preview package budget', () => {
  const bytes = getFileBytes(new URL('../miniprogram/assets/', import.meta.url))
  assert.ok(bytes < 20 * 1024 * 1024, `static assets are ${Math.round(bytes / 1024)}KB`)
})

test('wechat preview source stays under the 2MB upload limit', () => {
  const bytes = getFileBytes(new URL('../miniprogram/', import.meta.url))
  assert.ok(bytes < 2 * 1024 * 1024, `miniprogram source is ${Math.round(bytes / 1024)}KB`)
})
