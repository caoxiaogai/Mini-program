Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
  },
  methods: {
    onBackdropTap() {
      this.triggerEvent('close')
    },
    onCardTap() {},
    onShareMomentsTap() {
      this.triggerEvent('sharemoments')
    },
  },
})
