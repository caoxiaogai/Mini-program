import type { AnalysisChartPoint, AnalysisReadRange } from '../types/analysis'

export const DEFAULT_CHART_AXIS_MAX = 1500
const CHART_AXIS_POSITIONS = ['top', 'upper', 'lower', 'bottom'] as const
const EMPTY_AXIS_MAX = 3

export type AnalysisTrendPeriod = 'day' | 'week' | 'month' | 'total' | 'custom'
export type ChartAxisPosition = typeof CHART_AXIS_POSITIONS[number]

export interface ChartAxisTick {
  id: ChartAxisPosition
  value: string
  position: ChartAxisPosition
}

export type ChartAxisScale = 'hour' | 'weekday' | 'month' | 'week' | ''

export interface TotalTrendState {
  activeAnalysisReadRange: AnalysisReadRange
  visibleAnalysisReadTrend: AnalysisChartPoint[]
  analysisTrendSlotCount: number
  chartAxisMax: number
  chartAxisTicks: ChartAxisTick[]
  chartAxisScale: ChartAxisScale
}

export function parseChartValue(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.max(value, 0) : 0
  if (typeof value !== 'string') return 0

  const parsed = Number(value.replace(/,/g, ''))
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0
}

function niceTick(raw: number): number {
  if (raw <= 1) return 1

  const exp = Math.floor(Math.log10(raw))
  const mag = 10 ** exp
  const n = raw / mag
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 3 ? 3 : n <= 5 ? 5 : 10
  return nice * mag
}

export function buildChartAxisMax(values: number[]): number {
  const peak = values.reduce((max, value) => Math.max(max, value), 0)
  if (peak <= 0) return EMPTY_AXIS_MAX
  return niceTick(peak / 3) * 3
}

export function buildChartAxisTicks(axisMax: number): ChartAxisTick[] {
  const max = axisMax > 0 ? axisMax : EMPTY_AXIS_MAX
  const values = [max, (max * 2) / 3, max / 3, 0]

  return values.map((value, index) => ({
    id: CHART_AXIS_POSITIONS[index],
    value: String(Math.round(value)),
    position: CHART_AXIS_POSITIONS[index],
  }))
}

export function getAnalysisReadRange(period: AnalysisTrendPeriod): AnalysisReadRange {
  if (period === 'day') return 'day'
  if (period === 'month') return 'month'
  if (period === 'total') return 'total'
  return 'week'
}

export function getTotalComparisonLabel(period: AnalysisTrendPeriod): string {
  if (period === 'day') return '较昨日'
  if (period === 'week') return '较上周'
  if (period === 'month') return '较上月'
  return '较上两月'
}

export function getDaysInMonth(now = new Date()): number {
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

const TOTAL_TREND_WEEKS = 6

export function getAnalysisTrendSlotCount(period: AnalysisTrendPeriod): number {
  if (period === 'day') return 24
  if (period === 'week') return 7
  if (period === 'month') return getDaysInMonth()
  if (period === 'total') return TOTAL_TREND_WEEKS
  return 0
}

export function getChartAxisScale(period: AnalysisTrendPeriod): ChartAxisScale {
  if (period === 'day') return 'hour'
  if (period === 'week') return 'weekday'
  if (period === 'month') return 'month'
  if (period === 'total') return 'week'
  return ''
}

export function buildTotalTrendState(
  period: AnalysisTrendPeriod,
  points: AnalysisChartPoint[] = [],
): TotalTrendState {
  const axisScale = getChartAxisScale(period)
  const axisMax = axisScale
    ? buildChartAxisMax(points.map((point) => parseChartValue(point.value)))
    : DEFAULT_CHART_AXIS_MAX

  return {
    activeAnalysisReadRange: getAnalysisReadRange(period),
    visibleAnalysisReadTrend: points,
    analysisTrendSlotCount: getAnalysisTrendSlotCount(period),
    chartAxisMax: axisMax,
    chartAxisTicks: buildChartAxisTicks(axisMax),
    chartAxisScale: axisScale,
  }
}
