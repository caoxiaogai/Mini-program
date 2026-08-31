import type { NotificationFilterId } from '../../types/notifications'

Component({
  properties: {
    embedded: { type: Boolean, value: false },
    filters: { type: Array, value: [] },
    activeFilter: { type: String, value: 'all' },
  },
  methods: {
    onFilterChange(event: WechatMiniprogram.CustomEvent<{ id?: string }>) {
      const filterId = event.detail?.id as NotificationFilterId | undefined
      if (!filterId || !['all', 'high', 'medium', 'low'].includes(filterId)) return

      wx.vibrateShort({ type: 'light' })
      this.triggerEvent('filtertap', { filterId })
    },
  },
})
