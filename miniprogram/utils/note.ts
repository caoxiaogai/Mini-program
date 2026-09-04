import type { NoteBlock, NoteDisplayBlock, NotePersistedContent } from '../types/note'

export const NOTE_FILE_TYPE = 'NOTE'
export const NOTE_PLACEHOLDER_FILE_URL = 'note'
export const NOTE_DEFAULT_TITLE = '笔记'
export const NOTE_BACKSPACE_MARK = '\u200b'
export const MAX_NOTE_BLOCKS = 30
export const MAX_NOTE_IMAGES_PER_PICK = 9

export function createNoteBlockId(): string {
  return `note-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

export function createEmptyTextBlock(): NoteBlock {
  return { id: createNoteBlockId(), type: 'text', text: '' }
}

export function cloneNoteBlocks(blocks: NoteBlock[]): NoteBlock[] {
  return blocks.map((block) => ({ ...block }))
}

export function isNoteFileType(fileType: string | null | undefined): boolean {
  return (fileType ?? '').toUpperCase() === NOTE_FILE_TYPE
}

export function parseNoteContent(raw: string | null | undefined): NoteBlock[] | null {
  if (!raw || raw.trim() === '' || raw.trim().charAt(0) !== '{') return null

  try {
    const parsed = JSON.parse(raw) as Partial<NotePersistedContent>
    if (parsed.version !== 1 || !Array.isArray(parsed.blocks)) return null
    const blocks = parsed.blocks.filter(isNoteBlock)
    return blocks.length > 0 ? blocks : null
  } catch {
    return null
  }
}

export function serializeNoteContent(blocks: NoteBlock[]): string {
  const payload: NotePersistedContent = {
    version: 1,
    blocks: cloneNoteBlocks(blocks).map((block) =>
      block.type === 'text' ? { ...block, text: stripNoteTextMark(block.text) } : block,
    ),
  }
  return JSON.stringify(payload)
}

export function stripNoteTextMark(text: string): string {
  return text.split(NOTE_BACKSPACE_MARK).join('')
}

export function calcNoteScrollProgress(scrollTop: number, scrollHeight: number, viewportHeight: number): number {
  if (scrollHeight <= 0) return 0
  const viewed = Math.min(scrollHeight, Math.max(0, scrollTop) + Math.max(0, viewportHeight))
  return Math.min(100, Math.max(0, Math.round((viewed / scrollHeight) * 100)))
}

export function isNoteAttachmentBlock(block: NoteBlock): boolean {
  return block.type === 'location' || block.type === 'image' || block.type === 'video' || block.type === 'file'
}

export function mergeAdjacentNoteTextBlocks(blocks: NoteBlock[]): NoteBlock[] {
  const merged: NoteBlock[] = []
  for (const block of blocks) {
    const prev = merged[merged.length - 1]
    if (block.type === 'text' && prev && prev.type === 'text') {
      merged[merged.length - 1] = {
        ...prev,
        text: stripNoteTextMark(prev.text) + stripNoteTextMark(block.text),
      }
      continue
    }
    merged.push(block)
  }
  return merged.length > 0 ? merged : [createEmptyTextBlock()]
}

export function deletePreviousAttachmentOnBackspace(
  blocks: NoteBlock[],
  textBlockId: string,
  payload: { keyCode?: number; cursor: number; oldText: string; nextText: string },
): { blocks: NoteBlock[]; focusTextId: string } | null {
  const index = blocks.findIndex((block) => block.id === textBlockId)
  if (index <= 0) return null
  const current = blocks[index]
  const prev = blocks[index - 1]
  if (!current || current.type !== 'text' || !prev || !isNoteAttachmentBlock(prev)) return null

  const isBackspace = payload.keyCode === 8 || payload.keyCode === 46
  const atStart = payload.cursor === 0
  const textUnchanged = payload.nextText === payload.oldText
  const emptiedMark = stripNoteTextMark(payload.oldText) === '' && stripNoteTextMark(payload.nextText) === ''
  const deletedMark = payload.oldText === NOTE_BACKSPACE_MARK && payload.nextText === ''

  if (!((isBackspace && atStart && (textUnchanged || emptiedMark)) || deletedMark)) return null

  const next = mergeAdjacentNoteTextBlocks(blocks.filter((_, itemIndex) => itemIndex !== index - 1))
  const focus = next.find((block) => block.id === textBlockId) ?? next.find((block) => block.type === 'text')
  return {
    blocks: next,
    focusTextId: focus?.id ?? next[0]?.id ?? '',
  }
}

export function extractNotePlainText(blocks: NoteBlock[]): string {
  return blocks
    .filter((block): block is Extract<NoteBlock, { type: 'text' }> => block.type === 'text')
    .map((block) => stripNoteTextMark(block.text).trim())
    .filter((text) => text !== '')
    .join('\n')
}

export function extractNoteTitle(blocks: NoteBlock[], fallback = NOTE_DEFAULT_TITLE): string {
  const firstLine = extractNotePlainText(blocks).split(/\r?\n/).map((line) => line.trim()).find((line) => line !== '')
  return firstLine || fallback
}

export function noteAttachmentSignature(blocks: NoteBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'image') return `image:${block.remoteUrl || block.path}`
      if (block.type === 'video') return `video:${block.remoteUrl || block.path}:${block.remoteCoverUrl || block.coverPath}`
      if (block.type === 'file') return `file:${block.remoteUrl || block.path}:${block.name}:${block.size}`
      return ''
    })
    .filter((part) => part !== '')
    .join('|')
}

export function hasNoteContent(blocks: NoteBlock[]): boolean {
  return blocks.some((block) => {
    if (block.type === 'text') return stripNoteTextMark(block.text).trim() !== ''
    if (block.type === 'location') return block.name.trim() !== '' || block.address.trim() !== ''
    if (block.type === 'image' || block.type === 'video' || block.type === 'file') return block.path !== ''
    return false
  })
}

export function formatNoteFileSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) return ''
  if (size < 1024) return `${Math.round(size)}B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)}KB`
  return `${(size / (1024 * 1024)).toFixed(1)}MB`
}

export function noteFileExt(name: string): string {
  const match = name.trim().match(/\.([a-z0-9]+)$/i)
  return match ? match[1].toUpperCase() : 'FILE'
}

export function toNoteDisplayBlocks(blocks: NoteBlock[]): NoteDisplayBlock[] {
  return blocks.map((block) => {
    if (block.type === 'text') {
      return emptyDisplayBlock(block.id, 'text', { text: block.text })
    }
    if (block.type === 'location') {
      return emptyDisplayBlock(block.id, 'location', {
        name: block.name,
        address: block.address,
        latitude: block.latitude,
        longitude: block.longitude,
      })
    }
    if (block.type === 'image') {
      return emptyDisplayBlock(block.id, 'image', { path: block.path || block.remoteUrl || '' })
    }
    if (block.type === 'video') {
      return emptyDisplayBlock(block.id, 'video', {
        path: block.path || block.remoteUrl || '',
        coverPath: block.coverPath || block.remoteCoverUrl || '',
        duration: block.duration,
      })
    }
    return emptyDisplayBlock(block.id, 'file', {
      path: block.path || block.remoteUrl || '',
      name: block.name,
      sizeLabel: formatNoteFileSize(block.size),
      ext: block.ext || noteFileExt(block.name),
    })
  })
}

function emptyDisplayBlock(
  id: string,
  type: NoteDisplayBlock['type'],
  patch: Partial<NoteDisplayBlock>,
): NoteDisplayBlock {
  return {
    id,
    type,
    text: '',
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    path: '',
    coverPath: '',
    duration: 0,
    sizeLabel: '',
    ext: '',
    ...patch,
  }
}

function isNoteBlock(value: unknown): value is NoteBlock {
  if (!value || typeof value !== 'object') return false
  const block = value as Partial<NoteBlock>
  if (typeof block.id !== 'string' || block.id === '') return false
  if (block.type === 'text') return typeof block.text === 'string'
  if (block.type === 'location') {
    return typeof block.name === 'string' && typeof block.address === 'string'
  }
  if (block.type === 'image') return typeof block.path === 'string' || typeof block.remoteUrl === 'string'
  if (block.type === 'video') return typeof block.path === 'string' || typeof block.remoteUrl === 'string'
  if (block.type === 'file') return typeof block.name === 'string'
  return false
}
