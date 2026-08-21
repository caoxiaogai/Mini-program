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
    onShareFriendsTap() {
      this.triggerEvent('sharefriends')
    },
    onShareMomentsTap() {
      this.triggerEvent('sharemoments')
    },
  },
})
