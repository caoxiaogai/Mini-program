Component({
  data: {
    isAndroid: false,
  },
  properties: {
    items: {
      type: Array,
      value: [],
    },
    plusActive: {
      type: Boolean,
      value: false,
    },
  },
  lifetimes: {
    attached() {
      const { platform } = wx.getSystemInfoSync()
      this.setData({ isAndroid: platform === 'android' || platform === 'devtools' })
    },
  },
  methods: {
    onTabTap(event: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('tabtap', { id: event.currentTarget.dataset.id })
    },
    onPlusTap() {
      this.triggerEvent('plus')
    },
  },
})
