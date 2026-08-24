import { isCurrentUser, isVisitorAuthReady, refreshAuthGate } from '../../services/auth'
import { getMaterialDetail } from '../../services/materials'
import {
  calcImageViewProgress,
  createTrackingSessionId,
  reportTrackingEvent,
} from '../../services/tracking'
import type { MaterialDetailViewModel } from '../../types/materials'

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

Page({
  data: {
    detail: null as MaterialDetailViewModel | null,
    activeImageIndex: 0,
    isSharedVisit: false,
    authBlocked: false,
    isOwnerView: false,
  },

  trackingSessionId: '',
  viewedImageIndices: [] as number[],
  hasReportedComplete: false,
  imageViewStartedAt: 0,
  imageViewTimer: 0,
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
    this.reportImageViewProgress(true)
  },

  onUnload() {
    this.clearImageViewTimer()
    this.reportImageViewProgress(true)
    this.trackingSessionId = ''
    this.viewedImageIndices = []
    this.hasReportedComplete = false
    this.imageViewStartedAt = 0
    this.materialId = ''
    this.materialLoaded = false
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
      imageUrl: detail.images[0] ?? '',
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
      imageUrl: detail.images[this.data.activeImageIndex] ?? detail.images[0] ?? '',
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
