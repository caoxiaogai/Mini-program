import type { AnalysisChartPoint } from '../../types/analysis'

interface ChartCoordinate {
  x: number
  y: number
}

const CHART_WIDTH = 270
const CHART_HEIGHT = 151
const CHART_TOP = 0.5
const CHART_BOTTOM = 150.5
const CHART_AXIS_MAX = 1500

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

function buildSmoothPath(points: AnalysisChartPoint[], slotCount: number): string {
  if (!points.length) return ''

  const totalSlots = Math.max(Math.floor(slotCount), 1)
  const chartWidth = CHART_WIDTH * Math.min(points.length / totalSlots, 1)

  const coordinates: ChartCoordinate[] = points.map((point, index) => {
    const x = points.length === 1 ? chartWidth : (index / (points.length - 1)) * chartWidth
    const ratio = clamp(parseValue(point.value) / CHART_AXIS_MAX, 0, 1)

    return {
      x,
      y: CHART_BOTTOM - ratio * (CHART_BOTTOM - CHART_TOP),
    }
  })

  if (coordinates.length === 1) {
    const y = formatCoordinate(coordinates[0].y)
    return `M0 ${y} L${CHART_WIDTH} ${y}`
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

export function buildAnalysisTrendSvgSource(points: AnalysisChartPoint[], slotCount = points.length): string {
  const path = buildSmoothPath(points, slotCount)
  if (!path) return ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CHART_WIDTH}" height="${CHART_HEIGHT}" viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" preserveAspectRatio="none"><path d="${path}" fill="none" stroke="#0EC8D9" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

Component({
  externalClasses: ['host-class'],
  properties: {
    points: { type: Array, value: [] },
    slotCount: { type: Number, value: 0 },
  },
  data: {
    chartSource: '',
  },
  observers: {
    'points, slotCount'(points: unknown, slotCount: number) {
      this.setData({
        chartSource: buildAnalysisTrendSvgSource(Array.isArray(points) ? points as AnalysisChartPoint[] : [], slotCount),
      })
    },
  },
})
