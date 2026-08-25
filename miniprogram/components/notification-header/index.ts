import type { NotificationFilterId } from '../../types/notifications'

Component({
  properties: {
    embedded: { type: Boolean, value: false },
    filters: { type: Array, value: [] },
    activeFilter: { type: String, value: 'all' },
  },
  methods: {
    onFilterTap(event: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('filtertap', { filterId: event.currentTarget.dataset.id as NotificationFilterId })
    },
  },
})
