Component({
  properties: {
    actionLabel: {
      type: String,
      value: '立即开通',
    },
  },
  methods: {
    onUpgradeTap() {
      this.triggerEvent('upgrade')
    },
  },
})
