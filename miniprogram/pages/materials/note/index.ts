import { getMaterialShareCard, getNoteDraft, publishNote, saveNoteDraft } from '../../../services/materials'
import { runAuthed } from '../../../services/auth'
import type { NoteBlock, NoteFileBlock } from '../../../types/note'
import { buildReturnPath } from '../../../utils/auth'
import {
  cloneNoteBlocks,
  createEmptyTextBlock,
  createNoteBlockId,
  deletePreviousAttachmentOnBackspace,
  extractNotePlainText,
  formatNoteFileSize,
  isNoteAttachmentBlock,
  MAX_NOTE_BLOCKS,
  MAX_NOTE_IMAGES_PER_PICK,
  NOTE_BACKSPACE_MARK,
  noteAttachmentSignature,
  noteFileExt,
  stripNoteTextMark,
} from '../../../utils/note'
import {
  choosePublishImageOrVideo,
  isPickerCancel,
  showPublishPickerError,
} from '../../../utils/publish-media'
import type { PublishMediaViewModel } from '../../../types/materials'
import { returnToMaterialsList } from '../../../utils/publish-return'
import {
  getNavigationBarLayout,
  isMenuButtonRectValid,
  resolveNavActionsRight,
} from '../../../utils/navigation-layout'
import { MATERIAL_NOTE_PATH, isPublishRemixQuery } from '../../../utils/share-material'

function withFileLabels(blocks: NoteBlock[]): NoteBlock[] {
  return blocks.map((block) => {
    if (block.type !== 'file') return block
    return {
      ...block,
      ext: block.ext || noteFileExt(block.name),
      sizeLabel: formatNoteFileSize(block.size),
    } as NoteFileBlock & { sizeLabel: string }
  })
}

const NOTE_TOOLBAR_RPX = 88
const NOTE_ACTIONS_RPX = 108
const NOTE_PLUS_PANEL_RPX = 200
const NOTE_BLANK_TAP_GUARD_MS = 400
const NOTE_NAV_ACTION_BUTTON_RPX = 56
const NOTE_NAV_ACTION_GAP_RPX = 4
const NOTE_TITLE_ESTIMATE_PX = 34

function windowMetrics() {
  try {
    const info = wx.getSystemInfoSync()
    const windowWidth = info.windowWidth || 375
    const safeAreaBottom = Math.max(0, info.windowHeight - (info.safeArea?.bottom ?? info.windowHeight))
    return { windowWidth, safeAreaBottom }
  } catch {
    return { windowWidth: 375, safeAreaBottom: 0 }
  }
}

function rpxToPx(rpx: number, windowWidth: number): number {
  return Math.round((rpx / 750) * windowWidth)
}

function mediaToNoteBlocks(items: PublishMediaViewModel[]): NoteBlock[] {
  return items.map((item) => {
    if (item.kind === 'video') {
      return {
        id: createNoteBlockId(),
        type: 'video' as const,
        path: item.path,
        coverPath: item.previewPath,
        duration: item.duration,
      }
    }
    return {
      id: createNoteBlockId(),
      type: 'image' as const,
      path: item.path,
    }
  })
}

Page({
  draftMaterialId: null as string | null,
  originalAttachmentSignature: '',
  submitting: false,
  history: [] as NoteBlock[][],
  historyIndex: -1,
  keyboardHeightListener: null as ((result: WechatMiniprogram.OnKeyboardHeightChangeListenerResult) => void) | null,
  focusTimer: 0,
  ignoreBlankTapUntil: 0,
  openingPlusPanel: false,
  windowWidth: 375,
  safeAreaBottom: 0,

  data: {
    blocks: withFileLabels([createEmptyTextBlock()]),
    canUndo: false,
    canRedo: false,
    videoPlayerVisible: false,
    videoPlayerSrc: '',
    videoPlayerPoster: '',
    textFocused: false,
    focusTextId: '',
    keyboardHeight: 0,
    keyboardInset: 0,
    plusPanelVisible: false,
    showComposerBar: false,
    showActions: true,
    scrollIntoView: '',
    composerReserve: 120,
    navActionRight: 104,
  },

  onLoad(options: Record<string, string | undefined>) {
    const metrics = windowMetrics()
    this.windowWidth = metrics.windowWidth
    this.safeAreaBottom = metrics.safeAreaBottom
    this.setData({
      navActionRight: this.estimateNavActionRight(),
    })
    this.keyboardHeightListener = (result) => {
      this.applyKeyboardHeight(Math.max(0, result.height || 0))
    }
    wx.onKeyboardHeightChange(this.keyboardHeightListener)
    this.syncComposer({})
    runAuthed(buildReturnPath(MATERIAL_NOTE_PATH, options), () => this.startEditor(options))
  },
  onReady() {
    wx.nextTick(() => this.layoutNavActions())
  },
  estimateNavActionRight() {
    const windowWidth = this.windowWidth
    const menu = wx.getMenuButtonBoundingClientRect()
    const capsuleLeft = isMenuButtonRectValid(menu)
      ? menu.left
      : windowWidth - getNavigationBarLayout().capsuleOffset
    return resolveNavActionsRight({
      windowWidth,
      titleRight: windowWidth / 2 + NOTE_TITLE_ESTIMATE_PX / 2,
      capsuleLeft,
      actionsWidth: rpxToPx(NOTE_NAV_ACTION_BUTTON_RPX * 2 + NOTE_NAV_ACTION_GAP_RPX, windowWidth),
    })
  },
  layoutNavActions() {
    const apply = (titleRight: number) => {
      const windowWidth = this.windowWidth
      const menu = wx.getMenuButtonBoundingClientRect()
      const capsuleLeft = isMenuButtonRectValid(menu)
        ? menu.left
        : windowWidth - getNavigationBarLayout().capsuleOffset
      this.setData({
        navActionRight: resolveNavActionsRight({
          windowWidth,
          titleRight,
          capsuleLeft,
          actionsWidth: rpxToPx(NOTE_NAV_ACTION_BUTTON_RPX * 2 + NOTE_NAV_ACTION_GAP_RPX, windowWidth),
        }),
      })
    }

    const nav = this.selectComponent('#noteNavBar')
    if (!nav) {
      apply(this.windowWidth / 2 + NOTE_TITLE_ESTIMATE_PX / 2)
      return
    }

    nav.createSelectorQuery()
      .select('.weui-navigation-bar__title')
      .boundingClientRect((rect: WechatMiniprogram.BoundingClientRectCallbackResult) => {
        const measured = rect && rect.width > 0 && rect.width < this.windowWidth * 0.5
        apply(measured ? rect.right : this.windowWidth / 2 + NOTE_TITLE_ESTIMATE_PX / 2)
      })
      .exec()
  },
  onUnload() {
    this.clearFocusTimer()
    if (this.keyboardHeightListener) {
      wx.offKeyboardHeightChange(this.keyboardHeightListener)
      this.keyboardHeightListener = null
    }
  },
  onNavBackTap() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.exitMiniProgram({ fail: () => undefined })
      },
    })
  },
  onBackPress() {
    if (!this.data.videoPlayerVisible) return undefined
    this.onCloseVideoPlayer()
    return true
  },
  onPullDownRefresh() {
    wx.stopPullDownRefresh()
  },

  startEditor(options: Record<string, string | undefined>) {
    const materialId = options.id
    if (!materialId) {
      const first = this.data.blocks.find((block) => block.type === 'text')
      this.resetHistory(this.data.blocks)
      this.setData({ focusTextId: first?.id ?? '' })
      return
    }

    const remix = isPublishRemixQuery(options.remix)
    getNoteDraft(materialId).then((draft) => {
      if (!draft) {
        wx.showToast({ title: '笔记不存在', icon: 'none' })
        return
      }

      const blocks = withFileLabels(draft.blocks.length > 0 ? draft.blocks : [createEmptyTextBlock()])
      this.draftMaterialId = remix ? null : draft.id
      this.originalAttachmentSignature = remix ? '' : noteAttachmentSignature(blocks)
      const first = blocks.find((block) => block.type === 'text')
      this.setData({ blocks, focusTextId: first?.id ?? '' }, () => this.resetHistory(blocks))
    })
  },

  toolbarHeightPx() {
    return rpxToPx(NOTE_TOOLBAR_RPX, this.windowWidth)
  },

  actionsReservePx() {
    return rpxToPx(NOTE_ACTIONS_RPX, this.windowWidth) + this.safeAreaBottom
  },

  plusPanelReservePx() {
    return rpxToPx(NOTE_PLUS_PANEL_RPX, this.windowWidth) + this.safeAreaBottom
  },

  clearFocusTimer() {
    if (!this.focusTimer) return
    clearTimeout(this.focusTimer)
    this.focusTimer = 0
  },

  applyKeyboardHeight(height: number) {
    if (this.openingPlusPanel || this.data.plusPanelVisible) {
      if (height <= 0) {
        this.openingPlusPanel = false
        this.syncComposer({ keyboardHeight: 0, textFocused: false, plusPanelVisible: true })
      }
      return
    }
    if (height <= 0) {
      this.dismissKeyboard()
      return
    }
    this.ignoreBlankTapUntil = 0
    this.syncComposer({
      keyboardHeight: height,
      plusPanelVisible: false,
    })
    this.scrollFocusedBlockIntoView()
  },

  dismissKeyboard() {
    this.clearFocusTimer()
    this.ignoreBlankTapUntil = Date.now() + NOTE_BLANK_TAP_GUARD_MS
    this.syncComposer({
      textFocused: false,
      keyboardHeight: 0,
    })
  },

  scrollFocusedBlockIntoView(textId?: string) {
    const id = textId || this.data.focusTextId
    if (!id) return
    this.setData({ scrollIntoView: '' }, () => {
      this.setData({ scrollIntoView: `note-block-${id}` })
    })
  },

  syncComposer(patch: {
    keyboardHeight?: number
    plusPanelVisible?: boolean
    textFocused?: boolean
    focusTextId?: string
  }) {
    const keyboardHeight = patch.keyboardHeight ?? this.data.keyboardHeight
    const plusPanelVisible = patch.plusPanelVisible ?? this.data.plusPanelVisible
    const textFocused = patch.textFocused ?? this.data.textFocused
    const showComposerBar = !plusPanelVisible && keyboardHeight > 0
    const keyboardInset = plusPanelVisible ? 0 : keyboardHeight
    const composerReserve = plusPanelVisible
      ? this.plusPanelReservePx()
      : showComposerBar
        ? keyboardInset + this.toolbarHeightPx()
        : this.actionsReservePx()
    this.setData({
      ...patch,
      keyboardHeight,
      plusPanelVisible,
      textFocused,
      showComposerBar,
      showActions: keyboardHeight === 0 && !plusPanelVisible && !textFocused,
      keyboardInset,
      composerReserve,
    })
  },

  focusEditor(textId?: string) {
    if (Date.now() < this.ignoreBlankTapUntil && !this.data.plusPanelVisible) return
    this.openingPlusPanel = false
    let focusTextId = textId ?? ''
    let blocks = this.data.blocks
    if (!focusTextId) {
      const lastText = [...blocks].reverse().find((block) => block.type === 'text')
      if (lastText) {
        focusTextId = lastText.id
      } else {
        const next = createEmptyTextBlock()
        blocks = withFileLabels([...blocks, next])
        focusTextId = next.id
        this.applyBlocks(blocks)
      }
    }

    this.clearFocusTimer()
    this.syncComposer({
      plusPanelVisible: false,
      textFocused: false,
      focusTextId,
    })
    this.focusTimer = setTimeout(() => {
      this.focusTimer = 0
      if (Date.now() < this.ignoreBlankTapUntil) return
      this.syncComposer({ textFocused: true, focusTextId })
      this.scrollFocusedBlockIntoView(focusTextId)
    }, 40) as unknown as number
  },

  resetHistory(blocks: NoteBlock[]) {
    this.history = [cloneNoteBlocks(blocks)]
    this.historyIndex = 0
    this.setData({ canUndo: false, canRedo: false })
  },

  pushHistory(blocks: NoteBlock[]) {
    const next = this.history.slice(0, this.historyIndex + 1)
    next.push(cloneNoteBlocks(blocks))
    if (next.length > 40) next.shift()
    this.history = next
    this.historyIndex = next.length - 1
    this.setData({
      canUndo: this.historyIndex > 0,
      canRedo: false,
    })
  },

  applyBlocks(blocks: NoteBlock[], recordHistory = true) {
    const next = withFileLabels(blocks)
    this.setData({ blocks: next })
    if (recordHistory) this.pushHistory(next)
  },

  appendBlocks(incoming: NoteBlock[]) {
    if (incoming.length === 0) return
    const current = this.data.blocks
    const last = current[current.length - 1]
    const reuseTrailingText =
      !!last && last.type === 'text' && stripNoteTextMark(last.text).trim() === ''
    const trailingText = reuseTrailingText && last ? last : createEmptyTextBlock()
    const extra = reuseTrailingText ? 0 : 1
    if (current.length + incoming.length + extra > MAX_NOTE_BLOCKS) {
      wx.showToast({ title: '笔记内容已达上限', icon: 'none' })
      return
    }
    const head = reuseTrailingText ? current.slice(0, -1) : current
    this.applyBlocks([...head, ...incoming, trailingText].slice(0, MAX_NOTE_BLOCKS))
    this.focusEditor(trailingText.id)
  },

  onUndoTap() {
    if (this.historyIndex <= 0) return
    this.historyIndex -= 1
    this.setData({
      blocks: withFileLabels(cloneNoteBlocks(this.history[this.historyIndex] ?? [])),
      canUndo: this.historyIndex > 0,
      canRedo: true,
    })
  },

  onRedoTap() {
    if (this.historyIndex >= this.history.length - 1) return
    this.historyIndex += 1
    this.setData({
      blocks: withFileLabels(cloneNoteBlocks(this.history[this.historyIndex] ?? [])),
      canUndo: true,
      canRedo: this.historyIndex < this.history.length - 1,
    })
  },

  onEditorBlankTap() {
    if (Date.now() < this.ignoreBlankTapUntil) return
    this.focusEditor()
  },

  onTextBlockTap() {},

  onMediaBlockTap() {},

  onPlusTouchStart() {
    this.clearFocusTimer()
    this.openingPlusPanel = true
    this.ignoreBlankTapUntil = Date.now() + NOTE_BLANK_TAP_GUARD_MS
    this.syncComposer({ plusPanelVisible: true, textFocused: false, keyboardHeight: 0 })
  },

  onPlusTap() {
    this.clearFocusTimer()
    this.openingPlusPanel = true
    this.ignoreBlankTapUntil = Date.now() + NOTE_BLANK_TAP_GUARD_MS
    this.syncComposer({ plusPanelVisible: true, textFocused: false, keyboardHeight: 0 })
  },

  onAlbumTap() {
    this.syncComposer({ plusPanelVisible: false })
    choosePublishImageOrVideo({
      type: 'mix',
      source: 'album',
      count: MAX_NOTE_IMAGES_PER_PICK,
    })
      .then((items) => this.appendBlocks(mediaToNoteBlocks(items)))
      .catch((error: WechatMiniprogram.GeneralCallbackResult) => {
        showPublishPickerError(error.errMsg)
      })
  },

  onCameraTap() {
    this.syncComposer({ plusPanelVisible: false })
    choosePublishImageOrVideo({
      type: 'mix',
      source: 'camera',
      count: 1,
    })
      .then((items) => this.appendBlocks(mediaToNoteBlocks(items)))
      .catch((error: WechatMiniprogram.GeneralCallbackResult) => {
        showPublishPickerError(error.errMsg)
      })
  },

  onLocationInsertTap() {
    this.syncComposer({ plusPanelVisible: false })
    this.chooseLocation()
  },

  onFileInsertTap() {
    this.syncComposer({ plusPanelVisible: false })
    this.chooseFiles()
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (result) => {
        this.appendBlocks([
          {
            id: createNoteBlockId(),
            type: 'location',
            name: result.name || result.address || '位置',
            address: result.address || '',
            latitude: result.latitude,
            longitude: result.longitude,
          },
        ])
      },
      fail: (error) => {
        if (!isPickerCancel(error.errMsg)) wx.showToast({ title: '无法获取位置', icon: 'none' })
      },
    })
  },

  chooseFiles() {
    wx.chooseMessageFile({
      count: 5,
      type: 'file',
      success: (result) => {
        this.appendBlocks(
          result.tempFiles.map((file) => ({
            id: createNoteBlockId(),
            type: 'file' as const,
            path: file.path,
            name: file.name,
            size: file.size,
            ext: noteFileExt(file.name),
          })),
        )
      },
      fail: (error) => {
        showPublishPickerError(error.errMsg)
      },
    })
  },

  onTextInput(event: WechatMiniprogram.TextareaInput) {
    const id = event.currentTarget.dataset.id as string
    const nextText = event.detail.value
    const cursor = event.detail.cursor ?? 0
    const keyCode = (event.detail as { keyCode?: number }).keyCode
    const current = this.data.blocks.find((block) => block.id === id)
    const oldText = current && current.type === 'text' ? current.text : ''
    const deleted = deletePreviousAttachmentOnBackspace(this.data.blocks, id, {
      keyCode,
      cursor,
      oldText,
      nextText,
    })
    if (deleted) {
      this.applyBlocks(deleted.blocks)
      this.setData({ focusTextId: deleted.focusTextId, textFocused: true })
      return
    }

    const text = stripNoteTextMark(nextText) === '' && nextText.includes(NOTE_BACKSPACE_MARK)
      ? NOTE_BACKSPACE_MARK
      : stripNoteTextMark(nextText)
    const blocks = this.data.blocks.map((block) => (block.id === id && block.type === 'text' ? { ...block, text } : block))
    this.setData({ blocks })
  },

  onTextFocus(event: WechatMiniprogram.TextareaFocus) {
    const id = event.currentTarget.dataset.id as string
    const index = this.data.blocks.findIndex((block) => block.id === id)
    const current = this.data.blocks[index]
    const prev = index > 0 ? this.data.blocks[index - 1] : undefined
    let blocks = this.data.blocks
    if (
      current &&
      current.type === 'text' &&
      stripNoteTextMark(current.text) === '' &&
      prev &&
      isNoteAttachmentBlock(prev)
    ) {
      blocks = this.data.blocks.map((block) =>
        block.id === id && block.type === 'text' ? { ...block, text: NOTE_BACKSPACE_MARK } : block,
      )
    }
    this.syncComposer({
      plusPanelVisible: false,
      textFocused: true,
      focusTextId: id,
      keyboardHeight: event.detail.height > 0 ? event.detail.height : this.data.keyboardHeight,
    })
    if (blocks !== this.data.blocks) this.setData({ blocks })
    this.scrollFocusedBlockIntoView(id)
  },

  onTextBlur() {
    const blocks = this.data.blocks.map((block) =>
      block.type === 'text' ? { ...block, text: stripNoteTextMark(block.text) } : block,
    )
    this.setData({ blocks })
    this.pushHistory(blocks)
    if (this.data.keyboardHeight <= 0) this.syncComposer({ textFocused: false })
  },

  onKeyboardHeightChange(event: WechatMiniprogram.TextareaKeyboardHeightChange) {
    this.applyKeyboardHeight(Math.max(0, event.detail.height || 0))
  },

  onLocationTap(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    const block = this.data.blocks.find((item) => item.id === id)
    if (!block || block.type !== 'location') return
    wx.openLocation({
      latitude: block.latitude,
      longitude: block.longitude,
      name: block.name,
      address: block.address,
    })
  },

  onImageTap(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    const urls = this.data.blocks
      .filter((block): block is Extract<NoteBlock, { type: 'image' }> => block.type === 'image')
      .map((block) => block.path)
    const current = this.data.blocks.find((block) => block.id === id)
    wx.previewImage({
      current: current && current.type === 'image' ? current.path : urls[0],
      urls,
    })
  },

  onVideoTap(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    const block = this.data.blocks.find((item) => item.id === id)
    if (!block || block.type !== 'video' || !block.path) return
    this.syncComposer({ plusPanelVisible: false, textFocused: false, keyboardHeight: 0 })
    this.setData({
      videoPlayerVisible: true,
      videoPlayerSrc: block.path,
      videoPlayerPoster: block.coverPath,
    })
  },

  onCloseVideoPlayer() {
    this.setData({
      videoPlayerVisible: false,
      videoPlayerSrc: '',
      videoPlayerPoster: '',
    })
  },

  onFileTap(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    const block = this.data.blocks.find((item) => item.id === id)
    if (!block || block.type !== 'file' || !block.path) return
    wx.openDocument({
      filePath: block.path,
      showMenu: true,
      fail: () => wx.showToast({ title: '无法打开文件', icon: 'none' }),
    })
  },

  firstShareImage(): string {
    const image = this.data.blocks.find((block) => block.type === 'image')
    if (image && image.type === 'image') return image.path
    const video = this.data.blocks.find((block) => block.type === 'video')
    return video && video.type === 'video' ? video.coverPath : ''
  },

  buildSubmitInput() {
    return {
      draftId: this.draftMaterialId,
      originalAttachmentSignature: this.originalAttachmentSignature,
      blocks: this.data.blocks,
    }
  },

  onDraftTap() {
    if (this.submitting) return
    this.submitting = true
    saveNoteDraft(this.buildSubmitInput())
      .then((materialId) => {
        this.draftMaterialId = materialId
        this.originalAttachmentSignature = noteAttachmentSignature(this.data.blocks)
        wx.showToast({ title: '已保存草稿', icon: 'success' })
        returnToMaterialsList({ materialId, showSuccessModal: false })
      })
      .catch(() => undefined)
      .then(() => {
        this.submitting = false
      })
  },

  onPublishTap() {
    if (this.submitting) return
    this.submitting = true
    const copy = extractNotePlainText(this.data.blocks)
    publishNote(this.buildSubmitInput())
      .then((materialId) => {
        this.draftMaterialId = materialId
        this.originalAttachmentSignature = noteAttachmentSignature(this.data.blocks)
        return getMaterialShareCard(materialId, copy, this.firstShareImage()).then((card) => {
          returnToMaterialsList({
            materialId,
            showSuccessModal: true,
            shareTitle: card.shareTitle,
            shareImageUrl: card.shareImageUrl,
            shareTrackingId: card.shareTrackingId,
          })
        })
      })
      .catch(() => undefined)
      .then(() => {
        this.submitting = false
      })
  },
})
