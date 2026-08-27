export interface NavigationBarLayout {
  ios: boolean
  statusBarHeight: number
  navBarHeight: number
  totalHeight: number
  capsuleOffset: number
}

export interface MenuButtonRect {
  top: number
  left: number
  width: number
  height: number
}

export interface NavigationBarMetrics {
  windowWidth: number
  statusBarHeight: number
  safeAreaTop: number
  platform: string
  menuButton: MenuButtonRect
}

const FALLBACK_STATUS_BAR_HEIGHT = 47
const FALLBACK_MENU_WIDTH = 87
const FALLBACK_MENU_HEIGHT = 32
const FALLBACK_MENU_RIGHT_GAP = 7
const FALLBACK_MENU_TOP_GAP = 4

export function isMenuButtonRectValid(rect: MenuButtonRect | null | undefined): boolean {
  return Boolean(rect && rect.width > 0 && rect.height > 0 && rect.top > 0 && rect.left > 0)
}

export function resolveNavigationBarLayout(metrics: NavigationBarMetrics): NavigationBarLayout {
  const windowWidth = metrics.windowWidth > 0 ? metrics.windowWidth : 375
  const statusBarHeight = metrics.statusBarHeight > 0
    ? metrics.statusBarHeight
    : (metrics.safeAreaTop > 0 ? metrics.safeAreaTop : FALLBACK_STATUS_BAR_HEIGHT)
  const ios = metrics.platform !== 'android'
  const menuValid = isMenuButtonRectValid(metrics.menuButton)
  const menuHeight = menuValid ? metrics.menuButton.height : FALLBACK_MENU_HEIGHT
  const menuTop = menuValid ? metrics.menuButton.top : statusBarHeight + FALLBACK_MENU_TOP_GAP
  const menuLeft = menuValid
    ? metrics.menuButton.left
    : windowWidth - FALLBACK_MENU_RIGHT_GAP - FALLBACK_MENU_WIDTH
  const gap = Math.max(menuTop - statusBarHeight, FALLBACK_MENU_TOP_GAP)
  const capsuleOffset = Math.max(windowWidth - menuLeft, FALLBACK_MENU_WIDTH + FALLBACK_MENU_RIGHT_GAP)

  return {
    ios,
    statusBarHeight,
    navBarHeight: menuHeight + gap * 2,
    totalHeight: statusBarHeight + menuHeight + gap * 2,
    capsuleOffset,
  }
}

export function getNavigationBarLayout(): NavigationBarLayout {
  const windowInfo = wx.getSystemInfoSync()
  return resolveNavigationBarLayout({
    windowWidth: windowInfo.windowWidth,
    statusBarHeight: windowInfo.statusBarHeight,
    safeAreaTop: windowInfo.safeArea?.top ?? 0,
    platform: windowInfo.platform,
    menuButton: wx.getMenuButtonBoundingClientRect(),
  })
}

export function toNavigationBarStyle(layout: NavigationBarLayout): {
  ios: boolean
  innerPaddingRight: string
  leftWidth: string
  safeAreaTop: string
} {
  return {
    ios: layout.ios,
    innerPaddingRight: `padding-right: ${layout.capsuleOffset}px`,
    leftWidth: `width: ${layout.capsuleOffset}px`,
    safeAreaTop: `height: ${layout.totalHeight}px; padding-top: ${layout.statusBarHeight}px`,
  }
}
