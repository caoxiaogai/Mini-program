const MATERIAL_DETAIL_PATH = '/pages/material-detail/index'
const MATERIAL_ID_QUERY_KEY = 'id'
const DEFAULT_SHARE_TITLE = '图文素材'

export function buildMaterialSharePath(materialId: string, trackingId?: string): string {
  return `${MATERIAL_DETAIL_PATH}?${buildMaterialShareQuery(materialId, trackingId)}`
}

export function buildMaterialShareQuery(materialId: string, trackingId?: string): string {
  const query = `${MATERIAL_ID_QUERY_KEY}=${encodeURIComponent(materialId)}`
  if (!trackingId) return query
  return `${query}&trackingId=${encodeURIComponent(trackingId)}`
}

export function buildMaterialShareTitle(lines: string[]): string {
  const title = lines.map((line) => line.trim()).find((line) => line !== '')
  return title || DEFAULT_SHARE_TITLE
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
