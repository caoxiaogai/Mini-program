import type { ApiLoginData } from '../types/api'
import { AUTH_PAGE_ROUTE, buildShareGatePath, isLocalAvatarFile, isLoginProfileComplete, safeReturnPath, type AuthGate } from '../utils/auth'
import { HOME_PAGE_PATH } from '../utils/share-material'
import { authorizeLogin, clearLogin, ensureLogin, patchCachedLogin } from './request'
import { updateUserProfile, uploadUserAvatar } from './user'

export { isLoginProfileComplete }

export function resolveAuthGate(): Promise<AuthGate> {
  return ensureLogin()
    .then((user) => (isLoginProfileComplete(user) ? 'ok' : 'login'))
    .catch(() => 'login' as AuthGate)
}

export function requireAuth(returnPath: string): Promise<boolean> {
  return resolveAuthGate().then((gate) => {
    if (gate === 'ok') return true
    const url = buildShareGatePath(returnPath)
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

export function logoutToAuth(): void {
  clearLogin()
  wx.reLaunch({ url: buildShareGatePath(HOME_PAGE_PATH) })
}

export function completeProfileLogin(input: { nickname: string; avatar: string }): Promise<ApiLoginData> {
  const nickname = input.nickname.trim()
  const avatar = input.avatar.trim()
  if (!isLoginProfileComplete({ nickname, avatar })) {
    return Promise.reject(new Error('请设置真实头像和昵称'))
  }

  return authorizeLogin()
    .then((user) => {
      const resolvedAvatar = isLocalAvatarFile(avatar) ? uploadUserAvatar(avatar) : Promise.resolve(avatar)
      return resolvedAvatar.then((uploadedAvatar) => ({ user, avatar: uploadedAvatar }))
    })
    .then(({ user, avatar: uploadedAvatar }) =>
      updateUserProfile({ nickname, avatar: uploadedAvatar }).then(() => {
        patchCachedLogin({ nickname, avatar: uploadedAvatar })
        return { ...user, nickname, avatar: uploadedAvatar }
      }),
    )
}
