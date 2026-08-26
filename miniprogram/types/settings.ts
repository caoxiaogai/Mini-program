export type NotifyIntentLevel = 'low' | 'medium' | 'high'

export interface NotifyIntentLevelOption {
  id: NotifyIntentLevel
  label: string
}

export const DEFAULT_NOTIFY_INTENT_LEVEL: NotifyIntentLevel = 'high'

export const notifyIntentLevelOptions: NotifyIntentLevelOption[] = [
  { id: 'low', label: '低意向' },
  { id: 'medium', label: '中意向' },
  { id: 'high', label: '高意向' },
]
