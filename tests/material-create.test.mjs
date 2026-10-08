import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const loadMaterialCreate = () => {
  const source = stripTypeScriptTypes(
    read('miniprogram/utils/material-create.ts').replace(/^import[\s\S]*?from [^\n]+\n/gm, ''),
    { mode: 'strip' },
  ).replace(/^export /gm, '')
  return new Function(`${source}
    return {
      mergeCreatingMaterials,
      startMaterialCreateJob,
      dismissCreatedMaterialMark,
      resetMaterialCreateStateForTests,
      publishCreatePreview,
      visibleMaterialsWithCreates,
      pauseMaterialCreatesForBackground,
      resumeMaterialCreatesForForeground,
      MATERIAL_CREATE_TIMEOUT_MS,
    };
  `)()
}

const card = (id, title = id) => ({
  id,
  title,
  date: '2026-10-01',
  thumbnailUrl: '',
  kind: 'image',
})

test('background create stays on the list with progress and a new mark', async () => {
  const api = loadMaterialCreate()
  api.resetMaterialCreateStateForTests()
  const preview = api.publishCreatePreview('第一行标题\n第二行', [{
    kind: 'image',
    path: 'wxfile://local.jpg',
    previewPath: '',
    name: '',
  }])
  assert.equal(preview.title, '第一行标题')
  assert.equal(preview.kind, 'image')
  assert.equal(preview.thumbnailUrl, 'wxfile://local.jpg')
  assert.equal(api.MATERIAL_CREATE_TIMEOUT_MS > 15000, true)

  let report = null
  let finish = null
  api.startMaterialCreateJob(preview, (onProgress) => {
    report = onProgress
    return new Promise((resolve) => {
      finish = resolve
    })
  })

  const creating = api.mergeCreatingMaterials([card('old', '旧作品')])
  assert.equal(creating[0].creating, true)
  assert.equal(creating[0].progress, 0)
  assert.equal(creating[0].isNew, false)
  assert.equal(creating[1].id, 'old')
  assert.equal(creating[1].isNew, false)

  await Promise.resolve()
  report(0.42)
  const progressed = api.mergeCreatingMaterials([card('old', '旧作品')])
  assert.equal(progressed[0].creating, true)
  assert.equal(progressed[0].progress, 42)

  finish('server-9')
  await new Promise((resolve) => setImmediate(resolve))

  const ready = api.mergeCreatingMaterials([card('old', '旧作品')])
  assert.equal(ready[0].id, 'server-9')
  assert.equal(ready[0].creating, false)
  assert.equal(ready[0].isNew, true)

  const listed = api.mergeCreatingMaterials([card('server-9', '第一行标题'), card('old', '旧作品')])
  assert.equal(listed.some((item) => item.creating), false)
  assert.equal(listed[0].id, 'server-9')
  assert.equal(listed[0].isNew, true)

  api.dismissCreatedMaterialMark('server-9')
  const seen = api.mergeCreatingMaterials([card('server-9', '第一行标题'), card('old', '旧作品')])
  assert.equal(seen[0].isNew, false)

  api.resetMaterialCreateStateForTests()
  api.startMaterialCreateJob({
    title: '笔记',
    date: '2026-10-08',
    thumbnailUrl: '',
    kind: 'note',
  }, () => new Promise(() => {}))
  const pinned = api.visibleMaterialsWithCreates([card('old', '旧作品')], 'image')
  assert.equal(pinned[0].kind, 'note')
  assert.equal(pinned[0].creating, true)
  api.resetMaterialCreateStateForTests()
})

test('finished works stay in click order instead of success order', async () => {
  const api = loadMaterialCreate()
  api.resetMaterialCreateStateForTests()
  let finishEarlier = null
  let finishLater = null
  api.startMaterialCreateJob({
    title: '先点的',
    date: '2026-10-08',
    thumbnailUrl: '',
    kind: 'image',
  }, () => new Promise((resolve) => {
    finishEarlier = resolve
  }))
  api.startMaterialCreateJob({
    title: '后点的',
    date: '2026-10-08',
    thumbnailUrl: '',
    kind: 'image',
  }, () => new Promise((resolve) => {
    finishLater = resolve
  }))
  await Promise.resolve()
  assert.deepEqual(api.mergeCreatingMaterials([card('old')]).map((item) => item.title), ['后点的', '先点的', 'old'])

  finishLater('later-click')
  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(
    api.mergeCreatingMaterials([card('later-click', '后点的'), card('old')]).map((item) => item.title),
    ['后点的', '先点的', 'old'],
  )

  finishEarlier('earlier-click')
  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(
    api.mergeCreatingMaterials([
      card('earlier-click', '先点的'),
      card('later-click', '后点的'),
      card('old'),
    ]).map((item) => item.title),
    ['后点的', '先点的', 'old'],
  )
  api.resetMaterialCreateStateForTests()
})

test('an interrupted create stays on the list and resumes in the foreground', async () => {
  const api = loadMaterialCreate()
  api.resetMaterialCreateStateForTests()
  let calls = 0
  let pending = null
  api.startMaterialCreateJob({
    title: '视频素材',
    date: '2026-10-08',
    thumbnailUrl: '',
    kind: 'video',
  }, () => {
    calls += 1
    return new Promise((resolve, reject) => {
      pending = { resolve, reject }
    })
  })
  await Promise.resolve()
  api.pauseMaterialCreatesForBackground()
  pending.reject(new Error('uploadFile:fail interrupted'))
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(calls, 1)
  const paused = api.mergeCreatingMaterials([card('old')])
  assert.equal(paused[0].creating, true)
  assert.equal(paused[0].title, '视频素材')

  api.resumeMaterialCreatesForForeground()
  await Promise.resolve()
  assert.equal(calls, 2)
  pending.resolve('server-resume')
  await new Promise((resolve) => setImmediate(resolve))
  const ready = api.mergeCreatingMaterials([card('server-resume', '视频素材'), card('old')])
  assert.equal(ready[0].id, 'server-resume')
  assert.equal(ready[0].creating, false)
  assert.equal(ready[0].isNew, true)
  api.resetMaterialCreateStateForTests()
})

test('a foreground interrupt resumes the create once', async () => {
  const api = loadMaterialCreate()
  api.resetMaterialCreateStateForTests()
  let calls = 0
  api.startMaterialCreateJob({
    title: '图文素材',
    date: '2026-10-08',
    thumbnailUrl: '',
    kind: 'image',
  }, () => {
    calls += 1
    return Promise.reject(new Error('request:fail interrupted'))
  })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(calls, 2)
  const items = api.mergeCreatingMaterials([card('old')])
  assert.equal(items[0].creating, true)
  assert.equal(items[0].title, '图文素材')
  api.resetMaterialCreateStateForTests()
})

test('create progress stays put while the mini program is in the background', () => {
  const originalNow = Date.now
  const originalSetInterval = globalThis.setInterval
  const originalClearInterval = globalThis.clearInterval
  const originalWx = globalThis.wx
  let now = 10_000_000
  let tick = null
  Date.now = () => now
  globalThis.setInterval = (fn) => {
    tick = fn
    return 1
  }
  globalThis.clearInterval = () => {
    tick = null
  }
  globalThis.wx = {}
  try {
    const api = loadMaterialCreate()
    api.resetMaterialCreateStateForTests()
    api.startMaterialCreateJob({
      title: '视频素材',
      date: '2026-10-08',
      thumbnailUrl: '',
      kind: 'video',
    }, () => new Promise(() => {}))
    now += 1600
    tick()
    assert.equal(api.mergeCreatingMaterials([card('old')])[0].progress, 2)
    api.pauseMaterialCreatesForBackground()
    now += 8000
    tick()
    assert.equal(api.mergeCreatingMaterials([card('old')])[0].progress, 2)
    api.resumeMaterialCreatesForForeground()
    tick()
    assert.equal(api.mergeCreatingMaterials([card('old')])[0].progress, 2)
    now += 800
    tick()
    assert.equal(api.mergeCreatingMaterials([card('old')])[0].progress, 3)
    api.resetMaterialCreateStateForTests()
  } finally {
    Date.now = originalNow
    globalThis.setInterval = originalSetInterval
    globalThis.clearInterval = originalClearInterval
    if (originalWx === undefined) delete globalThis.wx
    else globalThis.wx = originalWx
  }
})

test('a failed background create removes the placeholder', async () => {
  const api = loadMaterialCreate()
  api.resetMaterialCreateStateForTests()
  api.startMaterialCreateJob({
    title: '视频素材',
    date: '2026-10-08',
    thumbnailUrl: '',
    kind: 'video',
  }, () => Promise.reject(Object.assign(new Error('上传失败'), { notified: true })))
  await new Promise((resolve) => setImmediate(resolve))
  const items = api.mergeCreatingMaterials([card('old')])
  assert.deepEqual(items.map((item) => item.id), ['old'])
  api.resetMaterialCreateStateForTests()
})

test('material lists show create progress and the yellow new mark', () => {
  const markup = [
    read('miniprogram/pages/materials/index.wxml'),
    read('miniprogram/pages/index/index.wxml'),
  ]
  const styles = read('miniprogram/pages/materials/index.less')
  const detail = read('miniprogram/pages/material-detail/index.ts')
  const publish = read('miniprogram/pages/materials/publish/index.ts')
  const note = read('miniprogram/pages/materials/note/index.ts')
  const requestLayer = read('miniprogram/services/request.ts')

  for (const page of markup) {
    assert.match(page, /class="materials-card__progress"/)
    assert.match(page, /创建中 \{\{item\.progress\}\}%/)
    assert.match(page, /z-index: 2; left: 0; top: 0; width: 100%; height: 100%;/)
    assert.match(page, /display: flex; flex-direction: row; flex-wrap: nowrap; align-items: center; justify-content: space-between; width: 100%;/)
    assert.match(page, /class="materials-card__date-wrap"/)
    assert.match(page, /style="color: #ff8901; font-size: 28rpx; font-weight: 600; line-height: 36rpx;">新<\/text>/)
    assert.match(page, /item\.isNew && !item\.creating/)
    assert.match(page, /item\.creating/)
  }
  assert.match(read('miniprogram/pages/materials/index.ts'), /material\.creating/)
  assert.match(read('miniprogram/pages/index/index.ts'), /material\?\.creating/)
  assert.match(styles, /\.materials-card__meta\s*\{[\s\S]*flex-direction: row;[\s\S]*justify-content: space-between;/)
  assert.match(styles, /\.materials-card__date-wrap\s*\{[\s\S]*flex: 1;/)
  assert.match(styles, /\.materials-card__progress\s*\{[\s\S]*position: absolute;/)
  assert.match(detail, /dismissCreatedMaterialMark\(this\.materialId\)/)
  assert.match(publish, /if \(!this\.draftMaterialId\) \{\s*this\.startBackgroundCreate\(\)/)
  assert.match(publish, /returnToEditedMaterial\(materialId\)/)
  assert.match(note, /if \(!this\.draftMaterialId\) \{\s*this\.startBackgroundCreate\(\)/)
  assert.match(note, /returnToEditedMaterial\(materialId\)/)
  assert.match(requestLayer, /onProgressUpdate/)
  assert.match(requestLayer, /timeout: options\?\.timeout \?\? UPLOAD_TIMEOUT_MS/)
  assert.match(requestLayer, /function setRequestForeground/)
  assert.match(publish, /draftId: createdId/)
  assert.match(publish, /onCreated:/)
  assert.match(note, /draftId: createdId/)
  assert.match(note, /onCreated:/)
  const app = read('miniprogram/app.ts')
  assert.match(app, /pauseMaterialCreatesForBackground\(\)/)
  assert.match(app, /resumeMaterialCreatesForForeground\(\)/)
  assert.match(app, /setRequestForeground\(false\)/)
  assert.match(app, /setRequestForeground\(true\)/)
})
