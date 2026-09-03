// 统一请求层：集中管理接口基址、超时、登录态请求头和错误归一化。
// 页面不直接使用本文件；所有数据访问经由 services/ 下的业务 service。

import type { ApiLoginData, ApiResponse } from '../types/api'
import { DEV_LAN_ORIGIN, DEVTOOLS_ORIGIN } from '../config/dev'
import { isMaterialDeletedError } from '../utils/material-deleted'

let cachedApiBaseUrl: string | null = null

/**
 * 开发者工具、真机调试和体验版都走当前配置的局域网 IP（与 caoxiaogai-aisales 一致）。
 * 延迟到首次请求再判定，避免模块加载时读不到运行环境。
 */
export function getApiBaseUrl(): string {
  if (cachedApiBaseUrl) return cachedApiBaseUrl

  try {
    if (wx.getSystemInfoSync().platform === 'devtools') {
      cachedApiBaseUrl = `${DEVTOOLS_ORIGIN}/api`
      return cachedApiBaseUrl
    }
  } catch {
    // 非小程序环境（如单元测试）回退局域网地址
  }

  cachedApiBaseUrl = `${DEV_LAN_ORIGIN}/api`
  return cachedApiBaseUrl
}

const REQUEST_TIMEOUT_MS = 15000
const UPLOAD_TIMEOUT_MS = 60000

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
 * 将后端返回的文件 URL 归一化为当前环境可访问的代理地址。
 * - MinIO 直连（:9000/sales-materials/...）→ /api/files/sales-materials/...
 * - 缺 /api/files 的 /sales-materials/... → 补全代理前缀
 * - 已是代理 URL → 仅对齐主机（模拟器本机 / 真机与体验版局域网 IP）
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (!/^https?:\/\//.test(trimmed)) {
    if (trimmed.startsWith('/api/files/')) {
      return `${getApiOrigin()}${trimmed}`
    }
    return trimmed
  }

  const origin = getApiOrigin()

  const minioDirect = trimmed.match(/^https?:\/\/[^/]+:9000\/sales-materials\/(.+)$/i)
  if (minioDirect) {
    return `${origin}/api/files/sales-materials/${minioDirect[1]}`
  }

  if (trimmed.includes('/api/files/')) {
    return trimmed.replace(/^https?:\/\/[^/]+/, origin)
  }

  const bareBucket = trimmed.match(/^https?:\/\/[^/]+\/sales-materials\/(.+)$/i)
  if (bareBucket) {
    return `${origin}/api/files/sales-materials/${bareBucket[1]}`
  }

  return trimmed.replace(/^https?:\/\/[^/]+/, origin)
}

/** 归一化后的接口错误；code 为后端业务码，网络层失败时为 -1 */
export class ApiError extends Error {
  code: number

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
  cachedUser = data
  wx.setStorageSync(STORAGE_KEY_USER_ID, data.userId)
  wx.setStorageSync(STORAGE_KEY_OPENID, data.openid)
  wx.setStorageSync(STORAGE_KEY_NICKNAME, data.nickname ?? '')
  wx.setStorageSync(STORAGE_KEY_AVATAR, data.avatar ?? '')
  return data
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

function readUploadedUrl(data: unknown): string {
  if (typeof data === 'string' && data.trim() !== '') return data
  if (data && typeof data === 'object') {
    const record = data as { url?: string; avatar?: string; fileUrl?: string }
    const url = record.avatar ?? record.url ?? record.fileUrl
    if (typeof url === 'string' && url.trim() !== '') return url
  }
  return ''
}

/** 上传单个文件，返回后端存储 URL（对应 POST /material/upload-file 一类接口） */
export function uploadFile(path: string, filePath: string): Promise<string> {
  if (!hasAuthorizedLogin()) return rejectUnauthorized<string>()
  return ensureLogin().then(
    () =>
      new Promise<string>((resolve, reject) => {
        beginLoading()

        const finish = (error: ApiError | null, value?: string): void => {
          endLoading()
          if (!error) {
            resolve(value as string)
            return
          }
          wx.showToast({ title: '上传失败，请稍后重试', icon: 'none' })
          reject(error)
        }

        wx.uploadFile({
          url: buildUrl(path),
          filePath,
          name: 'file',
          header: buildAuthHeader(),
          timeout: UPLOAD_TIMEOUT_MS,
          success: (response) => {
            try {
              const result = JSON.parse(response.data) as ApiResponse<unknown>
              const uploadedUrl = result.code === 200 ? readUploadedUrl(result.data) : ''
              if (uploadedUrl) {
                finish(null, uploadedUrl)
                return
              }
              finish(new ApiError(result.code, result.message || '上传失败'))
            } catch {
              finish(new ApiError(-1, '上传响应解析失败'))
            }
          },
          fail: () => finish(new ApiError(-1, '网络请求失败')),
        })
      }),
  )
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
