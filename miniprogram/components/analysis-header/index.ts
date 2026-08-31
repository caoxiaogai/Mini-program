Component({
  properties: {
    title: { type: String, value: '分析' },
    titleWeight: { type: Number, value: 700 },
    embedded: { type: Boolean, value: false },
    back: { type: Boolean, value: false },
    analysisTabs: { type: Array, value: [] },
    activeAnalysisTab: { type: String, value: 'work' },
    analysisTabOffset: { type: Number, value: 0 },
  },
  methods: {
    onAnalysisTabTap(event: WechatMiniprogram.CustomEvent<{ index: number }>) { this.triggerEvent('analysistabtap', { index: Number(event.detail.index) }) },
    onAnalysisTouchStart(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysistouchstart', { clientX: event.touches[0]?.clientX ?? 0 }) },
    onAnalysisTouchEnd(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysistouchend', { clientX: event.changedTouches[0]?.clientX ?? 0 }) },
  },
})
