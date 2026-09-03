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
  selected?: boolean
}

export interface MaterialDetailViewModel {
  id: string
  /** 分享追踪 ID；后端按此关联浏览事件。未生成分享链接时可能为空 */
  trackingId: string
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
  /** 当前登录用户是否为素材作者；作者详情显示二次编辑，访客仍显示分享到朋友圈 */
  isOwner: boolean
}

export interface MaterialsViewModel {
  filters: MaterialsFilterViewModel[]
  items: MaterialCardViewModel[]
}

export type PublishMediaKind = Exclude<MaterialsFilterId, 'all'>

export interface PublishMediaViewModel {
  id: string
  path: string
  kind: PublishMediaKind
  /** 视频封面临时路径；图片/PDF 为空 */
  previewPath: string
  /** PDF 文件名；图片/视频为空 */
  name: string
  /** 视频时长（秒） */
  duration: number
  /** 已有素材的远端文件地址；发表时若未替换该文件则直接复用，不必重新上传 */
  remoteUrl?: string
}

export interface MaterialDraftEditViewModel {
  id: string
  media: PublishMediaViewModel[]
  copy: string
}

export interface MaterialSubmitInput {
  /** 正在编辑的既有草稿素材 ID；新建时为 null */
  draftId: string | null
  /** 进入编辑时草稿的原始文件路径，用于判断素材是否被改动 */
  originalMediaPaths: string[]
  media: PublishMediaViewModel[]
  copy: string
}
