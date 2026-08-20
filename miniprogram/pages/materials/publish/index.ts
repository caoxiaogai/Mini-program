import { getMaterialDraft } from '../../../services/materials'
import type { PublishImageViewModel } from '../../../types/materials'

const MAX_IMAGE_COUNT = 9
const initialImages: PublishImageViewModel[] = []

Page({
  data: {
    images: initialImages,
    canAddImage: initialImages.length < MAX_IMAGE_COUNT,
    copy: '',
    showPublishSuccessModal: false,
  },
  onLoad(options: Record<string, string | undefined>) {
    const materialId = options.id
    if (!materialId) return

    getMaterialDraft(materialId).then((draft) => {
      if (!draft) return

      this.setData({
        images: draft.images,
        canAddImage: draft.images.length < MAX_IMAGE_COUNT,
        copy: draft.copy,
      })
    })
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
    wx.showToast({ title: '草稿功能待接入', icon: 'none' })
  },
  onPublishTap() {
    wx.showToast({ title: '发表功能待接入', icon: 'none' })
  },
  onPublishSuccess() {
    this.setData({ showPublishSuccessModal: true })
  },
  onPublishSuccessClose() {
    this.setData({ showPublishSuccessModal: false })
  },
  onPublishSuccessCardTap() {},
  onShareFriendsTap() {
    this.setData({ showPublishSuccessModal: false })
    wx.showToast({ title: '分享功能待接入', icon: 'none' })
  },
  onShareMomentsTap() {
    this.setData({ showPublishSuccessModal: false })
    wx.showToast({ title: '分享功能待接入', icon: 'none' })
  },
})
