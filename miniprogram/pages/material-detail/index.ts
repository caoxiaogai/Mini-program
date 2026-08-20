import { getMaterialDetail } from '../../services/materials'
import type { MaterialDetailViewModel } from '../../types/materials'

Page({
  data: {
    detail: null as MaterialDetailViewModel | null,
    activeImageIndex: 0,
  },
  onLoad(options: Record<string, string | undefined>) {
    const materialId = options.id
    if (!materialId) return

    getMaterialDetail(materialId).then((detail) => {
      if (!detail) return

      this.setData({
        detail,
        activeImageIndex: 0,
      })
    })
  },
  onSwiperChange(event: WechatMiniprogram.CustomEvent<{ current: number }>) {
    this.setData({ activeImageIndex: event.detail.current })
  },
})
