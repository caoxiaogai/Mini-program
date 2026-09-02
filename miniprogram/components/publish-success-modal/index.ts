Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    shareReady: {
      type: Boolean,
      value: false,
    },
    shareImageUrl: {
      type: String,
      value: '',
    },
  },
  methods: {
    onBackdropTap() {
      this.triggerEvent('close')
    },
    onCardTap() {},
    onShareFriendsTap() {
      if (this.data.shareReady) return
      wx.showToast({ title: '预览图准备中，请稍后再试', icon: 'none' })
    },
    onShareMomentsTap() {
      this.triggerEvent('sharemoments')
    },
  },
})
