export type NoteBlockType = 'text' | 'location' | 'image' | 'video' | 'file'

export interface NoteTextBlock {
  id: string
  type: 'text'
  text: string
}

export interface NoteLocationBlock {
  id: string
  type: 'location'
  name: string
  address: string
  latitude: number
  longitude: number
}

export interface NoteImageBlock {
  id: string
  type: 'image'
  path: string
  remoteUrl?: string
}

export interface NoteVideoBlock {
  id: string
  type: 'video'
  path: string
  coverPath: string
  remoteUrl?: string
  remoteCoverUrl?: string
  duration: number
}

export interface NoteFileBlock {
  id: string
  type: 'file'
  path: string
  remoteUrl?: string
  name: string
  size: number
  ext: string
  sizeLabel?: string
}

export type NoteBlock =
  | NoteTextBlock
  | NoteLocationBlock
  | NoteImageBlock
  | NoteVideoBlock
  | NoteFileBlock

export interface NotePersistedContent {
  version: 1
  blocks: NoteBlock[]
}

export interface NoteDraftViewModel {
  id: string
  blocks: NoteBlock[]
}

export interface NoteSubmitInput {
  draftId: string | null
  originalAttachmentSignature: string
  blocks: NoteBlock[]
}

export interface NoteDisplayBlock {
  id: string
  type: NoteBlockType
  text: string
  name: string
  address: string
  latitude: number
  longitude: number
  path: string
  coverPath: string
  duration: number
  sizeLabel: string
  ext: string
}
