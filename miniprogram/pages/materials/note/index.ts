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
  hasNoteContent,
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
const NOTE_BLANK_TAP_GUARD_MS = 480
const NOTE_KEYBOARD_DISMISS_MS = 320
const NOTE_KEYBOARD_HEIGHT_SLACK = 24
const NOTE_CARET_SCROLL_MS = 64
const NOTE_LINE_HEIGHT_RPX = 48
const NOTE_FONT_SIZE_RPX = 32
const NOTE_CARET_GAP_RPX = 16
const NOTE_NAV_ACTION_BUTTON_RPX = 56
const NOTE_NAV_ACTION_GAP_RPX = 4
const NOTE_TITLE_ESTIMATE_PX = 34
const NOTE_LOCATION_FALLBACK = { latitude: 30.659462, longitude: 104.065735 }
const NOTE_EMPTY_HINT = '点此编辑文字'

function estimateCaretLines(text: string, cursor: number, charsPerLine: number): number {
  const before = text.slice(0, Math.max(0, Math.min(cursor, text.length)))
  if (!before) return 1
  const columns = Math.max(1, charsPerLine)
  return before.split('\n').reduce((lines, paragraph) => {
    return lines + Math.max(1, Math.ceil(paragraph.length / columns))
  }, 0)
}

function emptyHintFor(blocks: NoteBlock[]): string {
  return hasNoteContent(blocks) ? '' : NOTE_EMPTY_HINT
}

function lastTextIdOf(blocks: NoteBlock[]): string {
  return [...blocks].reverse().find((block) => block.type === 'text')?.id ?? ''
}

function editorViewState(blocks: NoteBlock[]) {
  const lastTextId = lastTextIdOf(blocks)
  const last = blocks.find((block) => block.id === lastTextId)
  return {
    emptyHint: emptyHintFor(blocks),
    lastTextId,
    lastTextHasCopy: Boolean(last && last.type === 'text' && stripNoteTextMark(last.text).trim()),
  }
}

function isLocationAuthDenied(errMsg?: string): boolean {
  return typeof errMsg === 'string' && /auth deny|auth denied|authorize/i.test(errMsg)
}

function isLocationPrivacyBlocked(errMsg?: string): boolean {
  return typeof errMsg === 'string' && /privacy|not declared/i.test(errMsg)
}

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
  keyboardDismissTimer: 0,
  caretScrollTimer: 0,
  lastCaretCursor: 0,
  ignoreBlankTapUntil: 0,
  editorActive: false,
  keyboardHidePending: false,
  openingPlusPanel: false,
  textDrafts: {} as Record<string, string>,
  windowWidth: 375,
  safeAreaBottom: 0,

  data: {
    blocks: withFileLabels([createEmptyTextBlock()]),
    emptyHint: NOTE_EMPTY_HINT,
    lastTextId: '',
    lastTextHasCopy: false,
    canUndo: false,
    canRedo: false,
    videoPlayerVisible: false,
    videoPlayerSrc: '',
    videoPlayerPoster: '',
    textFocused: false,
    focusTextId: '',
    keyboardHeight: 0,
    keyboardInset: 0,
    plusPanelVisible: true,
    showComposerBar: false,
    showActions: false,
    scrollIntoView: '',
    scrollTop: 0,
    composerReserve: 120,
    navActionRight: 104,
  },

  onLoad(options: Record<string, string | undefined>) {
    const metrics = windowMetrics()
    this.windowWidth = metrics.windowWidth
    this.safeAreaBottom = metrics.safeAreaBottom
    this.setData({
      navActionRight: this.estimateNavActionRight(),
      lastTextId: lastTextIdOf(this.data.blocks),
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
    this.clearKeyboardDismissTimer()
    this.clearCaretScrollTimer()
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
      this.setData({ focusTextId: first?.id ?? '', lastTextId: lastTextIdOf(this.data.blocks) })
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
      this.setData({ blocks, ...editorViewState(blocks), focusTextId: first?.id ?? '' }, () => this.resetHistory(blocks))
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

  clearKeyboardDismissTimer() {
    if (!this.keyboardDismissTimer) return
    clearTimeout(this.keyboardDismissTimer)
    this.keyboardDismissTimer = 0
  },

  clearCaretScrollTimer() {
    if (!this.caretScrollTimer) return
    clearTimeout(this.caretScrollTimer)
    this.caretScrollTimer = 0
  },

  applyKeyboardHeight(height: number) {
    if (this.openingPlusPanel || this.data.plusPanelVisible) {
      if (height <= 0) {
        this.openingPlusPanel = false
        this.clearKeyboardDismissTimer()
        this.editorActive = false
        this.syncComposer({ keyboardHeight: 0, textFocused: false, plusPanelVisible: true })
      }
      return
    }
    if (height > 0) {
      this.keyboardHidePending = false
      this.clearKeyboardDismissTimer()
      this.editorActive = true
      if (Math.abs(height - this.data.keyboardHeight) < NOTE_KEYBOARD_HEIGHT_SLACK) {
        this.scheduleEnsureCaretVisible(this.data.focusTextId)
        return
      }
      this.setData({
        keyboardHeight: height,
        plusPanelVisible: false,
        showComposerBar: true,
        showActions: false,
        keyboardInset: height,
        composerReserve: height + this.toolbarHeightPx(),
      }, () => {
        this.scheduleEnsureCaretVisible(this.data.focusTextId)
      })
      return
    }
    this.keyboardHidePending = true
    this.scheduleDismissKeyboard(NOTE_KEYBOARD_DISMISS_MS)
  },

  scheduleDismissKeyboard(delay: number) {
    this.clearKeyboardDismissTimer()
    this.keyboardDismissTimer = setTimeout(() => {
      this.keyboardDismissTimer = 0
      if (!this.keyboardHidePending) return
      if (this.openingPlusPanel || this.data.plusPanelVisible) return
      this.dismissKeyboard()
    }, delay) as unknown as number
  },

  flushTextDrafts(recordHistory = false): NoteBlock[] {
    const blocks = this.data.blocks.map((block) => {
      if (block.type !== 'text') return block
      const draft = this.textDrafts[block.id]
      const text = stripNoteTextMark(draft === undefined ? block.text : draft)
      return text === block.text ? block : { ...block, text }
    })
    this.textDrafts = {}
    const changed = blocks.some((block, index) => block !== this.data.blocks[index])
    if (changed) this.setData({ blocks, ...editorViewState(blocks) })
    if (recordHistory && changed) this.pushHistory(blocks)
    return blocks
  },

  dismissKeyboard() {
    this.clearFocusTimer()
    this.clearKeyboardDismissTimer()
    this.editorActive = false
    this.keyboardHidePending = false
    this.ignoreBlankTapUntil = Date.now() + NOTE_BLANK_TAP_GUARD_MS
    this.flushTextDrafts(true)
    this.syncComposer({
      textFocused: false,
      keyboardHeight: 0,
    })
  },

  scheduleEnsureCaretVisible(textId?: string) {
    const id = textId || this.data.focusTextId
    if (!id) return
    this.clearCaretScrollTimer()
    this.caretScrollTimer = setTimeout(() => {
      this.caretScrollTimer = 0
      this.ensureCaretVisible(id)
    }, NOTE_CARET_SCROLL_MS) as unknown as number
  },

  ensureCaretVisible(textId?: string) {
    const id = textId || this.data.focusTextId
    if (!id || this.data.keyboardHeight <= 0) return
    const overlay = this.data.showComposerBar
      ? this.data.composerReserve
      : this.data.keyboardHeight
    if (overlay <= 0) return

    const query = this.createSelectorQuery()
    query.select('.note-page__scroll').boundingClientRect()
    query.select('.note-page__scroll').scrollOffset()
    query.select(`#note-block-${id}`).boundingClientRect()
    query.select(`#note-caret-${id}`).boundingClientRect()
    query.exec((res) => {
      const viewport = res[0] as WechatMiniprogram.BoundingClientRectCallbackResult | null
      const offset = res[1] as WechatMiniprogram.ScrollOffsetCallbackResult | null
      const block = res[2] as WechatMiniprogram.BoundingClientRectCallbackResult | null
      const caret = res[3] as WechatMiniprogram.BoundingClientRectCallbackResult | null
      if (!viewport || !offset || !block) {
        this.scrollFocusedBlockIntoView(id)
        return
      }

      const lineHeight = rpxToPx(NOTE_LINE_HEIGHT_RPX, this.windowWidth)
      const fontSize = rpxToPx(NOTE_FONT_SIZE_RPX, this.windowWidth)
      const gap = rpxToPx(NOTE_CARET_GAP_RPX, this.windowWidth)
      const current = this.data.blocks.find((item) => item.id === id)
      const text = this.textDrafts[id] ?? (current && current.type === 'text' ? current.text : '')
      const atEnd = this.lastCaretCursor >= text.length
      const charsPerLine = Math.max(1, Math.floor(block.width / Math.max(1, fontSize)))
      const caretOffset = estimateCaretLines(text, this.lastCaretCursor, charsPerLine) * lineHeight
      const caretBottom = atEnd
        ? (caret?.bottom ?? block.bottom)
        : Math.min(caret?.bottom ?? block.bottom, block.top + caretOffset)
      const caretTop = caretBottom - lineHeight
      const safeBottom = viewport.bottom - overlay - gap
      const safeTop = viewport.top + gap
      let delta = 0
      if (caretBottom > safeBottom) delta = caretBottom - safeBottom
      else if (caretTop < safeTop) delta = caretTop - safeTop
      if (Math.abs(delta) < 2) return

      const nextTop = Math.max(0, Math.round(offset.scrollTop + delta))
      const currentTop = this.data.scrollTop
      this.setData({
        scrollTop: nextTop === currentTop ? nextTop + 0.1 : nextTop,
      })
    })
  },

  scrollFocusedBlockIntoView(textId?: string) {
    const id = textId || this.data.focusTextId
    if (!id) return
    this.setData({ scrollIntoView: '' }, () => {
      this.setData({ scrollIntoView: `note-caret-${id}` })
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

    const alreadyFocused = this.editorActive && this.data.focusTextId === focusTextId
    if (alreadyFocused) return
    this.editorActive = true
    this.keyboardHidePending = false

    this.ignoreBlankTapUntil = Date.now() + NOTE_BLANK_TAP_GUARD_MS
    this.clearFocusTimer()
    if (this.data.textFocused) {
      this.syncComposer({
        plusPanelVisible: false,
        textFocused: false,
        focusTextId,
      })
      this.focusTimer = setTimeout(() => {
        this.focusTimer = 0
        if (this.openingPlusPanel || this.data.plusPanelVisible) return
        this.syncComposer({ textFocused: true, focusTextId })
        if (this.data.keyboardHeight > 0) this.scheduleEnsureCaretVisible(focusTextId)
      }, 40) as unknown as number
      return
    }

    this.syncComposer({
      plusPanelVisible: false,
      textFocused: true,
      focusTextId,
    })
    if (this.data.keyboardHeight > 0) this.scheduleEnsureCaretVisible(focusTextId)
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
    this.setData({ blocks: next, ...editorViewState(next) })
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
    const blocks = withFileLabels(cloneNoteBlocks(this.history[this.historyIndex] ?? []))
    this.setData({
      blocks,
      ...editorViewState(blocks),
      canUndo: this.historyIndex > 0,
      canRedo: true,
    })
  },

  onRedoTap() {
    if (this.historyIndex >= this.history.length - 1) return
    this.historyIndex += 1
    const blocks = withFileLabels(cloneNoteBlocks(this.history[this.historyIndex] ?? []))
    this.setData({
      blocks,
      ...editorViewState(blocks),
      canUndo: true,
      canRedo: this.historyIndex < this.history.length - 1,
    })
  },

  onEditorBlankTap() {
    if (Date.now() < this.ignoreBlankTapUntil) return
    if (this.editorActive || this.data.textFocused || this.data.keyboardHeight > 0) return
    this.focusEditor()
  },

  onTextBlockTap(event: WechatMiniprogram.TouchEvent) {
    if (Date.now() < this.ignoreBlankTapUntil) return
    if (this.data.lastTextHasCopy) return
    const id = event.currentTarget.dataset.id as string
    this.focusEditor(id || this.data.lastTextId)
  },

  onMediaBlockTap() {},

  onDoneTap() {
    this.openingPlusPanel = false
    this.dismissKeyboard()
  },

  onPlusTouchStart() {
    this.clearFocusTimer()
    this.clearKeyboardDismissTimer()
    this.openingPlusPanel = true
    this.editorActive = false
    this.keyboardHidePending = false
    this.ignoreBlankTapUntil = Date.now() + NOTE_BLANK_TAP_GUARD_MS
    this.flushTextDrafts(true)
    this.syncComposer({ plusPanelVisible: true, textFocused: false, keyboardHeight: 0 })
  },

  onPlusTap() {
    this.clearFocusTimer()
    this.clearKeyboardDismissTimer()
    this.openingPlusPanel = true
    this.editorActive = false
    this.keyboardHidePending = false
    this.ignoreBlankTapUntil = Date.now() + NOTE_BLANK_TAP_GUARD_MS
    this.flushTextDrafts(true)
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

  chooseLocation(center?: { latitude: number; longitude: number }, isRetry = false) {
    wx.chooseLocation({
      ...(center ? { latitude: center.latitude, longitude: center.longitude } : {}),
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
        const errMsg = error.errMsg
        if (isPickerCancel(errMsg)) return
        if (isLocationAuthDenied(errMsg)) {
          this.askLocationSetting()
          return
        }
        if (!isRetry && !isLocationPrivacyBlocked(errMsg)) {
          this.chooseLocation(NOTE_LOCATION_FALLBACK, true)
          return
        }
        console.error('[note] chooseLocation failed', error)
        wx.showToast({
          title: isLocationPrivacyBlocked(errMsg) ? '请先同意位置隐私授权' : '无法获取位置',
          icon: 'none',
        })
      },
    })
  },

  askLocationSetting() {
    wx.showModal({
      title: '需要位置权限',
      content: '请允许使用位置，以便在笔记中添加位置',
      confirmText: '去设置',
      success: (result) => {
        if (!result.confirm) return
        wx.openSetting({
          success: (opened) => {
            if (opened.authSetting['scope.userLocation']) this.chooseLocation()
          },
        })
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
    this.textDrafts[id] = text
    this.lastCaretCursor = cursor
    const preview = this.data.blocks.map((block) => (block.id === id && block.type === 'text' ? { ...block, text } : block))
    const view = editorViewState(preview)
    if (view.emptyHint !== this.data.emptyHint || view.lastTextHasCopy !== this.data.lastTextHasCopy) {
      this.setData(view)
    }
    this.scheduleEnsureCaretVisible(id)
  },

  onTextLineChange(event: WechatMiniprogram.TextareaLineChange) {
    const id = event.currentTarget.dataset.id as string
    this.scheduleEnsureCaretVisible(id)
  },

  onTextFocus(event: WechatMiniprogram.TextareaFocus) {
    if (this.keyboardHidePending && Date.now() < this.ignoreBlankTapUntil) return
    const id = event.currentTarget.dataset.id as string
    this.editorActive = true
    this.keyboardHidePending = false
    this.clearKeyboardDismissTimer()
    const index = this.data.blocks.findIndex((block) => block.id === id)
    const current = this.data.blocks[index]
    this.lastCaretCursor = this.textDrafts[id]?.length
      ?? (current && current.type === 'text' ? current.text.length : 0)
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
    const height = event.detail.height > 0 ? event.detail.height : this.data.keyboardHeight
    if (this.data.textFocused && this.data.focusTextId === id && blocks === this.data.blocks) {
      if (height > 0) this.applyKeyboardHeight(height)
      else this.scheduleEnsureCaretVisible(id)
      return
    }
    this.syncComposer({
      plusPanelVisible: false,
      textFocused: true,
      focusTextId: id,
      keyboardHeight: height,
    })
    if (blocks !== this.data.blocks) this.setData({ blocks, ...editorViewState(blocks) })
    this.scheduleEnsureCaretVisible(id)
  },

  onTextBlur() {
    this.keyboardHidePending = true
    this.scheduleDismissKeyboard(NOTE_KEYBOARD_DISMISS_MS)
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
    const blocks = this.flushTextDrafts()
    return {
      draftId: this.draftMaterialId,
      originalAttachmentSignature: this.originalAttachmentSignature,
      blocks,
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
