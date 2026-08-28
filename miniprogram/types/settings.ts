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

export interface IntentRuleSection {
  id: string
  label: string
  body: string
}

export const INTENT_RULES_TITLE = '意向判断标准'

export const intentRuleSections: IntentRuleSection[] = [
  {
    id: 'single-image',
    label: '单图',
    body: '观看5秒以内为低意向，观看5到10秒为中意向，观看10秒以上或者转发1次及以上为高意向',
  },
  {
    id: 'multi-image',
    label: '多图',
    body: '未看完所有图片为低意向，看完所有图片为中意向，查看2次及以上且至少1次看完所有图片或者转发1次及以上为高意向',
  },
  {
    id: 'pdf',
    label: 'PDF',
    body: '未看完为低意向，看完为中意向，查看2次及以上且至少1次看完或者转发1次及以上为高意向',
  },
  {
    id: 'video',
    label: '视频',
    body: '播放进度低于80%为低意向，播放进度不低于80%为中意向，查看2次及以上且至少1次播放进度要不低于80%或者转发1次及以上为高意向',
  },
]
