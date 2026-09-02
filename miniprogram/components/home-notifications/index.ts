import { fromDatasetId } from '../../utils/dataset-id'

Component({
  properties: {
    notifications: { type: Object, value: null },
    activeFilter: { type: String, value: 'all' },
    visibleGroups: { type: Array, value: [] },
    hasVisibleGroups: { type: Boolean, value: false },
  },
  methods: {
    onMembershipLimitUpgrade() {
      this.triggerEvent('upgrade')
    },
    onNotificationCardTap(event: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('cardtap', {
        userId: fromDatasetId(event.currentTarget.dataset.id),
        eventId: event.currentTarget.dataset.eventId as string | undefined,
      })
    },
  },
})
