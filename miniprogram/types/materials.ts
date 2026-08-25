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
  title: string
  fileType: string
  /** 图片素材轮播图；视频/PDF 可为空 */
  images: string[]
  /** 列表与详情预览图（视频为首帧封面） */
  previewUrl: string
  /** 视频播放地址（仅 VIDEO） */
  videoUrl: string
  /** 视频时长（秒，仅 VIDEO） */
  duration: number
  /** PDF/表格文件地址（仅 PDF、TABLE） */
  pdfUrl: string
  /** PDF/表格展示文件名（仅 PDF、TABLE） */
  pdfFileName: string
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

export interface MaterialDraftEditViewModel {
  id: string
  images: PublishImageViewModel[]
  copy: string
}

export interface MaterialSubmitInput {
  /** 正在编辑的既有草稿素材 ID；新建时为 null */
  draftId: string | null
  /** 进入编辑时草稿的原始图片路径，用于判断图片是否被改动 */
  originalImagePaths: string[]
  images: PublishImageViewModel[]
  copy: string
}
