import { getMaterialDetail } from '../../services/materials'
import {
  calcImageViewProgress,
  createTrackingSessionId,
  reportTrackingEvent,
} from '../../services/tracking'
import type { MaterialDetailViewModel } from '../../types/materials'

Page({
  data: {
    detail: null as MaterialDetailViewModel | null,
    activeImageIndex: 0,
  },

  trackingSessionId: '',
  viewedImageIndices: [] as number[],
  hasReportedComplete: false,

  onLoad(options: Record<string, string | undefined>) {
    const materialId = options.id
    if (!materialId) return

    this.trackingSessionId = createTrackingSessionId()
    this.viewedImageIndices = []
    this.hasReportedComplete = false

    getMaterialDetail(materialId).then((detail) => {
      if (!detail) return

      this.setData({
        detail,
        activeImageIndex: 0,
      })

      if (detail.fileType === 'IMAGE' && detail.images.length > 0) {
        this.markImageViewed(0, detail)
      }
    })
  },

  onUnload() {
    this.trackingSessionId = ''
    this.viewedImageIndices = []
    this.hasReportedComplete = false
  },

  markImageViewed(index: number, detail: MaterialDetailViewModel = this.data.detail!) {
    if (!detail || detail.fileType !== 'IMAGE' || detail.images.length === 0) return
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
      sessionId: this.trackingSessionId,
    })

    if (isComplete) {
      this.hasReportedComplete = true
    }
  },

  onSwiperChange(event: WechatMiniprogram.CustomEvent<{ current: number }>) {
    const activeImageIndex = event.detail.current
    this.setData({ activeImageIndex })

    const detail = this.data.detail
    if (!detail) return

    this.markImageViewed(activeImageIndex, detail)
  },
})
