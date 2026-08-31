type IntentUserPeriod = 'day' | 'week' | 'month' | 'custom'

Component({
  properties: {
    userCount: { type: String, value: '0' },
    periods: { type: Array, value: [] },
    activePeriod: { type: String, value: 'day' },
    sortLabel: { type: String, value: '阅读量' },
    users: { type: Array, value: [] },
  },
  data: {
    periodSelectionOffset: 0,
  },
  observers: {
    'periods, activePeriod'(periods: unknown, activePeriod: string) {
      const options = Array.isArray(periods) ? periods as Array<{ id?: string }> : []
      const activeIndex = Math.max(0, options.findIndex((item) => item.id === activePeriod))
      this.setData({ periodSelectionOffset: activeIndex * 34 })
    },
  },
  methods: {
    onPeriodTap(event: WechatMiniprogram.TouchEvent) {
      const id = event.currentTarget.dataset.id as IntentUserPeriod
      const index = Number(event.currentTarget.dataset.index)
      if (!Number.isInteger(index)) return
      this.triggerEvent('periodtap', { id, index })
    },
    onSortTap() {
      this.triggerEvent('sorttap')
    },
    onUserTap(event: WechatMiniprogram.TouchEvent) {
      const userId = String(event.currentTarget.dataset.userId ?? '')
      if (userId) this.triggerEvent('usertap', { id: userId })
    },
  },
})
