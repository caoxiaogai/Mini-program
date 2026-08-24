import { isCurrentUser, isVisitorAuthReady, refreshAuthGate } from '../../services/auth'
import { getMaterialDetail } from '../../services/materials'
import {
  calcImageViewProgress,
  calcVideoViewProgress,
  createTrackingSessionId,
  reportTrackingEvent,
} from '../../services/tracking'
import type { MaterialDetailViewModel } from '../../types/materials'
import { openRemoteDocument } from '../../utils/document'

const VIDEO_PROGRESS_INTERVAL_MS = 5000
const VIDEO_SEEK_STEP_SEC = 10
const VIDEO_SWIPE_THRESHOLD_PX = 48

function isDocumentMaterial(detail: MaterialDetailViewModel): boolean {
  return detail.fileType === 'PDF' || detail.fileType === 'TABLE'
}

function buildShareTitle(detail: MaterialDetailViewModel): string {
  const firstLine = detail.descriptionLines.find((line) => line.trim() !== '')
  return firstLine ?? '精彩内容'
}

function buildSharePath(detail: MaterialDetailViewModel): string {
  const query = detail.trackingId
    ? `id=${detail.id}&trackingId=${encodeURIComponent(detail.trackingId)}`
    : `id=${detail.id}`
  return `/pages/material-detail/index?${query}`
}

function resolveShareImage(detail: MaterialDetailViewModel): string {
  if (detail.previewUrl) return detail.previewUrl
  return detail.images[0] ?? ''
}

Page({
  data: {
    detail: null as MaterialDetailViewModel | null,
    activeImageIndex: 0,
    isSharedVisit: false,
    authBlocked: false,
    isOwnerView: false,
    pdfOpening: false,
  },

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
  pdfViewStartedAt: 0,
  hasReportedPdfComplete: false,
  materialId: '',
  materialLoaded: false,

  onLoad(options: Record<string, string | undefined>) {
    const materialId = options.id ?? ''
    const trackingId = options.trackingId ?? ''
    const isSharedVisit = trackingId !== ''

    this.materialId = materialId
    this.trackingSessionId = createTrackingSessionId()
    this.viewedImageIndices = []
    this.hasReportedComplete = false
    this.imageViewStartedAt = 0
    this.lastVideoProgress = 0
    this.videoCurrentTimeSec = 0
    this.videoDurationSec = 0
    this.videoTouchStartX = 0
    this.videoTouchStartY = 0
    this.pdfViewStartedAt = 0
    this.hasReportedPdfComplete = false
    this.materialLoaded = false

    if (!materialId) return

    this.setData({ isSharedVisit })

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    })

    if (isSharedVisit && !isVisitorAuthReady()) {
      refreshAuthGate()
      this.setData({ authBlocked: true })
      return
    }

    this.loadMaterialDetail()
  },

  onShow() {
    if (!this.data.isSharedVisit) return

    if (!isVisitorAuthReady()) {
      refreshAuthGate()
      this.setData({ authBlocked: true })
      return
    }

    if (this.data.authBlocked) {
      this.setData({ authBlocked: false })
    }

    this.loadMaterialDetail()
  },

  onAuthReady() {
    this.setData({ authBlocked: false })
    this.loadMaterialDetail()
  },

  loadMaterialDetail() {
    if (this.materialLoaded || !this.materialId) return
    if (this.data.isSharedVisit && !isVisitorAuthReady()) return

    this.materialLoaded = true

    getMaterialDetail(this.materialId).then((detail) => {
      if (!detail) return

      const isOwnerView = isCurrentUser(detail.ownerUserId)
      this.videoDurationSec = detail.duration

      this.setData({
        detail,
        activeImageIndex: 0,
        isOwnerView,
      })

      if (isOwnerView) return

      if (detail.fileType === 'IMAGE' && detail.images.length > 0) {
        this.markImageViewed(0, detail)
      }
    })
  },

  onHide() {
    this.clearImageViewTimer()
    this.clearVideoProgressTimer()
    this.reportImageViewProgress(true)
    this.reportVideoProgress(true)
    this.reportPdfViewProgress(true)
    this.getVideoContext()?.pause()
  },

  onUnload() {
    this.clearImageViewTimer()
    this.clearVideoProgressTimer()
    this.reportImageViewProgress(true)
    this.reportVideoProgress(true)
    this.reportPdfViewProgress(true)
    this.getVideoContext()?.pause()
    this.trackingSessionId = ''
    this.viewedImageIndices = []
    this.hasReportedComplete = false
    this.imageViewStartedAt = 0
    this.lastVideoProgress = 0
    this.videoCurrentTimeSec = 0
    this.videoDurationSec = 0
    this.pdfViewStartedAt = 0
    this.hasReportedPdfComplete = false
    this.materialId = ''
    this.materialLoaded = false
  },

  onPdfOpenTap() {
    const detail = this.data.detail
    if (!detail || !isDocumentMaterial(detail) || this.data.pdfOpening) return
    if (!detail.pdfUrl) {
      wx.showToast({ title: 'PDF 文件不存在', icon: 'none' })
      return
    }

    if (this.pdfViewStartedAt <= 0) {
      this.pdfViewStartedAt = Date.now()
    }

    this.reportPdfViewProgress(false)
    this.setData({ pdfOpening: true })

    openRemoteDocument(detail.pdfUrl, detail.fileType)
      .then(() => {
        this.hasReportedPdfComplete = true
        this.reportPdfViewProgress(true)
      })
      .catch(() => {
        wx.showToast({ title: '无法打开 PDF', icon: 'none' })
      })
      .finally(() => {
        this.setData({ pdfOpening: false })
      })
  },

  getPdfViewDurationSec(): number {
    if (this.pdfViewStartedAt <= 0) return 0
    return Math.max(0, Math.floor((Date.now() - this.pdfViewStartedAt) / 1000))
  },

  reportPdfViewProgress(isFinal = false) {
    const detail = this.data.detail
    if (!detail || !isDocumentMaterial(detail) || this.data.authBlocked || this.data.isOwnerView) return

    const duration = this.getPdfViewDurationSec()
    const progress = this.hasReportedPdfComplete ? 100 : 0

    if (!isFinal && progress < 100 && duration < 1) return

    reportTrackingEvent({
      trackingId: detail.trackingId,
      materialId: detail.id,
      actionType: progress >= 100 ? 'end' : 'play',
      progress,
      duration,
      sessionId: this.trackingSessionId,
    })
  },

  onImageTap(event: WechatMiniprogram.TouchEvent) {
    const detail = this.data.detail
    if (!detail || detail.fileType !== 'IMAGE' || detail.images.length === 0) return

    const index = Number(event.currentTarget.dataset.index)
    const currentIndex = Number.isNaN(index) ? this.data.activeImageIndex : index
    const currentUrl = detail.images[currentIndex] ?? detail.images[0]

    wx.previewImage({
      urls: detail.images,
      current: currentUrl,
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
    if (!detail || this.data.authBlocked || this.data.isOwnerView) return

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
    if (!detail || this.data.authBlocked || this.data.isOwnerView) return

    this.clearVideoProgressTimer()
    this.lastVideoProgress = 100
    this.videoCurrentTimeSec = this.videoDurationSec
    reportTrackingEvent({
      trackingId: detail.trackingId,
      materialId: detail.id,
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

  reportVideoProgress(isFinal = false) {
    const detail = this.data.detail
    if (!detail || detail.fileType !== 'VIDEO' || this.data.authBlocked || this.data.isOwnerView) return
    if (!isFinal && this.lastVideoProgress < 1) return

    reportTrackingEvent({
      trackingId: detail.trackingId,
      materialId: detail.id,
      actionType: this.lastVideoProgress >= 100 ? 'end' : 'play',
      progress: this.lastVideoProgress,
      duration: Math.max(0, Math.floor(this.videoCurrentTimeSec)),
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
    }, 5000) as unknown as number
  },

  reportImageViewProgress(isFinal = false) {
    const detail = this.data.detail
    if (!detail || this.data.authBlocked || this.data.isOwnerView) return
    if (detail.fileType !== 'IMAGE') return

    const duration = this.getImageViewDurationSec()
    const isSingleImage = detail.images.length <= 1
    if (isSingleImage) {
      if (!isFinal && duration < 1) return
      reportTrackingEvent({
        trackingId: detail.trackingId,
        materialId: detail.id,
        actionType: 'play',
        progress: 100,
        duration,
        sessionId: this.trackingSessionId,
      })
      return
    }

    if (isFinal && this.hasReportedComplete) {
      reportTrackingEvent({
        trackingId: detail.trackingId,
        materialId: detail.id,
        actionType: 'end',
        progress: 100,
        duration,
        sessionId: this.trackingSessionId,
      })
    }
  },

  markImageViewed(index: number, detail: MaterialDetailViewModel = this.data.detail!) {
    if (!detail || this.data.authBlocked || this.data.isOwnerView) return
    if (detail.fileType !== 'IMAGE' || detail.images.length === 0) return

    if (this.imageViewStartedAt <= 0) {
      this.imageViewStartedAt = Date.now()
    }

    const isSingleImage = detail.images.length <= 1
    if (isSingleImage) {
      const duration = this.getImageViewDurationSec()
      reportTrackingEvent({
        trackingId: detail.trackingId,
        materialId: detail.id,
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

    const progress = calcImageViewProgress(this.viewedImageIndices.length, detail.images.length)
    const isComplete = this.viewedImageIndices.length >= detail.images.length

    reportTrackingEvent({
      trackingId: detail.trackingId,
      materialId: detail.id,
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
    if (!detail || this.data.authBlocked || this.data.isOwnerView) return

    reportTrackingEvent({
      trackingId: detail.trackingId,
      materialId: detail.id,
      actionType: 'forward',
      sessionId: this.trackingSessionId,
    })
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const detail = this.data.detail
    this.reportForwardTracking()

    if (!detail) {
      return {
        title: '精彩内容',
        path: '/pages/index/index',
      }
    }

    return {
      title: buildShareTitle(detail),
      path: buildSharePath(detail),
      imageUrl: resolveShareImage(detail),
    }
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const detail = this.data.detail
    if (!detail) {
      return { title: '精彩内容' }
    }

    const query = detail.trackingId
      ? `id=${detail.id}&trackingId=${encodeURIComponent(detail.trackingId)}`
      : `id=${detail.id}`

    return {
      title: buildShareTitle(detail),
      query,
      imageUrl: resolveShareImage(detail),
    }
  },

  onShareMomentsTap() {
    const detail = this.data.detail
    if (!detail) return

    this.reportForwardTracking()

    wx.showModal({
      title: '分享到朋友圈',
      content: '请点击右上角「...」，选择「分享到朋友圈」',
      showCancel: false,
    })
  },

  onSwiperChange(event: WechatMiniprogram.CustomEvent<{ current: number }>) {
    const activeImageIndex = event.detail.current
    this.setData({ activeImageIndex })

    const detail = this.data.detail
    if (!detail) return

    this.markImageViewed(activeImageIndex, detail)
  },
})
