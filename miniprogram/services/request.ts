// 统一请求层：集中管理接口基址、超时、登录态请求头和错误归一化。
// 页面不直接使用本文件；所有数据访问经由 services/ 下的业务 service。

import type { ApiLoginData, ApiResponse } from '../types/api'
import { usableLoginAvatar, usableLoginNickname } from '../utils/auth'
import { DEV_LAN_ORIGIN, DEVTOOLS_ORIGIN, PROD_API_ORIGIN } from '../config/dev'
import { isMaterialDeletedError } from '../utils/material-deleted'

let cachedApiBaseUrl: string | null = null

function sameOrigin(left: string, right: string): boolean {
  return left.replace(/\/$/, '') === right.replace(/\/$/, '')
}

function onlineDevApiBase(): string {
  return `${PROD_API_ORIGIN}/dev/api`
}

function localDevApiBase(): string {
  return sameOrigin(DEV_LAN_ORIGIN, PROD_API_ORIGIN)
    ? onlineDevApiBase()
    : `${DEV_LAN_ORIGIN}/api`
}

/**
 * 正式版走线上 /api。体验版、以及 DEV_LAN 指到同一线上主机时的真机调试，走 /dev/api。
 * 开发者工具使用 DEVTOOLS_ORIGIN；指向线上主机时走 /dev/api。
 */
export function getApiBaseUrl(): string {
  if (cachedApiBaseUrl) return cachedApiBaseUrl

  try {
    const envVersion = wx.getAccountInfoSync().miniProgram.envVersion
    if (envVersion === 'release') {
      cachedApiBaseUrl = `${PROD_API_ORIGIN}/api`
      return cachedApiBaseUrl
    }
    if (envVersion === 'trial') {
      cachedApiBaseUrl = onlineDevApiBase()
      return cachedApiBaseUrl
    }
    if (wx.getSystemInfoSync().platform === 'devtools') {
      cachedApiBaseUrl = sameOrigin(DEVTOOLS_ORIGIN, PROD_API_ORIGIN)
        ? onlineDevApiBase()
        : `${DEVTOOLS_ORIGIN}/api`
      return cachedApiBaseUrl
    }
  } catch {
    // 非小程序环境（如单元测试）回退开发地址
  }

  cachedApiBaseUrl = localDevApiBase()
  return cachedApiBaseUrl
}

function joinApiFileUrl(objectPath: string): string {
  return `${getApiBaseUrl()}/files/${objectPath.replace(/^\/+/, '')}`
}

const CDN_MEDIA_ORIGIN = 'https://cdn.yjxzhang.com/'
const REQUEST_TIMEOUT_MS = 15000
const UPLOAD_TIMEOUT_MS = 300000

const STORAGE_KEY_USER_ID = 'auth.userId'
const STORAGE_KEY_OPENID = 'auth.openid'
const STORAGE_KEY_AUTHORIZED = 'auth.authorized'
const STORAGE_KEY_NICKNAME = 'auth.nickname'
const STORAGE_KEY_AVATAR = 'auth.avatar'

/** 当前 API 基址的 origin（不含 /api） */
export function getApiOrigin(): string {
  const apiBaseUrl = getApiBaseUrl()
  const schemeEnd = apiBaseUrl.indexOf('://')
  const pathStart = apiBaseUrl.indexOf('/', schemeEnd + 3)
  return pathStart === -1 ? apiBaseUrl : apiBaseUrl.slice(0, pathStart)
}

/**
 * 将后端返回的文件 URL 归一化为当前环境可访问的地址。
 * - CDN（cdn.yjxzhang.com/sales-materials/...）原样使用，不再经接口代理
 * - MinIO 直连（:9000/sales-materials/...）→ {apiBase}/files/sales-materials/...
 * - 旧地址 /api/files/sales-materials/ 与 /dev/api/files 仍改写到当前环境的文件代理
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (trimmed.slice(0, CDN_MEDIA_ORIGIN.length).toLowerCase() === CDN_MEDIA_ORIGIN) {
    return trimmed
  }
  if (!/^https?:\/\//.test(trimmed)) {
    if (trimmed.startsWith('/dev/api/files/')) {
      return joinApiFileUrl(trimmed.slice('/dev/api/files/'.length))
    }
    if (trimmed.startsWith('/api/files/')) {
      return joinApiFileUrl(trimmed.slice('/api/files/'.length))
    }
    return trimmed
  }

  const minioDirect = trimmed.match(/^https?:\/\/[^/]+:9000\/sales-materials\/(.+)$/i)
  if (minioDirect) {
    return joinApiFileUrl(`sales-materials/${minioDirect[1]}`)
  }

  const apiFiles = trimmed.match(/\/(?:dev\/)?api\/files\/(.+)$/i)
  if (apiFiles) {
    return joinApiFileUrl(apiFiles[1])
  }

  const bareBucket = trimmed.match(/^https?:\/\/[^/]+\/sales-materials\/(.+)$/i)
  if (bareBucket) {
    return joinApiFileUrl(`sales-materials/${bareBucket[1]}`)
  }

  return trimmed.replace(/^https?:\/\/[^/]+/, getApiOrigin())
}

/** 归一化后的接口错误；code 为后端业务码，网络层失败时为 -1 */
export class ApiError extends Error {
  code: number
  notified = false

  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  query?: Record<string, string | number | undefined>
  data?: Record<string, unknown>
  /** 跳过登录态（仅登录接口本身使用） */
  skipAuth?: boolean
  /** 静默模式：不弹 loading、失败不弹提示；用于可降级的子请求和埋点上报 */
  silent?: boolean
  /** 覆盖默认超时（毫秒），文档页数等慢请求使用 */
  timeout?: number
}

let pendingRequestCount = 0

function beginLoading(): void {
  pendingRequestCount += 1
  if (pendingRequestCount === 1) {
    wx.showLoading({ title: '加载中' })
  }
}

function endLoading(): void {
  pendingRequestCount = Math.max(0, pendingRequestCount - 1)
  if (pendingRequestCount === 0) {
    wx.hideLoading()
  }
}

function showErrorToast(error: ApiError): void {
  if (error.code === 401 || isMaterialDeletedError(error)) return
  const title = error.code === -1 ? '网络异常，请稍后重试' : '请求失败，请稍后重试'
  wx.showToast({ title, icon: 'none' })
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const entries = Object.entries(query ?? {}).filter(([, value]) => value !== undefined && value !== '')
  if (entries.length === 0) return `${getApiBaseUrl()}${path}`

  const queryString = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')

  return `${getApiBaseUrl()}${path}?${queryString}`
}

function buildAuthHeader(): Record<string, string> {
  const header: Record<string, string> = {}
  const userId = wx.getStorageSync(STORAGE_KEY_USER_ID) as string | ''
  const openid = wx.getStorageSync(STORAGE_KEY_OPENID) as string | ''

  if (userId) header['X-User-Id'] = String(userId)
  if (openid) header['X-Openid'] = String(openid)

  return header
}

/** 立刻发出请求，不等登录接口。用于小程序切后台时，异步登录来不及发出去。 */
export function postNow(path: string, data: Record<string, unknown>): void {
  if (!hasAuthorizedLogin()) return
  wx.request({
    url: buildUrl(path),
    method: 'POST',
    data,
    header: {
      'content-type': 'application/json',
      ...buildAuthHeader(),
    },
    timeout: REQUEST_TIMEOUT_MS,
    enableHttp2: false,
    enableQuic: false,
  })
}

function rawRequest<T>(options: RequestOptions): Promise<T> {
  const showLoading = !options.silent
  if (showLoading) beginLoading()

  return new Promise<T>((resolve, reject) => {
    const finish = (error: ApiError | null, value?: T): void => {
      if (showLoading) endLoading()
      if (!error) {
        resolve(value as T)
        return
      }
      if (!options.silent) showErrorToast(error)
      reject(error)
    }

    wx.request({
      url: buildUrl(options.path, options.query),
      method: options.method,
      data: options.data,
      header: {
        'content-type': 'application/json',
        ...(options.skipAuth ? {} : buildAuthHeader()),
      },
      timeout: options.timeout ?? REQUEST_TIMEOUT_MS,
      enableHttp2: false,
      enableQuic: false,
      success: (response) => {
        const result = response.data as ApiResponse<T> | undefined
        if (response.statusCode === 200 && result && result.code === 200) {
          finish(null, result.data)
          return
        }
        finish(new ApiError(result?.code ?? response.statusCode, result?.message ?? '请求失败'))
      },
      fail: () => finish(new ApiError(-1, '网络请求失败')),
    })
  })
}

let loginPromise: Promise<ApiLoginData> | null = null
let cachedUser: ApiLoginData | null = null

function persistLogin(data: ApiLoginData): ApiLoginData {
  const previousNickname = usableLoginNickname(cachedUser?.nickname ?? wx.getStorageSync(STORAGE_KEY_NICKNAME))
  const previousAvatar = usableLoginAvatar(cachedUser?.avatar ?? wx.getStorageSync(STORAGE_KEY_AVATAR))
  cachedUser = {
    ...data,
    nickname: usableLoginNickname(data.nickname) || previousNickname || data.nickname,
    avatar: usableLoginAvatar(data.avatar) || previousAvatar || data.avatar,
  }
  wx.setStorageSync(STORAGE_KEY_AUTHORIZED, '1')
  wx.setStorageSync(STORAGE_KEY_USER_ID, cachedUser.userId)
  wx.setStorageSync(STORAGE_KEY_OPENID, cachedUser.openid)
  wx.setStorageSync(STORAGE_KEY_NICKNAME, cachedUser.nickname ?? '')
  wx.setStorageSync(STORAGE_KEY_AVATAR, cachedUser.avatar ?? '')
  return cachedUser
}

export function getCachedLogin(): ApiLoginData | null {
  if (cachedUser) return cachedUser
  if (!hasAuthorizedLogin()) return null
  return {
    userId: String(wx.getStorageSync(STORAGE_KEY_USER_ID) ?? ''),
    openid: String(wx.getStorageSync(STORAGE_KEY_OPENID) ?? ''),
    phone: null,
    nickname: String(wx.getStorageSync(STORAGE_KEY_NICKNAME) ?? '') || null,
    avatar: String(wx.getStorageSync(STORAGE_KEY_AVATAR) ?? '') || null,
  }
}

function requestLogin(): Promise<ApiLoginData> {
  return new Promise<ApiLoginData>((resolve, reject) => {
    wx.login({
      success: (loginResult) => {
        rawRequest<ApiLoginData>({
          method: 'POST',
          path: '/wechat/login',
          query: { code: loginResult.code },
          skipAuth: true,
        })
          .then((data) => resolve(persistLogin(data)))
          .catch(reject)
      },
      fail: (error) => {
        console.error('[wx.login] failed', error.errMsg)
        reject(new ApiError(-1, `微信登录失败：${error.errMsg || '未知原因'}`))
      },
    })
  })
}

export function hasAuthorizedLogin(): boolean {
  return wx.getStorageSync(STORAGE_KEY_AUTHORIZED) === '1'
}

export function authorizeLogin(): Promise<ApiLoginData> {
  wx.setStorageSync(STORAGE_KEY_AUTHORIZED, '1')
  loginPromise = null
  cachedUser = null
  return ensureLogin()
}

export function clearLogin(): void {
  loginPromise = null
  cachedUser = null
  wx.removeStorageSync(STORAGE_KEY_USER_ID)
  wx.removeStorageSync(STORAGE_KEY_OPENID)
  wx.removeStorageSync(STORAGE_KEY_AUTHORIZED)
  wx.removeStorageSync(STORAGE_KEY_NICKNAME)
  wx.removeStorageSync(STORAGE_KEY_AVATAR)
}

export function patchCachedLogin(patch: Partial<Pick<ApiLoginData, 'nickname' | 'avatar'>>): void {
  const next: ApiLoginData = {
    userId: cachedUser?.userId ?? String(wx.getStorageSync(STORAGE_KEY_USER_ID) ?? ''),
    openid: cachedUser?.openid ?? String(wx.getStorageSync(STORAGE_KEY_OPENID) ?? ''),
    phone: cachedUser?.phone ?? null,
    nickname: patch.nickname !== undefined ? patch.nickname : cachedUser?.nickname ?? null,
    avatar: patch.avatar !== undefined ? patch.avatar : cachedUser?.avatar ?? null,
  }
  persistLogin(next)
  loginPromise = Promise.resolve(next)
}

/** 登录（code 换 userId），应用生命周期内复用同一登录态；失败后下次调用会重试 */
export function ensureLogin(): Promise<ApiLoginData> {
  if (cachedUser && loginPromise) return loginPromise
  if (!loginPromise) {
    loginPromise = requestLogin().catch((error: ApiError) => {
      loginPromise = null
      cachedUser = null
      throw error
    })
  }
  return loginPromise
}

function rejectUnauthorized<T>(): Promise<T> {
  return Promise.reject(new ApiError(401, '请先登录'))
}

/** 统一请求入口：默认先确保登录，再携带登录态请求头发起请求 */
export function request<T>(options: RequestOptions): Promise<T> {
  if (options.skipAuth) return rawRequest<T>(options)
  if (!hasAuthorizedLogin()) return rejectUnauthorized<T>()
  return ensureLogin().then(() => rawRequest<T>(options))
}

interface DirectUploadTicket {
  uploadUrl: string
  fileUrl: string
  formData: Record<string, string>
}

function uploadDirectory(path: string): 'materials' | 'avatars' {
  return path === '/user/avatar' ? 'avatars' : 'materials'
}

function fileNameOf(filePath: string): string {
  const slash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  return slash >= 0 ? filePath.slice(slash + 1) : filePath
}

function notifyUploadFailure(error: ApiError): Promise<never> {
  if (!error.notified) {
    error.notified = true
    wx.showModal({
      title: '上传失败',
      content: error.message || '上传失败',
      showCancel: false,
    })
  }
  return Promise.reject(error)
}

/** 向 OSS 直传单个本地文件，返回 CDN 地址。path 只用来区分作品和头像目录。 */
export function uploadFile(path: string, filePath: string): Promise<string> {
  if (!hasAuthorizedLogin()) return rejectUnauthorized<string>()
  return ensureLogin()
    .then(() => request<DirectUploadTicket>({
      method: 'POST',
      path: '/material/upload-ticket',
      data: { directory: uploadDirectory(path), filename: fileNameOf(filePath) },
      silent: true,
    }))
    .then((ticket) => new Promise<string>((resolve, reject) => {
      wx.uploadFile({
        url: ticket.uploadUrl,
        filePath,
        name: 'file',
        formData: ticket.formData,
        timeout: UPLOAD_TIMEOUT_MS,
        success: (response) => {
          if (response.statusCode === 200 || response.statusCode === 204) {
            resolve(ticket.fileUrl)
            return
          }
          reject(new ApiError(response.statusCode, '上传失败'))
        },
        fail: () => reject(new ApiError(-1, '网络请求失败')),
      })
    }))
    .catch((error: unknown) => notifyUploadFailure(error instanceof ApiError ? error : new ApiError(-1, '上传失败')))
}

/** 以固定并发度顺序执行任务队列，返回与任务顺序一致的结果（任务应自行处理失败降级） */
export function runRequestQueue<T>(tasks: Array<() => Promise<T>>, concurrency: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let cursor = 0

  const worker = (): Promise<void> => {
    const index = cursor
    cursor += 1
    if (index >= tasks.length) return Promise.resolve()

    return tasks[index]().then((value) => {
      results[index] = value
      return worker()
    })
  }

  const workerCount = Math.min(concurrency, tasks.length)
  const workers: Array<Promise<void>> = []
  for (let i = 0; i < workerCount; i += 1) {
    workers.push(worker())
  }

  return Promise.all(workers).then(() => results)
}
