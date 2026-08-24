import { resolveMediaUrl, runRequestQueue } from '../services/request'

const mediaCache = new Map<string, string>()
const MEDIA_DOWNLOAD_CONCURRENCY = 6
const DEFAULT_DOWNLOAD_TIMEOUT_MS = 15000

export interface PrepareMediaOptions {
  timeout?: number
  /** 指定本地文件后缀，真机 <image> 识别下载结果需要（如 png） */
  fileExtension?: string
}

function isLocalMediaPath(url: string): boolean {
  return (
    url.startsWith('/assets/')
    || url.startsWith('wxfile://')
    || url.startsWith('http://tmp/')
    || url.startsWith('https://tmp/')
    || url.startsWith('http://usr/')
    || url.startsWith('https://usr/')
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

function hashUrl(url: string): string {
  let hash = 0
  for (let index = 0; index < url.length; index += 1) {
    hash = (hash * 31 + url.charCodeAt(index)) >>> 0
  }
  return hash.toString(16)
}

function resolveDownloadPath(url: string, fileExtension?: string): string | undefined {
  if (!fileExtension) return undefined
  return `${wx.env.USER_DATA_PATH}/media_${hashUrl(url)}.${fileExtension}`
}

/**
 * 真机调试时，<image src="http://局域网..."> 常被平台拦截；先 downloadFile 转 wxfile 临时路径再展示。
 * 开发者工具模拟器可直接使用归一化后的 HTTP URL。
 */
export function prepareMediaUrl(
  url: string | null | undefined,
  options?: PrepareMediaOptions,
): Promise<string> {
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

  const filePath = resolveDownloadPath(resolved, options?.fileExtension)
  if (filePath) {
    try {
      wx.getFileSystemManager().accessSync(filePath)
      mediaCache.set(resolved, filePath)
      return Promise.resolve(filePath)
    } catch {
      // 本地尚无缓存，继续下载
    }
  }

  return new Promise((resolve) => {
    const downloadOptions: WechatMiniprogram.DownloadFileOption = {
      url: resolved,
      timeout: options?.timeout ?? DEFAULT_DOWNLOAD_TIMEOUT_MS,
      success: (res) => {
        const localPath = res.filePath || res.tempFilePath
        if (res.statusCode === 200 && localPath) {
          mediaCache.set(resolved, localPath)
          resolve(localPath)
          return
        }
        console.warn('[media] downloadFile non-200', resolved, res.statusCode)
        resolve(options?.fileExtension ? '' : resolved)
      },
      fail: (error) => {
        console.warn('[media] downloadFile failed', resolved, error)
        resolve(options?.fileExtension ? '' : resolved)
      },
    }
    if (filePath) {
      downloadOptions.filePath = filePath
    }
    wx.downloadFile(downloadOptions)
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
