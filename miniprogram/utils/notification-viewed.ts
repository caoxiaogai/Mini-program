const STORAGE_KEY_AUTH_USER_ID = 'auth.userId'
const STORAGE_KEY_VIEWED_NOTIFICATIONS = 'notifications.viewedCustomers'

export type ViewedNotificationMap = Record<string, string>

export type IntentCustomerViewKey = {
  customerId: string | number | null | undefined
  lastViewTime: string | null | undefined
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
  customerId: string,
  lastViewTime: string,
): ViewedNotificationMap {
  if (!customerId) return viewed
  if (viewed[customerId] === lastViewTime) return viewed
  return { ...viewed, [customerId]: lastViewTime }
}

export function isViewedNotification(
  customerId: string,
  lastViewTime: string | null | undefined,
  viewed: ViewedNotificationMap,
): boolean {
  if (!customerId) return false
  return viewed[customerId] === (lastViewTime ?? '')
}

export function selectUnviewedIntentCustomers<T extends IntentCustomerViewKey>(
  customers: T[],
  viewed: ViewedNotificationMap,
): T[] {
  return customers.filter((item) => !isViewedNotification(String(item.customerId ?? ''), item.lastViewTime, viewed))
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

export function persistViewedNotification(customerId: string, lastViewTime: string | null | undefined): void {
  if (!customerId) return
  const next = rememberViewedNotification(readViewedNotificationMap(), customerId, lastViewTime ?? '')
  try {
    wx.setStorageSync(viewedNotificationStorageKey(), next)
  } catch {
    // 存储失败时仍以本次会话的本地移除为准，下次启动可能再次出现
  }
}
