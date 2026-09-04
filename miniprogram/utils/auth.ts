export const AUTH_PAGE_ROUTE = 'pages/auth/index'
const AUTH_FALLBACK_PATH = '/pages/index/index'

export type AuthGate = 'ok' | 'login'

/** 微信官方文档「头像昵称填写」示例默认头像，未选择时不算已完善资料 */
export const DEFAULT_AVATAR_URL =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

const PLACEHOLDER_NICKNAMES = new Set(['微信用户', '匿名访客'])

export function isLoginProfileComplete(user: { nickname?: string | null; avatar?: string | null }): boolean {
  const nickname = (user.nickname ?? '').trim()
  const avatar = (user.avatar ?? '').trim()
  return nickname !== '' && !PLACEHOLDER_NICKNAMES.has(nickname) && avatar !== '' && avatar !== DEFAULT_AVATAR_URL
}

export function isLocalAvatarFile(url: string): boolean {
  const value = url.trim()
  if (!value) return false
  if (value.startsWith('wxfile://') || value.startsWith('file://')) return true
  if (value.includes('://tmp/') || value.startsWith('/tmp')) return true
  return !/^https?:\/\//i.test(value)
}

export function safeReturnPath(returnPath: string | undefined, fallback = AUTH_FALLBACK_PATH): string {
  if (!returnPath) return fallback

  let decoded = returnPath
  try {
    decoded = decodeURIComponent(returnPath)
  } catch {
    decoded = returnPath
  }

  const path = decoded.trim()
  if (!path.startsWith('/pages/') || path.startsWith(`/${AUTH_PAGE_ROUTE}`)) return fallback
  if (path.includes('://') || path.includes('..')) return fallback
  return path
}

export function buildReturnPath(route: string, options?: Record<string, string | undefined>): string {
  const path = route.startsWith('/') ? route : `/${route}`
  const query = Object.entries(options ?? {})
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')

  return query ? `${path}?${query}` : path
}

export function buildAuthPath(returnPath: string): string {
  return `/${AUTH_PAGE_ROUTE}?return=${encodeURIComponent(safeReturnPath(returnPath))}`
}
