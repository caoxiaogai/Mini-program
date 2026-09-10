import { getMaterialDraft, getMaterialShareCard, publishMaterial, saveMaterialDraft, uploadMaterialFiles } from '../../../services/materials'
import { runAuthed } from '../../../services/auth'
import { ensureEmojiPresentation } from '../../../utils/emoji'
import { openCreatedMaterial, returnToMaterialsList } from '../../../utils/publish-return'
import { buildMaterialPublishPath, getPublishShareImageUrl, isPublishRemixQuery } from '../../../utils/share-material'
import type { MaterialSubmitInput, PublishMediaViewModel } from '../../../types/materials'
import { takePendingPublishSelection } from '../../../utils/publish-selection'
import {
  canAddPublishMedia,
  choosePublishImageOrVideo,
  isPdfFileName,
  getPublishEntryType,
  MAX_IMAGE_COUNT,
  mergePublishMedia,
  showPublishPickerError,
} from '../../../utils/publish-media'
import type { PublishEntryType, PublishMediaSource, PublishTypeOptionId } from '../../../utils/publish-media'
import { buildReturnPath } from '../../../utils/auth'

const initialMedia: PublishMediaViewModel[] = []

type MediaSlotRect = Pick<WechatMiniprogram.BoundingClientRectCallbackResult, 'left' | 'top' | 'width' | 'height'>

interface PublishMediaSlotViewModel {
  index: number
  media: PublishMediaViewModel | null
  visible: boolean
  isAdd: boolean
}

/** 图片编辑页的固定九宫格；视频与 PDF 继续只占第一个槽位。 */
function buildPublishMediaSlots(
  items: PublishMediaViewModel[],
  previousSlots: PublishMediaSlotViewModel[] = [],
): PublishMediaSlotViewModel[] {
  const mediaById = new Map(items.map((item) => [item.id, item]))
  const slotMedia = Array<PublishMediaViewModel | null>(MAX_IMAGE_COUNT).fill(null)
  const assignedIds = new Set<string>()

  previousSlots.forEach((slot) => {
    if (slot.index >= MAX_IMAGE_COUNT || !slot.media || assignedIds.has(slot.media.id)) return
    const media = mediaById.get(slot.media.id)
    if (!media) return
    slotMedia[slot.index] = media
    assignedIds.add(media.id)
  })

  items.forEach((media) => {
    if (assignedIds.has(media.id)) return
    const emptyIndex = slotMedia.findIndex((slot) => slot === null)
    if (emptyIndex < 0) return
    slotMedia[emptyIndex] = media
    assignedIds.add(media.id)
  })

  const previousAddIndex = previousSlots.find((slot) => slot.isAdd)?.index ?? -1
  const addIndex = canAddPublishMedia(items)
    ? slotMedia[previousAddIndex] === null
      ? previousAddIndex
      : slotMedia.findIndex((slot) => slot === null)
    : -1

  return slotMedia.map((media, index) => ({
    index,
    media,
    visible: Boolean(media) || index === addIndex,
    isAdd: index === addIndex,
  }))
}

/** 已选图片互换槽位；目标为空时，原位置保留为空。 */
function swapPublishMediaSlots(
  slots: PublishMediaSlotViewModel[],
  draggingMediaId: string,
  targetSlotIndex: number,
): PublishMediaSlotViewModel[] {
  const draggingSlotIndex = slots.findIndex((slot) => slot.media?.id === draggingMediaId)
  const targetSlot = slots[targetSlotIndex]
  const draggingSlot = slots[draggingSlotIndex]

  if (
    draggingSlotIndex < 0
    || !draggingSlot?.media
    || draggingSlot.media.kind !== 'image'
    || !targetSlot
    || targetSlotIndex === draggingSlotIndex
    || (targetSlot.media && targetSlot.media.kind !== 'image')
  ) return slots

  return slots.map((slot, index) => {
    if (index === draggingSlotIndex) return { ...slot, media: targetSlot.media }
    if (index === targetSlotIndex) return { ...slot, media: draggingSlot.media }
    return slot
  })
}

/** 发布接口只接收连续媒体数组，提交时忽略九宫格中的空槽。 */
function getPublishMediaInSlotOrder(
  items: PublishMediaViewModel[],
  slots: PublishMediaSlotViewModel[],
): PublishMediaViewModel[] {
  const mediaById = new Map(items.map((item) => [item.id, item]))
  return slots.flatMap((slot) => {
    if (!slot.media) return []
    const media = mediaById.get(slot.media.id)
    return media ? [media] : []
  })
}

Page({
  draftMaterialId: null as string | null,
  draftMediaPaths: [] as string[],
  submitting: false,
  dragMediaRects: [] as MediaSlotRect[],
  visibleMediaSlotIndices: [] as number[],
  dragReleaseTimer: 0 as number,
  previewIgnoreTapUntil: 0,
  pendingMediaType: 'image' as Exclude<PublishTypeOptionId, 'pdf'>,
  entryType: 'image' as PublishEntryType,
  data: {
    media: initialMedia,
    mediaSlots: buildPublishMediaSlots(initialMedia),
    canAddMedia: canAddPublishMedia(initialMedia),
    copy: '',
    copyFocused: false,
    publishSourceSheetVisible: false,
    uploading: false,
    draggingMediaId: '',
    dragTargetSlotIndex: -1,
    dragPreviewPath: '',
    dragPreviewX: 0,
    dragPreviewY: 0,
    dragPreviewWidth: 0,
    dragPreviewHeight: 0,
    dragPreviewSettling: false,
  },
  onLoad(options: Record<string, string | undefined>) {
    const selectedEntryType = getPublishEntryType(options.type)
    const pendingSelection = takePendingPublishSelection()
    this.entryType = pendingSelection?.type ?? selectedEntryType ?? 'image'
    if (this.entryType === 'image' || this.entryType === 'video') this.pendingMediaType = this.entryType

    runAuthed(buildReturnPath(buildMaterialPublishPath(), options), () => {
      if (pendingSelection) {
        this.setPublishMedia(pendingSelection.media)
      }

      const materialId = options.id
      if (!materialId) return

      const remix = isPublishRemixQuery(options.remix)
      getMaterialDraft(materialId).then((draft) => {
        if (!draft) {
          wx.showToast({ title: '素材不存在', icon: 'none' })
          return
        }

        this.draftMaterialId = remix ? null : draft.id
        this.draftMediaPaths = remix ? [] : draft.media.map((item) => item.path)
        if (!selectedEntryType && draft.media[0]) this.entryType = draft.media[0].kind
        if (this.entryType === 'image' || this.entryType === 'video') this.pendingMediaType = this.entryType

        this.setPublishMedia(draft.media)
        this.setData({ copy: ensureEmojiPresentation(draft.copy) })
      })
    })
  },
  onPullDownRefresh() {
    wx.stopPullDownRefresh()
  },
  onUnload() {
    this.clearDragReleaseTimer()
  },
  buildSubmitInput(): MaterialSubmitInput {
    return {
      draftId: this.draftMaterialId,
      originalMediaPaths: this.draftMediaPaths,
      media: this.data.media,
      copy: ensureEmojiPresentation(this.data.copy),
    }
  },
  applySelectedMedia(incoming: PublishMediaViewModel[]) {
    const { items, message } = mergePublishMedia(this.data.media, incoming)
    if (message) wx.showToast({ title: message, icon: 'none' })
    this.setPublishMedia(items)
  },
  onAddMediaTap() {
    if (!this.data.canAddMedia) return
    if (this.entryType === 'pdf') {
      this.choosePdfFromChat()
      return
    }
    if (this.entryType === 'video') {
      this.pendingMediaType = 'video'
      this.setData({ publishSourceSheetVisible: true })
      return
    }

    this.pendingMediaType = 'image'
    this.setData({ publishSourceSheetVisible: true })
  },
  onPublishSourceSelect(event: WechatMiniprogram.CustomEvent<{ source: PublishMediaSource }>) {
    const source = event.detail.source
    this.setData({ publishSourceSheetVisible: false }, () => {
      if (source !== 'camera' && source !== 'album') return
      this.chooseImageOrVideo(source)
    })
  },
  onPublishSourceCancel() {
    this.setData({ publishSourceSheetVisible: false })
  },
  chooseImageOrVideo(source: PublishMediaSource) {
    const imageCount = this.data.media.filter((item) => item.kind === 'image').length
    const remaining = this.pendingMediaType === 'video'
      ? 1
      : this.data.media.length === 0 ? MAX_IMAGE_COUNT : MAX_IMAGE_COUNT - imageCount

    choosePublishImageOrVideo({
      type: this.entryType === 'video' ? 'video' : 'image',
      source,
      count: remaining,
    })
      .then((incoming) => this.applySelectedMedia(incoming))
      .catch((error: WechatMiniprogram.GeneralCallbackResult) => {
        showPublishPickerError(error.errMsg)
      })
  },
  choosePdfFromChat() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (result) => {
        const file = result.tempFiles[0]
        if (!file) return
        if (!isPdfFileName(file.name)) {
          wx.showToast({ title: '请选择 PDF 文件', icon: 'none' })
          return
        }

        this.applySelectedMedia([
          {
            id: file.path,
            path: file.path,
            kind: 'pdf',
            previewPath: '',
            name: file.name,
            duration: 0,
          },
        ])
      },
      fail: (error) => {
        showPublishPickerError(error.errMsg)
      },
    })
  },
  onDeleteMediaTap(event: WechatMiniprogram.TouchEvent) {
    const mediaId = event.currentTarget.dataset.id as string
    const media = this.data.media.filter((item) => item.id !== mediaId)
    this.setPublishMedia(media)
  },
  onMediaPreviewTap(event: WechatMiniprogram.TouchEvent) {
    if (Date.now() < this.previewIgnoreTapUntil) return
    const mediaId = event.currentTarget.dataset.id as string
    const media = this.data.mediaSlots.find((slot) => slot.media?.id === mediaId)?.media
    if (!media || media.kind !== 'image') return

    const imagePaths = this.data.mediaSlots.flatMap((slot) => (
      slot.media?.kind === 'image' ? [slot.media.path] : []
    ))
    wx.previewImage({
      current: media.path,
      urls: imagePaths,
    })
  },
  setPublishMedia(
    media: PublishMediaViewModel[],
    previousSlots: PublishMediaSlotViewModel[] = this.data.mediaSlots,
    callback?: () => void,
  ) {
    const mediaSlots = buildPublishMediaSlots(media, previousSlots)
    this.setData({
      media,
      mediaSlots,
      canAddMedia: canAddPublishMedia(media),
    }, callback)
  },
  measureMediaSlots(callback?: () => void) {
    const query = this.createSelectorQuery()
    query.selectAll('.publish-page__image-slot--visible').boundingClientRect()
    query.exec((results) => {
      const rects = results[0] as MediaSlotRect[] | null
      this.dragMediaRects = Array.isArray(rects) ? rects : []
      this.visibleMediaSlotIndices = this.data.mediaSlots.filter((slot) => slot.visible).map((slot) => slot.index)
      callback?.()
    })
  },
  clearDragReleaseTimer() {
    if (!this.dragReleaseTimer) return
    clearTimeout(this.dragReleaseTimer)
    this.dragReleaseTimer = 0
  },
  onMediaLongPress(event: WechatMiniprogram.TouchEvent) {
    const mediaId = event.currentTarget.dataset.id as string
    if (!mediaId || !this.data.media.every((item) => item.kind === 'image')) return

    const media = this.data.media.find((item) => item.id === mediaId)
    const touch = event.touches[0] ?? event.changedTouches[0]
    const sourceSlotIndex = this.data.mediaSlots.findIndex((slot) => slot.media?.id === mediaId)
    if (!media || !touch || sourceSlotIndex < 0) return

    this.clearDragReleaseTimer()
    this.setData({
      draggingMediaId: mediaId,
      dragTargetSlotIndex: -1,
      dragPreviewPath: media.path,
      dragPreviewX: touch.clientX,
      dragPreviewY: touch.clientY,
      dragPreviewWidth: 0,
      dragPreviewHeight: 0,
      dragPreviewSettling: false,
    }, () => this.measureMediaSlots(() => {
      const sourceRectIndex = this.visibleMediaSlotIndices.indexOf(sourceSlotIndex)
      const sourceRect = this.dragMediaRects[sourceRectIndex]
      if (!sourceRect || this.data.draggingMediaId !== mediaId) return
      this.setData({
        dragPreviewX: touch.clientX - sourceRect.width / 2,
        dragPreviewY: touch.clientY - sourceRect.height / 2,
        dragPreviewWidth: sourceRect.width,
        dragPreviewHeight: sourceRect.height,
      })
    }))
  },
  onMediaTouchMove(event: WechatMiniprogram.TouchEvent) {
    if (!this.data.draggingMediaId) return
    const touch = event.touches[0]
    if (!touch) return

    const targetRectIndex = this.dragMediaRects.findIndex((rect) => (
      touch.clientX >= rect.left
      && touch.clientX <= rect.left + rect.width
      && touch.clientY >= rect.top
      && touch.clientY <= rect.top + rect.height
    ))
    const targetSlotIndex = this.visibleMediaSlotIndices[targetRectIndex] ?? -1
    const targetSlot = this.data.mediaSlots[targetSlotIndex]
    const draggingSlotIndex = this.data.mediaSlots.findIndex((slot) => slot.media?.id === this.data.draggingMediaId)
    const dragTargetSlotIndex = targetSlotIndex === draggingSlotIndex || !targetSlot?.media ? -1 : targetSlotIndex
    this.setData({
      dragPreviewX: touch.clientX - this.data.dragPreviewWidth / 2,
      dragPreviewY: touch.clientY - this.data.dragPreviewHeight / 2,
      dragTargetSlotIndex,
    })
  },
  onMediaTouchEnd() {
    if (!this.data.draggingMediaId) return
    this.previewIgnoreTapUntil = Date.now() + 240
    const draggingMediaId = this.data.draggingMediaId
    const draggingSlotIndex = this.data.mediaSlots.findIndex((slot) => slot.media?.id === draggingMediaId)
    const targetSlotIndex = this.data.dragTargetSlotIndex
    const settleSlotIndex = targetSlotIndex >= 0 ? targetSlotIndex : draggingSlotIndex
    const targetRectIndex = this.visibleMediaSlotIndices.indexOf(settleSlotIndex)
    const targetRect = this.dragMediaRects[targetRectIndex]
    const mediaSlots = targetSlotIndex >= 0
      ? swapPublishMediaSlots(this.data.mediaSlots, this.data.draggingMediaId, this.data.dragTargetSlotIndex)
      : this.data.mediaSlots
    const media = getPublishMediaInSlotOrder(this.data.media, mediaSlots)
    const settlePreview = () => {
      this.setData({
        draggingMediaId: '',
        dragTargetSlotIndex: -1,
        dragPreviewX: targetRect?.left ?? this.data.dragPreviewX,
        dragPreviewY: targetRect?.top ?? this.data.dragPreviewY,
        dragPreviewWidth: targetRect?.width ?? this.data.dragPreviewWidth,
        dragPreviewHeight: targetRect?.height ?? this.data.dragPreviewHeight,
        dragPreviewSettling: true,
      }, () => {
        this.dragReleaseTimer = setTimeout(() => {
          this.dragReleaseTimer = 0
          this.dragMediaRects = []
          this.setData({ dragPreviewPath: '', dragPreviewSettling: false })
        }, 160) as unknown as number
      })
    }

    if (mediaSlots === this.data.mediaSlots) {
      settlePreview()
      return
    }

    this.setPublishMedia(media, mediaSlots, settlePreview)
  },
  onMediaTouchCancel() {
    if (!this.data.draggingMediaId) return
    this.setData({ dragTargetSlotIndex: -1 }, () => this.onMediaTouchEnd())
  },
  onCopyAreaTap() {
    if (this.data.copyFocused) return
    this.setData({ copyFocused: true })
  },
  onCopyBlur() {
    this.setData({ copyFocused: false })
  },
  onCopyInput(event: WechatMiniprogram.TextareaInput): string | void {
    const copy = ensureEmojiPresentation(event.detail.value)
    if (copy !== this.data.copy) this.setData({ copy })
    if (copy !== event.detail.value) return copy
  },
  beginSubmit(): boolean {
    if (this.submitting) return false
    this.submitting = true
    return true
  },
  uploadThenSubmit(work: (input: MaterialSubmitInput) => Promise<void>): void {
    const input = this.buildSubmitInput()
    this.setData({ uploading: true })
    uploadMaterialFiles(input)
      .then((media) => {
        this.setPublishMedia(media)
        return work({ ...input, media })
      })
      .catch(() => {
        this.setData({ uploading: false })
      })
      .then(() => {
        this.submitting = false
      })
  },
  onDraftTap() {
    if (!this.beginSubmit()) return

    this.uploadThenSubmit((input) =>
      saveMaterialDraft(input).then((materialId) => {
        this.draftMaterialId = materialId
        this.draftMediaPaths = this.data.media.map((item) => item.path)
        wx.showToast({ title: '已保存草稿', icon: 'success' })
        returnToMaterialsList({ materialId, showSuccessModal: false })
      }),
    )
  },
  onPublishTap() {
    if (!this.beginSubmit()) return

    this.uploadThenSubmit((input) =>
      publishMaterial(input).then((materialId) => {
        this.draftMaterialId = materialId
        this.draftMediaPaths = this.data.media.map((item) => item.path)
        return getMaterialShareCard(materialId, this.data.copy, getPublishShareImageUrl(this.data.media)).then((card) => {
          openCreatedMaterial({
            materialId,
            showSuccessModal: true,
            shareTitle: card.shareTitle,
            shareImageUrl: card.shareImageUrl,
            shareTrackingId: card.shareTrackingId,
          })
        })
      }),
    )
  },
})
