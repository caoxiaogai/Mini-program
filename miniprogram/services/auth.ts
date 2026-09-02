import type { ApiLoginData } from '../types/api'
import {
  AUTH_PAGE_ROUTE,
  buildAuthPath,
  isLoginProfileComplete,
  safeReturnPath,
  type AuthGate,
} from '../utils/auth'
import { HOME_PAGE_PATH } from '../utils/share-material'
import { authorizeLogin, ensureLogin, hasAuthorizedLogin } from './request'

export { isLoginProfileComplete }

export function resolveAuthGate(): Promise<AuthGate> {
  if (!hasAuthorizedLogin()) return Promise.resolve('login')

  return ensureLogin()
    .then((user) => (isLoginProfileComplete(user) ? 'ok' : 'profile'))
    .catch(() => 'login' as AuthGate)
}

export function requireAuth(returnPath: string): Promise<boolean> {
  return resolveAuthGate().then((gate) => {
    if (gate === 'ok') return true
    const url = buildAuthPath(returnPath, gate)
    wx.redirectTo({
      url,
      fail: () => wx.reLaunch({ url }),
    })
    return false
  })
}

export function continueAfterAuth(returnPath: string): void {
  wx.reLaunch({ url: safeReturnPath(returnPath, HOME_PAGE_PATH) })
}

export function runAuthed(returnPath: string, start: () => void): void {
  requireAuth(returnPath).then((ok) => {
    if (ok) start()
  })
}

export function isAuthPageRoute(route: string | undefined): boolean {
  return route === AUTH_PAGE_ROUTE || route === `/${AUTH_PAGE_ROUTE}`
}

export function afterAuthorizeLogin(): Promise<{ user: ApiLoginData; gate: AuthGate }> {
  return authorizeLogin().then((user) => ({
    user,
    gate: isLoginProfileComplete(user) ? 'ok' : 'profile',
  }))
}
