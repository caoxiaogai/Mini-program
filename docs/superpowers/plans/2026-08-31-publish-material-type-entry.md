# Publish Material Type Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every publish-material entry point choose 图片、视频 or PDF before opening the existing copy editor.

**Architecture:** Add a small shared publish-type-sheet component for the first choice. Pass a typed `type` query parameter to the existing publish page, where the page constrains its add-media picker to that type while keeping the existing copy, draft, publish and delete flows.

**Tech Stack:** Native WeChat Mini Program, TypeScript, WXML, Less, Node `node:test`.

**Spec:** User-confirmed request and Figma node `835:9004`.

## Global Constraints

- Use native WeChat Mini Program APIs and existing TypeScript/WXML/Less structure.
- Do not add third-party UI, state, request, media or date dependencies.
- Pages consume stable view state; media selection remains inside the publish page and no production API behavior is invented.
- Shared UI is placed in `miniprogram/components/`; static assets remain under `miniprogram/assets/`.
- Preserve existing draft, publish, delete and cancel behavior.

---

### Task 1: Add typed publish-entry helpers and regression tests

**Files:**
- Modify: `miniprogram/utils/publish-media.ts`
- Create: `tests/publish-material-entry.test.mjs`

**Interfaces:**
- Produces `PublishEntryType = 'image' | 'video' | 'pdf'`.
- Produces `PUBLISH_ENTRY_TYPE_OPTIONS` with labels 图片、视频、PDF.
- Produces `getPublishEntryType(value: string | undefined): PublishEntryType | null`.
- Produces `getMediaPickerType(entryType: PublishEntryType): 'image' | 'video' | 'pdf'`.

- [ ] **Step 1: Write the failing test**

```js
test('publish entry exposes separate image, video and PDF choices', async () => {
  const { PUBLISH_ENTRY_TYPE_OPTIONS, getPublishEntryType, getMediaPickerType } = await import('../miniprogram/utils/publish-media.ts')
  assert.deepEqual(PUBLISH_ENTRY_TYPE_OPTIONS.map((item) => item.id), ['image', 'video', 'pdf'])
  assert.deepEqual(PUBLISH_ENTRY_TYPE_OPTIONS.map((item) => item.label), ['图片', '视频', 'PDF'])
  assert.equal(getPublishEntryType('image'), 'image')
  assert.equal(getPublishEntryType('video'), 'video')
  assert.equal(getPublishEntryType('pdf'), 'pdf')
  assert.equal(getPublishEntryType(undefined), null)
  assert.equal(getPublishEntryType('media'), null)
  assert.equal(getMediaPickerType('image'), 'image')
  assert.equal(getMediaPickerType('video'), 'video')
  assert.equal(getMediaPickerType('pdf'), 'pdf')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/publish-material-entry.test.mjs`

Expected: FAIL because the new entry constants and helpers do not exist.

- [ ] **Step 3: Write minimal implementation**

Add the exact union, options and validation helpers to `miniprogram/utils/publish-media.ts`; leave the existing `PUBLISH_TYPE_OPTIONS` only until the publish-page migration in Task 3 removes its use.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/publish-material-entry.test.mjs`

Expected: PASS.

### Task 2: Build the shared publish-type sheet and wire both home entry points

**Files:**
- Create: `miniprogram/components/publish-type-sheet/index.json`
- Create: `miniprogram/components/publish-type-sheet/index.ts`
- Create: `miniprogram/components/publish-type-sheet/index.wxml`
- Create: `miniprogram/components/publish-type-sheet/index.less`
- Modify: `miniprogram/pages/index/index.json`
- Modify: `miniprogram/pages/index/index.ts`
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.less`
- Modify: `tests/publish-material-entry.test.mjs`

**Interfaces:**
- Component property: `visible: boolean`.
- Component event: `select`, detail `{ type: PublishEntryType }`.
- Component event: `cancel`, no detail.
- Home page handlers: `onMaterialPublishTap`, `onPlusTap`, `onPublishTypeSelect`, `onPublishTypeCancel`.

- [ ] **Step 1: Write the failing test**

```js
test('home routes both publish entry points through the shared type sheet', () => {
  const page = read('miniprogram/pages/index/index.wxml')
  const logic = read('miniprogram/pages/index/index.ts')
  const config = read('miniprogram/pages/index/index.json')

  assert.match(config, /"publish-type-sheet"\s*:\s*"\/components\/publish-type-sheet\/index"/)
  assert.match(page, /<publish-type-sheet[\s\S]*visible="\{\{publishTypeSheetVisible\}\}"/)
  assert.match(page, /bind:select="onPublishTypeSelect"/)
  assert.match(page, /bind:cancel="onPublishTypeCancel"/)
  assert.match(logic, /onMaterialPublishTap\(\)\s*\{[\s\S]*publishTypeSheetVisible: true/)
  assert.match(logic, /onPlusTap\(\)\s*\{[\s\S]*publishTypeSheetVisible: true/)
  assert.match(logic, /url: `\/pages\/materials\/publish\/index\?type=\$\{type\}`/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/publish-material-entry.test.mjs`

Expected: FAIL because the shared component and home handlers are not wired.

- [ ] **Step 3: Write minimal implementation**

Implement the component with the Figma-style bottom sheet: full-screen translucent mask, three vertically stacked choices 图片/视频/PDF, safe-area bottom padding, and cancel-on-mask. Add `publishTypeSheetVisible` to the home page; make both the floating 发布素材 button and bottom plus open it. On selection, close the sheet and navigate to `/pages/materials/publish/index?type=<type>`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/publish-material-entry.test.mjs`

Expected: PASS.

### Task 3: Make the publish editor honor the selected type

**Files:**
- Modify: `miniprogram/pages/materials/publish/index.ts`
- Modify: `miniprogram/pages/materials/publish/index.wxml`
- Modify: `miniprogram/pages/materials/publish/index.less`
- Modify: `tests/publish-material-entry.test.mjs`

**Interfaces:**
- Page state: `entryType: PublishEntryType`.
- Page query: `type=image|video|pdf`.
- The existing add-media control remains the entry to the native picker and the copy textarea remains visible on initial render.

- [ ] **Step 1: Write the failing test**

```js
test('publish editor reads the selected type and limits native pickers', () => {
  const page = read('miniprogram/pages/materials/publish/index.ts')
  const markup = read('miniprogram/pages/materials/publish/index.wxml')

  assert.match(page, /entryType:\s*'image'\s*as\s*PublishEntryType/)
  assert.match(page, /getPublishEntryType\(options\.type\)/)
  assert.match(page, /mediaType:\s*\[this\.entryType\]/)
  assert.match(page, /this\.entryType\s*===\s*'pdf'/)
  assert.match(page, /choosePdfFromChat\(\)/)
  assert.match(markup, /placeholder="添加文案"/)
  assert.doesNotMatch(page, /mediaType:\s*\['image',\s*'video'\]/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/publish-material-entry.test.mjs`

Expected: FAIL because the page still uses the old combined 图片/视频 flow.

- [ ] **Step 3: Write minimal implementation**

Read and validate `options.type` in `onLoad`, default legacy direct visits to `image`, restrict `chooseMedia` to `[this.entryType]`, route PDF to `chooseMessageFile`, and reject incompatible existing draft media with a clear toast. Replace the old type/source sheets with the selected-type behavior while preserving camera/album selection for images and videos. Remove obsolete combined type options and handlers after migration.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/publish-material-entry.test.mjs`

Expected: PASS.

### Task 4: Update project handoff and run verification

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Run all relevant tests**

Run: `node --test tests/home-page.test.mjs tests/publish-material-entry.test.mjs`

Expected: PASS with no failures.

- [ ] **Step 2: Run static checks**

Run: `node -e "const fs=require('fs'); const files=['miniprogram/pages/index/index.json','miniprogram/pages/materials/publish/index.json','miniprogram/components/publish-type-sheet/index.json']; for (const f of files) JSON.parse(fs.readFileSync(f,'utf8')); console.log('JSON OK')"`

Expected: `JSON OK`.

- [ ] **Step 3: Check source contracts**

Run: `rg -n "publish-type-sheet|PUBLISH_ENTRY_TYPE_OPTIONS|getPublishEntryType|添加文案|mediaType" miniprogram/components/publish-type-sheet miniprogram/pages/index miniprogram/pages/materials/publish miniprogram/utils/publish-media.ts`

Expected: shared sheet registration, typed entry parsing, copy placeholder and restricted picker contracts are present.

- [ ] **Step 4: Record the change**

Update `HANDOFF.md` with the new publish entry flow, the shared component path, the query parameter contract, and the fact that current media selection remains native/mock-front-end behavior pending a confirmed upload API.
