Component({
  data: {
    isAndroid: false,
    activeIndicatorIndex: 0,
    activeIndicatorOffset: '0%',
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
  observers: {
    'items, plusActive': function (items: Array<{ active?: boolean }>, plusActive: boolean) {
      const itemIndex = items.findIndex((item) => item.active)
      const visualIndex = plusActive ? 2 : itemIndex < 0 ? 0 : itemIndex >= 2 ? itemIndex + 1 : itemIndex

      if (visualIndex === this.data.activeIndicatorIndex) return
      this.setData({ activeIndicatorIndex: visualIndex, activeIndicatorOffset: `${visualIndex * 100}%` })
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
      wx.vibrateShort({ type: 'light' })
      this.triggerEvent('tabtap', { id: event.currentTarget.dataset.id })
    },
    onPlusTap() {
      wx.vibrateShort({ type: 'light' })
      this.triggerEvent('plus')
    },
  },
})
