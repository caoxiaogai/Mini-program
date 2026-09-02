import { getMaterialDraft, getMaterialShareCard, publishMaterial, saveMaterialDraft } from '../../../services/materials'
import { runAuthed } from '../../../services/auth'
import { ensureEmojiPresentation } from '../../../utils/emoji'
import { returnToMaterialsList } from '../../../utils/publish-return'
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

Page({
  draftMaterialId: null as string | null,
  draftMediaPaths: [] as string[],
  submitting: false,
  pendingMediaType: 'image' as Exclude<PublishTypeOptionId, 'pdf'>,
  entryType: 'image' as PublishEntryType,
  data: {
    media: initialMedia,
    canAddMedia: canAddPublishMedia(initialMedia),
    copy: '',
    copyFocused: false,
    publishTypeSheetVisible: false,
    publishSourceSheetVisible: false,
  },
  onLoad(options: Record<string, string | undefined>) {
    const selectedEntryType = getPublishEntryType(options.type)
    const pendingSelection = takePendingPublishSelection()
    this.entryType = pendingSelection?.type ?? selectedEntryType ?? 'image'
    if (this.entryType === 'image' || this.entryType === 'video') this.pendingMediaType = this.entryType

    runAuthed(buildReturnPath(buildMaterialPublishPath(), options), () => {
      if (pendingSelection) {
        this.setData({
          media: pendingSelection.media,
          canAddMedia: canAddPublishMedia(pendingSelection.media),
        })
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

        this.setData({
          media: draft.media,
          canAddMedia: canAddPublishMedia(draft.media),
          copy: ensureEmojiPresentation(draft.copy),
        })
      })
    })
  },
  onPullDownRefresh() {
    wx.stopPullDownRefresh()
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
    this.setData({
      media: items,
      canAddMedia: canAddPublishMedia(items),
    })
  },
  onAddMediaTap() {
    if (!this.data.canAddMedia) return
    if (this.data.media.length === 0) {
      this.setData({ publishTypeSheetVisible: true })
      return
    }

    this.pendingMediaType = 'image'
    this.entryType = 'image'
    this.setData({ publishSourceSheetVisible: true })
  },
  onPublishTypeSelect(event: WechatMiniprogram.CustomEvent<{ type: PublishEntryType }>) {
    const type = event.detail.type
    this.setData({ publishTypeSheetVisible: false }, () => {
      this.entryType = type
      if (type === 'pdf') {
        this.choosePdfFromChat()
        return
      }
      if (type !== 'image' && type !== 'video') return
      this.pendingMediaType = type
      this.setData({ publishSourceSheetVisible: true })
    })
  },
  onPublishTypeCancel() {
    this.setData({ publishTypeSheetVisible: false })
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

    this.setData({
      media,
      canAddMedia: canAddPublishMedia(media),
    })
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
  onDraftTap() {
    if (this.submitting) return
    this.submitting = true

    saveMaterialDraft(this.buildSubmitInput())
      .then((materialId) => {
        this.draftMaterialId = materialId
        this.draftMediaPaths = this.data.media.map((item) => item.path)
        wx.showToast({ title: '已保存草稿', icon: 'success' })
        returnToMaterialsList({ materialId, showSuccessModal: false })
      })
      .catch(() => undefined)
      .then(() => {
        this.submitting = false
      })
  },
  onPublishTap() {
    if (this.submitting) return
    this.submitting = true

    publishMaterial(this.buildSubmitInput())
      .then((materialId) => {
        this.draftMaterialId = materialId
        this.draftMediaPaths = this.data.media.map((item) => item.path)
        return getMaterialShareCard(materialId, this.data.copy, getPublishShareImageUrl(this.data.media)).then((card) => {
          returnToMaterialsList({
            materialId,
            showSuccessModal: true,
            shareTitle: card.shareTitle,
            shareImageUrl: card.shareImageUrl,
            shareTrackingId: card.shareTrackingId,
          })
        })
      })
      .catch(() => undefined)
      .then(() => {
        this.submitting = false
      })
  },
})
