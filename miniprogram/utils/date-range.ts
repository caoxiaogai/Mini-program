export type DateRange = {
  startDate: string
  endDate: string
}

export type DatePickerState = {
  date: string
  range: string[][]
  value: number[]
}

const DATE_PICKER_MIN_YEAR = 2000

const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const getDefaultDateRange = (now = new Date()): DateRange => {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)

  return {
    startDate: formatDate(start),
    endDate: formatDate(now),
  }
}

export const getDateRangeLimits = (now = new Date()): { minDate: string; maxDate: string } => {
  const targetYear = now.getFullYear()
  const targetMonth = now.getMonth() - 2
  const minDateBase = new Date(targetYear, targetMonth, 1)
  const lastDayOfTargetMonth = new Date(minDateBase.getFullYear(), minDateBase.getMonth() + 1, 0).getDate()
  const minDate = new Date(minDateBase.getFullYear(), minDateBase.getMonth(), Math.min(now.getDate(), lastDayOfTargetMonth))

  return {
    minDate: formatDate(minDate),
    maxDate: formatDate(now),
  }
}

export const startOfWeekMonday = (now: Date): Date => {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekday = date.getDay() === 0 ? 7 : date.getDay()
  date.setDate(date.getDate() - (weekday - 1))
  return date
}

export const getTotalRangeStart = (now = new Date()): Date => {
  const { minDate } = getDateRangeLimits(now)
  const [year, month, day] = minDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const normalizeDateRange = (startDate: string, endDate: string): DateRange => (
  startDate <= endDate ? { startDate, endDate } : { startDate: endDate, endDate: startDate }
)

const getDateParts = (date: string): [number, number, number] => {
  const [year, month, day] = date.split('-').map(Number)

  return [year, month, day]
}

const formatDateParts = (year: number, month: number, day: number): string => (
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
)

export const getDatePickerState = (date: string, maxDate: string, minDate = ''): DatePickerState => {
  const boundedMaxDate = maxDate || date
  const boundedMinDate = minDate || `${DATE_PICKER_MIN_YEAR}-01-01`
  const [maxYear, maxMonth, maxDay] = getDateParts(boundedMaxDate)
  const [minYear, minMonth, minDay] = getDateParts(boundedMinDate)
  const boundedDate = date > boundedMaxDate ? boundedMaxDate : date < boundedMinDate ? boundedMinDate : date
  const [inputYear, inputMonth, inputDay] = getDateParts(boundedDate)
  const year = Math.min(Math.max(inputYear, minYear), maxYear)
  const monthStart = year === minYear ? minMonth : 1
  const monthEnd = year === maxYear ? maxMonth : 12
  const month = Math.min(Math.max(inputMonth, monthStart), monthEnd)
  const monthDayCount = new Date(year, month, 0).getDate()
  const dayStart = year === minYear && month === minMonth ? minDay : 1
  const dayEnd = year === maxYear && month === maxMonth ? Math.min(monthDayCount, maxDay) : monthDayCount
  const day = Math.min(Math.max(inputDay, dayStart), dayEnd)
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index)
  const months = Array.from({ length: monthEnd - monthStart + 1 }, (_, index) => monthStart + index)
  const days = Array.from({ length: dayEnd - dayStart + 1 }, (_, index) => dayStart + index)

  return {
    date: formatDateParts(year, month, day),
    range: [
      years.map((item) => `${item}年`),
      months.map((item) => `${String(item).padStart(2, '0')}月`),
      days.map((item) => `${String(item).padStart(2, '0')}日`),
    ],
    value: [years.indexOf(year), months.indexOf(month), days.indexOf(day)],
  }
}
