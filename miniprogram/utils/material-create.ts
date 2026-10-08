import type { MaterialCardKind, MaterialCardViewModel, MaterialsFilterId } from '../types/materials'
import { HOME_MATERIALS_TAB_PATH } from './share-material'

/** 后台创建的上传和保存请求不走页面上的 15 秒超时。 */
export const MATERIAL_CREATE_TIMEOUT_MS = 600000

const UNSEEN_STORAGE_KEY = 'materials.unseenCreatedIds'
const UNSEEN_LIMIT = 50

export type MaterialCreateNotice = 'local' | 'created'

export interface MaterialCreatePreview {
  title: string
  date: string
  thumbnailUrl: string
  kind: MaterialCardKind
}

interface MaterialCreateJob extends MaterialCreatePreview {
  localId: string
  materialId: string
  status: 'creating' | 'ready'
  progress: number
  /** 这一轮上传开始时进度条已经走到的百分比。新的文件字节只填充剩下的部分。 */
  progressBase: number
  notifiedAt: number
  sequence: number
  run: (reportProgress: (ratio: number) => void) => Promise<string>
  running: boolean
  paused: boolean
  resumeQueued: boolean
}

interface MaterialListPage {
  refreshMaterialCreateCards?: (notice: MaterialCreateNotice) => void
}

const jobs: MaterialCreateJob[] = []
const memoryUnseen: string[] = []
const creationOrder: Array<{ id: string; sequence: number }> = []
let nextCreateSequence = 1
let appForeground = true

export function materialCreateDateKey(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function publishCreatePreview(
  copy: string,
  media: Array<{ kind: string; path: string; previewPath?: string; name?: string }>,
): MaterialCreatePreview {
  const first = media[0]
  const kind: MaterialCardKind = first?.kind === 'video' ? 'video' : first?.kind === 'pdf' ? 'pdf' : 'image'
  const line = copy.split(/\r?\n/).map((item) => item.trim()).find((item) => item !== '')
  const pdfName = (first?.name ?? '').replace(/\.pdf$/i, '').trim()
  const fallback = kind === 'video' ? '视频素材' : kind === 'pdf' ? (pdfName || 'PDF 文档') : '图文素材'
  const thumbnailUrl = kind === 'video' ? (first?.previewPath || '') : kind === 'image' ? (first?.path || '') : ''
  return {
    title: (line || fallback).slice(0, 30),
    date: materialCreateDateKey(),
    thumbnailUrl,
    kind,
  }
}

export function startMaterialCreateJob(
  preview: MaterialCreatePreview,
  run: (reportProgress: (ratio: number) => void) => Promise<string>,
): void {
  const job: MaterialCreateJob = {
    ...preview,
    localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    materialId: '',
    status: 'creating',
    progress: 0,
    progressBase: 0,
    notifiedAt: 0,
    sequence: nextCreateSequence,
    run,
    running: false,
    paused: false,
    resumeQueued: false,
  }
  nextCreateSequence += 1
  jobs.unshift(job)
  notifyMaterialLists('local')
  runMaterialCreateJob(job)
}

/** 小程序进入后台。进度停在当前字节百分比；正在上传的请求会被微信打断，卡片先留着。 */
export function pauseMaterialCreatesForBackground(): void {
  appForeground = false
  jobs.forEach((job) => {
    job.resumeQueued = false
  })
}

/** 回到前台后，把被打断的创建接着跑。还在进行中的那一次不会再开一条。 */
export function resumeMaterialCreatesForForeground(): void {
  appForeground = true
  jobs.forEach((job) => {
    job.resumeQueued = false
    if (job.status === 'creating' && job.paused && !job.running) runMaterialCreateJob(job)
  })
}

function runMaterialCreateJob(job: MaterialCreateJob): void {
  if (job.running || job.status !== 'creating') return
  job.progressBase = job.progress
  job.paused = false
  job.running = true
  Promise.resolve()
    .then(() => job.run((ratio) => updateJobProgress(job.localId, ratio)))
    .then((materialId) => {
      job.running = false
      const id = String(materialId || '').trim()
      if (!id) throw new Error('创建失败')
      finishJob(job.localId, id)
    })
    .catch((error: unknown) => {
      const current = jobs.find((item) => item.localId === job.localId)
      if (!current || current.status !== 'creating') return
      current.running = false
      const message = error instanceof Error ? error.message : ''
      if (!appForeground || /interrupted/i.test(message)) {
        current.paused = true
        if (appForeground && !current.resumeQueued) {
          current.resumeQueued = true
          runMaterialCreateJob(current)
        }
        return
      }
      current.resumeQueued = false
      removeJob(current.localId)
      showCreateFailure(error)
      notifyMaterialLists('local')
    })
}

export function mergeCreatingMaterials(items: MaterialCardViewModel[]): MaterialCardViewModel[] {
  const known = new Set(items.map((item) => item.id))
  for (let index = jobs.length - 1; index >= 0; index -= 1) {
    const job = jobs[index]
    if (job.status === 'ready' && job.materialId && known.has(job.materialId)) jobs.splice(index, 1)
  }

  const unseen = new Set(readUnseenIds())
  const decorated = items.map((item) => ({
    ...item,
    creating: false,
    progress: 0,
    isNew: unseen.has(item.id),
  }))
  const pending: MaterialCardViewModel[] = jobs
    .filter((job) => {
      const id = job.materialId || job.localId
      return !known.has(id) && !known.has(job.localId)
    })
    .map((job) => ({
      id: job.materialId || job.localId,
      title: job.title,
      date: job.date,
      thumbnailUrl: job.thumbnailUrl,
      kind: job.kind,
      creating: job.status === 'creating',
      progress: job.status === 'creating' ? job.progress : 100,
      isNew: job.status === 'ready',
    }))

  return orderByCreateStart([...pending, ...decorated])
}

function sequenceById(): Map<string, number> {
  const sequence = new Map<string, number>()
  creationOrder.forEach((entry) => sequence.set(entry.id, entry.sequence))
  jobs.forEach((job) => {
    sequence.set(job.localId, job.sequence)
    if (job.materialId) sequence.set(job.materialId, job.sequence)
  })
  return sequence
}

/** 列表按点击创建的先后排，不按上传完成、写入数据库的时间排。后点击的仍在前面。 */
function orderByCreateStart(items: MaterialCardViewModel[]): MaterialCardViewModel[] {
  const sequence = sequenceById()
  if (sequence.size === 0) return items
  const ranked: MaterialCardViewModel[] = []
  const rest: MaterialCardViewModel[] = []
  items.forEach((item) => {
    if (sequence.has(item.id)) ranked.push(item)
    else rest.push(item)
  })
  ranked.sort((left, right) => (sequence.get(right.id) ?? 0) - (sequence.get(left.id) ?? 0))
  return [...ranked, ...rest]
}

/** 当前筛选放不下刚创建的作品时，仍把它留在列表最前面。 */
export function visibleMaterialsWithCreates(
  items: MaterialCardViewModel[],
  filterId: MaterialsFilterId,
): MaterialCardViewModel[] {
  const merged = mergeCreatingMaterials(items)
  if (filterId === 'all') return merged
  const filtered = merged.filter((item) => item.kind === filterId)
  const pinned = merged.filter((item) => (item.creating || item.isNew) && item.kind !== filterId)
  if (pinned.length === 0) return filtered
  const pinnedIds = new Set(pinned.map((item) => item.id))
  return [...pinned, ...filtered.filter((item) => !pinnedIds.has(item.id))]
}

export function dismissCreatedMaterialMark(materialId: string): void {
  const id = materialId.trim()
  if (!id) return
  const current = readUnseenIds()
  if (!current.includes(id)) return
  writeUnseenIds(current.filter((item) => item !== id))
  notifyMaterialLists('local')
}

export function returnToMaterialList(): void {
  if (typeof getCurrentPages === 'function' && getCurrentPages().length > 1) {
    wx.navigateBack()
    return
  }
  wx.reLaunch({ url: HOME_MATERIALS_TAB_PATH })
}

export function resetMaterialCreateStateForTests(): void {
  jobs.splice(0, jobs.length)
  memoryUnseen.splice(0, memoryUnseen.length)
  creationOrder.splice(0, creationOrder.length)
  nextCreateSequence = 1
  appForeground = true
  if (typeof wx !== 'undefined' && typeof wx.removeStorageSync === 'function') {
    try {
      wx.removeStorageSync(UNSEEN_STORAGE_KEY)
    } catch {
      // 测试环境没有存储时只清内存
    }
  }
}

function updateJobProgress(localId: string, ratio: number): void {
  if (!appForeground) return
  const job = jobs.find((item) => item.localId === localId)
  if (!job || job.status !== 'creating') return
  const clamped = Math.max(0, Math.min(1, ratio))
  const next = Math.max(job.progress, Math.round(job.progressBase + clamped * (100 - job.progressBase)))
  if (next === job.progress) return
  job.progress = next
  const now = Date.now()
  if (next < 100 && now - job.notifiedAt < 200) return
  job.notifiedAt = now
  notifyMaterialLists('local')
}

function finishJob(localId: string, materialId: string): void {
  const job = jobs.find((item) => item.localId === localId)
  if (!job) return
  job.materialId = materialId
  job.status = 'ready'
  job.progress = 100
  rememberCreateOrder(materialId, job.sequence)
  const unseen = readUnseenIds().filter((item) => item !== materialId)
  unseen.unshift(materialId)
  writeUnseenIds(unseen)
  notifyMaterialLists('created')
}

function rememberCreateOrder(id: string, sequence: number): void {
  const next = creationOrder.filter((entry) => entry.id !== id)
  next.push({ id, sequence })
  creationOrder.splice(0, creationOrder.length, ...next.slice(-UNSEEN_LIMIT))
}

function removeJob(localId: string): void {
  const index = jobs.findIndex((item) => item.localId === localId)
  if (index >= 0) jobs.splice(index, 1)
}

/** 缩略图刷新会整表覆盖列表，这里把创建进度和「新」再写回去。 */
export function stampMaterialCreateState(items: MaterialCardViewModel[]): MaterialCardViewModel[] {
  if (jobs.length === 0 && readUnseenIds().length === 0) return items
  const jobById = new Map<string, MaterialCreateJob>()
  jobs.forEach((job) => {
    jobById.set(job.localId, job)
    if (job.materialId) jobById.set(job.materialId, job)
  })
  const unseen = new Set(readUnseenIds())
  return items.map((item) => {
    const job = jobById.get(item.id)
    if (job) {
      return {
        ...item,
        creating: job.status === 'creating',
        progress: job.progress,
        isNew: job.status === 'ready',
      }
    }
    if (!item.creating && !item.isNew && !unseen.has(item.id)) return item
    return { ...item, creating: false, progress: 0, isNew: unseen.has(item.id) }
  })
}

function notifyMaterialLists(notice: MaterialCreateNotice): void {
  if (typeof getCurrentPages !== 'function') return
  getCurrentPages().forEach((page) => {
    const refresh = (page as MaterialListPage).refreshMaterialCreateCards
    if (typeof refresh === 'function') refresh.call(page, notice)
  })
}

function readUnseenIds(): string[] {
  if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') return memoryUnseen.slice()
  try {
    const raw = wx.getStorageSync(UNSEEN_STORAGE_KEY) as unknown
    if (!Array.isArray(raw)) return []
    return raw.filter((item): item is string => typeof item === 'string' && item !== '')
  } catch {
    return memoryUnseen.slice()
  }
}

function writeUnseenIds(ids: string[]): void {
  const next = ids.slice(0, UNSEEN_LIMIT)
  memoryUnseen.splice(0, memoryUnseen.length, ...next)
  if (typeof wx === 'undefined' || typeof wx.setStorageSync !== 'function') return
  try {
    wx.setStorageSync(UNSEEN_STORAGE_KEY, next)
  } catch {
    // 存储失败时本次打开仍保留“新”标记
  }
}

function showCreateFailure(error: unknown): void {
  if (typeof wx === 'undefined') return
  if (typeof error === 'object' && error !== null && 'notified' in error && (error as { notified?: boolean }).notified) return
  const message = error instanceof Error ? error.message.trim() : ''
  wx.showModal({
    title: '创建失败',
    content: message || '创建失败，请稍后重试',
    showCancel: false,
  })
}
