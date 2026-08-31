import type { AnalysisAudienceUser, AnalysisViewModel } from '../../types/analysis'
import { fromDatasetId } from '../../utils/dataset-id'

type AnalysisPeriodId = 'day' | 'week' | 'month' | 'total' | 'custom'
type AnalysisSortId = 'completion' | 'share' | 'view'
Component({
  properties: {
    embedded: { type: Boolean, value: false },
    analysisData: { type: Object, value: null },
    analysisTabs: { type: Array, value: [] },
    activeAnalysisTab: { type: String, value: 'work' },
    analysisTabOffset: { type: Number, value: 0 },
    analysisPeriods: { type: Array, value: [] },
    activePeriod: { type: String, value: 'day' },
    activeAnalysisSortLabel: { type: String, value: '浏览次数' },
    analysisSortOptions: { type: Array, value: [] },
    analysisSortSheetVisible: { type: Boolean, value: false },
    visibleAnalysisUsers: { type: Array, value: [] },
    workSummary: { type: Array, value: [] },
    workCount: { type: String, value: '0' },
    visibleAnalysisCards: { type: Array, value: [] },
    hasAnalysisCards: { type: Boolean, value: false },
    hasAnalysisUsers: { type: Boolean, value: false },
    totalAnalysisPeriods: { type: Array, value: [] },
    activeOverviewPeriod: { type: String, value: 'day' },
    activePeakPeriod: { type: String, value: 'day' },
    activeAnalysisReadRange: { type: String, value: 'total' },
    visibleAnalysisReadTrend: { type: Array, value: [] },
    analysisTrendSlotCount: { type: Number, value: 0 },
    chartAxisTicks: { type: Array, value: [] },
    chartAxisMax: { type: Number, value: 1500 },
    chartAxisScale: { type: String, value: '' },
  },
  methods: {
    onAnalysisTabTap(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysistabtap', { index: Number(event.currentTarget.dataset.index) }) },
    onAnalysisTouchStart(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysistouchstart', { clientX: event.touches[0]?.clientX ?? 0 }) },
    onAnalysisTouchEnd(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysistouchend', { clientX: event.changedTouches[0]?.clientX ?? 0 }) },
    onPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) { this.triggerEvent('periodtap', event.detail) },
    onTotalOverviewPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) { this.triggerEvent('overviewperiodtap', event.detail) },
    onTotalPeakPeriodTap(event: WechatMiniprogram.CustomEvent<{ id: AnalysisPeriodId; index: number }>) { this.triggerEvent('peakperiodtap', event.detail) },
    onAnalysisSortTap() { this.triggerEvent('analysissorttap') },
    onAnalysisSortOptionTap(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('analysissortoptiontap', { id: event.currentTarget.dataset.id as AnalysisSortId }) },
    onAnalysisSortMaskTap() { this.triggerEvent('analysissortmasktap') },
    onCardTap(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('cardtap', { id: fromDatasetId(event.currentTarget.dataset.id) }) },
    onAnalysisUserTap(event: WechatMiniprogram.TouchEvent) { this.triggerEvent('usertap', { id: fromDatasetId(event.currentTarget.dataset.id) }) },
  },
})
