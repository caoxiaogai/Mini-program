Component({
  properties: {
    variant: {
      type: String,
      value: 'membership',
    },
    actionLabel: {
      type: String,
      value: '立即开通',
    },
    visitorCount: {
      type: Number,
      value: 5,
    },
    visitorAvatars: {
      type: Array,
      value: [],
    },
    visitorDescription: {
      type: String,
      value: '升级会员，查看详情',
    },
  },
  methods: {
    onUpgradeTap() {
      this.triggerEvent('upgrade')
    },
  },
})
