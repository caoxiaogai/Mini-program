import { getMaterialDetail } from '../../services/materials'
import { runAuthed } from '../../services/auth'
import {
  calcImageViewProgress,
  calcVideoViewProgress,
  createTrackingSessionId,
  reportTrackingEvent,
} from '../../services/tracking'
import { calcNoteScrollProgress } from '../../utils/note'
import type { MaterialDetailViewModel } from '../../types/materials'
import { buildReturnPath } from '../../utils/auth'
import { MATERIAL_DELETED_MESSAGE } from '../../utils/material-deleted'
import { runPagePullRefresh } from '../../utils/pull-refresh'
import {
  buildMaterialEditPath,
  buildMaterialSharePath,
  buildMaterialShareQuery,
  buildMaterialShareTitle,
  enableMaterialShareMenu,
  MATERIAL_DETAIL_PATH,
  showMomentsShareGuide,
} from '../../utils/share-material'

const VIDEO_PROGRESS_INTERVAL_MS = 5000
const VIDEO_SEEK_STEP_SEC = 10
const VIDEO_SWIPE_THRESHOLD_PX = 48
const IMAGE_VIEW_INTERVAL_MS = 5000
const PREVIEW_DOUBLE_TAP_MS = 280
const PREVIEW_PINCH_TAP_GUARD_MS = 400
const PREVIEW_TAP_SLOP_PX = 10
const PREVIEW_EDGE_PAGE_PX = 72
const PREVIEW_EDGE_IDLE_MS = 80
const PREVIEW_SCALE_MIN = 1
const PREVIEW_SCALE_MAX = 4
const PREVIEW_DOUBLE_TAP_SCALE = 2.5

function isDocumentMaterial(detail: MaterialDetailViewModel): boolean {
  return detail.fileType === 'PDF' || detail.fileType === 'TABLE'
}

Page({
  data: {
    detail: null as MaterialDetailViewModel | null,
    activeImageIndex: 0,
    imagePreviewVisible: false,
    previewZoomed: false,
    previewPinching: false,
    previewScale: 1,
    unavailableMessage: '',
    videoPlayerVisible: false,
    videoPlayerSrc: '',
    videoPlayerPoster: '',
  },

  materialId: '',
  pageTrackingId: '',
  trackingSessionId: '',
  viewedImageIndices: [] as number[],
  hasReportedComplete: false,
  imageViewStartedAt: 0,
  imageViewTimer: 0,
  videoProgressTimer: 0,
  lastVideoProgress: 0,
  videoCurrentTimeSec: 0,
  videoDurationSec: 0,
  videoTouchStartX: 0,
  videoTouchStartY: 0,
  previewScaleLive: 1,
  previewViewX: 0,
  previewAreaWidth: 0,
  previewFingerStartX: 0,
  previewFingerStartY: 0,
  previewFingerStartAt: 0,
  previewStartViewX: 0,
  previewTapMoved: false,
  previewMovedView: false,
  previewLastViewAt: 0,
  previewOutOfBounds: false,
  previewStartedAtEdge: false,
  previewFingerDx: 0,
  previewTurningPage: false,
  lastPreviewTapAt: 0,
  previewIgnoreTapUntil: 0,
  previewTapTimer: null as number | null,
  noteScrollTimer: 0,
  noteScrollReportTimer: 0,
  lastNoteProgress: 0,
  noteViewStartedAt: 0,

  onLoad(options: Record<string, string | undefined>) {
    runAuthed(buildReturnPath(MATERIAL_DETAIL_PATH, options), () => this.startDetail(options))
  },
  startDetail(options: Record<string, string | undefined>) {
    this.materialId = options.id ?? ''
    this.pageTrackingId = options.trackingId ?? ''
    this.trackingSessionId = createTrackingSessionId()
    this.viewedImageIndices = []
    this.hasReportedComplete = false
    this.imageViewStartedAt = 0
    this.lastVideoProgress = 0
    this.lastNoteProgress = 0
    this.noteViewStartedAt = 0
    this.videoCurrentTimeSec = 0
    this.videoDurationSec = 0
    this.videoTouchStartX = 0
    this.videoTouchStartY = 0
    this.resetPreviewZoomState()

    if (!this.materialId) {
      this.setData({ unavailableMessage: MATERIAL_DELETED_MESSAGE })
      return
    }

    this.loadDetail()
  },
  onPullDownRefresh() {
    runPagePullRefresh(this.loadDetail())
  },
  loadDetail() {
    if (!this.materialId) return Promise.resolve()

    return getMaterialDetail(this.materialId)
      .then((detail) => {
        if (!detail) {
          this.setData({ detail: null, unavailableMessage: MATERIAL_DELETED_MESSAGE })
          return
        }

        this.videoDurationSec = detail.duration
        this.setData({ detail, unavailableMessage: '' }, () => {
          if (detail.fileType === 'VIDEO' && detail.videoUrl) {
            this.getVideoContext()?.play()
          }
        })

        this.reportOpenedPlay()

        if (detail.fileType === 'IMAGE' && detail.images.length > 0) {
          this.markImageViewed(0, detail)
        } else if (detail.fileType === 'VIDEO') {
          this.reportVideoProgress(false, detail)
        } else if (detail.fileType === 'NOTE') {
          this.startNoteScrollTracking()
        } else if (isDocumentMaterial(detail)) {
          this.reportDocumentView(detail)
        }
      })
      .catch(() => {
        this.setData({
          detail: null,
          unavailableMessage: MATERIAL_DELETED_MESSAGE,
        })
      })
  },

  onShow() {
    enableMaterialShareMenu()
  },

  onHide() {
    this.clearImageViewTimer()
    this.clearVideoProgressTimer()
    this.clearNoteScrollTimer()
    this.reportImageViewProgress(true)
    this.reportVideoProgress(true)
    this.reportNoteScrollProgress(true)
    this.reportDocumentView()
    this.getVideoContext()?.pause()
  },

  onUnload() {
    this.clearImageViewTimer()
    this.clearVideoProgressTimer()
    this.clearNoteScrollTimer()
    this.reportImageViewProgress(true)
    this.reportVideoProgress(true)
    this.reportNoteScrollProgress(true)
    this.reportDocumentView()
    this.getVideoContext()?.pause()
    this.clearPreviewTapTimer()
    this.trackingSessionId = ''
    this.viewedImageIndices = []
    this.hasReportedComplete = false
    this.imageViewStartedAt = 0
    this.lastVideoProgress = 0
    this.videoCurrentTimeSec = 0
    this.videoDurationSec = 0
    this.lastNoteProgress = 0
    this.noteViewStartedAt = 0
    this.pageTrackingId = ''
    this.materialId = ''
  },

  onBackPress() {
    if (!this.data.videoPlayerVisible) return undefined
    this.onCloseVideoPlayer()
    return true
  },

  onPageScroll() {
    if (this.data.detail?.fileType !== 'NOTE') return
    this.scheduleNoteScrollReport()
  },

  resolveTrackingTarget(detail?: MaterialDetailViewModel) {
    const target = detail ?? this.data.detail
    return {
      trackingId: (target?.trackingId || this.pageTrackingId) ?? '',
      materialId: target?.id || this.materialId || '',
    }
  },

  reportOpenedPlay(detail?: MaterialDetailViewModel) {
    if (!this.canTrackMaterial(detail)) return

    const target = this.resolveTrackingTarget(detail)
    reportTrackingEvent({
      trackingId: target.trackingId,
      materialId: target.materialId,
      actionType: 'play',
      progress: 0,
      duration: 0,
      sessionId: this.trackingSessionId,
    })
  },

  canTrackMaterial(detail?: MaterialDetailViewModel): boolean {
    const target = this.resolveTrackingTarget(detail)
    return target.trackingId !== '' || target.materialId !== ''
  },

  startNoteScrollTracking() {
    if (this.noteViewStartedAt <= 0) this.noteViewStartedAt = Date.now()
    this.reportNoteScrollProgress(false)
    this.clearNoteScrollTimer()
    this.noteScrollTimer = setInterval(() => {
      this.reportNoteScrollProgress(false)
    }, IMAGE_VIEW_INTERVAL_MS) as unknown as number
  },

  clearNoteScrollTimer() {
    if (this.noteScrollTimer) {
      clearInterval(this.noteScrollTimer)
      this.noteScrollTimer = 0
    }
    if (this.noteScrollReportTimer) {
      clearTimeout(this.noteScrollReportTimer)
      this.noteScrollReportTimer = 0
    }
  },

  scheduleNoteScrollReport() {
    if (this.noteScrollReportTimer) return
    this.noteScrollReportTimer = setTimeout(() => {
      this.noteScrollReportTimer = 0
      this.reportNoteScrollProgress(false)
    }, 300) as unknown as number
  },

  getNoteViewDurationSec() {
    if (this.noteViewStartedAt <= 0) return 0
    return Math.max(0, Math.floor((Date.now() - this.noteViewStartedAt) / 1000))
  },

  reportNoteScrollProgress(isFinal = false) {
    const detail = this.data.detail
    if (!detail || detail.fileType !== 'NOTE' || !this.canTrackMaterial(detail)) return

    wx.createSelectorQuery()
      .selectViewport()
      .scrollOffset((offset) => {
        if (!offset) return
        let viewportHeight = 0
        try {
          viewportHeight = wx.getSystemInfoSync().windowHeight || 0
        } catch {
          viewportHeight = 0
        }
        const progress = calcNoteScrollProgress(offset.scrollTop, offset.scrollHeight, viewportHeight)
        if (!isFinal && progress <= this.lastNoteProgress) return
        this.lastNoteProgress = Math.max(this.lastNoteProgress, progress)
        const target = this.resolveTrackingTarget(detail)
        reportTrackingEvent({
          trackingId: target.trackingId,
          materialId: target.materialId,
          actionType: this.lastNoteProgress >= 100 ? 'end' : 'play',
          progress: this.lastNoteProgress,
          duration: this.getNoteViewDurationSec(),
          sessionId: this.trackingSessionId,
        })
      })
      .exec()
  },

  onPdfOpenTap() {
    const detail = this.data.detail
    if (!detail || !isDocumentMaterial(detail)) return
    if (!detail.pdfUrl) {
      wx.showToast({ title: '文件不存在', icon: 'none' })
      return
    }

    const target = this.resolveTrackingTarget(detail)
    const query = [`materialId=${encodeURIComponent(detail.id)}`]
    if (target.trackingId) {
      query.push(`trackingId=${encodeURIComponent(target.trackingId)}`)
    }
    if (this.trackingSessionId) {
      query.push(`sessionId=${encodeURIComponent(this.trackingSessionId)}`)
    }

    wx.navigateTo({ url: `/pages/document-reader/index?${query.join('&')}` })
  },

  onNoteLocationTap(event: WechatMiniprogram.TouchEvent) {
    const { latitude, longitude, name, address } = event.currentTarget.dataset
    const lat = Number(latitude)
    const lng = Number(longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    wx.openLocation({
      latitude: lat,
      longitude: lng,
      name: String(name ?? ''),
      address: String(address ?? ''),
    })
  },

  onNoteVideoTap(event: WechatMiniprogram.TouchEvent) {
    const path = String(event.currentTarget.dataset.path ?? '')
    if (!path) {
      wx.showToast({ title: '视频不存在', icon: 'none' })
      return
    }
    this.setData({
      videoPlayerVisible: true,
      videoPlayerSrc: path,
      videoPlayerPoster: String(event.currentTarget.dataset.cover ?? ''),
    })
  },

  onCloseVideoPlayer() {
    this.setData({
      videoPlayerVisible: false,
      videoPlayerSrc: '',
      videoPlayerPoster: '',
    })
  },

  onNoteFileTap(event: WechatMiniprogram.TouchEvent) {
    const path = String(event.currentTarget.dataset.path ?? '')
    if (!path) {
      wx.showToast({ title: '文件不存在', icon: 'none' })
      return
    }

    const openLocal = (filePath: string) => {
      // 笔记内文件不进文档阅读页，避免单独记 PDF 页进度。
      wx.openDocument({
        filePath,
        showMenu: true,
        fail: () => wx.showToast({ title: '无法打开文件', icon: 'none' }),
      })
    }

    if (!/^https?:\/\//.test(path)) {
      openLocal(path)
      return
    }

    wx.downloadFile({
      url: path,
      success: (result) => {
        if (result.statusCode === 200 && result.tempFilePath) openLocal(result.tempFilePath)
        else wx.showToast({ title: '无法打开文件', icon: 'none' })
      },
      fail: () => wx.showToast({ title: '无法打开文件', icon: 'none' }),
    })
  },

  onImageTap(event: WechatMiniprogram.TouchEvent) {
    const detail = this.data.detail
    if (!detail || detail.fileType !== 'IMAGE' || detail.images.length === 0) return

    const index = Number(event.currentTarget.dataset.index)
    const currentIndex = Number.isNaN(index) ? this.data.activeImageIndex : index

    this.setData({
      imagePreviewVisible: true,
      activeImageIndex: currentIndex,
      previewZoomed: false,
      previewPinching: false,
      previewScale: 1,
    }, () => this.measurePreviewArea())
    this.previewScaleLive = 1
    this.previewViewX = 0
    this.markImageViewed(currentIndex, detail)
  },

  measurePreviewArea() {
    wx.createSelectorQuery()
      .in(this)
      .select('.material-detail-preview__area')
      .boundingClientRect((rect) => {
        if (rect && rect.width > 0) this.previewAreaWidth = rect.width
      })
      .exec()
  },

  onPreviewBlockSwiper() {
    // 放大后拦截触摸冒泡，避免 swiper 把平移当成翻页。
  },

  onPreviewSwiperChange(event: WechatMiniprogram.CustomEvent<{ current: number }>) {
    const nextIndex = event.detail.current
    if (this.previewTurningPage) return
    if (this.data.previewZoomed || this.previewScaleLive > PREVIEW_SCALE_MIN + 0.02) {
      const stayAt = this.data.activeImageIndex
      if (nextIndex === stayAt) return
      this.setData({ activeImageIndex: nextIndex }, () => {
        this.setData({ activeImageIndex: stayAt })
      })
      return
    }

    const activeImageIndex = nextIndex
    this.resetPreviewZoom()
    this.setData({ activeImageIndex })

    const detail = this.data.detail
    if (!detail) return

    this.markImageViewed(activeImageIndex, detail)
  },

  onPreviewViewChange(event: WechatMiniprogram.CustomEvent<{ x: number; y: number; source?: string }>) {
    const { x, source } = event.detail
    this.previewViewX = x
    this.previewLastViewAt = Date.now()
    if (Math.abs(x - this.previewStartViewX) > 6) this.previewMovedView = true
    if (source === 'touch-out-of-bounds') {
      this.previewOutOfBounds = true
      this.tryPreviewEdgePage(this.previewFingerDx)
    } else if (source === 'touch' || source === '') {
      this.previewOutOfBounds = false
    }
  },

  previewWindowWidth() {
    if (this.previewAreaWidth > 0) return this.previewAreaWidth
    try {
      return wx.getSystemInfoSync().windowWidth || 375
    } catch {
      return 375
    }
  },

  previewMaxMoveX() {
    return Math.max(0, (this.previewScaleLive - 1) * this.previewWindowWidth() / 2)
  },

  isPreviewAtHorizontalLimit(direction: 'left' | 'right') {
    const extra = this.previewMaxMoveX()
    if (this.previewOutOfBounds) {
      if (direction === 'left') return this.previewFingerDx < 0 || this.previewViewX <= 0
      return this.previewFingerDx > 0 || this.previewViewX >= 0
    }
    if (extra < 8) return true
    if (direction === 'left') return this.previewViewX <= -extra + 16
    return this.previewViewX >= extra - 16
  },

  turnPreviewPage(delta: number) {
    const detail = this.data.detail
    if (!detail || this.previewTurningPage || this.data.previewPinching) return
    const nextIndex = this.data.activeImageIndex + delta
    if (nextIndex < 0 || nextIndex >= detail.images.length) return

    this.previewTurningPage = true
    this.previewTapMoved = true
    this.suppressPreviewTap()
    this.resetPreviewZoomState()
    this.previewViewX = 0
    this.setData({
      activeImageIndex: nextIndex,
      previewZoomed: false,
      previewPinching: false,
      previewScale: 1.01,
    }, () => {
      this.setData({ previewScale: PREVIEW_SCALE_MIN })
      this.previewTurningPage = false
      this.markImageViewed(nextIndex, detail)
    })
  },

  tryPreviewEdgePage(fingerDx: number) {
    if (this.previewTurningPage || this.data.previewPinching) return
    if (this.previewScaleLive <= PREVIEW_SCALE_MIN + 0.02) return

    const threshold = this.previewOutOfBounds ? 40 : PREVIEW_EDGE_PAGE_PX
    if (Math.abs(fingerDx) < threshold) return

    const viewStalled = this.previewMovedView && Date.now() - this.previewLastViewAt >= PREVIEW_EDGE_IDLE_MS
    const startEdgeHandoff = this.previewStartedAtEdge && !this.previewMovedView
    const goingLeft = fingerDx < 0
    const atLimit = goingLeft
      ? this.isPreviewAtHorizontalLimit('left')
      : this.isPreviewAtHorizontalLimit('right')

    if (!this.previewOutOfBounds && !startEdgeHandoff && !atLimit && !viewStalled) return
    if (goingLeft && !this.previewOutOfBounds && !startEdgeHandoff && !atLimit && this.previewViewX > this.previewStartViewX) {
      return
    }
    if (!goingLeft && !this.previewOutOfBounds && !startEdgeHandoff && !atLimit && this.previewViewX < this.previewStartViewX) {
      return
    }
    if (goingLeft && startEdgeHandoff && this.previewStartViewX > 8) return
    if (!goingLeft && startEdgeHandoff && this.previewStartViewX < -8) return

    this.turnPreviewPage(goingLeft ? 1 : -1)
  },

  suppressPreviewTap() {
    this.previewIgnoreTapUntil = Date.now() + PREVIEW_PINCH_TAP_GUARD_MS
    this.lastPreviewTapAt = 0
    this.clearPreviewTapTimer()
  },

  onPreviewTouchStart(event: WechatMiniprogram.TouchEvent) {
    if (event.touches.length >= 2) {
      this.suppressPreviewTap()
      this.previewTapMoved = true
      if (!this.data.previewPinching) {
        this.setData({
          previewPinching: true,
          previewScale: this.previewScaleLive,
        })
      }
      return
    }

    const touch = event.touches[0]
    if (!touch) return
    this.previewFingerStartX = touch.clientX
    this.previewFingerStartY = touch.clientY
    this.previewFingerStartAt = Date.now()
    this.previewFingerDx = 0
    this.previewStartViewX = this.previewViewX
    this.previewTapMoved = false
    this.previewMovedView = false
    this.previewStartedAtEdge = this.previewOutOfBounds
      || this.isPreviewAtHorizontalLimit('left')
      || this.isPreviewAtHorizontalLimit('right')
    this.previewOutOfBounds = false
    this.previewLastViewAt = Date.now()
  },

  onPreviewTouchMove(event: WechatMiniprogram.TouchEvent) {
    if (this.data.previewPinching || this.previewTurningPage || event.touches.length !== 1) return
    const touch = event.touches[0]
    if (!touch) return
    const dx = touch.clientX - this.previewFingerStartX
    const dy = touch.clientY - this.previewFingerStartY
    this.previewFingerDx = dx
    if (dx * dx + dy * dy > PREVIEW_TAP_SLOP_PX * PREVIEW_TAP_SLOP_PX) this.previewTapMoved = true
    if (Math.abs(this.previewViewX - this.previewStartViewX) > 6) this.previewMovedView = true
    this.tryPreviewEdgePage(dx)
  },

  onPreviewTouchEnd(event: WechatMiniprogram.TouchEvent) {
    if (event.touches.length > 0) return

    if (this.data.previewPinching) {
      this.suppressPreviewTap()
      const previewZoomed = this.previewScaleLive > PREVIEW_SCALE_MIN + 0.02
      this.setData({
        previewPinching: false,
        previewZoomed,
        previewScale: this.previewScaleLive,
      })
      return
    }

    const touch = event.changedTouches[0]
    if (touch) this.tryPreviewEdgePage(touch.clientX - this.previewFingerStartX)

    if (!this.previewTapMoved && Date.now() >= this.previewIgnoreTapUntil) {
      this.onPreviewImageTap()
    }
  },

  onPreviewScale(event: WechatMiniprogram.MovableViewScale) {
    const scale = event.detail.scale
    this.previewScaleLive = scale
    this.previewViewX = event.detail.x
    this.previewLastViewAt = Date.now()
    if (this.data.previewPinching) this.suppressPreviewTap()
  },

  onPreviewImageTap() {
    if (this.data.previewPinching || this.previewTapMoved || Date.now() < this.previewIgnoreTapUntil) {
      this.lastPreviewTapAt = 0
      this.clearPreviewTapTimer()
      return
    }
    const now = Date.now()
    if (now - this.lastPreviewTapAt < PREVIEW_DOUBLE_TAP_MS) {
      this.clearPreviewTapTimer()
      this.lastPreviewTapAt = 0
      this.togglePreviewZoom()
      return
    }

    this.lastPreviewTapAt = now
    this.clearPreviewTapTimer()
    this.previewTapTimer = setTimeout(() => {
      this.previewTapTimer = null
      this.onCloseImagePreview()
    }, PREVIEW_DOUBLE_TAP_MS) as unknown as number
  },

  togglePreviewZoom() {
    const zoomedIn = this.previewScaleLive > PREVIEW_SCALE_MIN + 0.05
    const nextScale = zoomedIn ? PREVIEW_SCALE_MIN : PREVIEW_DOUBLE_TAP_SCALE
    this.previewScaleLive = nextScale
    this.setData({
      previewScale: nextScale,
      previewZoomed: nextScale > PREVIEW_SCALE_MIN + 0.02,
    })
  },

  resetPreviewZoom() {
    this.resetPreviewZoomState()
    this.setData({
      previewZoomed: false,
      previewPinching: false,
      previewScale: 1.01,
    }, () => this.setData({ previewScale: PREVIEW_SCALE_MIN }))
  },

  resetPreviewZoomState() {
    this.previewScaleLive = 1
    this.previewViewX = 0
    this.previewTapMoved = false
    this.previewMovedView = false
    this.previewOutOfBounds = false
    this.previewStartedAtEdge = false
    this.previewFingerDx = 0
    this.lastPreviewTapAt = 0
    this.previewIgnoreTapUntil = 0
    this.clearPreviewTapTimer()
  },

  clearPreviewTapTimer() {
    if (this.previewTapTimer === null) return
    clearTimeout(this.previewTapTimer)
    this.previewTapTimer = null
  },

  onCloseImagePreview() {
    if (!this.data.imagePreviewVisible) return
    this.resetPreviewZoomState()
    this.setData({
      imagePreviewVisible: false,
      previewZoomed: false,
      previewPinching: false,
      previewScale: PREVIEW_SCALE_MIN,
    })
  },

  getVideoContext(): WechatMiniprogram.VideoContext | null {
    if (!this.data.detail || this.data.detail.fileType !== 'VIDEO') return null
    return wx.createVideoContext('materialVideo', this)
  },

  onVideoTouchStart(event: WechatMiniprogram.TouchEvent) {
    const touch = event.touches[0]
    if (!touch) return
    this.videoTouchStartX = touch.clientX
    this.videoTouchStartY = touch.clientY
  },

  onVideoTouchEnd(event: WechatMiniprogram.TouchEvent) {
    const touch = event.changedTouches[0]
    if (!touch) return

    const deltaX = touch.clientX - this.videoTouchStartX
    const deltaY = touch.clientY - this.videoTouchStartY

    if (Math.abs(deltaX) < VIDEO_SWIPE_THRESHOLD_PX) return
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return

    this.seekVideoBySwipe(deltaX > 0 ? VIDEO_SEEK_STEP_SEC : -VIDEO_SEEK_STEP_SEC)
  },

  seekVideoBySwipe(offsetSec: number) {
    const duration = this.videoDurationSec
    if (duration <= 0) return

    const nextTime = Math.max(0, Math.min(duration, this.videoCurrentTimeSec + offsetSec))
    this.getVideoContext()?.seek(nextTime)
    this.videoCurrentTimeSec = nextTime
    this.lastVideoProgress = calcVideoViewProgress(nextTime, duration)
  },

  onVideoPlay() {
    const detail = this.data.detail
    if (!detail || !this.canTrackMaterial(detail)) return

    this.reportVideoProgress(false)
    this.startVideoProgressTimer()
  },

  onVideoPause() {
    this.clearVideoProgressTimer()
    this.reportVideoProgress(true)
  },

  onVideoTimeUpdate(event: WechatMiniprogram.VideoTimeUpdate) {
    const currentTime = event.detail.currentTime
    const duration = event.detail.duration || this.videoDurationSec
    if (duration > 0) {
      this.videoDurationSec = duration
    }
    this.videoCurrentTimeSec = currentTime
    this.lastVideoProgress = calcVideoViewProgress(currentTime, duration || this.videoDurationSec)
  },

  onVideoEnded() {
    const detail = this.data.detail
    if (!detail || !this.canTrackMaterial(detail)) return

    this.clearVideoProgressTimer()
    this.lastVideoProgress = 100
    this.videoCurrentTimeSec = this.videoDurationSec
    const target = this.resolveTrackingTarget(detail)
    reportTrackingEvent({
      trackingId: target.trackingId,
      materialId: target.materialId,
      actionType: 'end',
      progress: 100,
      duration: Math.floor(this.videoDurationSec),
      sessionId: this.trackingSessionId,
    })
  },

  clearVideoProgressTimer() {
    if (this.videoProgressTimer) {
      clearInterval(this.videoProgressTimer)
      this.videoProgressTimer = 0
    }
  },

  startVideoProgressTimer() {
    this.clearVideoProgressTimer()
    this.videoProgressTimer = setInterval(() => {
      this.reportVideoProgress(false)
    }, VIDEO_PROGRESS_INTERVAL_MS) as unknown as number
  },

  reportVideoProgress(_isFinal = false, detail?: MaterialDetailViewModel) {
    const current = detail ?? this.data.detail
    if (!current || current.fileType !== 'VIDEO' || !this.canTrackMaterial(current)) return

    const target = this.resolveTrackingTarget(current)
    reportTrackingEvent({
      trackingId: target.trackingId,
      materialId: target.materialId,
      actionType: this.lastVideoProgress >= 100 ? 'end' : 'play',
      progress: this.lastVideoProgress,
      duration: Math.max(0, Math.floor(this.videoCurrentTimeSec)),
      sessionId: this.trackingSessionId,
    })
  },

  reportDocumentView(detail?: MaterialDetailViewModel) {
    const current = detail ?? this.data.detail
    if (!current || !isDocumentMaterial(current) || !this.canTrackMaterial(current)) return

    const target = this.resolveTrackingTarget(current)
    reportTrackingEvent({
      trackingId: target.trackingId,
      materialId: target.materialId,
      actionType: 'play',
      progress: 0,
      duration: 0,
      sessionId: this.trackingSessionId,
    })
  },

  getImageViewDurationSec(): number {
    if (this.imageViewStartedAt <= 0) return 0
    return Math.max(0, Math.floor((Date.now() - this.imageViewStartedAt) / 1000))
  },

  clearImageViewTimer() {
    if (this.imageViewTimer) {
      clearInterval(this.imageViewTimer)
      this.imageViewTimer = 0
    }
  },

  startSingleImageViewTimer() {
    this.clearImageViewTimer()
    this.imageViewTimer = setInterval(() => {
      this.reportImageViewProgress(false)
    }, IMAGE_VIEW_INTERVAL_MS) as unknown as number
  },

  reportImageViewProgress(isFinal = false) {
    const detail = this.data.detail
    if (!detail || !this.canTrackMaterial(detail) || detail.fileType !== 'IMAGE') return

    const duration = this.getImageViewDurationSec()
    const isSingleImage = detail.images.length <= 1
    const target = this.resolveTrackingTarget(detail)

    if (isSingleImage) {
      if (!isFinal && duration < 1) return
      reportTrackingEvent({
        trackingId: target.trackingId,
        materialId: target.materialId,
        actionType: 'play',
        progress: 100,
        duration,
        sessionId: this.trackingSessionId,
      })
      return
    }

    if (isFinal && this.hasReportedComplete) {
      reportTrackingEvent({
        trackingId: target.trackingId,
        materialId: target.materialId,
        actionType: 'end',
        progress: 100,
        duration,
        sessionId: this.trackingSessionId,
      })
    }
  },

  markImageViewed(index: number, detail?: MaterialDetailViewModel) {
    const current = detail ?? this.data.detail
    if (!current || !this.canTrackMaterial(current)) return
    if (current.fileType !== 'IMAGE' || current.images.length === 0) return

    if (this.imageViewStartedAt <= 0) {
      this.imageViewStartedAt = Date.now()
    }

    const target = this.resolveTrackingTarget(current)
    const isSingleImage = current.images.length <= 1
    if (isSingleImage) {
      const duration = this.getImageViewDurationSec()
      reportTrackingEvent({
        trackingId: target.trackingId,
        materialId: target.materialId,
        actionType: 'play',
        progress: 100,
        duration,
        sessionId: this.trackingSessionId,
      })
      this.startSingleImageViewTimer()
      return
    }

    if (!this.viewedImageIndices.includes(index)) {
      this.viewedImageIndices.push(index)
    }

    const progress = calcImageViewProgress(this.viewedImageIndices.length, current.images.length)
    const isComplete = this.viewedImageIndices.length >= current.images.length

    reportTrackingEvent({
      trackingId: target.trackingId,
      materialId: target.materialId,
      actionType: isComplete ? 'end' : 'play',
      progress,
      duration: this.getImageViewDurationSec(),
      sessionId: this.trackingSessionId,
    })

    if (isComplete) {
      this.hasReportedComplete = true
    }
  },

  reportForwardTracking() {
    const detail = this.data.detail
    if (!detail || !this.canTrackMaterial(detail)) return

    const target = this.resolveTrackingTarget(detail)
    reportTrackingEvent({
      trackingId: target.trackingId,
      materialId: target.materialId,
      actionType: 'forward',
      sessionId: this.trackingSessionId,
    })
  },

  onSwiperChange(event: WechatMiniprogram.CustomEvent<{ current: number }>) {
    const activeImageIndex = event.detail.current
    this.setData({ activeImageIndex })

    const detail = this.data.detail
    if (!detail) return

    this.markImageViewed(activeImageIndex, detail)
  },

  onShareAppMessage() {
    const detail = this.data.detail
    this.reportForwardTracking()
    if (!detail) return

    return {
      title: buildMaterialShareTitle(detail.descriptionLines),
      path: buildMaterialSharePath(detail.id, detail.trackingId || this.pageTrackingId),
      imageUrl: detail.previewUrl || undefined,
    }
  },

  onShareTimeline() {
    const detail = this.data.detail
    this.reportForwardTracking()
    if (!detail) return

    return {
      title: buildMaterialShareTitle(detail.descriptionLines),
      query: buildMaterialShareQuery(detail.id, detail.trackingId || this.pageTrackingId),
      imageUrl: detail.previewUrl || undefined,
    }
  },

  onShareMomentsTap() {
    showMomentsShareGuide()
  },

  onSecondaryEditTap() {
    const detail = this.data.detail
    if (!detail || !detail.isOwner) return
    wx.navigateTo({ url: buildMaterialEditPath(detail.id, detail.fileType === 'NOTE' ? 'note' : '', true) })
  },
})
