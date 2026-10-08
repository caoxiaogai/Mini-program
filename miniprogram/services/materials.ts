import type { ApiMaterial, ApiMaterialComment, ApiMaterialEngagement } from '../types/api'
import type {
  MaterialCardViewModel,
  MaterialCommentViewModel,
  MaterialDetailViewModel,
  MaterialDraftEditViewModel,
  MaterialsFilterViewModel,
  MaterialsViewModel,
  MaterialSubmitInput,
  PublishMediaKind,
  PublishMediaViewModel,
} from '../types/materials'
import type { NoteBlock, NoteDraftViewModel, NoteSubmitInput } from '../types/note'
import { formatCompactCount, formatDateKey, formatRelativeDayTime } from '../utils/format'
import { prepareMediaUrl, prepareMediaUrls } from '../utils/media'
import {
  extractNotePlainText,
  extractNoteTitle,
  hasNoteContent,
  isNoteFileType,
  NOTE_DEFAULT_TITLE,
  NOTE_FILE_TYPE,
  NOTE_PLACEHOLDER_FILE_URL,
  noteAttachmentSignature,
  parseNoteContent,
  serializeNoteContent,
  toNoteDisplayBlocks,
} from '../utils/note'
import { isMaterialDeletedError } from '../utils/material-deleted'
import { prepareShareCardImage } from '../utils/share-image'
import { buildMaterialShareTitle, isSinglePageMode } from '../utils/share-material'
import { prepareDocumentPageImage } from './document'
import { ensureLogin, getCachedLogin, hasAuthorizedLogin, request, resolveMediaUrl, runRequestQueue, uploadFile } from './request'
import type { FileUploadOptions } from './request'

const materialsFilters: MaterialsFilterViewModel[] = [
  { id: 'all', label: '全部' },
  { id: 'image', label: '图片' },
  { id: 'video', label: '视频' },
  { id: 'pdf', label: 'PDF' },
]

// 后端 fileType（PDF/IMAGE/VIDEO/TABLE）到列表筛选类型的映射；TABLE 暂归入 PDF 文档类展示（待后端确认）
const materialKinds: Record<string, MaterialCardViewModel['kind']> = {
  IMAGE: 'image',
  VIDEO: 'video',
  PDF: 'pdf',
  TABLE: 'pdf',
  NOTE: 'note',
}

const MATERIAL_DEFAULT_TITLES = {
  IMAGE: '图文素材',
  VIDEO: '视频素材',
  PDF: 'PDF 文档',
  TABLE: '表格文档',
  NOTE: NOTE_DEFAULT_TITLE,
} as const
const MATERIAL_TITLE_MAX_LENGTH = 30
const UPLOAD_CONCURRENCY = 3
const THUMBNAIL_CONCURRENCY = 6
const thumbnailSourceById = new Map<string, MaterialThumbnailSource>()

/** fileUrl 为多图 JSON 数组字符串或单个 URL，统一解析为 URL 列表 */
function parseImageUrls(fileUrl: string | null): string[] {
  if (!fileUrl) return []

  if (fileUrl.startsWith('[')) {
    try {
      const parsed = JSON.parse(fileUrl) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string').map(resolveMediaUrl)
      }
    } catch (error) {
      // 非 JSON 数组时按单文件 URL 处理
    }
  }

  return [fileUrl].map(resolveMediaUrl)
}

export interface MaterialThumbnailSource {
  id: string
  fileType?: string | null
  coverUrl?: string | null
  fileUrl?: string | null
}

function isDocumentFileType(fileType: string | null | undefined): boolean {
  return fileType === 'PDF' || fileType === 'TABLE'
}

function resolveThumbnail(material: MaterialThumbnailSource): string {
  if (material.coverUrl) return resolveMediaUrl(material.coverUrl)
  return material.fileType === 'IMAGE' ? parseImageUrls(material.fileUrl ?? null)[0] ?? '' : ''
}

export function resolveMaterialListThumbnail(material: MaterialThumbnailSource): string {
  return resolveThumbnail(material)
}

export function rememberMaterialThumbnailSources(sources: MaterialThumbnailSource[]): void {
  for (const source of sources) {
    const id = String(source.id ?? '')
    if (!id) continue
    thumbnailSourceById.set(id, { ...source, id })
  }
}

export function enrichThumbnailsByIds(ids: string[]): Promise<Map<string, string>> {
  const sources = [...new Set(ids)]
    .map((id) => thumbnailSourceById.get(id))
    .filter((source): source is MaterialThumbnailSource => source != null)

  if (sources.length === 0) return Promise.resolve(new Map())
  return prepareMaterialThumbnailMap(sources)
}

export function applyThumbnailMap<T extends { id: string; thumbnailUrl: string }>(
  items: T[],
  thumbs: Map<string, string>,
): T[] {
  if (thumbs.size === 0) return items
  return items.map((item) => {
    const thumbnailUrl = thumbs.get(item.id)
    return thumbnailUrl ? { ...item, thumbnailUrl } : item
  })
}

/** 图片/视频用封面；PDF/表格无封面时取第一页渲染图 */
export function prepareMaterialThumbnail(material: MaterialThumbnailSource): Promise<string> {
  if (!material.id) return Promise.resolve('')

  const load = !material.coverUrl && isDocumentFileType(material.fileType)
    ? prepareDocumentPageImage(String(material.id), 0)
    : prepareMediaUrl(resolveThumbnail(material))

  return load.catch(() => '')
}

export function prepareMaterialThumbnails(sources: MaterialThumbnailSource[]): Promise<string[]> {
  return runRequestQueue(
    sources.map((material) => () => prepareMaterialThumbnail(material).catch(() => '')),
    THUMBNAIL_CONCURRENCY,
  )
}

export function prepareMaterialThumbnailMap(sources: MaterialThumbnailSource[]): Promise<Map<string, string>> {
  const unique: MaterialThumbnailSource[] = []
  const seen = new Set<string>()

  for (const source of sources) {
    const id = String(source.id ?? '')
    if (!id || seen.has(id)) continue
    seen.add(id)
    unique.push({ ...source, id })
  }

  return prepareMaterialThumbnails(unique).then((urls) => (
    new Map(unique.map((source, index) => [source.id, urls[index] ?? '']))
  ))
}

/** 列表展示用户填写的文案；content 为空时回退 title（兼容旧数据 / 仅有文件名的素材） */
function resolveMaterialCopy(material: ApiMaterial): string {
  const noteBlocks = parseNoteContent(material.content)
  if (noteBlocks) return extractNotePlainText(noteBlocks)
  if (material.content != null && material.content.trim() !== '') return material.content
  return material.title ?? ''
}

function splitMaterialCopy(copy: string): string[] {
  if (!copy) return []
  return copy.split(/\r?\n/)
}

export function getMaterials(): Promise<MaterialsViewModel> {
  return request<ApiMaterial[]>({ method: 'GET', path: '/material/mine', silent: true }).then((materials) => {
    const sources = materials.map((material) => ({
      id: String(material.id),
      fileType: material.fileType,
      coverUrl: material.coverUrl,
      fileUrl: material.fileUrl,
    }))
    rememberMaterialThumbnailSources(sources)

    return {
      filters: materialsFilters,
      items: materials.map((material, index) => ({
        id: String(material.id),
        title: resolveMaterialCopy(material),
        date: formatDateKey(material.createTime),
        thumbnailUrl: resolveThumbnail(sources[index]),
        kind: materialKinds[material.fileType] ?? 'pdf',
      })),
    }
  })
}

export function deleteMaterials(ids: string[]): Promise<void> {
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter((id) => id !== ''))]
  return uniqueIds.reduce(
    (chain, id) =>
      chain.then(() =>
        request<void>({
          method: 'DELETE',
          path: `/material/${id}`,
        }),
      ),
    Promise.resolve(),
  )
}

const EMPTY_ENGAGEMENT: ApiMaterialEngagement = {
  likeCount: 0,
  forwardCount: 0,
  commentCount: 0,
  liked: false,
}

const COMMENT_AVATAR_PLACEHOLDER = '/assets/auth/avatar-placeholder.svg'

function normalizeEngagement(data: ApiMaterialEngagement | null | undefined): ApiMaterialEngagement {
  return {
    likeCount: Math.max(0, Math.trunc(Number(data?.likeCount) || 0)),
    forwardCount: Math.max(0, Math.trunc(Number(data?.forwardCount) || 0)),
    commentCount: Math.max(0, Math.trunc(Number(data?.commentCount) || 0)),
    liked: Boolean(data?.liked),
  }
}

export function mapMaterialEngagement(
  engagement: ApiMaterialEngagement | null | undefined,
): Pick<
  MaterialDetailViewModel,
  'likeCount' | 'forwardCount' | 'commentCount' | 'liked' | 'likeCountLabel' | 'forwardCountLabel' | 'commentCountLabel'
> {
  const next = normalizeEngagement(engagement)
  return {
    ...next,
    likeCountLabel: formatCompactCount(next.likeCount),
    forwardCountLabel: formatCompactCount(next.forwardCount),
    commentCountLabel: formatCompactCount(next.commentCount),
  }
}

export function getMaterialEngagement(materialId: string): Promise<ApiMaterialEngagement> {
  return request<ApiMaterialEngagement>({
    method: 'GET',
    path: `/material/${materialId}/engagement`,
    silent: true,
  }).then(normalizeEngagement)
}

export function toggleMaterialLike(materialId: string): Promise<ApiMaterialEngagement> {
  return request<ApiMaterialEngagement>({
    method: 'POST',
    path: `/material/${materialId}/like`,
    silent: true,
  }).then(normalizeEngagement)
}

function mapMaterialComment(comment: ApiMaterialComment): MaterialCommentViewModel {
  return {
    id: String(comment.id),
    userId: String(comment.userId),
    nickname: comment.nickname?.trim() || '用户',
    avatar: resolveMediaUrl(comment.avatar) || COMMENT_AVATAR_PLACEHOLDER,
    content: comment.content ?? '',
    timeLabel: formatRelativeDayTime(comment.createTime),
  }
}

export function listMaterialComments(materialId: string): Promise<MaterialCommentViewModel[]> {
  return request<ApiMaterialComment[]>({
    method: 'GET',
    path: `/material/${materialId}/comments`,
    silent: true,
  }).then((comments) => (Array.isArray(comments) ? comments.map(mapMaterialComment) : []))
}

export function addMaterialComment(materialId: string, content: string): Promise<MaterialCommentViewModel> {
  return request<ApiMaterialComment>({
    method: 'POST',
    path: `/material/${materialId}/comments`,
    data: { content },
  }).then(mapMaterialComment)
}

export function getMaterialDetail(
  materialId: string,
  ownerView = false,
  forceVisitorView = false,
): Promise<MaterialDetailViewModel | null> {
  return Promise.all([
    request<ApiMaterial>({ method: 'GET', path: `/material/${materialId}`, silent: true, skipAuth: true }),
    getMaterialEngagement(materialId).catch(() => EMPTY_ENGAGEMENT),
  ]).then(async ([material, engagement]) => {
      const fileType = material.fileType ?? 'IMAGE'
      const userPromise = !isSinglePageMode() && hasAuthorizedLogin()
        ? ensureLogin().catch(() => getCachedLogin())
        : Promise.resolve(getCachedLogin())

      let images: string[] = []
      let videoUrl = ''
      let pdfUrl = ''
      let pdfFileName = ''
      let noteBlocks = [] as MaterialDetailViewModel['noteBlocks']
      let previewUrl = ''

      if (fileType === 'IMAGE') {
        const urls = parseImageUrls(material.fileUrl)
        const first = urls[0] ? await prepareMediaUrl(urls[0]) : ''
        images = urls.map((url, index) => (index === 0 ? (first || url) : url)).filter((url) => url !== '')
        previewUrl = resolveThumbnail(material)
      } else if (fileType === 'VIDEO') {
        videoUrl = resolveMediaUrl(material.fileUrl)
        previewUrl = await prepareMaterialThumbnail(material)
      } else if (fileType === 'PDF' || fileType === 'TABLE') {
        pdfUrl = resolveMediaUrl(material.fileUrl)
        pdfFileName = material.title?.trim() || (fileType === 'TABLE' ? '表格文档' : 'PDF 文档')
        previewUrl = await prepareMaterialThumbnail(material)
      } else if (isNoteFileType(fileType)) {
        noteBlocks = await prepareNoteDetailForOpen(parseNoteContent(material.content) ?? [])
        previewUrl = resolveThumbnail(material)
      } else {
        previewUrl = await prepareMaterialThumbnail(material)
      }

      const user = await userPromise

      return {
        id: String(material.id),
        trackingId: material.trackingId ?? '',
        title: '作品',
        fileType,
        images: images.filter((url) => url !== ''),
        previewUrl,
        videoUrl,
        duration: material.duration ?? 0,
        pdfUrl,
        pdfFileName,
        noteBlocks,
        descriptionLines: splitMaterialCopy(resolveMaterialCopy(material)),
        isOwner: forceVisitorView ? false : ownerView || Boolean(user && String(material.userId) === String(user.userId)),
        ...mapMaterialEngagement(engagement),
      }
    })
}

/** 详情页已经显示后，继续下载多图和笔记里第一张之外的图片。 */
export function finishMaterialDetailMedia(
  detail: MaterialDetailViewModel,
): Promise<{ images: string[]; noteBlocks: MaterialDetailViewModel['noteBlocks'] } | null> {
  if (detail.fileType === 'IMAGE') {
    if (detail.images.length <= 1) return Promise.resolve(null)
    return prepareMediaUrls(detail.images.slice(1)).then((rest) => ({
      images: [detail.images[0], ...rest],
      noteBlocks: detail.noteBlocks,
    }))
  }
  if (detail.fileType !== 'NOTE') return Promise.resolve(null)
  return prepareRemainingNoteBlocks(detail.noteBlocks).then((noteBlocks) => ({
    images: detail.images,
    noteBlocks,
  }))
}

/** 分享前置页用的列表预览图；未登录访客也可读取封面，并区分作品是否已删除。 */
export function getMaterialListPreview(materialId: string): Promise<{ url: string; deleted: boolean }> {
  const id = materialId.trim()
  if (!id) return Promise.resolve({ url: '', deleted: false })

  return request<ApiMaterial>({
    method: 'GET',
    path: `/material/${id}`,
    silent: true,
    skipAuth: true,
  })
    .then((material) => prepareMaterialThumbnail(material))
    .then((url) => ({ url, deleted: false }))
    .catch((error) => ({
      url: '',
      deleted: isMaterialDeletedError(error),
    }))
}

/** 分享卡片用的标题和预览图，与详情页分享同一数据来源。 */
export function getMaterialShareCard(
  materialId: string,
  fallbackCopy: string,
  fallbackImageUrl = '',
): Promise<{ shareTitle: string; shareImageUrl: string; shareTrackingId: string }> {
  const fallbackTitle = buildMaterialShareTitle(fallbackCopy.split(/\r?\n/))

  return request<ApiMaterial>({ method: 'GET', path: `/material/${materialId}`, silent: true })
    .then(async (material) => {
      const previewUrl = await prepareMaterialThumbnail(material)
      const sourceUrl = previewUrl || fallbackImageUrl
      const shareImageUrl = (await prepareShareCardImage(sourceUrl)) || sourceUrl
      return {
        shareTitle: buildMaterialShareTitle(splitMaterialCopy(resolveMaterialCopy(material))) || fallbackTitle,
        shareImageUrl,
        shareTrackingId: material.trackingId ?? '',
      }
    })
    .catch(() =>
      prepareShareCardImage(fallbackImageUrl).then((shareImageUrl) => ({
        shareTitle: fallbackTitle,
        shareImageUrl: shareImageUrl || fallbackImageUrl,
        shareTrackingId: '',
      })),
    )
}

function kindFromFileType(fileType: string): PublishMediaKind {
  return materialKinds[fileType] ?? 'pdf'
}

export function getMaterialDraft(materialId: string): Promise<MaterialDraftEditViewModel | null> {
  return request<ApiMaterial>({ method: 'GET', path: `/material/${materialId}`, silent: true })
    .then(async (material) => {
      const fileType = material.fileType ?? 'IMAGE'
      const kind = kindFromFileType(fileType)
      const sourceUrls = parseImageUrls(material.fileUrl)
      const paths = await prepareMediaUrls(sourceUrls)
      const previewPath = material.coverUrl ? await prepareMediaUrl(resolveMediaUrl(material.coverUrl)) : ''

      const media: PublishMediaViewModel[] =
        kind === 'image'
          ? sourceUrls.map((url, index) => ({
              id: url,
              path: paths[index] ?? url,
              kind: 'image',
              previewPath: '',
              name: '',
              duration: 0,
              remoteUrl: url,
            }))
          : [
              {
                id: sourceUrls[0] ?? String(material.id),
                path: paths[0] ?? sourceUrls[0] ?? '',
                kind,
                previewPath,
                name: kind === 'pdf' ? material.title?.trim() || MATERIAL_DEFAULT_TITLES.PDF : '',
                duration: material.duration ?? 0,
                remoteUrl: sourceUrls[0] ?? '',
              },
            ]

      return {
        id: String(material.id),
        media,
        copy: resolveMaterialCopy(material),
      }
    })
    .catch(() => null)
}

function shouldUploadLocalPath(path: string): boolean {
  if (
    path.startsWith('wxfile://')
    || path.startsWith('http://tmp/')
    || path.startsWith('https://tmp/')
  ) {
    return true
  }
  return !/^https?:\/\//i.test(path)
}

function buildMaterialTitle(copy: string, fallbackTitle: string): string {
  const firstLine = copy
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line !== '')

  return firstLine ? firstLine.slice(0, MATERIAL_TITLE_MAX_LENGTH) : fallbackTitle.slice(0, MATERIAL_TITLE_MAX_LENGTH)
}

function uploadLocalFile(path: string, control?: FileUploadOptions): Promise<string> {
  return shouldUploadLocalPath(path) ? uploadFile('/material/upload-file', path, control) : Promise.resolve(path)
}

/** 已有作品预填的远端文件可直接复用；用户新选的本地文件才上传。 */
function persistMediaFile(item: PublishMediaViewModel, control?: FileUploadOptions): Promise<string> {
  if (!shouldUploadLocalPath(item.path)) return Promise.resolve(item.path)
  const remoteUrl = item.remoteUrl ?? ''
  if (remoteUrl && !shouldUploadLocalPath(remoteUrl)) return Promise.resolve(remoteUrl)
  return uploadFile('/material/upload-file', item.path, control)
}

function persistMediaFiles(items: PublishMediaViewModel[]): Promise<string[]> {
  return runRequestQueue(
    items.map((item) => () => persistMediaFile(item)),
    UPLOAD_CONCURRENCY,
  )
}

function isExistingMediaUnchanged(input: MaterialSubmitInput): boolean {
  return (
    input.draftId !== null &&
    input.originalMediaPaths.length === input.media.length &&
    input.media.every((item, index) => item.path === input.originalMediaPaths[index])
  )
}

function fallbackTitleFor(input: MaterialSubmitInput): string {
  const first = input.media[0]
  if (first?.kind === 'video') return MATERIAL_DEFAULT_TITLES.VIDEO
  if (first?.kind === 'pdf') return first.name.replace(/\.pdf$/i, '').trim() || MATERIAL_DEFAULT_TITLES.PDF
  return MATERIAL_DEFAULT_TITLES.IMAGE
}

function updateMaterial(
  materialId: string,
  data: { title?: string; content?: string; fileUrl?: string; coverUrl?: string; duration?: number },
  timeout?: number,
): Promise<string> {
  return request<ApiMaterial>({
    method: 'PUT',
    path: `/material/${materialId}`,
    silent: true,
    timeout,
    data,
  }).then(() => materialId)
}

export interface MaterialWriteOptions {
  timeout?: number
}

/** 只把本地文件直传到 OSS，不创建素材、不跳转。 */
export function uploadMaterialFiles(input: MaterialSubmitInput, control?: FileUploadOptions): Promise<PublishMediaViewModel[]> {
  if (input.media.length === 0 || isExistingMediaUnchanged(input)) {
    control?.onProgress?.(1)
    return Promise.resolve(input.media)
  }
  const slots = input.media.map(() => 0)
  const emit = (): void => {
    if (!control?.onProgress) return
    const sum = slots.reduce((total, value) => total + value, 0)
    control.onProgress(sum / slots.length)
  }
  return runRequestQueue(
    input.media.map((item, index) => () => {
      const hasCover = Boolean(item.previewPath && shouldUploadLocalPath(item.previewPath))
      return persistMediaFile(item, {
        timeout: control?.timeout,
        onProgress: (ratio) => {
          slots[index] = ratio * (hasCover ? 0.85 : 1)
          emit()
        },
      }).then((fileUrl) => {
        const coverTask = hasCover
          ? uploadLocalFile(item.previewPath, {
            timeout: control?.timeout,
            onProgress: (ratio) => {
              slots[index] = 0.85 + ratio * 0.15
              emit()
            },
          }).catch(() => item.previewPath)
          : Promise.resolve(item.previewPath)
        return coverTask.then((previewPath) => {
          slots[index] = 1
          emit()
          return {
            ...item,
            remoteUrl: fileUrl,
            previewPath: previewPath || item.previewPath,
          }
        })
      })
    }),
    UPLOAD_CONCURRENCY,
  )
}

function createMaterial(input: {
  fileType: 'IMAGE' | 'VIDEO' | 'PDF' | 'NOTE'
  fileUrl: string
  coverUrl: string
  duration: number
  copy: string
  fallbackTitle: string
  content?: string
}, timeout?: number): Promise<string> {
  return request<ApiMaterial>({
    method: 'POST',
    path: '/material',
    silent: true,
    timeout,
    data: {
      title: buildMaterialTitle(input.copy, input.fallbackTitle),
      content: input.content ?? input.copy,
      fileType: input.fileType,
      fileUrl: input.fileUrl,
      coverUrl: input.coverUrl,
      duration: input.duration,
    },
  }).then((material) => String(material.id))
}

function persistMaterialFields(input: MaterialSubmitInput): Promise<{
  fileType: 'IMAGE' | 'VIDEO' | 'PDF'
  fileUrl: string
  coverUrl: string
  duration: number
  fallbackTitle: string
}> {
  const kind = input.media[0]?.kind
  if (kind === 'video') {
    const video = input.media[0]
    return persistMediaFile(video).then((fileUrl) => {
      const coverTask = video.previewPath ? uploadLocalFile(video.previewPath).catch(() => '') : Promise.resolve('')
      return coverTask.then((coverUrl) => ({
        fileType: 'VIDEO' as const,
        fileUrl,
        coverUrl,
        duration: Math.round(video.duration),
        fallbackTitle: MATERIAL_DEFAULT_TITLES.VIDEO,
      }))
    })
  }

  if (kind === 'pdf') {
    const pdf = input.media[0]
    const fallbackTitle = pdf.name.replace(/\.pdf$/i, '').trim() || MATERIAL_DEFAULT_TITLES.PDF
    return persistMediaFile(pdf).then((fileUrl) => ({
      fileType: 'PDF' as const,
      fileUrl,
      coverUrl: '',
      duration: 0,
      fallbackTitle,
    }))
  }

  return persistMediaFiles(input.media).then((imageUrls) => ({
    fileType: 'IMAGE' as const,
    fileUrl: JSON.stringify(imageUrls),
    coverUrl: imageUrls[0] ?? '',
    duration: 0,
    fallbackTitle: MATERIAL_DEFAULT_TITLES.IMAGE,
  }))
}

function persistMaterial(input: MaterialSubmitInput, timeout?: number): Promise<string> {
  if (input.media.length === 0) {
    wx.showToast({ title: '请先添加素材', icon: 'none' })
    return Promise.reject(new Error('material media required'))
  }

  const materialId = input.draftId
  if (materialId && isExistingMediaUnchanged(input)) {
    return updateMaterial(materialId, {
      title: buildMaterialTitle(input.copy, fallbackTitleFor(input)),
      content: input.copy,
    }, timeout)
  }

  return persistMaterialFields(input).then((fields) => {
    if (materialId) {
      return updateMaterial(materialId, {
        title: buildMaterialTitle(input.copy, fields.fallbackTitle),
        content: input.copy,
        fileUrl: fields.fileUrl,
        coverUrl: fields.coverUrl,
        duration: fields.duration,
      }, timeout)
    }

    return createMaterial({
      fileType: fields.fileType,
      fileUrl: fields.fileUrl,
      coverUrl: fields.coverUrl,
      duration: fields.duration,
      copy: input.copy,
      fallbackTitle: fields.fallbackTitle,
    }, timeout)
  })
}

/** 创建或修改作品后生成分享链接（已发布作品不会更换追踪码），返回素材 ID */
export function publishMaterial(input: MaterialSubmitInput, options?: MaterialWriteOptions): Promise<string> {
  return persistMaterial(input, options?.timeout).then((materialId) =>
    request<ApiMaterial>({
      method: 'POST',
      path: `/material/${materialId}/share`, silent: true,
      timeout: options?.timeout,
    }).then(() => materialId),
  )
}

async function hydrateNoteBlock(block: NoteBlock): Promise<NoteBlock> {
  if (block.type === 'image') {
    const source = block.remoteUrl || block.path
    const path = source ? await prepareMediaUrl(resolveMediaUrl(source)) : ''
    return { ...block, path: path || source, remoteUrl: source }
  }
  if (block.type === 'video') {
    const source = block.remoteUrl || block.path
    const coverSource = block.remoteCoverUrl || block.coverPath
    const path = source ? resolveMediaUrl(source) : ''
    const coverPath = coverSource ? await prepareMediaUrl(resolveMediaUrl(coverSource)).catch(() => '') : ''
    return { ...block, path, coverPath, remoteUrl: source, remoteCoverUrl: coverSource }
  }
  if (block.type === 'file') {
    const source = block.remoteUrl || block.path
    return { ...block, path: source ? resolveMediaUrl(source) : '', remoteUrl: source }
  }
  return block
}

async function prepareNoteDetailForOpen(blocks: NoteBlock[]): Promise<MaterialDetailViewModel['noteBlocks']> {
  const firstImageIndex = blocks.findIndex((block) => block.type === 'image' && (block.remoteUrl || block.path))
  const hydrated = await Promise.all(blocks.map(async (block, index) => {
    if (block.type === 'image' && index === firstImageIndex) return hydrateNoteBlock(block)
    if (block.type === 'image') {
      const source = block.remoteUrl || block.path
      return { ...block, path: source ? resolveMediaUrl(source) : '', remoteUrl: source }
    }
    if (block.type === 'video') {
      const source = block.remoteUrl || block.path
      const coverSource = block.remoteCoverUrl || block.coverPath
      return {
        ...block,
        path: source ? resolveMediaUrl(source) : '',
        coverPath: coverSource ? resolveMediaUrl(coverSource) : '',
        remoteUrl: source,
        remoteCoverUrl: coverSource,
      }
    }
    if (block.type === 'file') {
      const source = block.remoteUrl || block.path
      return { ...block, path: source ? resolveMediaUrl(source) : '', remoteUrl: source }
    }
    return block
  }))
  return toNoteDisplayBlocks(hydrated)
}

function prepareRemainingNoteBlocks(
  blocks: MaterialDetailViewModel['noteBlocks'],
): Promise<MaterialDetailViewModel['noteBlocks']> {
  let skippedFirstImage = false
  return Promise.all(blocks.map(async (block) => {
    if (block.type === 'image') {
      if (!skippedFirstImage && block.path) {
        skippedFirstImage = true
        return block
      }
      const path = block.path ? await prepareMediaUrl(block.path) : ''
      return { ...block, path: path || block.path }
    }
    if (block.type === 'video' && block.coverPath) {
      const coverPath = await prepareMediaUrl(block.coverPath).catch(() => block.coverPath)
      return { ...block, coverPath: coverPath || block.coverPath }
    }
    return block
  }))
}

export function getNoteDraft(materialId: string): Promise<NoteDraftViewModel | null> {
  return request<ApiMaterial>({ method: 'GET', path: `/material/${materialId}` })
    .then(async (material) => {
      if (!isNoteFileType(material.fileType)) return null
      const parsed = parseNoteContent(material.content) ?? []
      const blocks = await Promise.all(parsed.map((block) => hydrateNoteBlock(block)))
      return { id: String(material.id), blocks: blocks.length > 0 ? blocks : [] }
    })
    .catch(() => null)
}

async function persistNoteBlock(block: NoteBlock, control?: FileUploadOptions): Promise<NoteBlock> {
  if (block.type === 'image') {
    const fileUrl = await persistNoteFile(block.path, block.remoteUrl, control)
    return { ...block, path: fileUrl, remoteUrl: fileUrl }
  }
  if (block.type === 'video') {
    const hasCover = Boolean(block.coverPath)
    const fileUrl = await persistNoteFile(block.path, block.remoteUrl, {
      timeout: control?.timeout,
      onProgress: (ratio) => control?.onProgress?.(hasCover ? ratio * 0.85 : ratio),
    })
    const coverUrl = hasCover
      ? await persistNoteFile(block.coverPath, block.remoteCoverUrl, {
        timeout: control?.timeout,
        onProgress: (ratio) => control?.onProgress?.(0.85 + ratio * 0.15),
      }).catch(() => '')
      : block.remoteCoverUrl ?? ''
    control?.onProgress?.(1)
    return { ...block, path: fileUrl, remoteUrl: fileUrl, coverPath: coverUrl, remoteCoverUrl: coverUrl, duration: Math.round(block.duration) }
  }
  if (block.type === 'file') {
    const fileUrl = await persistNoteFile(block.path, block.remoteUrl, control)
    return { ...block, path: fileUrl, remoteUrl: fileUrl }
  }
  return block
}

function persistNoteFile(path: string, remoteUrl?: string, control?: FileUploadOptions): Promise<string> {
  if (!shouldUploadLocalPath(path)) return Promise.resolve(path || remoteUrl || '')
  if (remoteUrl && !shouldUploadLocalPath(remoteUrl)) return Promise.resolve(remoteUrl)
  return uploadFile('/material/upload-file', path, control)
}

function firstNoteCover(blocks: NoteBlock[]): { fileUrl: string; coverUrl: string; duration: number } {
  const image = blocks.find((block): block is Extract<NoteBlock, { type: 'image' }> => block.type === 'image')
  if (image) return { fileUrl: image.remoteUrl || image.path, coverUrl: image.remoteUrl || image.path, duration: 0 }

  const video = blocks.find((block): block is Extract<NoteBlock, { type: 'video' }> => block.type === 'video')
  if (video) {
    return {
      fileUrl: video.remoteUrl || video.path,
      coverUrl: video.remoteCoverUrl || video.coverPath || '',
      duration: Math.round(video.duration),
    }
  }

  const file = blocks.find((block): block is Extract<NoteBlock, { type: 'file' }> => block.type === 'file')
  if (file) return { fileUrl: file.remoteUrl || file.path, coverUrl: '', duration: 0 }

  return { fileUrl: NOTE_PLACEHOLDER_FILE_URL, coverUrl: '', duration: 0 }
}

/** 只把笔记本地附件直传到 OSS，不创建素材、不跳转。 */
export function uploadNoteFiles(input: NoteSubmitInput, control?: FileUploadOptions): Promise<NoteBlock[]> {
  if (!hasNoteContent(input.blocks)) return Promise.resolve(input.blocks)
  if (input.draftId !== null && noteAttachmentSignature(input.blocks) === input.originalAttachmentSignature) {
    control?.onProgress?.(1)
    return Promise.resolve(input.blocks)
  }
  const weights = input.blocks.map((block) => (block.type === 'text' ? 0 : 1))
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  const slots = input.blocks.map(() => 0)
  const emit = (): void => {
    if (!control?.onProgress || total === 0) return
    let sum = 0
    slots.forEach((value, index) => {
      if (weights[index]) sum += value
    })
    control.onProgress(sum / total)
  }
  if (total === 0) control?.onProgress?.(1)
  return runRequestQueue(
    input.blocks.map((block, index) => () => {
      if (block.type === 'text') return Promise.resolve(block)
      return persistNoteBlock(block, {
        timeout: control?.timeout,
        onProgress: (ratio) => {
          slots[index] = ratio
          emit()
        },
      }).then((next) => {
        slots[index] = 1
        emit()
        return next
      })
    }),
    UPLOAD_CONCURRENCY,
  )
}

function persistNoteMaterial(input: NoteSubmitInput, timeout?: number): Promise<string> {
  if (!hasNoteContent(input.blocks)) {
    wx.showToast({ title: '请先添加笔记内容', icon: 'none' })
    return Promise.reject(new Error('note content required'))
  }

  const attachmentsUnchanged =
    input.draftId !== null && noteAttachmentSignature(input.blocks) === input.originalAttachmentSignature

  if (attachmentsUnchanged && input.draftId) {
    return updateMaterial(input.draftId, {
      title: extractNoteTitle(input.blocks),
      content: serializeNoteContent(input.blocks),
    }, timeout)
  }

  return runRequestQueue(
    input.blocks.map((block) => () => persistNoteBlock(block)),
    UPLOAD_CONCURRENCY,
  ).then((blocks) => {
    const media = firstNoteCover(blocks)
    const payload = {
      title: extractNoteTitle(blocks),
      content: serializeNoteContent(blocks),
      fileUrl: media.fileUrl || NOTE_PLACEHOLDER_FILE_URL,
      coverUrl: media.coverUrl,
      duration: media.duration,
    }
    if (input.draftId) return updateMaterial(input.draftId, payload, timeout)
    return createMaterial({
      fileType: NOTE_FILE_TYPE,
      fileUrl: payload.fileUrl,
      coverUrl: payload.coverUrl,
      duration: payload.duration,
      copy: extractNotePlainText(blocks),
      fallbackTitle: payload.title,
      content: payload.content,
    }, timeout)
  })
}

export function publishNote(input: NoteSubmitInput, options?: MaterialWriteOptions): Promise<string> {
  return persistNoteMaterial(input, options?.timeout).then((materialId) =>
    request<ApiMaterial>({
      method: 'POST',
      path: `/material/${materialId}/share`, silent: true,
      timeout: options?.timeout,
    }).then(() => materialId),
  )
}
