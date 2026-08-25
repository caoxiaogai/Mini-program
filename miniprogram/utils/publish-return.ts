export interface PendingPublishReturn {
  materialId: string
  showSuccessModal: boolean
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

/** 发表/存草稿后回到原来的素材列表，避免再 push 一层首页。 */
export function returnToMaterialsList(result: PendingPublishReturn): void {
  if (getCurrentPages().length > 1) {
    setPendingPublishReturn(result)
    wx.navigateBack({ delta: 1 })
    return
  }

  const params = ['tab=materials']
  if (result.showSuccessModal) params.push('publishSuccess=1')
  if (result.materialId) params.push(`id=${encodeURIComponent(result.materialId)}`)
  wx.reLaunch({ url: `/pages/index/index?${params.join('&')}` })
}
