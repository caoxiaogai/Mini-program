import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('publish entry exposes separate image, video and PDF choices', async () => {
  const { PUBLISH_ENTRY_TYPE_OPTIONS, PUBLISH_SOURCE_OPTIONS, getPublishEntryType, getMediaPickerType } = await import('../miniprogram/utils/publish-media.ts')

  assert.deepEqual(PUBLISH_ENTRY_TYPE_OPTIONS.map((item) => item.id), ['image', 'video', 'pdf'])
  assert.deepEqual(PUBLISH_ENTRY_TYPE_OPTIONS.map((item) => item.label), ['图片', '视频', 'PDF'])
  assert.deepEqual(PUBLISH_SOURCE_OPTIONS.map((item) => item.id), ['camera', 'album'])
  assert.deepEqual(PUBLISH_SOURCE_OPTIONS.map((item) => item.label), ['拍摄', '从相册选择'])
  assert.equal(getPublishEntryType('image'), 'image')
  assert.equal(getPublishEntryType('video'), 'video')
  assert.equal(getPublishEntryType('pdf'), 'pdf')
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
  assert.doesNotMatch(componentStyles, /\.publish-type-sheet\s*\{[\s\S]*background:\s*#f5f5f5;/)
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
  assert.match(picker, /mediaType:\s*\[options\.type\]/)
  assert.match(picker, /sourceType:\s*\[options\.source\]/)
  assert.match(page, /takePendingPublishSelection\(\)/)
  assert.match(page, /onAddMediaTap\(\) \{[\s\S]*media\.length === 0[\s\S]*publishTypeSheetVisible: true/)
  assert.match(page, /onAddMediaTap\(\) \{[\s\S]*publishSourceSheetVisible: true/)
  assert.match(page, /onPublishTypeSelect[\s\S]*publishSourceSheetVisible: true/)
  assert.match(page, /chooseImageOrVideo\(source\)/)
  assert.match(markup, /<publish-type-sheet[\s\S]*visible="\{\{publishTypeSheetVisible\}\}"/)
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

  assert.match(markup, /class="publish-page__image-slot publish-page__image-slot--filled"/)
  assert.match(styles, /\.publish-page__image-slot--filled\s*\{[^}]*border:\s*2rpx solid #e5e5e5;/)
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
