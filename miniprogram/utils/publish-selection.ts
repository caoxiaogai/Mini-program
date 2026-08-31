import type { PublishMediaViewModel } from '../types/materials'
import type { PublishEntryType } from './publish-media'

export interface PendingPublishSelection {
  type: PublishEntryType
  media: PublishMediaViewModel[]
}

let pendingPublishSelection: PendingPublishSelection | null = null

/** 选择器完成后，在跳转发布详情页前暂存本地临时文件路径。 */
export function setPendingPublishSelection(selection: PendingPublishSelection): void {
  pendingPublishSelection = {
    type: selection.type,
    media: selection.media.map((item) => ({ ...item })),
  }
}

/** 发布详情页只消费一次，避免返回后重复带入上一次选择结果。 */
export function takePendingPublishSelection(): PendingPublishSelection | null {
  const selection = pendingPublishSelection
  pendingPublishSelection = null
  return selection
}
