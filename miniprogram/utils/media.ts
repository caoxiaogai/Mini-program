import { resolveMediaUrl, runRequestQueue } from '../services/request'

const mediaCache = new Map<string, string>()
const mediaDownloads = new Map<string, Promise<string>>()
const MEDIA_DOWNLOAD_CONCURRENCY = 6
const DEFAULT_DOWNLOAD_TIMEOUT_MS = 15000
const MEDIA_CACHE_DIR = 'media-cache'
const MEDIA_CACHE_INDEX_KEY = 'media.imageCacheIndex'
const MEDIA_CACHE_FILE_LIMIT = 300
const CACHE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'pdf'])
const SKIP_CACHE_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'avi', 'zip'])

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
  let primary = 2166136261
  let secondary = 0
  for (let index = 0; index < url.length; index += 1) {
    const code = url.charCodeAt(index)
    primary ^= code
    primary = Math.imul(primary, 16777619)
    secondary = (secondary * 33 + code) >>> 0
  }
  return (primary >>> 0).toString(16) + secondary.toString(16)
}

function extensionFromUrl(url: string): string {
  const path = url.split('?')[0].split('#')[0]
  const match = path.match(/\.([a-z0-9]{1,8})$/i)
  return match?.[1]?.toLowerCase() ?? ''
}

/** 图片和 PDF 写入本地目录；视频仍只使用临时文件，避免占满本地空间。 */
function cacheExtension(url: string, fileExtension?: string): string | null {
  const explicit = (fileExtension ?? '').toLowerCase().replace(/^\./, '')
  if (explicit === 'jpeg') return 'jpg'
  if (explicit) return explicit
  const ext = extensionFromUrl(url)
  if (SKIP_CACHE_EXTENSIONS.has(ext)) return null
  if (ext === 'jpeg') return 'jpg'
  if (CACHE_EXTENSIONS.has(ext)) return ext
  return 'jpg'
}

function resolveDownloadPath(url: string, fileExtension?: string): string | undefined {
  const extension = cacheExtension(url, fileExtension)
  if (!extension) return undefined
  return `${wx.env.USER_DATA_PATH}/${MEDIA_CACHE_DIR}/m_${hashUrl(url)}.${extension}`
}

let cacheDirReady = false

function ensureCacheDir(): boolean {
  if (cacheDirReady) return true
  const dir = `${wx.env.USER_DATA_PATH}/${MEDIA_CACHE_DIR}`
  const fs = wx.getFileSystemManager()
  try {
    fs.accessSync(dir)
    cacheDirReady = true
    return true
  } catch {
    try {
      fs.mkdirSync(dir, true)
      cacheDirReady = true
      return true
    } catch {
      return false
    }
  }
}

function readCacheIndex(): Array<{ url: string; path: string }> {
  try {
    const raw = wx.getStorageSync(MEDIA_CACHE_INDEX_KEY)
    if (!Array.isArray(raw)) return []
    return raw.filter((item) => item && typeof item.url === 'string' && typeof item.path === 'string')
  } catch {
    return []
  }
}

function isStorageLimitError(error: { errMsg?: string }): boolean {
  return /storage|maximum size|exceed/i.test(error.errMsg ?? '')
}

function evictOldestCacheFiles(count: number): void {
  const index = readCacheIndex()
  const removed = index.splice(0, count)
  const fs = wx.getFileSystemManager()
  for (const item of removed) {
    mediaCache.delete(item.url)
    try {
      fs.unlinkSync(item.path)
    } catch {
      // 文件已经不在
    }
  }
  try {
    wx.setStorageSync(MEDIA_CACHE_INDEX_KEY, index)
  } catch {
    // 索引写失败不影响本次展示
  }
}

function rememberCacheFile(url: string, filePath: string): void {
  const index = readCacheIndex().filter((item) => item.url !== url)
  index.push({ url, path: filePath })
  const fs = wx.getFileSystemManager()
  while (index.length > MEDIA_CACHE_FILE_LIMIT) {
    const oldest = index.shift()
    if (!oldest) break
    mediaCache.delete(oldest.url)
    try {
      fs.unlinkSync(oldest.path)
    } catch {
      // 文件已经不在
    }
  }
  try {
    wx.setStorageSync(MEDIA_CACHE_INDEX_KEY, index)
  } catch {
    // 索引写失败不影响本次展示
  }
}

/**
 * 真机与体验版中，<image src="http(s)://..."> 常被平台拦截；先 downloadFile 转本地路径再展示。
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

  const pending = mediaDownloads.get(resolved)
  if (pending) return pending

  const filePath = resolveDownloadPath(resolved, options?.fileExtension)
  if (filePath && ensureCacheDir()) {
    try {
      wx.getFileSystemManager().accessSync(filePath)
      mediaCache.set(resolved, filePath)
      return Promise.resolve(filePath)
    } catch {
      // 本地尚无缓存，继续下载
    }
  }

  const task = new Promise<string>((resolve) => {
    const finishWithoutFile = () => resolve(options?.fileExtension ? '' : resolved)
    const download = (allowRetry: boolean) => {
      const downloadOptions: WechatMiniprogram.DownloadFileOption = {
        url: resolved,
        timeout: options?.timeout ?? DEFAULT_DOWNLOAD_TIMEOUT_MS,
        success: (res) => {
          const localPath = res.filePath || res.tempFilePath
          if (res.statusCode === 200 && localPath) {
            mediaCache.set(resolved, localPath)
            if (filePath && localPath === filePath) rememberCacheFile(resolved, filePath)
            resolve(localPath)
            return
          }
          console.warn('[media] downloadFile non-200', resolved, res.statusCode)
          finishWithoutFile()
        },
        fail: (error) => {
          console.warn('[media] downloadFile failed', resolved, error)
          if (filePath) {
            try {
              wx.getFileSystemManager().unlinkSync(filePath)
            } catch {
              // 没有残留文件
            }
          }
          if (allowRetry && filePath && isStorageLimitError(error)) {
            evictOldestCacheFiles(30)
            download(false)
            return
          }
          finishWithoutFile()
        },
      }
      if (filePath && ensureCacheDir()) {
        downloadOptions.filePath = filePath
      }
      wx.downloadFile(downloadOptions)
    }
    download(true)
  }).finally(() => {
    mediaDownloads.delete(resolved)
  })
  mediaDownloads.set(resolved, task)
  return task
}

export function prepareMediaUrls(
  urls: Array<string | null | undefined>,
  concurrency: number = MEDIA_DOWNLOAD_CONCURRENCY,
): Promise<string[]> {
  if (urls.length === 0) return Promise.resolve([])
  const tasks = urls.map((url) => () => prepareMediaUrl(url ?? ''))
  return runRequestQueue(tasks, concurrency)
}
