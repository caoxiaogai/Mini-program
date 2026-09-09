import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('publish entry exposes separate image, video and PDF choices', async () => {
  const { PUBLISH_ENTRY_TYPE_OPTIONS, PUBLISH_SOURCE_OPTIONS, getPublishEntryType, getMediaPickerType } = await import('../miniprogram/utils/publish-media.ts')

  assert.deepEqual(PUBLISH_ENTRY_TYPE_OPTIONS.map((item) => item.id), ['image', 'video', 'pdf', 'note'])
  assert.deepEqual(PUBLISH_ENTRY_TYPE_OPTIONS.map((item) => item.label), ['图片', '视频', 'PDF', '笔记'])
  assert.deepEqual(PUBLISH_SOURCE_OPTIONS.map((item) => item.id), ['camera', 'album'])
  assert.deepEqual(PUBLISH_SOURCE_OPTIONS.map((item) => item.label), ['拍摄', '从相册选择'])
  assert.equal(getPublishEntryType('image'), 'image')
  assert.equal(getPublishEntryType('video'), 'video')
  assert.equal(getPublishEntryType('pdf'), 'pdf')
  assert.equal(getPublishEntryType('note'), 'note')
  assert.equal(getPublishEntryType(undefined), null)
  assert.equal(getPublishEntryType('media'), null)
  assert.equal(getMediaPickerType('image'), 'image')
  assert.equal(getMediaPickerType('video'), 'video')
  assert.equal(getMediaPickerType('pdf'), 'pdf')
})

test('home routes both publish entry points through the shared type sheet', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const logic = read('miniprogram/pages/index/index.ts')
  const config = read('miniprogram/pages/index/index.json')
  const component = read('miniprogram/components/publish-type-sheet/index.wxml')
  const componentLogic = read('miniprogram/components/publish-type-sheet/index.ts')
  const componentStyles = read('miniprogram/components/publish-type-sheet/index.less')

  assert.match(config, /"publish-type-sheet"\s*:\s*"\/components\/publish-type-sheet\/index"/)
  assert.match(page, /<publish-type-sheet[\s\S]*visible="\{\{publishTypeSheetVisible\}\}"/)
  assert.match(page, /bind:select="onPublishTypeSelect"/)
  assert.match(page, /bind:cancel="onPublishTypeCancel"/)
  assert.match(page, /<publish-type-sheet kind="source"[\s\S]*visible="\{\{publishSourceSheetVisible\}\}"/)
  assert.match(page, /bind:select="onPublishSourceSelect"/)
  assert.match(logic, /onPublishTypeSelect[\s\S]*publishSourceSheetVisible: true/)
  assert.match(componentLogic, /kind === 'source'/)
  assert.match(component, /class="publish-type-sheet__mask" catchtap="onMaskTap"/)
  assert.doesNotMatch(component, /onCancelTap|>取消<\/text>/)
  assert.doesNotMatch(componentLogic, /onCancelTap/)
  assert.match(componentStyles, /\.publish-type-sheet\s*\{[\s\S]*background:\s*transparent;/)
  assert.doesNotMatch(componentStyles, /\.publish-type-sheet\s*\{[\s\S]*background:\s*#f0f1f2;/)
  assert.match(componentStyles, /\.publish-type-sheet__panel\s*\{[^}]*border-radius:\s*40rpx 40rpx 0 0;[^}]*background:\s*#ffffff;[^}]*overflow:\s*hidden;[^}]*padding-bottom:\s*env\(safe-area-inset-bottom\);/)
  assert.doesNotMatch(componentStyles, /publish-type-sheet__cancel|gap:\s*20rpx;/)
  assert.match(logic, /onMaterialPublishTap\(\)\s*\{[\s\S]*publishTypeSheetVisible: true/)
  assert.match(logic, /onPlusTap\(\)\s*\{\s*this\.setActiveTab\(2\)\s*}/)
  assert.doesNotMatch(logic, /onPlusTap\(\)\s*\{[\s\S]*publishTypeSheetVisible: true/)
  assert.match(logic, /url: `\/pages\/materials\/publish\/index\?type=\$\{type\}`/)
})

test('publish editor reads the selected type and limits native pickers', () => {
  const page = read('miniprogram/pages/materials/publish/index.ts')
  const markup = read('miniprogram/pages/materials/publish/index.wxml')
  const picker = read('miniprogram/utils/publish-media.ts')

  assert.match(page, /entryType:\s*'image'\s*as\s*PublishEntryType/)
  assert.match(page, /getPublishEntryType\(options\.type\)/)
  assert.match(picker, /mediaType:\s*options\.type === 'mix' \? \['image', 'video'\] : \[options\.type\]/)
  assert.match(picker, /sourceType:\s*\[options\.source\]/)
  assert.match(page, /takePendingPublishSelection\(\)/)
  assert.match(page, /onAddMediaTap\(\) \{[\s\S]*this\.entryType === 'pdf'[\s\S]*choosePdfFromChat\(\)/)
  assert.match(page, /onAddMediaTap\(\) \{[\s\S]*this\.entryType === 'video'[\s\S]*pendingMediaType = 'video'/)
  assert.match(page, /onAddMediaTap\(\) \{[\s\S]*pendingMediaType = 'image'[\s\S]*publishSourceSheetVisible: true/)
  assert.doesNotMatch(page, /onAddMediaTap\(\) \{[\s\S]*media\.length === 0[\s\S]*publishTypeSheetVisible: true/)
  assert.doesNotMatch(page, /onPublishTypeSelect/)
  assert.match(page, /chooseImageOrVideo\(source\)/)
  assert.doesNotMatch(markup, /visible="\{\{publishTypeSheetVisible\}\}"/)
  assert.match(markup, /<publish-type-sheet kind="source"[\s\S]*visible="\{\{publishSourceSheetVisible\}\}"/)
  assert.match(markup, /placeholder="添加文案"/)
  assert.doesNotMatch(page, /mediaType:\s*\['image',\s*'video'\]/)
  assert.doesNotMatch(picker, /sourceType:\s*\['album'\]/)
})

test('publish type selection asks camera or album before opening the native picker', async () => {
  const selection = await import('../miniprogram/utils/publish-selection.ts')
  const picker = read('miniprogram/utils/publish-media.ts')
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const materialsLogic = read('miniprogram/pages/materials/index.ts')
  const materialsMarkup = read('miniprogram/pages/materials/index.wxml')
  const publishLogic = read('miniprogram/pages/materials/publish/index.ts')
  const publishMarkup = read('miniprogram/pages/materials/publish/index.wxml')
  const materialsConfig = read('miniprogram/pages/materials/index.json')

  assert.equal(typeof selection.setPendingPublishSelection, 'function')
  assert.equal(typeof selection.takePendingPublishSelection, 'function')
  assert.match(picker, /wx\.chooseMedia\([\s\S]*sourceType:\s*\[options\.source\]/)
  assert.match(homeLogic, /openPublishEditorFromPicker\(type, source\)/)
  assert.match(homeLogic, /onPublishTypeSelect[\s\S]*publishSourceSheetVisible: true/)
  assert.doesNotMatch(homeLogic, /sourceType:\s*\['album'\]/)
  assert.match(homeMarkup, /<publish-type-sheet kind="source"[\s\S]*visible="\{\{publishSourceSheetVisible\}\}"/)
  assert.match(materialsLogic, /openPublishEditorFromPicker\(type, source\)/)
  assert.match(materialsLogic, /onPublishTypeSelect[\s\S]*publishSourceSheetVisible: true/)
  assert.match(materialsMarkup, /<publish-type-sheet kind="source"[\s\S]*visible="\{\{publishSourceSheetVisible\}\}"/)
  assert.match(materialsConfig, /publish-type-sheet/)
  assert.match(publishLogic, /takePendingPublishSelection\(\)/)
  assert.match(publishMarkup, /placeholder="添加文案"/)
  assert.match(publishLogic, /chooseImageOrVideo\(source\)/)
  assert.match(publishLogic, /source !== 'camera' && source !== 'album'/)
})

test('publish selection is consumed once and image detail can append another image', async () => {
  const { setPendingPublishSelection, takePendingPublishSelection } = await import('../miniprogram/utils/publish-selection.ts')
  const { mergePublishMedia } = await import('../miniprogram/utils/publish-media.ts')
  const first = { id: 'image-1', path: 'wxfile://image-1', kind: 'image', previewPath: '', name: '', duration: 0 }
  const second = { id: 'image-2', path: 'wxfile://image-2', kind: 'image', previewPath: '', name: '', duration: 0 }

  setPendingPublishSelection({ type: 'image', media: [first] })
  assert.deepEqual(takePendingPublishSelection(), { type: 'image', media: [first] })
  assert.equal(takePendingPublishSelection(), null)
  assert.deepEqual(mergePublishMedia([first], [second]).items, [first, second])
})

test('publish detail add-image slot matches Figma 850:9370', () => {
  const markup = read('miniprogram/pages/materials/publish/index.wxml')
  const styles = read('miniprogram/pages/materials/publish/index.less')

  assert.match(markup, /class="publish-page__add-icon" aria-hidden="true"[\s\S]*publish-page__add-icon-horizontal[\s\S]*publish-page__add-icon-vertical/)
  assert.match(styles, /\.publish-page__image-slot--add\s*\{[^}]*background:\s*#f7f7f7;[^}]*border:\s*2rpx solid #e5e5e5;[^}]*border-radius:\s*20rpx;/)
  assert.match(styles, /\.publish-page__add-icon\s*\{[^}]*width:\s*26%;[^}]*height:\s*26%;/)
  assert.match(styles, /\.publish-page__add-icon-horizontal,\s*\.publish-page__add-icon-vertical\s*\{[^}]*background:\s*#8a8e94;/)
  assert.match(styles, /\.publish-page__add-icon-horizontal\s*\{[^}]*width:\s*100%;[^}]*height:\s*4rpx;/)
  assert.match(styles, /\.publish-page__add-icon-vertical\s*\{[^}]*width:\s*4rpx;[^}]*height:\s*100%;/)
  assert.doesNotMatch(styles, /\.publish-page__add-icon\s*\{[^}]*font-size:/)
})

test('publish detail filled image slots use the requested outline', () => {
  const markup = read('miniprogram/pages/materials/publish/index.wxml')
  const styles = read('miniprogram/pages/materials/publish/index.less')

  assert.match(markup, /publish-page__image-slot--filled/)
  assert.match(styles, /\.publish-page__image-slot--filled\s*\{[^}]*border:\s*2rpx solid #e5e5e5;/)
})

test('publish image media swaps fixed nine-grid slots instead of shifting other images', () => {
  const logic = read('miniprogram/pages/materials/publish/index.ts')

  assert.match(logic, /function buildPublishMediaSlots\(/)
  assert.match(logic, /Array<PublishMediaViewModel \| null>\(MAX_IMAGE_COUNT\)\.fill\(null\)/)
  assert.match(logic, /function swapPublishMediaSlots\(/)
  assert.match(logic, /if \(index === draggingSlotIndex\) return \{ \.\.\.slot, media: targetSlot\.media \}/)
  assert.match(logic, /if \(index === targetSlotIndex\) return \{ \.\.\.slot, media: draggingSlot\.media \}/)
  assert.match(logic, /function getPublishMediaInSlotOrder\(/)
})

test('publish grid hides unfilled trailing slots and only allows dropping on an existing image', () => {
  const markup = read('miniprogram/pages/materials/publish/index.wxml')
  const logic = read('miniprogram/pages/materials/publish/index.ts')
  const moveHandler = logic.split('onMediaTouchMove')[1].split('onMediaTouchEnd')[0]

  assert.match(markup, /wx:if="\{\{item\.visible\}\}"/)
  assert.match(logic, /visible: Boolean\(media\) \|\| index === addIndex/)
  assert.match(logic, /visibleMediaSlotIndices: \[\] as number\[\]/)
  assert.match(logic, /this\.visibleMediaSlotIndices = this\.data\.mediaSlots\.filter\(\(slot\) => slot\.visible\)\.map\(\(slot\) => slot\.index\)/)
  assert.match(moveHandler, /const targetSlotIndex = this\.visibleMediaSlotIndices\[targetRectIndex\] \?\? -1/)
  assert.match(moveHandler, /const dragTargetSlotIndex = targetSlotIndex === draggingSlotIndex \|\| !targetSlot\?\.media \? -1 : targetSlotIndex/)
})

test('publish image grid uses a finger-following floating preview and swaps only on release', () => {
  const markup = read('miniprogram/pages/materials/publish/index.wxml')
  const logic = read('miniprogram/pages/materials/publish/index.ts')
  const styles = read('miniprogram/pages/materials/publish/index.less')
  const moveHandler = logic.split('onMediaTouchMove')[1].split('onMediaTouchEnd')[0]

  assert.match(markup, /wx:for="\{\{mediaSlots\}\}"/)
  assert.match(markup, /data-slot-index="\{\{item\.index\}\}"/)
  assert.match(markup, /bindlongpress="onMediaLongPress"/)
  assert.match(markup, /catchtouchmove="onMediaTouchMove"/)
  assert.match(markup, /catchtouchend="onMediaTouchEnd"/)
  assert.match(markup, /class="publish-page__drag-preview/)
  assert.match(markup, /src="\{\{dragPreviewPath\}\}"/)
  assert.match(markup, /dragTargetSlotIndex === item\.index/)
  assert.match(logic, /onMediaLongPress\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(logic, /onMediaTouchMove\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(logic, /onMediaTouchEnd\(\)/)
  assert.match(logic, /dragPreviewX: touch\.clientX - this\.data\.dragPreviewWidth \/ 2/)
  assert.match(logic, /dragPreviewY: touch\.clientY - this\.data\.dragPreviewHeight \/ 2/)
  assert.match(logic, /const dragTargetSlotIndex = targetSlotIndex === draggingSlotIndex \|\| !targetSlot\?\.media \? -1 : targetSlotIndex/)
  assert.match(logic, /dragTargetSlotIndex,\n    \}\)/)
  assert.match(logic, /swapPublishMediaSlots\(this\.data\.mediaSlots, this\.data\.draggingMediaId, this\.data\.dragTargetSlotIndex\)/)
  assert.doesNotMatch(moveHandler, /swapPublishMediaSlots/)
  assert.match(styles, /\.publish-page__image-slot--empty\s*\{[^}]*background:\s*transparent;/)
  assert.match(styles, /\.publish-page__image-slot--dragging\s*\{[^}]*opacity:\s*0\.28;/)
  assert.match(styles, /\.publish-page__drag-preview\s*\{[^}]*position:\s*fixed;[^}]*pointer-events:\s*none;/)
  assert.match(styles, /\.publish-page__image-slot--drag-target\s*\{[^}]*transform:\s*scale\(0\.96\);/)
})

test('tapping a publish-image thumbnail gives press feedback then opens the native image preview', () => {
  const markup = read('miniprogram/pages/materials/publish/index.wxml')
  const logic = read('miniprogram/pages/materials/publish/index.ts')
  const styles = read('miniprogram/pages/materials/publish/index.less')

  assert.match(markup, /bindtap="onMediaPreviewTap"/)
  assert.match(markup, /hover-class="\{\{item\.media \? 'publish-page__image-slot--preview-pressed' : ''\}\}"/)
  assert.match(logic, /onMediaPreviewTap\(event: WechatMiniprogram\.TouchEvent\)/)
  assert.match(logic, /wx\.previewImage\(\{[\s\S]*current: media\.path,[\s\S]*urls: imagePaths,/)
  assert.match(logic, /if \(Date\.now\(\) < this\.previewIgnoreTapUntil\) return/)
  assert.match(styles, /\.publish-page__image-slot--preview-pressed\s*\{[^}]*transform:\s*scale\(0\.96\);/)
})

test('publish copy area starts 20px below the image grid', () => {
  const styles = read('miniprogram/pages/materials/publish/index.less')

  assert.match(styles, /\.publish-page__copy-area\s*\{[^}]*margin-top:\s*40rpx;/)
  assert.doesNotMatch(styles, /\.publish-page__copy-area\s*\{[^}]*margin-top:\s*20rpx;/)
})

test('publish actions match Figma 850:9374 without a white bottom container', () => {
  const styles = read('miniprogram/pages/materials/publish/index.less')

  assert.match(styles, /\.publish-page__actions\s*\{[^}]*background:\s*transparent;/)
  assert.doesNotMatch(styles, /\.publish-page__actions\s*\{[^}]*background:\s*#ffffff;/)
  assert.match(styles, /\.publish-page__draft-button\s*\{[^}]*border:\s*2rpx solid #e5e5e5;/)
})

test('draft and publish buttons show a file-upload overlay until MinIO uploads finish', () => {
  const publishMarkup = read('miniprogram/pages/materials/publish/index.wxml')
  const publishLogic = read('miniprogram/pages/materials/publish/index.ts')
  const noteMarkup = read('miniprogram/pages/materials/note/index.wxml')
  const noteLogic = read('miniprogram/pages/materials/note/index.ts')
  const service = read('miniprogram/services/materials.ts')
  const requestLayer = read('miniprogram/services/request.ts')
  const overlay = read('miniprogram/components/upload-loading/index.wxml')

  assert.match(publishMarkup, /<upload-loading visible="\{\{uploading\}\}"/)
  assert.match(noteMarkup, /<upload-loading visible="\{\{uploading\}\}"/)
  assert.match(publishLogic, /this\.uploadThenSubmit\(\(input\) =>\s*saveMaterialDraft\(input\)/)
  assert.match(publishLogic, /this\.uploadThenSubmit\(\(input\) =>\s*publishMaterial\(input\)/)
  assert.match(noteLogic, /this\.uploadThenSubmit\(\(input\) =>\s*saveNoteDraft\(input\)/)
  assert.match(noteLogic, /this\.uploadThenSubmit\(\(input\) =>\s*publishNote\(input\)/)
  assert.match(publishLogic, /this\.setPublishMedia\(media\)/)
  assert.doesNotMatch(publishLogic, /setData\(\{ media, uploading: false \}\)/)
  assert.match(noteLogic, /this\.setData\(\{ blocks: withFileLabels\(blocks\) \}\)/)
  assert.doesNotMatch(noteLogic, /withFileLabels\(blocks\), uploading: false/)
  assert.match(service, /export function uploadMaterialFiles/)
  assert.match(service, /export function uploadNoteFiles/)
  assert.match(service, /path: '\/material',[\s\S]*silent: true/)
  assert.match(service, /path: `\/material\/\$\{materialId\}\/share`, silent: true/)
  assert.match(overlay, /文件上传中/)
  assert.match(requestLayer, /export function uploadFile\([\s\S]*wx\.uploadFile\(/)
  assert.doesNotMatch(requestLayer, /export function uploadFile\([\s\S]*beginLoading\(\)/)
})

test('materials publish button uses the orange publish color', () => {
  const styles = read('miniprogram/pages/materials/index.less')

  assert.match(styles, /\.materials-publish-button\s*\{[\s\S]*background:\s*#ff8901;/)
})

test('publish editor submit button uses the orange theme color', () => {
  const styles = read('miniprogram/pages/materials/publish/index.less')

  assert.match(styles, /\.publish-page__publish-button\s*\{[^}]*background:\s*#ff8901;/)
})
