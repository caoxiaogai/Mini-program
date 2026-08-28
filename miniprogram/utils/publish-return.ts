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

const MATERIALS_RETURN_ROUTES = new Set(['pages/index/index', 'pages/materials/index'])

/** 从发布页回到素材列表：二次编辑时栈上还有详情页，需要一次越过。 */
export function getMaterialsReturnDelta(routes: string[]): number {
  for (let index = routes.length - 2; index >= 0; index -= 1) {
    if (MATERIALS_RETURN_ROUTES.has(routes[index] ?? '')) {
      return routes.length - 1 - index
    }
  }
  return 1
}

/** 发表/存草稿后回到原来的素材列表，避免再 push 一层首页。 */
export function returnToMaterialsList(result: PendingPublishReturn): void {
  setPendingPublishReturn(result)
  const pages = getCurrentPages()
  if (pages.length > 1) {
    wx.navigateBack({
      delta: getMaterialsReturnDelta(pages.map((page) => page.route ?? '')),
    })
    return
  }

  const params = ['tab=materials']
  if (result.showSuccessModal) params.push('publishSuccess=1')
  if (result.materialId) params.push(`id=${encodeURIComponent(result.materialId)}`)
  wx.reLaunch({ url: `/pages/index/index?${params.join('&')}` })
}
