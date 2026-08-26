Component({
  properties: {
    notifications: { type: Object, value: null },
    activeFilter: { type: String, value: 'all' },
    visibleGroups: { type: Array, value: [] },
    hasVisibleGroups: { type: Boolean, value: false },
  },
  methods: {
    onNotificationCardTap(event: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('cardtap', {
        userId: event.currentTarget.dataset.id as string,
        lastViewTime: event.currentTarget.dataset.lastViewTime as string | undefined,
      })
    },
  },
})
