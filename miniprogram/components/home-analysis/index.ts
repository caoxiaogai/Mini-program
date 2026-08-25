import type { AnalysisIntentLevel, AnalysisWorkSortId } from '../../types/analysis'

type AnalysisPeriodId = 'day' | 'week' | 'month' | 'total'
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
    activeAnalysisSortLabel: { type: String, value: '浏览量' },
    analysisSortOptions: { type: Array, value: [] },
    analysisSortSheetVisible: { type: Boolean, value: false },
    visibleAnalysisCards: { type: Array, value: [] },
    analysisIntentTabs: { type: Array, value: [] },
    activeAnalysisIntent: { type: String, value: 'all' },
    visibleAnalysisUsers: { type: Array, value: [] },
    hasAnalysisCards: { type: Boolean, value: false },
    hasAnalysisUsers: { type: Boolean, value: false },
    totalAnalysisPeriods: { type: Array, value: [] },
    activeTotalPeriod: { type: String, value: 'total' },
    activeAnalysisReadRange: { type: String, value: 'week' },
    visibleAnalysisReadTrend: { type: Array, value: [] },
  },
  methods: {
    onAnalysisTabTap(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysistabtap', { index: Number(event.currentTarget.dataset.index) }) },
    onAnalysisTouchStart(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysistouchstart', { clientX: event.touches[0]?.clientX ?? 0 }) },
    onAnalysisTouchEnd(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysistouchend', { clientX: event.changedTouches[0]?.clientX ?? 0 }) },
    onPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) { this.triggerEvent('periodtap', event.detail) },
    onAnalysisIntentTap(event: WechatMiniprogram.CustomEvent<{ index: number }>) { this.triggerEvent('analysisintenttap', event.detail) },
    onAnalysisIntentTouchStart(event: WechatMiniprogram.CustomEvent<{ clientX: number }>) { this.triggerEvent('analysisintenttouchstart', event.detail) },
    onAnalysisIntentTouchEnd(event: WechatMiniprogram.CustomEvent<{ clientX: number }>) { this.triggerEvent('analysisintenttouchend', event.detail) },
    onTotalPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) { this.triggerEvent('totalperiodtap', event.detail) },
    onAnalysisSortTap() { this.triggerEvent('analysissorttap') },
    onAnalysisSortOptionTap(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysissortoptiontap', { id: event.currentTarget.dataset.id as AnalysisWorkSortId }) },
    onAnalysisSortMaskTap() { this.triggerEvent('analysissortmasktap') },
    onCardTap(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('cardtap', { id: event.currentTarget.dataset.id as string }) },
    onAnalysisUserTap(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('usertap', { id: event.currentTarget.dataset.id as string }) },
  },
})
