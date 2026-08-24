export type MaterialsFilterId = 'all' | 'image' | 'video' | 'pdf'

export interface MaterialsFilterViewModel {
  id: MaterialsFilterId
  label: string
}

export interface MaterialCardViewModel {
  id: string
  title: string
  date: string
  thumbnailUrl: string
  kind: Exclude<MaterialsFilterId, 'all'>
  isDraft?: boolean
}

export interface MaterialDetailViewModel {
  id: string
  ownerUserId: string
  title: string
  fileType: string
  trackingId: string
  /** 图片素材轮播图；视频/PDF 等可为空 */
  images: string[]
  /** 列表与详情预览图（视频为首帧封面） */
  previewUrl: string
  /** 视频播放地址（仅 VIDEO） */
  videoUrl: string
  /** 视频时长（秒，仅 VIDEO） */
  duration: number
  descriptionLines: string[]
}

export interface MaterialsViewModel {
  filters: MaterialsFilterViewModel[]
  items: MaterialCardViewModel[]
}

export interface PublishImageViewModel {
  id: string
  path: string
}

export interface PublishVideoViewModel {
  videoPath: string
  coverPath: string
  duration: number
}

export interface PublishPdfViewModel {
  filePath: string
  fileName: string
}

export interface MaterialDraftEditViewModel {
  id: string
  fileType: string
  images: PublishImageViewModel[]
  video: PublishVideoViewModel | null
  pdf: PublishPdfViewModel | null
  copy: string
}

export interface MaterialSubmitInput {
  /** 正在编辑的既有草稿素材 ID；新建时为 null */
  draftId: string | null
  /** 进入编辑时草稿的原始图片路径，用于判断图片是否被改动 */
  originalImagePaths: string[]
  /** 进入编辑时草稿的视频路径，用于判断视频是否被改动 */
  originalVideoPath: string
  /** 进入编辑时草稿的 PDF 路径，用于判断 PDF 是否被改动 */
  originalPdfPath: string
  images: PublishImageViewModel[]
  video: PublishVideoViewModel | null
  pdf: PublishPdfViewModel | null
  copy: string
}
