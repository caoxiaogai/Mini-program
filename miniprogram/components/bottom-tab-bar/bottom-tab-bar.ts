Component({
  properties: {
    items: {
      type: Array,
      value: [],
    },
  },
  methods: {
    onTabTap(event: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('tabtap', { id: event.currentTarget.dataset.id })
    },
  },
})
