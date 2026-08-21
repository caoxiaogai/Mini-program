import type { ApiLoginData, ApiResponse } from '../types/api'
import {
  STORAGE_KEY_AVATAR,
  STORAGE_KEY_NICKNAME,
  STORAGE_KEY_OPENID,
  STORAGE_KEY_USER_ID,
} from '../constants/auth'
import { ApiError, getApiBaseUrl, rawRequestWithAuth } from './request'

export interface AuthGateState {
  showLogin: boolean
  showProfile: boolean
}

export interface AuthSession {
  userId: string
  openid: string
  nickname: string
  avatar: string
}

interface PendingLoginHandlers {
  resolve: (data: ApiLoginData) => void
  reject: (error: ApiError) => void
}

let pendingLoginHandlers: PendingLoginHandlers | null = null
let pendingLoginPromise: Promise<ApiLoginData> | null = null

function readStorageString(key: string): string {
  const value = wx.getStorageSync(key) as string | ''
  return typeof value === 'string' ? value : ''
}

export function getAuthSession(): AuthSession | null {
  const userId = readStorageString(STORAGE_KEY_USER_ID)
  if (!userId) return null

  return {
    userId,
    openid: readStorageString(STORAGE_KEY_OPENID),
    nickname: readStorageString(STORAGE_KEY_NICKNAME),
    avatar: readStorageString(STORAGE_KEY_AVATAR),
  }
}

export function isLoggedIn(): boolean {
  return getAuthSession() !== null
}

/** 分享素材访客：已登录且头像昵称已完善 */
export function isVisitorAuthReady(): boolean {
  const session = getAuthSession()
  return session !== null && !needsProfileSetup(session)
}

export function needsProfileSetup(session: Pick<ApiLoginData, 'nickname' | 'avatar'> | AuthSession | null): boolean {
  if (!session) return false
  const nickname = (session.nickname ?? '').trim()
  const avatar = (session.avatar ?? '').trim()
  return nickname === '' || avatar === ''
}

function saveAuthSession(data: ApiLoginData): AuthSession {
  wx.setStorageSync(STORAGE_KEY_USER_ID, data.userId)
  wx.setStorageSync(STORAGE_KEY_OPENID, data.openid)
  wx.setStorageSync(STORAGE_KEY_NICKNAME, data.nickname ?? '')
  wx.setStorageSync(STORAGE_KEY_AVATAR, data.avatar ?? '')

  return {
    userId: data.userId,
    openid: data.openid,
    nickname: data.nickname ?? '',
    avatar: data.avatar ?? '',
  }
}

export function refreshAuthGate(): AuthGateState {
  const session = getAuthSession()
  const state: AuthGateState = {
    showLogin: session === null,
    showProfile: session !== null && needsProfileSetup(session),
  }

  const app = getApp<IAppOption>()
  app.globalData.authGate = state
  return state
}

function resolvePendingLogin(data: ApiLoginData): void {
  pendingLoginHandlers?.resolve(data)
  pendingLoginHandlers = null
  pendingLoginPromise = null
}

function rejectPendingLogin(error: ApiError): void {
  pendingLoginHandlers?.reject(error)
  pendingLoginHandlers = null
  pendingLoginPromise = null
}

/** 等待用户通过弹窗完成登录；已登录则直接返回会话 */
export function waitForLogin(): Promise<ApiLoginData> {
  const session = getAuthSession()
  if (session) {
    return Promise.resolve({
      userId: session.userId,
      openid: session.openid,
      nickname: session.nickname || null,
      avatar: session.avatar || null,
      phone: null,
    })
  }

  refreshAuthGate()

  if (!pendingLoginPromise) {
    pendingLoginPromise = new Promise<ApiLoginData>((resolve, reject) => {
      pendingLoginHandlers = { resolve, reject }
    })
  }

  return pendingLoginPromise
}

function requestWechatLogin(code: string): Promise<ApiLoginData> {
  return rawRequestWithAuth<ApiLoginData>({
    method: 'POST',
    path: '/wechat/login',
    query: { code },
    skipAuth: true,
  })
}

/** 用户点击授权登录：wx.login → 后端换 userId */
export function loginWithWechat(): Promise<AuthSession> {
  return new Promise<AuthSession>((resolve, reject) => {
    wx.login({
      success: (loginResult) => {
        requestWechatLogin(loginResult.code)
          .then((data) => {
            const session = saveAuthSession(data)
            resolvePendingLogin(data)
            refreshAuthGate()
            resolve(session)
          })
          .catch((error: ApiError) => {
            rejectPendingLogin(error)
            reject(error)
          })
      },
      fail: (error) => {
        const apiError = new ApiError(-1, `微信登录失败：${error.errMsg || '未知原因'}`)
        console.error('[wx.login] failed', error.errMsg)
        rejectPendingLogin(apiError)
        reject(apiError)
      },
    })
  })
}

function isLocalAvatarPath(path: string): boolean {
  return (
    path.startsWith('wxfile://')
    || path.startsWith('http://tmp/')
    || path.startsWith('https://tmp/')
    || (!path.startsWith('http://') && !path.startsWith('https://') && path !== '')
  )
}

function buildAuthHeader(): Record<string, string> {
  const session = getAuthSession()
  const header: Record<string, string> = {}
  if (session?.userId) header['X-User-Id'] = session.userId
  if (session?.openid) header['X-Openid'] = session.openid
  return header
}

/** POST /user/avatar，返回后端存储 URL */
export function uploadUserAvatar(localPath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    wx.uploadFile({
      url: `${getApiBaseUrl()}/user/avatar`,
      filePath: localPath,
      name: 'file',
      header: buildAuthHeader(),
      timeout: 60000,
      success: (response) => {
        try {
          const result = JSON.parse(response.data) as ApiResponse<{ avatar: string }>
          if (result.code === 200 && result.data?.avatar) {
            wx.setStorageSync(STORAGE_KEY_AVATAR, result.data.avatar)
            resolve(result.data.avatar)
            return
          }
          reject(new ApiError(result.code ?? -1, result.message ?? '头像上传失败'))
        } catch {
          reject(new ApiError(-1, '头像上传响应解析失败'))
        }
      },
      fail: () => reject(new ApiError(-1, '头像上传失败')),
    })
  })
}

export interface ProfileSetupInput {
  nickname: string
  avatarPath: string
}

/** 首次登录完善资料：上传头像（如有本地文件）并更新昵称 */
export function completeProfileSetup(input: ProfileSetupInput): Promise<AuthSession> {
  const nickname = input.nickname.trim()
  if (!nickname) {
    return Promise.reject(new ApiError(-1, '请填写昵称'))
  }

  const session = getAuthSession()
  if (!session) {
    return Promise.reject(new ApiError(-1, '请先登录'))
  }

  const uploadTask = isLocalAvatarPath(input.avatarPath)
    ? uploadUserAvatar(input.avatarPath)
    : Promise.resolve(input.avatarPath)

  return uploadTask
    .then((avatarUrl) =>
      rawRequestWithAuth<void>({
        method: 'PUT',
        path: '/user/profile',
        data: { nickname, avatar: avatarUrl },
        skipAuth: false,
      }).then(() => {
        wx.setStorageSync(STORAGE_KEY_NICKNAME, nickname)
        wx.setStorageSync(STORAGE_KEY_AVATAR, avatarUrl)
        refreshAuthGate()
        return {
          ...session,
          nickname,
          avatar: avatarUrl,
        }
      }),
    )
}

export function clearAuthSession(): void {
  wx.removeStorageSync(STORAGE_KEY_USER_ID)
  wx.removeStorageSync(STORAGE_KEY_OPENID)
  wx.removeStorageSync(STORAGE_KEY_NICKNAME)
  wx.removeStorageSync(STORAGE_KEY_AVATAR)
  rejectPendingLogin(new ApiError(-1, '登录态已失效'))
  refreshAuthGate()
}

import { registerLoginWaiter } from './request'

registerLoginWaiter(waitForLogin)
