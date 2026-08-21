import { resolveMediaUrl, runRequestQueue } from '../services/request'

const mediaCache = new Map<string, string>()
const MEDIA_DOWNLOAD_CONCURRENCY = 6

function isLocalMediaPath(url: string): boolean {
  return (
    url.startsWith('/assets/')
    || url.startsWith('wxfile://')
    || url.startsWith('http://tmp/')
    || url.startsWith('https://tmp/')
    || url.startsWith('data:')
  )
}

function isDevtoolsPlatform(): boolean {
  try {
    return wx.getSystemInfoSync().platform === 'devtools'
  } catch {
    return false
  }
}

/**
 * 真机调试时，<image src="http://局域网..."> 常被平台拦截；先 downloadFile 转 wxfile 临时路径再展示。
 * 开发者工具模拟器可直接使用归一化后的 HTTP URL。
 */
export function prepareMediaUrl(url: string | null | undefined): Promise<string> {
  const resolved = resolveMediaUrl(url)
  if (!resolved || isLocalMediaPath(resolved)) {
    return Promise.resolve(resolved)
  }
  if (!/^https?:\/\//i.test(resolved)) {
    return Promise.resolve(resolved)
  }
  if (isDevtoolsPlatform()) {
    return Promise.resolve(resolved)
  }

  const cached = mediaCache.get(resolved)
  if (cached) return Promise.resolve(cached)

  return new Promise((resolve) => {
    wx.downloadFile({
      url: resolved,
      timeout: 15000,
      success: (res) => {
        if (res.statusCode === 200 && res.tempFilePath) {
          mediaCache.set(resolved, res.tempFilePath)
          resolve(res.tempFilePath)
          return
        }
        console.warn('[media] downloadFile non-200', resolved, res.statusCode)
        resolve(resolved)
      },
      fail: (error) => {
        console.warn('[media] downloadFile failed', resolved, error)
        resolve(resolved)
      },
    })
  })
}

export function prepareMediaUrls(
  urls: Array<string | null | undefined>,
  concurrency: number = MEDIA_DOWNLOAD_CONCURRENCY,
): Promise<string[]> {
  if (urls.length === 0) return Promise.resolve([])
  const tasks = urls.map((url) => () => prepareMediaUrl(url ?? ''))
  return runRequestQueue(tasks, concurrency)
}

function isShareableLocalPath(url: string): boolean {
  if (isLocalMediaPath(url) || url.startsWith('wxfile://')) {
    return true
  }
  // 微信本地临时文件路径（非局域网/远端资源）
  if (/^https?:\/\/(tmp|usr)\//i.test(url)) {
    return true
  }
  if (!/^https?:\/\//i.test(url) && url !== '') {
    return true
  }
  return false
}

/** 分享图片到朋友圈前解析为本地临时路径；已缓存或已是 wxfile 则不再 downloadFile */
export function resolveShareImagePath(url: string): Promise<string> {
  const trimmed = url.trim()
  if (!trimmed) {
    return Promise.reject(new Error('empty image url'))
  }

  if (isShareableLocalPath(trimmed)) {
    return Promise.resolve(trimmed)
  }

  const cached = mediaCache.get(trimmed)
  if (cached && isShareableLocalPath(cached)) {
    return Promise.resolve(cached)
  }

  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url: trimmed,
      timeout: 15000,
      success: (res) => {
        if (res.statusCode === 200 && res.tempFilePath) {
          mediaCache.set(trimmed, res.tempFilePath)
          resolve(res.tempFilePath)
          return
        }
        reject(new Error(`download status ${res.statusCode}`))
      },
      fail: (error) => reject(error),
    })
  })
}
