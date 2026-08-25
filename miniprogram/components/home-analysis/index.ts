import type { AnalysisAudienceUser, AnalysisIntentLevel, AnalysisReadRange, AnalysisViewModel } from '../../types/analysis'

type AnalysisPeriodId = 'day' | 'week' | 'month' | 'total'
type AnalysisSortId = 'completion' | 'share' | 'view'
type AnalysisIntentFilter = 'all' | AnalysisIntentLevel

Component({
  properties: {
    embedded: { type: Boolean, value: false },
    analysisData: { type: Object, value: null },
    analysisTabs: { type: Array, value: [] },
    activeAnalysisTab: { type: String, value: 'work' },
    analysisTabOffset: { type: Number, value: 0 },
    analysisPeriods: { type: Array, value: [] },
    activePeriod: { type: String, value: 'day' },
    activePeriodOffset: { type: Number, value: 0 },
    activeAnalysisSortLabel: { type: String, value: '阅读量' },
    analysisSortOptions: { type: Array, value: [] },
    analysisSortSheetVisible: { type: Boolean, value: false },
    analysisIntentTabs: { type: Array, value: [] },
    activeAnalysisIntent: { type: String, value: 'all' },
    analysisIntentOffset: { type: Number, value: 0 },
    visibleAnalysisUsers: { type: Array, value: [] },
    hasAnalysisCards: { type: Boolean, value: false },
    hasAnalysisUsers: { type: Boolean, value: false },
    analysisReadRanges: { type: Array, value: [] },
    activeAnalysisReadRange: { type: String, value: 'week' },
    visibleAnalysisReadTrend: { type: Array, value: [] },
  },
  methods: {
    onAnalysisTabTap(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysistabtap', { index: Number(event.currentTarget.dataset.index) }) },
    onAnalysisTouchStart(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysistouchstart', { clientX: event.touches[0]?.clientX ?? 0 }) },
    onAnalysisTouchEnd(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysistouchend', { clientX: event.changedTouches[0]?.clientX ?? 0 }) },
    onPeriodTap(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('periodtap', { id: event.currentTarget.dataset.id as AnalysisPeriodId, index: Number(event.currentTarget.dataset.index) }) },
    onAnalysisIntentTap(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysisintenttap', { index: Number(event.currentTarget.dataset.index) }) },
    onAnalysisIntentTouchStart(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysisintenttouchstart', { clientX: event.touches[0]?.clientX ?? 0 }) },
    onAnalysisIntentTouchEnd(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysisintenttouchend', { clientX: event.changedTouches[0]?.clientX ?? 0 }) },
    onAnalysisRangeTap(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysisrangetap', { id: event.currentTarget.dataset.id as AnalysisReadRange }) },
    onAnalysisSortTap() { this.triggerEvent('analysissorttap') },
    onAnalysisSortOptionTap(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysissortoptiontap', { id: event.currentTarget.dataset.id as AnalysisSortId }) },
    onAnalysisSortMaskTap() { this.triggerEvent('analysissortmasktap') },
    onCardTap(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('cardtap', { id: event.currentTarget.dataset.id as string }) },
    onAnalysisUserTap(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('usertap', { id: event.currentTarget.dataset.id as string }) },
  },
})
