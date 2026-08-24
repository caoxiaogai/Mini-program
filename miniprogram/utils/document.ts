import { resolveMediaUrl } from '../services/request'

type OpenDocumentFileType = NonNullable<WechatMiniprogram.OpenDocumentOption['fileType']>

const documentCache = new Map<string, string>()

function isLocalDocumentPath(url: string): boolean {
  return (
    url.startsWith('wxfile://')
    || url.startsWith('http://tmp/')
    || url.startsWith('https://tmp/')
    || url.startsWith('http://usr/')
    || url.startsWith('https://usr/')
  )
}

function inferDocumentFileType(url: string, materialFileType: string): OpenDocumentFileType {
  const lower = url.split('?')[0]?.toLowerCase() ?? ''

  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.docx')) return 'docx'
  if (lower.endsWith('.doc')) return 'doc'
  if (lower.endsWith('.xlsx')) return 'xlsx'
  if (lower.endsWith('.xls')) return 'xls'
  if (lower.endsWith('.pptx')) return 'pptx'
  if (lower.endsWith('.ppt')) return 'ppt'

  return materialFileType === 'TABLE' ? 'xlsx' : 'pdf'
}

function downloadDocument(url: string): Promise<string> {
  const resolved = resolveMediaUrl(url)
  if (!resolved) {
    return Promise.reject(new Error('empty document url'))
  }

  if (isLocalDocumentPath(resolved)) {
    return Promise.resolve(resolved)
  }

  const cached = documentCache.get(resolved)
  if (cached) return Promise.resolve(cached)

  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url: resolved,
      timeout: 60000,
      success: (res) => {
        if (res.statusCode === 200 && res.tempFilePath) {
          documentCache.set(resolved, res.tempFilePath)
          resolve(res.tempFilePath)
          return
        }
        reject(new Error(`download status ${res.statusCode}`))
      },
      fail: (error) => reject(error),
    })
  })
}

function openLocalDocument(filePath: string, materialFileType: string): Promise<void> {
  return new Promise((resolve, reject) => {
    wx.openDocument({
      filePath,
      fileType: inferDocumentFileType(filePath, materialFileType),
      showMenu: true,
      success: () => resolve(),
      fail: (error) => reject(error),
    })
  })
}

/** 下载远端 PDF/Office 文件并用微信原生文档预览打开 */
export function openRemoteDocument(url: string, materialFileType = 'PDF'): Promise<void> {
  if (!url) {
    return Promise.reject(new Error('empty document url'))
  }

  wx.showLoading({ title: '加载中...', mask: true })

  return downloadDocument(url)
    .then((filePath) => openLocalDocument(filePath, materialFileType))
    .finally(() => {
      wx.hideLoading()
    })
}
