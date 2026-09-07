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
  },
  methods: {
    onUpgradeTap() {
      this.triggerEvent('upgrade')
    },
  },
})
