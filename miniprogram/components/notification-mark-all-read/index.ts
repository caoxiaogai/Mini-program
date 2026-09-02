Component({
  data: {
    compactExpanded: false,
  },
  properties: {
    unreadCount: {
      type: Number,
      value: 0,
    },
    compact: {
      type: Boolean,
      value: false,
    },
    collapseKey: {
      type: Number,
      value: 0,
      observer() {
        if (this.data.compactExpanded) this.setData({ compactExpanded: false })
      },
    },
  },
  methods: {
    onCompactCloseTap() {
      if (!this.data.compact || this.data.compactExpanded) return
      this.setData({ compactExpanded: true })
    },
    onCompactMarkAllReadTap() {
      if (!this.data.compact || !this.data.compactExpanded) return
      this.setData({ compactExpanded: false })
      this.triggerEvent('markallread')
    },
    onCompactDismissTap() {
      if (!this.data.compact || !this.data.compactExpanded) return
      this.setData({ compactExpanded: false })
    },
    onCompactTouchMove() {
      if (!this.data.compact || !this.data.compactExpanded) return
      this.setData({ compactExpanded: false })
    },
    onMarkAllReadTap() {
      if (this.data.compact) {
        if (this.data.compactExpanded) this.setData({ compactExpanded: false })
        return
      }
      this.triggerEvent('markallread')
    },
  },
})
