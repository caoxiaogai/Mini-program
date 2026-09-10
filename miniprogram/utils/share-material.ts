export const HOME_PAGE_PATH = '/pages/index/index'
export const MATERIAL_DETAIL_PATH = '/pages/material-detail/index'
export const MATERIAL_SHARE_GATE_PATH = '/pages/share-gate/index'
export const MATERIAL_PUBLISH_PATH = '/pages/materials/publish/index'
export const MATERIAL_NOTE_PATH = '/pages/materials/note/index'

const MATERIAL_ID_QUERY_KEY = 'id'
const MATERIAL_OWNER_QUERY_KEY = 'owner'
const PUBLISH_REMIX_QUERY_KEY = 'remix'
const DEFAULT_SHARE_TITLE = '图文素材'

function withTrackingId(query: string, trackingId?: string): string {
  if (!trackingId) return query
  return `${query}&trackingId=${encodeURIComponent(trackingId)}`
}

/** 分享卡片先进入授权前置页，授权后再打开作品详情。 */
export function buildMaterialSharePath(materialId: string, trackingId?: string): string {
  return buildMaterialShareGatePath(materialId, trackingId)
}

/** 分享进入授权前置页，用户授权后再进入作品详情。 */
export function buildMaterialShareGatePath(materialId: string, trackingId?: string): string {
  return `${MATERIAL_SHARE_GATE_PATH}?${buildMaterialShareQuery(materialId, trackingId)}`
}

/** 朋友圈只能打开当前页；query 带作品 id，落地后再转到作品详情。 */
export function buildMaterialShareTimelineQuery(materialId: string, trackingId?: string): string {
  return buildMaterialShareQuery(materialId, trackingId)
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

export function isPublishRemixQuery(value?: string): boolean {
  return value === '1'
}

/** 打开发布页；remix 时预填已发布素材，发表为新作品，不覆盖原素材 */
export function buildMaterialPublishPath(materialId?: string, remix = false): string {
  return buildMaterialEditPath(materialId, undefined, remix)
}

/** 笔记草稿/二次编辑走笔记页，其余素材走原发布页 */
export function buildMaterialEditPath(materialId?: string, kind?: string, remix = false): string {
  const basePath = kind === 'note' || kind === 'NOTE' ? MATERIAL_NOTE_PATH : MATERIAL_PUBLISH_PATH
  if (!materialId) return basePath
  const query = [`${MATERIAL_ID_QUERY_KEY}=${encodeURIComponent(materialId)}`]
  if (remix) query.push(`${PUBLISH_REMIX_QUERY_KEY}=1`)
  return `${basePath}?${query.join('&')}`
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
