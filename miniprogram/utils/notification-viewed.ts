const STORAGE_KEY_AUTH_USER_ID = 'auth.userId'
const STORAGE_KEY_VIEWED_NOTIFICATIONS = 'notifications.viewedEvents'

export type ViewedNotificationMap = Record<string, true>

export type NotificationEventViewKey = {
  id: string | number | null | undefined
}

function viewedNotificationStorageKey(): string {
  let userId = ''
  try {
    userId = String(wx.getStorageSync(STORAGE_KEY_AUTH_USER_ID) || '')
  } catch {
    userId = ''
  }

  return `${STORAGE_KEY_VIEWED_NOTIFICATIONS}.${userId || 'anon'}`
}

function isViewedNotificationMap(value: unknown): value is ViewedNotificationMap {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function rememberViewedNotification(
  viewed: ViewedNotificationMap,
  eventId: string,
): ViewedNotificationMap {
  if (!eventId || viewed[eventId]) return viewed
  return { ...viewed, [eventId]: true }
}

export function isViewedNotification(eventId: string, viewed: ViewedNotificationMap): boolean {
  if (!eventId) return false
  return viewed[eventId] === true
}

export function selectUnviewedNotificationEvents<T extends NotificationEventViewKey>(
  events: T[],
  viewed: ViewedNotificationMap,
): T[] {
  return events.filter((item) => !isViewedNotification(String(item.id ?? ''), viewed))
}

export function readViewedNotificationMap(): ViewedNotificationMap {
  try {
    const raw = wx.getStorageSync(viewedNotificationStorageKey()) as unknown
    if (!raw) return {}
    if (typeof raw === 'string') {
      const parsed = JSON.parse(raw) as unknown
      return isViewedNotificationMap(parsed) ? parsed : {}
    }
    return isViewedNotificationMap(raw) ? raw : {}
  } catch {
    return {}
  }
}

/** 将一条浏览/转发通知记为已读。返回是否新写入（已读过则 false）。 */
export function persistViewedNotification(eventId: string | null | undefined): boolean {
  const id = String(eventId ?? '')
  if (!id) return false

  const current = readViewedNotificationMap()
  const next = rememberViewedNotification(current, id)
  if (next === current) return false

  try {
    wx.setStorageSync(viewedNotificationStorageKey(), next)
  } catch {
    // 存储失败时仍以本次会话的本地移除为准，下次启动可能再次出现
  }
  return true
}
