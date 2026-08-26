import { getDatePickerState, normalizeDateRange } from '../../utils/date-range'
import type { DatePickerState } from '../../utils/date-range'

const getDateForPickerColumn = (currentDate: string, state: DatePickerState, column: number, value: number): string => {
  const label = state.range[column]?.[value]
  if (!label) return currentDate

  const [year, month, day] = currentDate.split('-').map(Number)
  const selectedValue = Number(label.slice(0, -1))
  const nextDate = [year, month, day]
  nextDate[column] = selectedValue

  return `${nextDate[0]}-${String(nextDate[1]).padStart(2, '0')}-${String(nextDate[2]).padStart(2, '0')}`
}

const getDateForPickerValue = (currentDate: string, maxDate: string, minDate: string, value: number[]): string => {
  let date = currentDate

  value.forEach((columnValue, column) => {
    const state = getDatePickerState(date, maxDate, minDate)
    date = getDateForPickerColumn(state.date, state, column, columnValue)
  })

  return getDatePickerState(date, maxDate, minDate).date
}

Component({
  properties: {
    visible: { type: Boolean, value: false },
    startDate: { type: String, value: '' },
    endDate: { type: String, value: '' },
    minDate: { type: String, value: '' },
    maxDate: { type: String, value: '' },
  },
  data: {
    draftStartDate: '',
    draftEndDate: '',
    startPickerRange: [] as string[][],
    startPickerValue: [0, 0, 0] as number[],
    endPickerRange: [] as string[][],
    endPickerValue: [0, 0, 0] as number[],
  },
  observers: {
    'visible, startDate, endDate, minDate, maxDate'(visible: boolean, startDate: string, endDate: string, minDate: string, maxDate: string) {
      if (!visible) return

      const dateRange = normalizeDateRange(startDate, endDate)
      const startPicker = getDatePickerState(dateRange.startDate, maxDate, minDate)
      const endPicker = getDatePickerState(dateRange.endDate, maxDate, minDate)
      this.setData({
        draftStartDate: startPicker.date,
        draftEndDate: endPicker.date,
        startPickerRange: startPicker.range,
        startPickerValue: startPicker.value,
        endPickerRange: endPicker.range,
        endPickerValue: endPicker.value,
      })
    },
  },
  methods: {
    stopPropagation() {},
    onStartPickerColumnChange(event: WechatMiniprogram.CustomEvent<{ column: number; value: number }>) {
      const date = getDateForPickerColumn(this.data.draftStartDate, getDatePickerState(this.data.draftStartDate, this.data.maxDate, this.data.minDate), event.detail.column, event.detail.value)
      const pickerState = getDatePickerState(date, this.data.maxDate, this.data.minDate)
      this.setData({ draftStartDate: pickerState.date, startPickerRange: pickerState.range, startPickerValue: pickerState.value })
    },
    onStartPickerChange(event: WechatMiniprogram.CustomEvent<{ value: number[] }>) {
      const pickerState = getDatePickerState(getDateForPickerValue(this.data.draftStartDate, this.data.maxDate, this.data.minDate, event.detail.value), this.data.maxDate, this.data.minDate)
      this.setData({ draftStartDate: pickerState.date, startPickerRange: pickerState.range, startPickerValue: pickerState.value })
    },
    onEndPickerColumnChange(event: WechatMiniprogram.CustomEvent<{ column: number; value: number }>) {
      const date = getDateForPickerColumn(this.data.draftEndDate, getDatePickerState(this.data.draftEndDate, this.data.maxDate, this.data.minDate), event.detail.column, event.detail.value)
      const pickerState = getDatePickerState(date, this.data.maxDate, this.data.minDate)
      this.setData({ draftEndDate: pickerState.date, endPickerRange: pickerState.range, endPickerValue: pickerState.value })
    },
    onEndPickerChange(event: WechatMiniprogram.CustomEvent<{ value: number[] }>) {
      const pickerState = getDatePickerState(getDateForPickerValue(this.data.draftEndDate, this.data.maxDate, this.data.minDate, event.detail.value), this.data.maxDate, this.data.minDate)
      this.setData({ draftEndDate: pickerState.date, endPickerRange: pickerState.range, endPickerValue: pickerState.value })
    },
    onCancelTap() {
      this.triggerEvent('cancel')
    },
    onConfirmTap() {
      this.triggerEvent('confirm', {
        startDate: this.data.draftStartDate,
        endDate: this.data.draftEndDate,
      })
    },
  },
})
