export const HOME_PAGE_PATH = '/pages/index/index'
export const MATERIAL_DETAIL_PATH = '/pages/material-detail/index'

const MATERIAL_ID_QUERY_KEY = 'id'
const SHARE_MATERIAL_ID_QUERY_KEY = 'materialId'
const DEFAULT_SHARE_TITLE = '图文素材'

function withTrackingId(query: string, trackingId?: string): string {
  if (!trackingId) return query
  return `${query}&trackingId=${encodeURIComponent(trackingId)}`
}

/** 分享卡片落地到首页，再打开详情，返回时先回到小程序首页 */
export function buildMaterialSharePath(materialId: string, trackingId?: string): string {
  return `${HOME_PAGE_PATH}?${buildHomeShareQuery(materialId, trackingId)}`
}

export function buildHomeShareQuery(materialId: string, trackingId?: string): string {
  return withTrackingId(`${SHARE_MATERIAL_ID_QUERY_KEY}=${encodeURIComponent(materialId)}`, trackingId)
}

/** 小程序内打开素材详情 */
export function buildMaterialDetailPath(materialId: string, trackingId?: string): string {
  return `${MATERIAL_DETAIL_PATH}?${buildMaterialShareQuery(materialId, trackingId)}`
}

export function buildMaterialShareQuery(materialId: string, trackingId?: string): string {
  return withTrackingId(`${MATERIAL_ID_QUERY_KEY}=${encodeURIComponent(materialId)}`, trackingId)
}

export function buildMaterialShareTitle(lines: string[]): string {
  const title = lines.map((line) => line.trim()).find((line) => line !== '')
  return title || DEFAULT_SHARE_TITLE
}

export function isRootPageStack(): boolean {
  try {
    return getCurrentPages().length <= 1
  } catch {
    return true
  }
}

export function enableMaterialShareMenu(): void {
  wx.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline'],
  })
}

/** 平台不允许按钮直接分享小程序卡片到朋友圈，引导用户使用右上角菜单。 */
export function showMomentsShareGuide(): void {
  wx.showModal({
    title: '分享到朋友圈',
    content: '请点击右上角「···」，选择「分享到朋友圈」',
    showCancel: false,
    confirmText: '我知道了',
  })
}
