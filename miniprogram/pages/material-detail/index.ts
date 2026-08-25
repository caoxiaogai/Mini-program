import { getMaterialDetail } from '../../services/materials'
import type { MaterialDetailViewModel } from '../../types/materials'

const VIDEO_SEEK_STEP_SEC = 10
const VIDEO_SWIPE_THRESHOLD_PX = 48

function isDocumentMaterial(detail: MaterialDetailViewModel): boolean {
  return detail.fileType === 'PDF' || detail.fileType === 'TABLE'
}

Page({
  data: {
    detail: null as MaterialDetailViewModel | null,
    activeImageIndex: 0,
  },

  videoCurrentTimeSec: 0,
  videoDurationSec: 0,
  videoTouchStartX: 0,
  videoTouchStartY: 0,

  onLoad(options: Record<string, string | undefined>) {
    const materialId = options.id ?? ''
    if (!materialId) return

    this.videoCurrentTimeSec = 0
    this.videoDurationSec = 0
    this.videoTouchStartX = 0
    this.videoTouchStartY = 0

    getMaterialDetail(materialId).then((detail) => {
      if (!detail) return

      this.videoDurationSec = detail.duration
      this.setData({
        detail,
        activeImageIndex: 0,
      })
    })
  },

  onHide() {
    this.getVideoContext()?.pause()
  },

  onUnload() {
    this.getVideoContext()?.pause()
    this.videoCurrentTimeSec = 0
    this.videoDurationSec = 0
  },

  onPdfOpenTap() {
    const detail = this.data.detail
    if (!detail || !isDocumentMaterial(detail)) return
    if (!detail.pdfUrl) {
      wx.showToast({ title: '文件不存在', icon: 'none' })
      return
    }

    wx.navigateTo({
      url: `/pages/document-reader/index?materialId=${encodeURIComponent(detail.id)}`,
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
  },

  onVideoTimeUpdate(event: WechatMiniprogram.VideoTimeUpdate) {
    const currentTime = event.detail.currentTime
    const duration = event.detail.duration || this.videoDurationSec
    if (duration > 0) {
      this.videoDurationSec = duration
    }
    this.videoCurrentTimeSec = currentTime
  },

  onSwiperChange(event: WechatMiniprogram.CustomEvent<{ current: number }>) {
    this.setData({ activeImageIndex: event.detail.current })
  },
})
