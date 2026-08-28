export const HOME_PAGE_PATH = '/pages/index/index'
export const MATERIAL_DETAIL_PATH = '/pages/material-detail/index'
export const MATERIAL_PUBLISH_PATH = '/pages/materials/publish/index'

const MATERIAL_ID_QUERY_KEY = 'id'
const PUBLISH_REMIX_QUERY_KEY = 'remix'
const DEFAULT_SHARE_TITLE = '图文素材'

function withTrackingId(query: string, trackingId?: string): string {
  if (!trackingId) return query
  return `${query}&trackingId=${encodeURIComponent(trackingId)}`
}

/** 分享卡片直接打开作品详情，返回回到分享来源 */
export function buildMaterialSharePath(materialId: string, trackingId?: string): string {
  return buildMaterialDetailPath(materialId, trackingId)
}

/** 小程序内打开素材详情 */
export function buildMaterialDetailPath(materialId: string, trackingId?: string): string {
  return `${MATERIAL_DETAIL_PATH}?${buildMaterialShareQuery(materialId, trackingId)}`
}

export function isPublishRemixQuery(value?: string): boolean {
  return value === '1'
}

/** 打开发布页；remix 时预填已发布素材，发表为新作品，不覆盖原素材 */
export function buildMaterialPublishPath(materialId?: string, remix = false): string {
  if (!materialId) return MATERIAL_PUBLISH_PATH
  const query = [`${MATERIAL_ID_QUERY_KEY}=${encodeURIComponent(materialId)}`]
  if (remix) query.push(`${PUBLISH_REMIX_QUERY_KEY}=1`)
  return `${MATERIAL_PUBLISH_PATH}?${query.join('&')}`
}

export function buildMaterialShareQuery(materialId: string, trackingId?: string): string {
  return withTrackingId(`${MATERIAL_ID_QUERY_KEY}=${encodeURIComponent(materialId)}`, trackingId)
}

export function buildMaterialShareTitle(lines: string[]): string {
  const title = lines.map((line) => line.trim()).find((line) => line !== '')
  return title || DEFAULT_SHARE_TITLE
}

/** 刚发布的本地文件：图片用原图，视频/PDF 用预览图。 */
export function getPublishShareImageUrl(media: Array<{ kind: string; path: string; previewPath: string }>): string {
  const first = media[0]
  if (!first) return ''
  if (first.kind === 'image') return first.path
  return first.previewPath || ''
}

export function pickShareImageUrl(
  preferred: string,
  items: Array<{ id: string; thumbnailUrl: string }>,
  materialId: string,
): string | undefined {
  if (preferred) return preferred
  const thumbnail = items.find((item) => item.id === materialId)?.thumbnailUrl
  return thumbnail || undefined
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
