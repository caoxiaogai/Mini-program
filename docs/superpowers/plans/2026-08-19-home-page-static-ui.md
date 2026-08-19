# Home Page Static UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Figma home screen as a static native WeChat Mini Program page using local assets, typed mock data, and no real API.

**Architecture:** Reuse the existing custom `navigation-bar` for status-bar and capsule spacing. Keep the greeting area and the three intentionally different summary cards local to the index page; add only the bottom navigation as a reusable component. The page loads a stable `HomeOverviewViewModel` from a local service, which currently returns mock data and is the sole future API seam.

**Tech Stack:** WeChat Mini Program, TypeScript, WXML, Less, Node built-in test runner.

**Spec:** `docs/home-page-prd.md`

## Global Constraints

- The implementation is static UI only: no real API, authentication, upload, tracking, routing, or business writes.
- Use the Figma node `107:6040` as the visual reference at a 393px-wide iPhone 16 baseline.
- Reuse `components/navigation-bar`; do not create a second custom navigation implementation.
- Download Figma assets to `miniprogram/assets/`; do not keep temporary Figma asset URLs in committed code.
- Use TypeScript typed mock data; the page must not import a mock directly.
- Do not retain the default home template or add compatibility layers, migrations, fallback behavior, or configuration frameworks.
- Do not install dependencies.
- Preserve the user-confirmed three-card layout: new visitors (including high-intent count and avatars), reads, shares.

---

### Task 1: Establish the page data contract and its test

**Files:**

- Create: `tests/home-page.test.mjs`
- Create: `miniprogram/types/home.ts`
- Create: `miniprogram/mocks/home.ts`
- Create: `miniprogram/services/home.ts`

**Interfaces:**

- Produces `HomeOverviewViewModel` with `greeting`, `newVisitors`, `reading`, `sharing`, and `unreadNotificationCount`.
- Produces `getHomeOverview(): Promise<HomeOverviewViewModel>` for the index page.

- [ ] **Step 1: Write the failing contract test**

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('home data layer exposes one typed service seam', () => {
  const types = read('miniprogram/types/home.ts')
  const mock = read('miniprogram/mocks/home.ts')
  const service = read('miniprogram/services/home.ts')

  assert.match(types, /export interface HomeOverviewViewModel/)
  assert.match(mock, /export const homeOverviewMock/)
  assert.match(service, /export function getHomeOverview\(\): Promise<HomeOverviewViewModel>/)
  assert.match(service, /TODO\(API\): 接入首页摘要真实接口/)
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/home-page.test.mjs`

Expected: `ENOENT` because the home type, mock, and service files do not exist.

- [ ] **Step 3: Add the minimal typed data layer**

```ts
// miniprogram/types/home.ts
export interface HomeOverviewViewModel {
  greeting: string
  newVisitors: { total: number; highIntentCount: number; visitors: Array<{ id: string; avatarUrl: string }> }
  reading: { total: number }
  sharing: { total: number; highlightedContentTitle: string; highlightedContentShareCount: number }
  unreadNotificationCount: number
}

// miniprogram/services/home.ts
export function getHomeOverview(): Promise<HomeOverviewViewModel> {
  // TODO(API): 接入首页摘要真实接口
  return Promise.resolve(homeOverviewMock)
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `node --test tests/home-page.test.mjs`

Expected: `1 passing`.

### Task 2: Create reusable bottom navigation

**Files:**

- Modify: `tests/home-page.test.mjs`
- Create: `miniprogram/components/bottom-tab-bar/bottom-tab-bar.json`
- Create: `miniprogram/components/bottom-tab-bar/bottom-tab-bar.ts`
- Create: `miniprogram/components/bottom-tab-bar/bottom-tab-bar.wxml`
- Create: `miniprogram/components/bottom-tab-bar/bottom-tab-bar.less`

**Interfaces:**

- Consumes an array of `{ id, label, iconPath, badgeCount? }` through a component `items` property.
- Produces a `tabtap` event with `{ id }` and hides a badge for `0` or an absent count.

- [ ] **Step 1: Add the failing structural test**

```js
test('bottom navigation renders tab labels and optional unread badges', () => {
  const component = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.wxml')
  const logic = read('miniprogram/components/bottom-tab-bar/bottom-tab-bar.ts')

  assert.match(component, /wx:for="{{items}}"/)
  assert.match(component, /wx:if="{{item.badgeCount}}"/)
  assert.match(logic, /triggerEvent\('tabtap'/)
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/home-page.test.mjs`

Expected: `ENOENT` because the bottom navigation component does not exist.

- [ ] **Step 3: Implement the minimal component**

```ts
Component({
  properties: { items: { type: Array, value: [] } },
  methods: {
    onTabTap(event: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('tabtap', { id: event.currentTarget.dataset.id })
    },
  },
})
```

Use a fixed bottom container with `padding-bottom: env(safe-area-inset-bottom)`, evenly distributed tab items, local exported icons, and `hover-class` for static press feedback. Do not add route handling.

- [ ] **Step 4: Run the test and verify it passes**

Run: `node --test tests/home-page.test.mjs`

Expected: `2 passing`.

### Task 3: Replace the default home template with the Figma static screen

**Files:**

- Modify: `tests/home-page.test.mjs`
- Modify: `miniprogram/pages/index/index.json`
- Modify: `miniprogram/pages/index/index.ts`
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.less`
- Modify: `miniprogram/app.less`
- Modify: `miniprogram/app.json`
- Create: `miniprogram/assets/home/*` from Figma exports

**Interfaces:**

- Consumes `getHomeOverview()` and the `bottom-tab-bar` component.
- Produces the static home screen with the exact text and structure from the approved spec.

- [ ] **Step 1: Add the failing page structure test**

```js
test('home page declares the Figma primary regions', () => {
  const page = read('miniprogram/pages/index/index.wxml')

  assert.match(page, /class="home-page"/)
  assert.match(page, /class="home-assistant"/)
  assert.match(page, /class="home-summary"/)
  assert.match(page, /bottom-tab-bar/)
  assert.match(page, /阿宝AI/)
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/home-page.test.mjs`

Expected: assertion failure because the default index WXML has none of the required page regions.

- [ ] **Step 3: Implement the page with the smallest complete layout**

1. Remove the default user-profile template and its handlers.
2. Set `usingComponents` for `navigation-bar` and `bottom-tab-bar`.
3. Load `getHomeOverview()` in the page lifecycle and bind `homeData` to the WXML.
4. Reuse `navigation-bar` with a left slot containing `阿宝AI`, no back button, and transparent background.
5. Render the local AI image, greeting, three summary card blocks, avatar overlap list, and bottom navigation config.
6. Rebuild the Figma visual system in Less: full-height pale-blue gradient, white translucent cards, 12rpx-equivalent rounded cards, teal metric emphasis, spacious vertical rhythm, and fixed safe-area bottom navigation.
7. Use Figma-exported local assets only; do not recreate the system status-bar or capsule graphics.

- [ ] **Step 4: Run structural tests and TypeScript compilation checks**

Run: `node --test tests/home-page.test.mjs`

Expected: `3 passing`.

Run: compile the project in WeChat Developer Tools.

Expected: no WXML, Less, JSON, or TypeScript errors.

- [ ] **Step 5: Perform visual verification**

Compare the rendered home screen against Figma node `107:6040` at 393px width, then check one narrower simulator width. Verify the gradient, title placement, AI image, greeting, all three cards, teal numbers, avatar overlap, fixed bottom navigation, badge visibility, and safe-area spacing.

### Task 4: Update project handoff

**Files:**

- Modify: `HANDOFF.md`

**Interfaces:**

- Records that the static home page is implemented with mock data and has no real API or route behavior.

- [ ] **Step 1: Update task status and recent change entry**

Record the created page, component, mock, service, local Figma assets, structural test command, and visual-verification result. Keep unresolved production API and navigation behavior marked as not in scope.

- [ ] **Step 2: Verify handoff references the implementation artifacts**

Run: `rg -n 'bottom-tab-bar|HomeOverviewViewModel|node --test tests/home-page.test.mjs' HANDOFF.md`

Expected: all three terms are present.
