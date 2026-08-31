import type { PublishMediaKind, PublishMediaViewModel } from '../types/materials'

export const MAX_IMAGE_COUNT = 9
export const MAX_VIDEO_DURATION_SECONDS = 30

export type PublishEntryType = 'image' | 'video' | 'pdf'

export const PUBLISH_TYPE_OPTIONS = [
  { id: 'image', label: '图片' },
  { id: 'video', label: '视频' },
  { id: 'pdf', label: 'PDF' },
] as const

export const PUBLISH_ENTRY_TYPE_OPTIONS = PUBLISH_TYPE_OPTIONS

export type PublishTypeOptionId = (typeof PUBLISH_TYPE_OPTIONS)[number]['id']

export const PUBLISH_SOURCE_OPTIONS = [
  { id: 'camera', label: '拍摄' },
  { id: 'album', label: '从相册选择' },
] as const

export function getPublishEntryType(value: string | undefined): PublishEntryType | null {
  if (value === 'image' || value === 'video' || value === 'pdf') return value
  return null
}

export function getMediaPickerType(entryType: PublishEntryType): 'image' | 'video' | 'pdf' {
  return entryType
}

export function getPublishTypeOptions(
  items: Array<{ kind: PublishMediaKind }>,
): Array<(typeof PUBLISH_TYPE_OPTIONS)[number]> {
  const kind = items[0]?.kind
  if (!kind) return [...PUBLISH_TYPE_OPTIONS]
  return PUBLISH_TYPE_OPTIONS.filter((option) => option.id === kind)
}

export function canAddPublishMedia(items: Array<{ kind: PublishMediaKind }>): boolean {
  if (items.length === 0) return true
  return items.every((item) => item.kind === 'image') && items.length < MAX_IMAGE_COUNT
}

export function mergePublishMedia(
  current: PublishMediaViewModel[],
  incoming: PublishMediaViewModel[],
): { items: PublishMediaViewModel[]; message?: string } {
  if (incoming.length === 0) return { items: current }

  const currentKind = current[0]?.kind

  if (!currentKind) {
    const pdf = incoming.find((item) => item.kind === 'pdf')
    if (pdf) return { items: [pdf] }

    const video = incoming.find((item) => item.kind === 'video')
    if (video) return { items: [video] }

    return { items: incoming.filter((item) => item.kind === 'image').slice(0, MAX_IMAGE_COUNT) }
  }

  if (currentKind === 'image') {
    if (incoming.some((item) => item.kind === 'pdf')) {
      return { items: current, message: '已添加图片，不能同时选择 PDF' }
    }
    if (incoming.some((item) => item.kind === 'video')) {
      return { items: current, message: '已添加图片，不能同时选择视频' }
    }

    const remaining = MAX_IMAGE_COUNT - current.length
    return { items: [...current, ...incoming.filter((item) => item.kind === 'image').slice(0, remaining)] }
  }

  return {
    items: current,
    message: currentKind === 'video' ? '已添加视频，不能再添加其他素材' : '已添加 PDF，不能再添加其他素材',
  }
}

export function isVideoMediaFile(file: WechatMiniprogram.MediaFile, batchType: string): boolean {
  if (file.duration > 0) return true
  if (file.thumbTempFilePath) return true
  return batchType === 'video'
}

export function mediaFilesToPublishItems(
  files: WechatMiniprogram.MediaFile[],
  batchType: string,
): PublishMediaViewModel[] {
  return files.map((file) => {
    const isVideo = isVideoMediaFile(file, batchType)
    return {
      id: file.tempFilePath,
      path: file.tempFilePath,
      kind: isVideo ? 'video' : 'image',
      previewPath: isVideo ? file.thumbTempFilePath : '',
      name: '',
      duration: isVideo ? file.duration : 0,
    }
  })
}

export function isPdfFileName(name: string): boolean {
  return /\.pdf$/i.test(name)
}
