import { getMaterialDraft, publishMaterial, saveMaterialDraft } from '../../../services/materials'
import type {
  MaterialSubmitInput,
  PublishImageViewModel,
  PublishPdfViewModel,
  PublishVideoViewModel,
} from '../../../types/materials'

const MAX_IMAGE_COUNT = 9
const MAX_VIDEO_DURATION_SEC = 300
const PUBLISH_SUCCESS_STORAGE_KEY = 'materials.publishSuccessPending'
const MATERIALS_PAGE_ROUTE = 'pages/materials/index'
const initialImages: PublishImageViewModel[] = []

type MediaSource = 'camera' | 'album'

function returnToMaterialsList(options?: { publishSuccess?: boolean }): void {
  if (options?.publishSuccess) {
    wx.setStorageSync(PUBLISH_SUCCESS_STORAGE_KEY, '1')
  }

  const pages = getCurrentPages()
  const materialsPageIndex = pages.findIndex((page) => page.route === MATERIALS_PAGE_ROUTE)
  if (materialsPageIndex >= 0) {
    const delta = pages.length - 1 - materialsPageIndex
    if (delta > 0) {
      wx.navigateBack({ delta })
      return
    }
  }

  wx.reLaunch({ url: '/pages/materials/index' })
}

function showActionSheet(itemList: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    wx.showActionSheet({
      itemList,
      success: (result) => resolve(result.tapIndex),
      fail: (error) => reject(error),
    })
  })
}

function resolveSourceType(source: MediaSource): Array<'album' | 'camera'> {
  return source === 'camera' ? ['camera'] : ['album']
}

Page({
  draftMaterialId: null as string | null,
  draftImagePaths: [] as string[],
  draftVideoPath: '',
  draftPdfPath: '',
  submitting: false,
  data: {
    images: initialImages,
    video: null as PublishVideoViewModel | null,
    pdf: null as PublishPdfViewModel | null,
    canAddMedia: true,
    copy: '',
  },

  onLoad(options: Record<string, string | undefined>) {
    const materialId = options.id
    if (!materialId) return

    getMaterialDraft(materialId).then((draft) => {
      if (!draft) return

      this.draftMaterialId = draft.id
      this.draftImagePaths = draft.images.map((image) => image.path)
      this.draftVideoPath = draft.video?.videoPath ?? ''
      this.draftPdfPath = draft.pdf?.filePath ?? ''

      this.setData({
        images: draft.images,
        video: draft.video,
        pdf: draft.pdf,
        canAddMedia: this.canAddMoreMedia(draft.images, draft.video, draft.pdf),
        copy: draft.copy,
      })
    })
  },

  canAddMoreMedia(
    images: PublishImageViewModel[],
    video: PublishVideoViewModel | null,
    pdf: PublishPdfViewModel | null,
  ): boolean {
    if (video || pdf) return false
    return images.length < MAX_IMAGE_COUNT
  },

  syncCanAddMedia(
    images: PublishImageViewModel[],
    video: PublishVideoViewModel | null,
    pdf: PublishPdfViewModel | null,
  ): boolean {
    return this.canAddMoreMedia(images, video, pdf)
  },

  buildSubmitInput(): MaterialSubmitInput {
    return {
      draftId: this.draftMaterialId,
      originalImagePaths: this.draftImagePaths,
      originalVideoPath: this.draftVideoPath,
      originalPdfPath: this.draftPdfPath,
      images: this.data.images,
      video: this.data.video,
      pdf: this.data.pdf,
      copy: this.data.copy,
    }
  },

  hasBlockingMedia(): boolean {
    return this.data.images.length > 0 || this.data.video !== null || this.data.pdf !== null
  },

  async onAddMediaTap() {
    if (!this.data.canAddMedia) return

    if (this.data.pdf) {
      wx.showToast({ title: '请先删除已有 PDF', icon: 'none' })
      return
    }

    try {
      const typeIndex = await showActionSheet(['图片', '视频', 'PDF'])
      if (typeIndex === 2) {
        this.pickPdfFromChat()
        return
      }

      const sourceIndex = await showActionSheet(['拍摄', '从相册选择'])
      this.pickVisualMedia(sourceIndex === 0 ? 'camera' : 'album')
    } catch {
      // 用户取消
    }
  },

  pickVisualMedia(source: MediaSource) {
    if (this.data.pdf) {
      wx.showToast({ title: '请先删除已有 PDF', icon: 'none' })
      return
    }

    const remainingImageCount = MAX_IMAGE_COUNT - this.data.images.length
    if (!this.data.video && remainingImageCount <= 0) return

    wx.chooseMedia({
      count: source === 'camera' ? 1 : Math.max(1, remainingImageCount),
      mediaType: ['image', 'video'],
      sourceType: resolveSourceType(source),
      maxDuration: MAX_VIDEO_DURATION_SEC,
      sizeType: ['compressed'],
      success: (result) => {
        const files = result.tempFiles ?? []
        if (files.length === 0) return

        const pickedVideo = files.find((file) => file.fileType === 'video')
        if (pickedVideo) {
          if (this.data.images.length > 0) {
            wx.showToast({ title: '请先删除已有图片', icon: 'none' })
            return
          }

          const video: PublishVideoViewModel = {
            videoPath: pickedVideo.tempFilePath,
            coverPath: pickedVideo.thumbTempFilePath,
            duration: Math.max(0, Math.floor(pickedVideo.duration ?? 0)),
          }
          this.setData({
            video,
            pdf: null,
            images: [],
            canAddMedia: false,
          })
          return
        }

        if (this.data.video) {
          wx.showToast({ title: '请先删除已有视频', icon: 'none' })
          return
        }

        const selectedImages = files
          .filter((file) => file.fileType === 'image')
          .slice(0, remainingImageCount)
          .map((file) => ({ id: file.tempFilePath, path: file.tempFilePath }))

        if (selectedImages.length === 0) return

        const images = [...this.data.images, ...selectedImages]
        this.setData({
          images,
          video: null,
          pdf: null,
          canAddMedia: this.syncCanAddMedia(images, null, null),
        })
      },
    })
  },

  pickPdfFromChat() {
    if (this.data.images.length > 0 || this.data.video) {
      wx.showToast({ title: '请先删除已有素材', icon: 'none' })
      return
    }
    if (this.data.pdf) {
      wx.showToast({ title: '请先删除已有 PDF', icon: 'none' })
      return
    }

    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (result) => {
        const file = result.tempFiles[0]
        if (!file) return

        const pdf: PublishPdfViewModel = {
          filePath: file.path,
          fileName: file.name || 'PDF 文档',
        }

        this.setData({
          pdf,
          video: null,
          images: [],
          canAddMedia: false,
        })
      },
      fail: () => {
        wx.showToast({ title: '未选择 PDF 文件', icon: 'none' })
      },
    })
  },

  onDeleteImageTap(event: WechatMiniprogram.TouchEvent) {
    const imageId = event.currentTarget.dataset.id as string
    const images = this.data.images.filter((image) => image.id !== imageId)

    this.setData({
      images,
      canAddMedia: this.syncCanAddMedia(images, this.data.video, this.data.pdf),
    })
  },

  onDeleteVideoTap() {
    this.setData({
      video: null,
      canAddMedia: this.syncCanAddMedia(this.data.images, null, this.data.pdf),
    })
  },

  onDeletePdfTap() {
    this.setData({
      pdf: null,
      canAddMedia: this.syncCanAddMedia(this.data.images, this.data.video, null),
    })
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
        this.draftImagePaths = this.data.images.map((image) => image.path)
        this.draftVideoPath = this.data.video?.videoPath ?? ''
        this.draftPdfPath = this.data.pdf?.filePath ?? ''
        wx.showToast({ title: '已保存草稿', icon: 'success' })
        returnToMaterialsList()
      })
      .catch(() => undefined)
      .then(() => {
        this.submitting = false
      })
  },

  onPublishTap() {
    if (this.submitting) return

    if (!this.hasBlockingMedia()) {
      wx.showToast({ title: '请先添加素材', icon: 'none' })
      return
    }

    this.submitting = true

    publishMaterial(this.buildSubmitInput())
      .then((materialId) => {
        this.draftMaterialId = materialId
        this.draftImagePaths = this.data.images.map((image) => image.path)
        this.draftVideoPath = this.data.video?.videoPath ?? ''
        this.draftPdfPath = this.data.pdf?.filePath ?? ''
        returnToMaterialsList({ publishSuccess: true })
      })
      .catch(() => undefined)
      .then(() => {
        this.submitting = false
      })
  },
})
