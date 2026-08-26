import type { AnalysisChartPoint } from '../../types/analysis'

interface ChartCoordinate {
  x: number
  y: number
}

const CHART_WIDTH = 270
const CHART_HEIGHT = 151
const CHART_WITH_TICKS_HEIGHT = 168
const CHART_TOP = 0.5
const CHART_BOTTOM = 150.5
const CHART_AXIS_MAX = 1500
const DAY_HOUR_DOMAIN = 24
const DAY_HOUR_TICKS = [0, 4, 8, 12, 16, 20, 24] as const
const WEEKDAY_DOMAIN = 6
const WEEKDAY_TICKS = [1, 2, 3, 4, 5, 6, 7] as const
const WEEK_INDEX_DOMAIN = 5
const WEEK_INDEX_TICKS = [1, 2, 3, 4, 5, 6] as const

type ChartAxisScale = 'hour' | 'weekday' | 'month' | 'week' | ''

function parseValue(value: string): number {
  const parsed = Number(value.replace(/,/g, ''))
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function formatCoordinate(value: number): string {
  return String(Math.round(value * 100) / 100)
}

function resolveAxisScale(value: unknown): ChartAxisScale {
  return value === 'hour' || value === 'weekday' || value === 'month' || value === 'week' ? value : ''
}

function usesNamedScale(axisScale: ChartAxisScale): boolean {
  return axisScale === 'hour' || axisScale === 'weekday' || axisScale === 'month' || axisScale === 'week'
}

function indexDomainSize(slotCount: number): number {
  return Math.max(Math.floor(slotCount), 2)
}

function monthTicks(days: number): number[] {
  const ticks: number[] = []
  for (let day = 1; day <= days; day += 5) ticks.push(day)
  return ticks
}

function pointScaleValue(point: AnalysisChartPoint, index: number, axisScale: ChartAxisScale): number {
  const numeric = Number(point.label)
  if (axisScale === 'hour') return Number.isFinite(numeric) ? numeric : index
  if (axisScale === 'weekday' || axisScale === 'month' || axisScale === 'week') {
    return Number.isFinite(numeric) ? numeric : index + 1
  }
  return index
}

function scaledX(value: number, axisScale: ChartAxisScale, slotCount: number): number {
  if (axisScale === 'hour') return clamp((value / DAY_HOUR_DOMAIN) * CHART_WIDTH, 0, CHART_WIDTH)
  if (axisScale === 'weekday') return clamp(((value - 1) / WEEKDAY_DOMAIN) * CHART_WIDTH, 0, CHART_WIDTH)
  if (axisScale === 'week') return clamp(((value - 1) / WEEK_INDEX_DOMAIN) * CHART_WIDTH, 0, CHART_WIDTH)
  if (axisScale === 'month') {
    return clamp(((value - 1) / (indexDomainSize(slotCount) - 1)) * CHART_WIDTH, 0, CHART_WIDTH)
  }
  return 0
}

function buildSmoothPath(points: AnalysisChartPoint[], slotCount: number, axisMax: number, axisScale: ChartAxisScale): string {
  if (!points.length) return ''

  const totalSlots = Math.max(Math.floor(slotCount), 1)
  const safeAxisMax = axisMax > 0 ? axisMax : CHART_AXIS_MAX
  const namedScale = usesNamedScale(axisScale)
  const chartWidth = namedScale
    ? CHART_WIDTH
    : CHART_WIDTH * Math.min(points.length / totalSlots, 1)

  const coordinates: ChartCoordinate[] = points.map((point, index) => {
    const x = namedScale
      ? scaledX(pointScaleValue(point, index, axisScale), axisScale, totalSlots)
      : points.length === 1
        ? chartWidth
        : (index / (points.length - 1)) * chartWidth
    const ratio = clamp(parseValue(point.value) / safeAxisMax, 0, 1)

    return {
      x,
      y: CHART_BOTTOM - ratio * (CHART_BOTTOM - CHART_TOP),
    }
  })

  if (coordinates.length === 1) {
    const y = formatCoordinate(coordinates[0].y)
    return namedScale
      ? `M${formatCoordinate(coordinates[0].x)} ${y}`
      : `M0 ${y} L${CHART_WIDTH} ${y}`
  }

  const commands = [`M${formatCoordinate(coordinates[0].x)} ${formatCoordinate(coordinates[0].y)}`]

  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const current = coordinates[index]
    const next = coordinates[index + 1]
    const previous = coordinates[index - 1] ?? current
    const afterNext = coordinates[index + 2] ?? next
    const controlX1 = current.x + (next.x - previous.x) / 6
    const controlY1 = clamp(current.y + (next.y - previous.y) / 6, CHART_TOP, CHART_BOTTOM)
    const controlX2 = next.x - (afterNext.x - current.x) / 6
    const controlY2 = clamp(next.y - (afterNext.y - current.y) / 6, CHART_TOP, CHART_BOTTOM)

    commands.push(
      `C${formatCoordinate(controlX1)} ${formatCoordinate(controlY1)} ${formatCoordinate(controlX2)} ${formatCoordinate(controlY2)} ${formatCoordinate(next.x)} ${formatCoordinate(next.y)}`,
    )
  }

  return commands.join(' ')
}

function lastDomainValue(axisScale: ChartAxisScale, slotCount: number): number {
  if (axisScale === 'hour') return DAY_HOUR_DOMAIN
  if (axisScale === 'weekday') return WEEKDAY_TICKS[WEEKDAY_TICKS.length - 1]
  if (axisScale === 'week') return WEEK_INDEX_TICKS[WEEK_INDEX_TICKS.length - 1]
  if (axisScale === 'month') return indexDomainSize(slotCount)
  return 0
}

function tickTextAnchor(index: number, tick: number, axisScale: ChartAxisScale, slotCount: number): 'start' | 'middle' | 'end' {
  if (index === 0) return 'start'
  if (tick === lastDomainValue(axisScale, slotCount)) return 'end'
  return 'middle'
}

function buildTickMarkup(axisScale: ChartAxisScale, slotCount: number): string {
  const ticks = axisScale === 'hour'
    ? [...DAY_HOUR_TICKS]
    : axisScale === 'weekday'
      ? [...WEEKDAY_TICKS]
      : axisScale === 'month'
        ? monthTicks(indexDomainSize(slotCount))
        : axisScale === 'week'
          ? [...WEEK_INDEX_TICKS]
          : []

  return ticks.map((tick, index) => {
    const x = formatCoordinate(scaledX(tick, axisScale, slotCount))
    const anchor = tickTextAnchor(index, tick, axisScale, slotCount)
    return `<text x="${x}" y="165" fill="#CCCCCC" font-family="sans-serif" font-size="9" text-anchor="${anchor}">${tick}</text>`
  }).join('')
}

export function buildAnalysisTrendSvgSource(
  points: AnalysisChartPoint[],
  slotCount = points.length,
  axisMax = CHART_AXIS_MAX,
  axisScale: ChartAxisScale = '',
): string {
  const resolvedScale = resolveAxisScale(axisScale)
  const path = buildSmoothPath(points, slotCount, axisMax, resolvedScale)
  const ticks = resolvedScale ? buildTickMarkup(resolvedScale, slotCount) : ''
  if (!path && !ticks) return ''

  const svgHeight = resolvedScale ? CHART_WITH_TICKS_HEIGHT : CHART_HEIGHT
  const pathMarkup = path
    ? `<path d="${path}" fill="none" stroke="#0EC8D9" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>`
    : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CHART_WIDTH}" height="${svgHeight}" viewBox="0 0 ${CHART_WIDTH} ${svgHeight}" preserveAspectRatio="none">${pathMarkup}${ticks}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

Component({
  externalClasses: ['host-class'],
  properties: {
    points: { type: Array, value: [] },
    slotCount: { type: Number, value: 0 },
    axisMax: { type: Number, value: CHART_AXIS_MAX },
    axisScale: { type: String, value: '' },
  },
  data: {
    chartSource: '',
  },
  observers: {
    'points, slotCount, axisMax, axisScale'(points: unknown, slotCount: number, axisMax: number, axisScale: unknown) {
      this.setData({
        chartSource: buildAnalysisTrendSvgSource(
          Array.isArray(points) ? points as AnalysisChartPoint[] : [],
          slotCount,
          axisMax,
          resolveAxisScale(axisScale),
        ),
      })
    },
  },
})
