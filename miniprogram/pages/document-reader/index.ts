import { getDocumentPageCount, prepareDocumentPageImage } from '../../services/document'
import type { DocumentReaderPage } from '../../types/document'

const PRELOAD_AHEAD = 2

function buildPages(totalPages: number): DocumentReaderPage[] {
  const pages: DocumentReaderPage[] = []
  for (let index = 0; index < totalPages; index += 1) {
    pages.push({
      index,
      pageNo: index + 1,
      url: '',
    })
  }
  return pages
}

Page({
  data: {
    navTitle: '文档预览',
    status: 'loading' as 'loading' | 'success' | 'error',
    errorMessage: '文档加载失败',
    pages: [] as DocumentReaderPage[],
  },

  materialId: '',
  totalPages: 0,
  loadedUntil: -1,
  loadingPageIndices: [] as number[],
  maxViewedIndex: -1,
  pageObserver: null as WechatMiniprogram.IntersectionObserver | null,

  onLoad(options: Record<string, string | undefined>) {
    this.materialId = options.materialId ?? ''
    this.loadedUntil = -1
    this.loadingPageIndices = []
    this.maxViewedIndex = -1

    if (!this.materialId) {
      this.setData({ status: 'error', errorMessage: '无法打开文档', navTitle: '文档预览' })
      return
    }

    this.loadDocument()
  },

  onUnload() {
    this.disconnectPageObserver()
  },

  onRetryTap() {
    this.loadDocument()
  },

  loadDocument() {
    this.disconnectPageObserver()
    this.setData({ status: 'loading', navTitle: '文档预览', pages: [] })

    getDocumentPageCount(this.materialId)
      .then((totalPages) => {
        if (totalPages <= 0) {
          this.setData({ status: 'error', errorMessage: '文档没有可预览的页' })
          return
        }

        this.totalPages = totalPages
        this.loadedUntil = -1
        this.loadingPageIndices = []
        this.setData(
          {
            status: 'success',
            navTitle: `1 / ${totalPages}`,
            pages: buildPages(totalPages),
          },
          () => {
            this.observePages()
            this.markPageViewed(0)
          },
        )
      })
      .catch(() => {
        this.setData({
          status: 'error',
          errorMessage: '无法加载文档，请稍后重试',
          navTitle: '文档预览',
        })
      })
  },

  disconnectPageObserver() {
    if (!this.pageObserver) return
    this.pageObserver.disconnect()
    this.pageObserver = null
  },

  observePages() {
    this.disconnectPageObserver()
    const observer = this.createIntersectionObserver({
      observeAll: true,
      nativeMode: true,
    })
    this.pageObserver = observer
    observer.relativeToViewport().observe('.document-reader__page', (res) => {
      if (res.intersectionRatio <= 0) return
      const fromDataset = Number(res.dataset.page)
      const fromId = typeof res.id === 'string' ? Number(res.id.replace('doc-page-', '')) : Number.NaN
      const pageIndex = Number.isNaN(fromDataset) ? fromId : fromDataset
      if (Number.isNaN(pageIndex)) return
      this.markPageViewed(pageIndex)
    })
  },

  ensurePagesLoaded(visibleIndex: number) {
    const nextLoadedUntil = Math.min(this.totalPages - 1, visibleIndex + PRELOAD_AHEAD)
    for (let index = 0; index <= nextLoadedUntil; index += 1) {
      this.loadPageImage(index)
    }
    if (nextLoadedUntil > this.loadedUntil) {
      this.loadedUntil = nextLoadedUntil
    }
  },

  loadPageImage(pageIndex: number) {
    if (pageIndex < 0 || pageIndex >= this.totalPages) return
    if (this.data.pages[pageIndex]?.url) return
    if (this.loadingPageIndices.includes(pageIndex)) return

    this.loadingPageIndices.push(pageIndex)
    prepareDocumentPageImage(this.materialId, pageIndex)
      .then((localUrl) => {
        this.loadingPageIndices = this.loadingPageIndices.filter((index) => index !== pageIndex)
        if (!localUrl || this.materialId === '') return
        this.setData({ [`pages[${pageIndex}].url`]: localUrl })
      })
      .catch(() => {
        this.loadingPageIndices = this.loadingPageIndices.filter((index) => index !== pageIndex)
      })
  },

  markPageViewed(pageIndex: number) {
    if (pageIndex < 0 || pageIndex >= this.totalPages) return

    if (pageIndex > this.maxViewedIndex) {
      this.maxViewedIndex = pageIndex
    }
    this.setData({ navTitle: `${pageIndex + 1} / ${this.totalPages}` })
    this.ensurePagesLoaded(this.maxViewedIndex)
  },

  onPageTap(event: WechatMiniprogram.TouchEvent) {
    const pageIndex = Number(event.currentTarget.dataset.page)
    const urls = this.data.pages.map((page) => page.url).filter((url) => url !== '')
    const current = this.data.pages[pageIndex]?.url || urls[0]
    if (!current) return

    wx.previewImage({
      urls,
      current,
    })
  },
})
