Component({
  properties: {
    profile: {
      type: Object,
      value: null,
    },
  },
  methods: {
    onSettingsTap() {
      this.triggerEvent('settingstap')
    },
  },
})
