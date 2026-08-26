import { getMaterialDraft, publishMaterial, saveMaterialDraft } from '../../../services/materials'
import { returnToMaterialsList } from '../../../utils/publish-return'
import type { MaterialSubmitInput, PublishMediaViewModel } from '../../../types/materials'
import {
  canAddPublishMedia,
  isPdfFileName,
  MAX_IMAGE_COUNT,
  MAX_VIDEO_DURATION_SECONDS,
  mediaFilesToPublishItems,
  mergePublishMedia,
  PUBLISH_SOURCE_OPTIONS,
  PUBLISH_TYPE_OPTIONS,
} from '../../../utils/publish-media'

const initialMedia: PublishMediaViewModel[] = []

function isUserCancel(errMsg?: string): boolean {
  return typeof errMsg === 'string' && /cancel/i.test(errMsg)
}

Page({
  draftMaterialId: null as string | null,
  draftMediaPaths: [] as string[],
  submitting: false,
  data: {
    media: initialMedia,
    canAddMedia: canAddPublishMedia(initialMedia),
    copy: '',
    typeSheetVisible: false,
    sourceSheetVisible: false,
    typeOptions: PUBLISH_TYPE_OPTIONS,
    sourceOptions: PUBLISH_SOURCE_OPTIONS,
  },
  onLoad(options: Record<string, string | undefined>) {
    const materialId = options.id
    if (!materialId) return

    getMaterialDraft(materialId).then((draft) => {
      if (!draft) return

      this.draftMaterialId = draft.id
      this.draftMediaPaths = draft.media.map((item) => item.path)

      this.setData({
        media: draft.media,
        canAddMedia: canAddPublishMedia(draft.media),
        copy: draft.copy,
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
      copy: this.data.copy,
    }
  },
  applySelectedMedia(incoming: PublishMediaViewModel[]) {
    const { items, message } = mergePublishMedia(this.data.media, incoming)
    if (message) wx.showToast({ title: message, icon: 'none' })
    this.setData({ media: items, canAddMedia: canAddPublishMedia(items) })
  },
  onAddMediaTap() {
    if (!this.data.canAddMedia) return
    this.setData({ typeSheetVisible: true, sourceSheetVisible: false })
  },
  onTypeSheetMaskTap() {
    this.setData({ typeSheetVisible: false })
  },
  onSourceSheetMaskTap() {
    this.setData({ sourceSheetVisible: false })
  },
  onTypeOptionTap(event: WechatMiniprogram.TouchEvent) {
    const optionId = event.currentTarget.dataset.id as string
    if (optionId === 'media') {
      this.setData({ typeSheetVisible: false, sourceSheetVisible: true })
      return
    }
    if (optionId !== 'pdf') return

    if (this.data.media.length > 0) {
      this.setData({ typeSheetVisible: false })
      wx.showToast({ title: '已添加图片，不能同时选择 PDF', icon: 'none' })
      return
    }

    this.setData({ typeSheetVisible: false }, () => {
      this.choosePdfFromChat()
    })
  },
  onSourceOptionTap(event: WechatMiniprogram.TouchEvent) {
    const optionId = event.currentTarget.dataset.id as string
    if (optionId === 'camera') {
      this.setData({ sourceSheetVisible: false }, () => {
        this.chooseImageOrVideo(['camera'])
      })
      return
    }
    if (optionId !== 'album') return

    this.setData({ sourceSheetVisible: false }, () => {
      this.chooseImageOrVideo(['album'])
    })
  },
  chooseImageOrVideo(sourceType: Array<'album' | 'camera'>) {
    const imageCount = this.data.media.filter((item) => item.kind === 'image').length
    const remaining = this.data.media.length === 0 ? MAX_IMAGE_COUNT : MAX_IMAGE_COUNT - imageCount

    wx.chooseMedia({
      count: Math.max(remaining, 1),
      mediaType: ['image', 'video'],
      sourceType,
      maxDuration: MAX_VIDEO_DURATION_SECONDS,
      camera: 'back',
      sizeType: ['compressed'],
      success: (result) => {
        this.applySelectedMedia(mediaFilesToPublishItems(result.tempFiles, result.type))
      },
      fail: (error) => {
        if (!isUserCancel(error.errMsg)) wx.showToast({ title: '选择失败，请稍后重试', icon: 'none' })
      },
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
        if (!isUserCancel(error.errMsg)) wx.showToast({ title: '选择失败，请稍后重试', icon: 'none' })
      },
    })
  },
  onDeleteMediaTap(event: WechatMiniprogram.TouchEvent) {
    const mediaId = event.currentTarget.dataset.id as string
    const media = this.data.media.filter((item) => item.id !== mediaId)

    this.setData({ media, canAddMedia: canAddPublishMedia(media) })
  },
  onCopyInput(event: WechatMiniprogram.TextareaInput) {
    this.setData({ copy: event.detail.value })
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
        returnToMaterialsList({ materialId, showSuccessModal: true })
      })
      .catch(() => undefined)
      .then(() => {
        this.submitting = false
      })
  },
})
