import { buildMaterialDetailPath } from './share-material'

export interface PendingPublishReturn {
  materialId: string
  showSuccessModal: boolean
  shareTitle?: string
  shareImageUrl?: string
  shareTrackingId?: string
}

let pendingPublishReturn: PendingPublishReturn | null = null

export function setPendingPublishReturn(value: PendingPublishReturn): void {
  pendingPublishReturn = value
}

export function takePendingPublishReturn(): PendingPublishReturn | null {
  const pending = pendingPublishReturn
  pendingPublishReturn = null
  return pending
}

let materialDetailNeedsRefresh = false
let materialsListNeedsRefresh = false

export function markMaterialDetailNeedsRefresh(): void {
  materialDetailNeedsRefresh = true
}

export function takeMaterialDetailNeedsRefresh(): boolean {
  const needsRefresh = materialDetailNeedsRefresh
  materialDetailNeedsRefresh = false
  return needsRefresh
}

export function markMaterialsListNeedsRefresh(): void {
  materialsListNeedsRefresh = true
}

export function takeMaterialsListNeedsRefresh(): boolean {
  const needsRefresh = materialsListNeedsRefresh
  materialsListNeedsRefresh = false
  return needsRefresh
}

function refreshStackedMaterialsLists(): void {
  getCurrentPages().forEach((page) => {
    const route = page.route ?? ''
    if (route !== 'pages/index/index' && route !== 'pages/materials/index') return
    const loadMaterials = (page as { loadMaterials?: () => void }).loadMaterials
    if (typeof loadMaterials === 'function') loadMaterials.call(page)
  })
}

/** 创建成功后打开作品详情，替换发布页，避免再回到列表。 */
export function openCreatedMaterial(result: PendingPublishReturn): void {
  setPendingPublishReturn(result)
  markMaterialsListNeedsRefresh()
  refreshStackedMaterialsLists()
  const url = buildMaterialDetailPath(result.materialId, undefined, true)
  wx.redirectTo({
    url,
    fail: () => {
      wx.reLaunch({ url })
    },
  })
}

/** 修改已有作品后回到详情并刷新，不再新建一层详情。 */
export function returnToEditedMaterial(materialId: string): void {
  markMaterialDetailNeedsRefresh()
  markMaterialsListNeedsRefresh()
  refreshStackedMaterialsLists()
  const pages = getCurrentPages()
  const previous = pages[pages.length - 2]
  if (pages.length > 1 && previous?.route === 'pages/material-detail/index') {
    wx.navigateBack()
    return
  }

  const url = buildMaterialDetailPath(materialId, undefined, true)
  wx.redirectTo({
    url,
    fail: () => {
      wx.reLaunch({ url })
    },
  })
}
