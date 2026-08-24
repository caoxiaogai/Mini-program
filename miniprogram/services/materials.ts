import type { ApiMaterial } from '../types/api'
import type {
  MaterialCardViewModel,
  MaterialDetailViewModel,
  MaterialDraftEditViewModel,
  MaterialsFilterViewModel,
  MaterialsViewModel,
  MaterialSubmitInput,
  PublishImageViewModel,
  PublishPdfViewModel,
  PublishVideoViewModel,
} from '../types/materials'
import { formatDateKey } from '../utils/format'
import { prepareMediaUrls } from '../utils/media'
import { request, resolveMediaUrl, runRequestQueue, uploadFile } from './request'

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
}

const MATERIAL_DEFAULT_TITLE = '图文素材'
const MATERIAL_TITLE_MAX_LENGTH = 30
const UPLOAD_CONCURRENCY = 3

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

function resolveThumbnail(material: ApiMaterial): string {
  if (material.coverUrl) return resolveMediaUrl(material.coverUrl)
  return material.fileType === 'IMAGE' ? parseImageUrls(material.fileUrl)[0] ?? '' : ''
}

/** 用户发布/编辑时填写的文案；content 为空时回退 title（兼容旧数据） */
function resolveMaterialCopy(material: ApiMaterial): string {
  if (material.content != null && material.content !== '') return material.content
  return material.title ?? ''
}

function splitMaterialCopy(copy: string): string[] {
  if (!copy) return []
  return copy.split(/\r?\n/)
}

export function getMaterials(): Promise<MaterialsViewModel> {
  return request<ApiMaterial[]>({ method: 'GET', path: '/material/mine' }).then(async (materials) => {
    const thumbnailUrls = await prepareMediaUrls(materials.map((material) => resolveThumbnail(material)))

    return {
      filters: materialsFilters,
      items: materials.map((material, index) => ({
        id: String(material.id),
        title: resolveMaterialCopy(material),
        date: formatDateKey(material.createTime),
        thumbnailUrl: thumbnailUrls[index] ?? '',
        kind: materialKinds[material.fileType] ?? 'pdf',
        isDraft: material.publishStatus === 0,
      })),
    }
  })
}

export function getMaterialDetail(materialId: string): Promise<MaterialDetailViewModel | null> {
  return request<ApiMaterial>({
    method: 'GET',
    path: `/material/${materialId}`,
    /** 分享打开时访客未登录，素材详情按 id 公开读取 */
    skipAuth: true,
    silent: true,
  })
    .then(async (material) => {
      const fileType = material.fileType ?? 'IMAGE'
      const coverSource = resolveThumbnail(material)
      const [previewUrl] = await prepareMediaUrls([coverSource])

      let images: string[] = []
      let videoUrl = ''
      let pdfUrl = ''
      let pdfFileName = ''

      if (fileType === 'IMAGE') {
        images = await prepareMediaUrls(parseImageUrls(material.fileUrl))
      } else if (fileType === 'VIDEO') {
        videoUrl = resolveMediaUrl(material.fileUrl)
      } else if (fileType === 'PDF' || fileType === 'TABLE') {
        pdfUrl = resolveMediaUrl(material.fileUrl)
        pdfFileName = material.title?.trim() || (fileType === 'TABLE' ? '表格文档' : 'PDF 文档')
      }

      return {
        id: String(material.id),
        ownerUserId: material.userId,
        title: '作品',
        fileType,
        trackingId: material.trackingId ?? '',
        images,
        previewUrl: previewUrl ?? '',
        videoUrl,
        duration: material.duration ?? 0,
        pdfUrl,
        pdfFileName,
        descriptionLines: splitMaterialCopy(resolveMaterialCopy(material)),
      }
    })
    .catch(() => null)
}

export function getMaterialDraft(materialId: string): Promise<MaterialDraftEditViewModel | null> {
  return request<ApiMaterial>({ method: 'GET', path: `/material/${materialId}` })
    .then(async (material) => {
      const fileType = material.fileType ?? 'IMAGE'

      if (fileType === 'VIDEO') {
        const videoUrl = resolveMediaUrl(material.fileUrl)
        const coverUrl = resolveMediaUrl(material.coverUrl)
        const [videoPath, coverPath] = await prepareMediaUrls([videoUrl, coverUrl])

        return {
          id: String(material.id),
          fileType,
          images: [],
          video: {
            videoPath: videoPath || videoUrl,
            coverPath: coverPath || coverUrl,
            duration: material.duration ?? 0,
          },
          pdf: null,
          copy: material.content ?? '',
        }
      }

      if (fileType === 'PDF') {
        const fileUrl = resolveMediaUrl(material.fileUrl)
        const fileName = material.title?.trim() || 'PDF 文档'

        return {
          id: String(material.id),
          fileType,
          images: [],
          video: null,
          pdf: {
            filePath: fileUrl,
            fileName,
          },
          copy: material.content ?? '',
        }
      }

      const sourceUrls = parseImageUrls(material.fileUrl)
      const paths = await prepareMediaUrls(sourceUrls)

      return {
        id: String(material.id),
        fileType,
        images: sourceUrls.map((url, index) => ({ id: url, path: paths[index] ?? '' })),
        video: null,
        pdf: null,
        copy: material.content ?? '',
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

function uploadLocalPath(path: string): Promise<string> {
  return shouldUploadLocalPath(path) ? uploadFile('/material/upload-file', path) : Promise.resolve(path)
}

function buildMaterialTitle(copy: string): string {
  const firstLine = copy
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line !== '')

  return firstLine ? firstLine.slice(0, MATERIAL_TITLE_MAX_LENGTH) : MATERIAL_DEFAULT_TITLE
}

function uploadLocalImages(images: PublishImageViewModel[]): Promise<string[]> {
  const tasks = images.map((image) => () => uploadLocalPath(image.path))
  return runRequestQueue(tasks, UPLOAD_CONCURRENCY)
}

function createImageMaterial(imageUrls: string[], copy: string): Promise<string> {
  return request<ApiMaterial>({
    method: 'POST',
    path: '/material',
    data: {
      title: buildMaterialTitle(copy),
      content: copy,
      fileType: 'IMAGE',
      fileUrl: JSON.stringify(imageUrls),
      coverUrl: imageUrls[0] ?? '',
      duration: 0,
    },
  }).then((material) => String(material.id))
}

function createVideoMaterial(videoUrl: string, coverUrl: string, duration: number, copy: string): Promise<string> {
  return request<ApiMaterial>({
    method: 'POST',
    path: '/material',
    data: {
      title: buildMaterialTitle(copy),
      content: copy,
      fileType: 'VIDEO',
      fileUrl: videoUrl,
      coverUrl,
      duration,
    },
  }).then((material) => String(material.id))
}

function createPdfMaterial(pdfUrl: string, fileName: string, copy: string): Promise<string> {
  const title = fileName.trim() || buildMaterialTitle(copy)
  return request<ApiMaterial>({
    method: 'POST',
    path: '/material',
    data: {
      title: title.slice(0, MATERIAL_TITLE_MAX_LENGTH),
      content: copy,
      fileType: 'PDF',
      fileUrl: pdfUrl,
      coverUrl: '',
      duration: 0,
    },
  }).then((material) => String(material.id))
}

function uploadVideoAsset(video: PublishVideoViewModel): Promise<{ videoUrl: string; coverUrl: string }> {
  return Promise.all([uploadLocalPath(video.videoPath), uploadLocalPath(video.coverPath)]).then(
    ([videoUrl, coverUrl]) => ({ videoUrl, coverUrl }),
  )
}

/**
 * 保存素材：编辑既有草稿且图片未改动时仅更新文案（PUT）；
 * 其余情况上传本地图片后创建新素材（后端暂无「更新素材图片」接口，见 HANDOFF 待确认项）。
 */
function persistMaterial(input: MaterialSubmitInput): Promise<string> {
  if (input.video) {
    const videoUnchanged =
      input.draftId !== null &&
      input.originalVideoPath !== '' &&
      input.video.videoPath === input.originalVideoPath

    if (input.draftId !== null && videoUnchanged) {
      const draftId = input.draftId
      return request<ApiMaterial>({
        method: 'PUT',
        path: `/material/${draftId}`,
        data: { content: input.copy },
      }).then(() => draftId)
    }

    return uploadVideoAsset(input.video).then(({ videoUrl, coverUrl }) =>
      createVideoMaterial(videoUrl, coverUrl, input.video!.duration, input.copy),
    )
  }

  if (input.pdf) {
    const pdfUnchanged =
      input.draftId !== null &&
      input.originalPdfPath !== '' &&
      input.pdf.filePath === input.originalPdfPath

    if (input.draftId !== null && pdfUnchanged) {
      const draftId = input.draftId
      return request<ApiMaterial>({
        method: 'PUT',
        path: `/material/${draftId}`,
        data: { content: input.copy },
      }).then(() => draftId)
    }

    return uploadLocalPath(input.pdf.filePath).then((pdfUrl) =>
      createPdfMaterial(pdfUrl, input.pdf!.fileName, input.copy),
    )
  }

  if (input.images.length === 0) {
    wx.showToast({ title: '请先添加图片、视频或 PDF', icon: 'none' })
    return Promise.reject(new Error('material media required'))
  }

  const imagesUnchanged =
    input.draftId !== null &&
    input.originalImagePaths.length === input.images.length &&
    input.images.every((image, index) => image.path === input.originalImagePaths[index])

  if (input.draftId !== null && imagesUnchanged) {
    const draftId = input.draftId
    return request<ApiMaterial>({
      method: 'PUT',
      path: `/material/${draftId}`,
      data: { content: input.copy },
    }).then(() => draftId)
  }

  return uploadLocalImages(input.images).then((imageUrls) => createImageMaterial(imageUrls, input.copy))
}

/** 存草稿：素材落库但不生成分享链接（publishStatus 保持 0），返回素材 ID */
export function saveMaterialDraft(input: MaterialSubmitInput): Promise<string> {
  return persistMaterial(input)
}

/** 发表：素材落库后生成分享链接（后端置 publishStatus=1），返回素材 ID */
export function publishMaterial(input: MaterialSubmitInput): Promise<string> {
  return persistMaterial(input).then((materialId) =>
    request<ApiMaterial>({ method: 'POST', path: `/material/${materialId}/share` }).then(() => materialId),
  )
}
