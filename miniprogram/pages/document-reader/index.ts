import { getDocumentPageCount, prepareDocumentPageImage } from '../../services/document'
import {
  calcImageViewProgress,
  createTrackingSessionId,
  reportTrackingEvent,
} from '../../services/tracking'
import type { DocumentReaderPage } from '../../types/document'
import { pickCurrentDocumentPageByScroll } from '../../utils/document-page'
import { runPullRefresh } from '../../utils/pull-refresh'

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

function getWindowWidth(): number {
  try {
    return wx.getSystemInfoSync().windowWidth
  } catch {
    return 375
  }
}

Page({
  data: {
    navTitle: '文档预览',
    status: 'loading' as 'loading' | 'success' | 'error',
    errorMessage: '文档加载失败',
    pages: [] as DocumentReaderPage[],
    pullRefreshing: false,
  },

  materialId: '',
  trackingId: '',
  sessionId: '',
  totalPages: 0,
  loadedUntil: -1,
  loadingPageIndices: [] as number[],
  currentPageIndex: 0,
  lastScrollTop: 0,
  windowWidth: 375,
  pageHeightsPx: [] as Array<number | undefined>,
  viewedPageIndices: [] as number[],
  maxViewedIndex: -1,
  lastReportedProgress: -1,
  hasReportedComplete: false,
  viewStartedAt: 0,

  onLoad(options: Record<string, string | undefined>) {
    this.materialId = options.materialId ?? ''
    this.trackingId = options.trackingId ?? ''
    this.sessionId = createTrackingSessionId()
    this.windowWidth = getWindowWidth()
    this.resetPagingState()

    if (!this.materialId) {
      this.setData({ status: 'error', errorMessage: '无法打开文档', navTitle: '文档预览' })
      return
    }

    this.loadDocument()
  },

  resetPagingState() {
    this.loadedUntil = -1
    this.loadingPageIndices = []
    this.currentPageIndex = 0
    this.lastScrollTop = 0
    this.pageHeightsPx = []
    this.viewedPageIndices = []
    this.maxViewedIndex = -1
    this.lastReportedProgress = -1
    this.hasReportedComplete = false
  },

  onRetryTap() {
    this.loadDocument()
  },

  onPullRefresh() {
    this.setData({ pullRefreshing: true })
    runPullRefresh(this.loadDocument(true), () => this.setData({ pullRefreshing: false }))
  },

  loadDocument(silent = false) {
    this.resetPagingState()
    if (!silent) this.setData({ status: 'loading', navTitle: '文档预览', pages: [] })

    return getDocumentPageCount(this.materialId)
      .then((totalPages) => {
        if (totalPages <= 0) {
          if (!silent) this.setData({ status: 'error', errorMessage: '文档没有可预览的页' })
          return
        }

        this.totalPages = totalPages
        this.pageHeightsPx = new Array(totalPages)
        this.setData(
          {
            status: 'success',
            navTitle: `1 / ${totalPages}`,
            pages: buildPages(totalPages),
          },
          () => {
            this.ensurePagesLoaded(0)
            this.markPageViewed(0)
          },
        )
      })
      .catch(() => {
        if (silent) return
        this.setData({
          status: 'error',
          errorMessage: '无法加载文档，请稍后重试',
          navTitle: '文档预览',
        })
      })
  },

  onDocumentScroll(event: WechatMiniprogram.ScrollViewScroll) {
    this.lastScrollTop = event.detail.scrollTop
    this.syncCurrentPageFromScroll()
  },

  onPageImageLoad(event: WechatMiniprogram.ImageLoad) {
    const pageIndex = Number(event.currentTarget.dataset.page)
    const { width, height } = event.detail
    if (Number.isNaN(pageIndex) || pageIndex < 0 || pageIndex >= this.totalPages) return
    if (!width || !height) return

    this.pageHeightsPx[pageIndex] = (this.windowWidth * height) / width
    this.syncCurrentPageFromScroll()
  },

  syncCurrentPageFromScroll() {
    const current = pickCurrentDocumentPageByScroll(
      this.lastScrollTop,
      this.totalPages,
      this.pageHeightsPx,
      this.windowWidth,
    )
    if (current < 0) return

    if (current !== this.currentPageIndex) {
      this.currentPageIndex = current
      this.setData({ navTitle: `${current + 1} / ${this.totalPages}` })
      this.markPageViewed(current)
    }

    this.ensurePagesLoaded(current)
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

  onUnload() {
    this.reportProgress(true)
    this.sessionId = ''
    this.trackingId = ''
    this.materialId = ''
  },

  markPageViewed(pageIndex: number) {
    if (pageIndex < 0 || pageIndex >= this.totalPages) return

    if (this.viewStartedAt <= 0) {
      this.viewStartedAt = Date.now()
    }

    if (!this.viewedPageIndices.includes(pageIndex)) {
      this.viewedPageIndices.push(pageIndex)
    }

    if (pageIndex > this.maxViewedIndex) {
      this.maxViewedIndex = pageIndex
    }

    this.ensurePagesLoaded(this.maxViewedIndex)
    this.reportProgress(false)
  },

  getViewDurationSec(): number {
    if (this.viewStartedAt <= 0) return 0
    return Math.max(0, Math.floor((Date.now() - this.viewStartedAt) / 1000))
  },

  canTrack(): boolean {
    if (!this.materialId) return false
    return this.trackingId !== '' || this.materialId !== ''
  },

  reportProgress(isFinal: boolean) {
    if (!this.canTrack() || this.totalPages <= 0 || this.maxViewedIndex < 0) return
    if (this.hasReportedComplete) return

    const viewedCount = this.maxViewedIndex + 1
    const progress = calcImageViewProgress(viewedCount, this.totalPages)
    const isComplete = viewedCount >= this.totalPages

    if (!isFinal && progress <= this.lastReportedProgress && !isComplete) return

    this.lastReportedProgress = Math.max(this.lastReportedProgress, progress)
    if (isComplete) this.hasReportedComplete = true

    reportTrackingEvent({
      trackingId: this.trackingId,
      materialId: this.materialId,
      actionType: isComplete ? 'end' : 'play',
      progress,
      duration: this.getViewDurationSec(),
      sessionId: this.sessionId,
    })
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
