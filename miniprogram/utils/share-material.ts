export const HOME_PAGE_PATH = '/pages/index/index'
export const HOME_MATERIALS_TAB_PATH = `${HOME_PAGE_PATH}?tab=materials`
export const MATERIAL_DETAIL_PATH = '/pages/material-detail/index'
export const MATERIAL_SHARE_GATE_PATH = '/pages/share-gate/index'
export const MATERIAL_PUBLISH_PATH = '/pages/materials/publish/index'
export const MATERIAL_NOTE_PATH = '/pages/materials/note/index'
export const SHARE_GATE_DEFAULT_ART = '/assets/share-gate/default-background.png'
const SHARE_COVER_QUERY_KEY = 'cover'
const MAX_SHARE_QUERY_LENGTH = 980

/** 仅远程封面能给访客立刻显示；本地临时路径带不过去。 */
export function shareableCoverUrl(url?: string): string {
  const value = (url ?? '').trim()
  return /^https:\/\//i.test(value) ? value : ''
}

/** 分享卡片上的作品图可直接铺开；没有封面时有作品 ID 先留空，避免闪默认气泡图。 */
export function shareGateHeroArt(materialId?: string, coverUrl?: string): { artSrc: string; artFromWork: boolean } {
  const cover = shareableCoverUrl(coverUrl)
  if (cover) return { artSrc: cover, artFromWork: true }
  return {
    artSrc: materialId ? '' : SHARE_GATE_DEFAULT_ART,
    artFromWork: false,
  }
}

/** 确认作品已删除后改回默认气泡图；有封面才换成作品图。 */
export function shareGateArtFromPreview(preview: { url: string; deleted: boolean }): { artSrc: string; artFromWork: boolean } | null {
  if (preview.deleted) return { artSrc: SHARE_GATE_DEFAULT_ART, artFromWork: false }
  if (preview.url) return { artSrc: preview.url, artFromWork: true }
  return null
}

const MATERIAL_ID_QUERY_KEY = 'id'
const MATERIAL_OWNER_QUERY_KEY = 'owner'
const DEFAULT_SHARE_TITLE = '图文素材'

function withTrackingId(query: string, trackingId?: string): string {
  if (!trackingId) return query
  return `${query}&trackingId=${encodeURIComponent(trackingId)}`
}

/** 分享卡片先进入授权前置页，授权后再打开作品详情。 */
export function buildMaterialSharePath(materialId: string, trackingId?: string, coverUrl?: string): string {
  return buildMaterialShareGatePath(materialId, trackingId, coverUrl)
}

/** 分享进入授权前置页，用户授权后再进入作品详情。 */
export function buildMaterialShareGatePath(materialId: string, trackingId?: string, coverUrl?: string): string {
  return `${MATERIAL_SHARE_GATE_PATH}?${buildMaterialShareQuery(materialId, trackingId, coverUrl)}`
}

/** 朋友圈只能打开当前页；query 带作品 id 和封面，单页第一帧就能显示作品图。 */
export function buildMaterialShareTimelineQuery(materialId: string, trackingId?: string, coverUrl?: string): string {
  return buildMaterialShareQuery(materialId, trackingId, coverUrl)
}

const MOMENTS_SINGLE_PAGE_SCENE = 1154

/** 朋友圈先打开单页模式，不能跳转或登录，只能渲染当前页。 */
export function isSinglePageMode(): boolean {
  try {
    const getApiCategory = (wx as WechatMiniprogram.Wx & { getApiCategory?: () => string }).getApiCategory
    if (typeof getApiCategory === 'function' && getApiCategory() === 'browseOnly') return true
  } catch {
    // 旧基础库没有该接口
  }

  try {
    const options = typeof wx.getEnterOptionsSync === 'function'
      ? wx.getEnterOptionsSync()
      : wx.getLaunchOptionsSync()
    return options.scene === MOMENTS_SINGLE_PAGE_SCENE
  } catch {
    return false
  }
}

export const SINGLE_PAGE_OPEN_HINT = '请前往小程序'

/** 单页模式不能跳转或登录，点按钮时提示去完整小程序。 */
export function promptOpenFullMiniProgram(): void {
  wx.showToast({ title: SINGLE_PAGE_OPEN_HINT, icon: 'none' })
}

/** 单页模式拦截交互并提示；调用方应立即 return。 */
export function guardSinglePageAction(): boolean {
  if (!isSinglePageMode()) return false
  promptOpenFullMiniProgram()
  return true
}

/** 发布成功回跳带 tab / publishSuccess，不要当成朋友圈打开作品。 */
export function isPublishReturnQuery(options: Record<string, string | undefined>): boolean {
  return options.tab === 'materials' || options.publishSuccess === '1'
}

/** 首次进入先到前置页，已登录才直接打开作品详情。单页模式不能跳转。 */
export function openSharedMaterial(materialId: string, trackingId: string | undefined, completedLogin: boolean): void {
  if (isSinglePageMode()) return
  const url = completedLogin
    ? buildMaterialDetailPath(materialId, trackingId)
    : buildMaterialShareGatePath(materialId, trackingId)
  wx.redirectTo({
    url,
    fail: () => wx.reLaunch({ url }),
  })
}

/** 小程序内打开素材详情；ownerView 只由已登录用户的作品入口传入。 */
export function buildMaterialDetailPath(materialId: string, trackingId?: string, ownerView = false): string {
  const query = buildMaterialShareQuery(materialId, trackingId)
  return `${MATERIAL_DETAIL_PATH}?${ownerView ? `${query}&${MATERIAL_OWNER_QUERY_KEY}=1` : query}`
}

export function buildMaterialPublishPath(materialId?: string): string {
  return buildMaterialEditPath(materialId)
}

/** 修改已有作品：笔记走笔记页，其余素材走发布页 */
export function buildMaterialEditPath(materialId?: string, kind?: string): string {
  const basePath = kind === 'note' || kind === 'NOTE' ? MATERIAL_NOTE_PATH : MATERIAL_PUBLISH_PATH
  if (!materialId) return basePath
  return `${basePath}?${MATERIAL_ID_QUERY_KEY}=${encodeURIComponent(materialId)}`
}

export function buildMaterialShareQuery(materialId: string, trackingId?: string, coverUrl?: string): string {
  const query = withTrackingId(`${MATERIAL_ID_QUERY_KEY}=${encodeURIComponent(materialId)}`, trackingId)
  const cover = shareableCoverUrl(coverUrl)
  if (!cover) return query
  const next = `${query}&${SHARE_COVER_QUERY_KEY}=${encodeURIComponent(cover)}`
  return next.length > MAX_SHARE_QUERY_LENGTH ? query : next
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

export function enableMaterialShareMenu(includeTimeline = false): void {
  wx.showShareMenu({
    menus: includeTimeline ? ['shareAppMessage', 'shareTimeline'] : ['shareAppMessage'],
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
