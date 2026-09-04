import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('note content serializes and extracts title without exposing raw json', async () => {
  const {
    createEmptyTextBlock,
    extractNoteTitle,
    hasNoteContent,
    noteAttachmentSignature,
    parseNoteContent,
    serializeNoteContent,
  } = await import('../miniprogram/utils/note.ts')

  const empty = createEmptyTextBlock()
  assert.equal(hasNoteContent([empty]), false)

  const blocks = [
    { id: 't1', type: 'text', text: '案例' },
    { id: 'l1', type: 'location', name: '中环广场', address: '锦江区北福路16号', latitude: 30.6, longitude: 104.0 },
    { id: 'i1', type: 'image', path: 'wxfile://a.jpg', remoteUrl: 'https://cdn.example/a.jpg' },
  ]
  const raw = serializeNoteContent(blocks)
  assert.equal(extractNoteTitle(blocks), '案例')
  assert.deepEqual(parseNoteContent(raw)?.map((item) => item.id), ['t1', 'l1', 'i1'])
  assert.equal(hasNoteContent(blocks), true)
  assert.equal(noteAttachmentSignature(blocks), 'image:https://cdn.example/a.jpg')
  assert.equal(parseNoteContent('普通文案'), null)
})

test('note visitor progress uses full-note scroll, not embedded video or pdf', async () => {
  const { calcNoteScrollProgress } = await import('../miniprogram/utils/note.ts')
  const detailMarkup = read('miniprogram/pages/material-detail/index.wxml')
  const detailLogic = read('miniprogram/pages/material-detail/index.ts')
  const noteSection = detailMarkup.slice(detailMarkup.indexOf("fileType === 'NOTE'"), detailMarkup.indexOf("fileType === 'VIDEO'"))
  const fileTap = detailLogic.slice(detailLogic.indexOf('onNoteFileTap'), detailLogic.indexOf('onImageTap'))

  assert.equal(calcNoteScrollProgress(0, 1000, 400), 40)
  assert.equal(calcNoteScrollProgress(600, 1000, 400), 100)
  assert.equal(calcNoteScrollProgress(0, 300, 400), 100)
  assert.match(detailLogic, /calcNoteScrollProgress/)
  assert.match(detailLogic, /onPageScroll/)
  assert.match(detailLogic, /reportNoteScrollProgress/)
  assert.match(noteSection, /onNoteVideoTap/)
  assert.match(detailMarkup, /note-video-player/)
  const playerMarkup = read('miniprogram/components/note-video-player/index.wxml')
  const playerLogic = read('miniprogram/components/note-video-player/index.ts')
  const playerStyles = read('miniprogram/components/note-video-player/index.less')
  assert.match(playerMarkup, /note-video-player__bar/)
  assert.match(playerMarkup, /catchtap="onCloseTap"/)
  assert.match(playerLogic, /getNavigationBarLayout/)
  assert.match(playerStyles, /note-video-player__bar/)
  assert.doesNotMatch(noteSection, /<video|bindtimeupdate|bindplay/)
  assert.match(fileTap, /wx\.openDocument/)
  assert.doesNotMatch(fileTap, /document-reader/)
})

test('backspace at the start of following text deletes the previous note attachment', async () => {
  const { deletePreviousAttachmentOnBackspace } = await import('../miniprogram/utils/note.ts')

  const image = { id: 'i1', type: 'image', path: 'wxfile://a.jpg' }
  const text = { id: 't1', type: 'text', text: '\u200b' }
  const deleted = deletePreviousAttachmentOnBackspace([image, text], 't1', {
    keyCode: 8,
    cursor: 0,
    oldText: '\u200b',
    nextText: '',
  })

  assert.ok(deleted)
  assert.equal(deleted.blocks.some((block) => block.type === 'image'), false)
  assert.equal(deleted.focusTextId, 't1')

  const kept = deletePreviousAttachmentOnBackspace(
    [{ id: 't0', type: 'text', text: '案例' }, text],
    't1',
    { keyCode: 8, cursor: 0, oldText: '', nextText: '' },
  )
  assert.equal(kept, null)
})

test('publish sheet entry includes 笔记 and opens the note editor', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const materialsLogic = read('miniprogram/pages/materials/index.ts')
  const materialsMarkup = read('miniprogram/pages/materials/index.wxml')
  const sheet = read('miniprogram/components/publish-type-sheet/index.ts')
  const service = read('miniprogram/services/materials.ts')

  assert.ok(app.pages.includes('pages/materials/note/index'))
  assert.match(JSON.stringify(app.requiredPrivateInfos), /chooseLocation/)
  assert.match(homeMarkup, /kind="entry"/)
  assert.match(materialsMarkup, /kind="entry"/)
  assert.match(sheet, /kind === 'entry' \? PUBLISH_ENTRY_TYPE_OPTIONS/)
  assert.match(homeLogic, /type === 'note'/)
  assert.match(homeLogic, /MATERIAL_NOTE_PATH/)
  assert.match(materialsLogic, /type === 'note'/)
  assert.match(materialsLogic, /buildMaterialEditPath\(materialId, material.kind\)/)
  assert.match(service, /fileType: NOTE_FILE_TYPE/)
  assert.match(service, /export function saveNoteDraft/)
  assert.match(service, /export function publishNote/)
})

test('note editor can add text, location, image, video, file and save like other materials', () => {
  const markup = read('miniprogram/pages/materials/note/index.wxml')
  const logic = read('miniprogram/pages/materials/note/index.ts')
  const detailMarkup = read('miniprogram/pages/material-detail/index.wxml')
  const detailLogic = read('miniprogram/pages/material-detail/index.ts')
  const share = read('miniprogram/utils/share-material.ts')

  const styles = read('miniprogram/pages/materials/note/index.less')
  const navBarMarkup = read('miniprogram/components/navigation-bar/navigation-bar.wxml')

  assert.match(markup, /title="笔记"/)
  assert.match(markup, /back="\{\{false\}\}"/)
  assert.match(markup, /note-page__nav-back/)
  assert.match(markup, /onNavBackTap/)
  assert.doesNotMatch(markup, /slot="left"|left-flush/)
  assert.match(styles, /\.note-page \{[\s\S]*height: 100vh;[\s\S]*overflow: hidden;/)
  assert.match(styles, /\.note-page__scroll \{[\s\S]*flex: 1;[\s\S]*height: 0;/)
  assert.match(styles, /weui-navigation-bar__center/)
  assert.match(styles, /\.note-page__nav-back \{[\s\S]*position: absolute;[\s\S]*left: 0;/)
  assert.match(styles, /padding: 0 24rpx 0 8rpx/)
  assert.match(markup, /id="noteNavBar"/)
  assert.match(markup, /note-page__nav-actions/)
  assert.match(markup, /navActionRight/)
  assert.match(styles, /\.note-page__nav-actions \{[\s\S]*position: absolute;/)
  assert.match(logic, /layoutNavActions/)
  assert.match(logic, /resolveNavActionsRight/)
  assert.match(navBarMarkup, /weui-navigation-bar__title/)
  assert.match(markup, /onUndoTap/)
  assert.match(markup, /onRedoTap/)
  assert.doesNotMatch(markup, /placeholder="添加文字"/)
  assert.match(markup, /scroll-into-view/)
  assert.match(markup, /bottom: \{\{keyboardInset\}\}px/)
  assert.match(markup, /hold-keyboard="\{\{false\}\}"/)
  assert.match(markup, /note-video-player/)
  assert.match(markup, /onCloseVideoPlayer/)
  assert.doesNotMatch(markup, /playingVideoId|<video/)
  assert.doesNotMatch(markup, /onMoreTap|note-more\.svg/)
  assert.doesNotMatch(markup, /note-page__insert/)
  assert.match(markup, /bindtap="onEditorBlankTap"/)
  assert.match(markup, /onPlusTap/)
  assert.match(markup, /note-plus\.svg/)
  assert.doesNotMatch(markup, /<text>\+<\/text>|onDeleteBlockTap|note-block__delete/)
  assert.match(markup, />照片</)
  assert.match(markup, />拍摄</)
  assert.match(markup, />位置</)
  assert.match(markup, />文件</)
  assert.match(markup, /存草稿/)
  assert.match(markup, /发表/)
  assert.match(logic, /focusEditor/)
  assert.match(logic, /onKeyboardHeightChange/)
  assert.match(logic, /deletePreviousAttachmentOnBackspace/)
  assert.match(logic, /dismissKeyboard/)
  assert.match(logic, /openingPlusPanel/)
  assert.match(logic, /onPlusTouchStart/)
  assert.match(logic, /ignoreBlankTapUntil/)
  assert.match(logic, /showComposerBar = !plusPanelVisible && keyboardHeight > 0/)
  assert.match(logic, /wx\.onKeyboardHeightChange/)
  assert.match(logic, /onCloseVideoPlayer/)
  assert.match(logic, /type: 'mix'/)
  assert.match(logic, /source: 'album'/)
  assert.match(logic, /source: 'camera'/)
  assert.match(logic, /wx\.chooseLocation/)
  assert.match(logic, /wx\.chooseMessageFile/)
  assert.match(logic, /saveNoteDraft/)
  assert.match(logic, /publishNote/)
  assert.match(logic, /returnToMaterialsList/)
  assert.match(detailMarkup, /detail.fileType === 'NOTE'/)
  assert.match(detailMarkup, /open-type="share"/)
  assert.match(detailLogic, /onShareTimeline/)
  assert.match(detailLogic, /buildMaterialEditPath\(detail.id, detail.fileType === 'NOTE' \? 'note' : '', true\)/)
  assert.match(share, /MATERIAL_NOTE_PATH/)
  assert.match(share, /kind === 'note' \|\| kind === 'NOTE'/)
})
