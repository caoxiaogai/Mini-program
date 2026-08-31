import { getMaterialDetail } from '../../services/materials'
import { runAuthed } from '../../services/auth'
import {
  calcImageViewProgress,
  calcVideoViewProgress,
  createTrackingSessionId,
  reportTrackingEvent,
} from '../../services/tracking'
import type { MaterialDetailViewModel } from '../../types/materials'
import { buildReturnPath } from '../../utils/auth'
import { runPagePullRefresh } from '../../utils/pull-refresh'
import {
  buildMaterialPublishPath,
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
  lastPreviewTapAt: 0,
  previewTapTimer: null as number | null,

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
    this.videoCurrentTimeSec = 0
    this.videoDurationSec = 0
    this.videoTouchStartX = 0
    this.videoTouchStartY = 0
    this.resetPreviewZoomState()

    if (!this.materialId) return

    this.reportOpenedPlay()
    this.loadDetail()
  },
  onPullDownRefresh() {
    runPagePullRefresh(this.loadDetail())
  },
  loadDetail() {
    if (!this.materialId) return Promise.resolve()

    return getMaterialDetail(this.materialId).then((detail) => {
      if (!detail) return

      this.videoDurationSec = detail.duration
      this.setData({
        detail,
      })

      if (detail.fileType === 'IMAGE' && detail.images.length > 0) {
        this.markImageViewed(0, detail)
      } else if (detail.fileType === 'VIDEO') {
        this.reportVideoProgress(false, detail)
      } else if (isDocumentMaterial(detail)) {
        this.reportDocumentView(detail)
      }
    })
  },

  onShow() {
    enableMaterialShareMenu()
  },

  onHide() {
    this.clearImageViewTimer()
    this.clearVideoProgressTimer()
    this.reportImageViewProgress(true)
    this.reportVideoProgress(true)
    this.reportDocumentView()
    this.getVideoContext()?.pause()
  },

  onUnload() {
    this.clearImageViewTimer()
    this.clearVideoProgressTimer()
    this.reportImageViewProgress(true)
    this.reportVideoProgress(true)
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
    this.pageTrackingId = ''
    this.materialId = ''
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
    })
    this.previewScaleLive = 1
    this.markImageViewed(currentIndex, detail)
  },

  onPreviewSwiperChange(event: WechatMiniprogram.CustomEvent<{ current: number }>) {
    const activeImageIndex = event.detail.current
    this.resetPreviewZoom()
    this.setData({ activeImageIndex })

    const detail = this.data.detail
    if (!detail) return

    this.markImageViewed(activeImageIndex, detail)
  },

  onPreviewTouchStart(event: WechatMiniprogram.TouchEvent) {
    if (event.touches.length < 2) return

    const patch: { previewPinching?: boolean; previewZoomed?: boolean } = {}
    if (!this.data.previewPinching) patch.previewPinching = true
    if (!this.data.previewZoomed) patch.previewZoomed = true
    if (patch.previewPinching || patch.previewZoomed) this.setData(patch)
  },

  onPreviewTouchEnd(event: WechatMiniprogram.TouchEvent) {
    if (event.touches.length > 0 || !this.data.previewPinching) return
    this.setData({ previewPinching: false })
  },

  onPreviewScale(event: WechatMiniprogram.MovableViewScale) {
    const scale = event.detail.scale
    this.previewScaleLive = scale
    const previewZoomed = scale > PREVIEW_SCALE_MIN + 0.02
    if (previewZoomed !== this.data.previewZoomed) {
      this.setData({ previewZoomed })
    }
  },

  onPreviewImageTap() {
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
    this.lastPreviewTapAt = 0
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
    wx.navigateTo({ url: buildMaterialPublishPath(detail.id, true) })
  },
})
