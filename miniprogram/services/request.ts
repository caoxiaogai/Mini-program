// 统一请求层：集中管理接口基址、超时、登录态请求头和错误归一化。
// 页面不直接使用本文件；所有数据访问经由 services/ 下的业务 service。

import type { ApiLoginData, ApiResponse } from '../types/api'
import { DEV_LAN_ORIGIN } from '../config/dev'
import { STORAGE_KEY_OPENID, STORAGE_KEY_USER_ID } from '../constants/auth'

const DEVTOOLS_API_BASE_URL = 'http://localhost:8080/api'
// const DEVTOOLS_API_BASE_URL = 'https://www.yjxzhang.com/api'

let cachedApiBaseUrl: string | null = null
let loginWaiter: (() => Promise<ApiLoginData>) | null = null

/** 由 auth 模块注册，避免 request ↔ auth 循环依赖 */
export function registerLoginWaiter(waiter: () => Promise<ApiLoginData>): void {
  loginWaiter = waiter
}

/** 开发者工具模拟器用 localhost；真机/预览用手机可访问的局域网 IP（延迟到首次请求再判定） */
export function getApiBaseUrl(): string {
  if (cachedApiBaseUrl) return cachedApiBaseUrl

  try {
    if (wx.getSystemInfoSync().platform === 'devtools') {
      cachedApiBaseUrl = DEVTOOLS_API_BASE_URL
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

/** 当前 API 基址的 origin（不含 /api），例如 http://192.168.31.225:8080 */
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
 * - 已是代理 URL → 仅对齐主机（模拟器 localhost / 真机局域网 IP）
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
  method: 'GET' | 'POST' | 'PUT'
  path: string
  query?: Record<string, string | number | undefined>
  data?: Record<string, unknown>
  /** 跳过登录态（仅登录接口本身使用） */
  skipAuth?: boolean
  /** 静默模式：失败时不弹提示，用于可降级的聚合子请求 */
  silent?: boolean
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

/** 供 auth 模块调用的底层请求（登录接口等） */
export function rawRequestWithAuth<T>(options: RequestOptions): Promise<T> {
  if (!options.silent) {
    beginLoading()
  }

  return new Promise<T>((resolve, reject) => {
    const finish = (error: ApiError | null, value?: T): void => {
      if (!options.silent) {
        endLoading()
      }
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
      timeout: REQUEST_TIMEOUT_MS,
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

function readStoredLoginData(): ApiLoginData | null {
  const userId = wx.getStorageSync(STORAGE_KEY_USER_ID) as string | ''
  if (!userId) return null

  return {
    userId,
    openid: (wx.getStorageSync(STORAGE_KEY_OPENID) as string | '') || '',
    nickname: null,
    avatar: null,
    phone: null,
  }
}

/** 等待登录完成；未登录时由 auth 弹窗引导，不静默 wx.login */
export function ensureLogin(): Promise<ApiLoginData> {
  const stored = readStoredLoginData()
  if (stored) return Promise.resolve(stored)

  if (!loginWaiter) {
    return Promise.reject(new ApiError(-1, '登录模块未初始化'))
  }

  return loginWaiter()
}

/** 统一请求入口：默认先确保登录，再携带登录态请求头发起请求 */
export function request<T>(options: RequestOptions): Promise<T> {
  if (options.skipAuth) return rawRequestWithAuth<T>(options)
  return ensureLogin().then(() => rawRequestWithAuth<T>(options))
}

/** 上传单个文件，返回后端存储 URL（对应 POST /material/upload-file 一类接口） */
export function uploadFile(path: string, filePath: string): Promise<string> {
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
              const result = JSON.parse(response.data) as ApiResponse<string>
              if (result.code === 200) {
                finish(null, result.data)
                return
              }
              finish(new ApiError(result.code, result.message))
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
