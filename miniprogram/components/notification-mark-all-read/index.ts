Component({
  properties: {
    unreadCount: {
      type: Number,
      value: 0,
    },
    compact: {
      type: Boolean,
      value: false,
    },
  },
  methods: {
    onMarkAllReadTap() {
      this.triggerEvent('markallread')
    },
  },
})
