export const STORAGE_KEY_GUEST_VISITOR_ID = 'visitor.guestId'

/** 访客标识：已登录用户用 openid，否则用本地持久化的 guest id（避免 anonymous 合并成同一客户） */
export function ensureVisitorId(): string {
  const openid = wx.getStorageSync('auth.openid') as string | ''
  if (typeof openid === 'string' && openid !== '') {
    return openid
  }

  const existing = wx.getStorageSync(STORAGE_KEY_GUEST_VISITOR_ID) as string | ''
  if (typeof existing === 'string' && existing !== '') {
    return existing
  }

  const guestId = `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  wx.setStorageSync(STORAGE_KEY_GUEST_VISITOR_ID, guestId)
  return guestId
}
