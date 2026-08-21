import { getMaterialDraft, publishMaterial, saveMaterialDraft } from '../../../services/materials'
import type { MaterialSubmitInput, PublishImageViewModel } from '../../../types/materials'

const MAX_IMAGE_COUNT = 9
const PUBLISH_SUCCESS_STORAGE_KEY = 'materials.publishSuccessPending'
const MATERIALS_PAGE_ROUTE = 'pages/materials/index'
const initialImages: PublishImageViewModel[] = []

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

Page({
  draftMaterialId: null as string | null,
  draftImagePaths: [] as string[],
  submitting: false,
  data: {
    images: initialImages,
    canAddImage: initialImages.length < MAX_IMAGE_COUNT,
    copy: '',
  },
  onLoad(options: Record<string, string | undefined>) {
    const materialId = options.id
    if (!materialId) return

    getMaterialDraft(materialId).then((draft) => {
      if (!draft) return

      this.draftMaterialId = draft.id
      this.draftImagePaths = draft.images.map((image) => image.path)

      this.setData({
        images: draft.images,
        canAddImage: draft.images.length < MAX_IMAGE_COUNT,
        copy: draft.copy,
      })
    })
  },
  buildSubmitInput(): MaterialSubmitInput {
    return {
      draftId: this.draftMaterialId,
      originalImagePaths: this.draftImagePaths,
      images: this.data.images,
      copy: this.data.copy,
    }
  },
  onAddImageTap() {
    const count = MAX_IMAGE_COUNT - this.data.images.length
    if (count <= 0) return

    wx.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (result) => {
        const selectedImages = result.tempFilePaths
          .slice(0, count)
          .map((path) => ({ id: path, path }))
        const images = [...this.data.images, ...selectedImages]
        this.setData({ images, canAddImage: images.length < MAX_IMAGE_COUNT })
      },
    })
  },
  onDeleteImageTap(event: WechatMiniprogram.TouchEvent) {
    const imageId = event.currentTarget.dataset.id as string
    const images = this.data.images.filter((image) => image.id !== imageId)

    this.setData({ images, canAddImage: images.length < MAX_IMAGE_COUNT })
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
    this.submitting = true

    publishMaterial(this.buildSubmitInput())
      .then((materialId) => {
        this.draftMaterialId = materialId
        this.draftImagePaths = this.data.images.map((image) => image.path)
        returnToMaterialsList({ publishSuccess: true })
      })
      .catch(() => undefined)
      .then(() => {
        this.submitting = false
      })
  },
})
