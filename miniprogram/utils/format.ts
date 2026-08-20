// 无业务状态的数据格式化工具：数字千分位、后端日期时间解析与展示格式。

const pad2 = (value: number): string => String(value).padStart(2, '0')

/** 数字转千分位字符串，空值按 0 处理，例如 124234 -> '124,234' */
export function formatCount(value: number | null | undefined): string {
  const count = value ?? 0
  return String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** 秒数转展示时长，例如 56 -> '56s' */
export function formatSeconds(value: number | null | undefined): string {
  return `${value ?? 0}s`
}

/** 解析后端 'yyyy-MM-dd HH:mm:ss' 字符串；无法解析时返回 null */
export function parseDateTime(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

/** Date 转后端要求的 'yyyy-MM-dd HH:mm:ss' */
export function formatDateTime(date: Date): string {
  const datePart = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
  const timePart = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
  return `${datePart} ${timePart}`
}

/** 后端日期时间取日期部分，例如 '2026-08-20 10:00:00' -> '2026-08-20' */
export function formatDateKey(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : ''
}

/** 后端日期时间转 'M月D日'，例如 '2026-08-20 10:00:00' -> '8月20日' */
export function formatMonthDay(value: string | null | undefined): string {
  const date = parseDateTime(value)
  if (!date) return ''
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

/** 后端日期时间转 'MM月DD日'，例如 '2026-08-20 10:00:00' -> '08月20日' */
export function formatPaddedMonthDay(value: string | null | undefined): string {
  const date = parseDateTime(value)
  if (!date) return ''
  return `${pad2(date.getMonth() + 1)}月${pad2(date.getDate())}日`
}

export interface CustomRangeQuery {
  timeRange: 'custom'
  startDate: string
  endDate: string
}

/** 构造后端 custom 时间范围查询参数：最近 days 天（含今天）到当前时刻 */
export function buildCustomRangeQuery(days: number): CustomRangeQuery {
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  return { timeRange: 'custom', startDate: formatDateTime(start), endDate: formatDateTime(end) }
}
