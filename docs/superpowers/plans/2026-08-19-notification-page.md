# Notification Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Figma notification screen `107:6253` as a native WeChat mini-program page and make the home notification tab navigate to it.

**Architecture:** Add a typed notification view model, fixed mock data, and a service seam. The page will compose the existing navigation-bar component with a notification filter row and grouped notification cards; local Figma assets will be referenced through the mock view model. The home page will handle the bottom-tab event and navigate to the new page only for the notification tab.

**Tech Stack:** WeChat native mini-program, TypeScript, WXML, Less, Skyline, glass-easel, Node test runner.

**Spec:** Figma node `107:6253` from `https://www.figma.com/design/kpT2Xd5s7zHkwDsiN1vzrm/Untitled?node-id=107-6253&m=dev`, plus `AGENTS.md` and `HANDOFF.md`.

## Global Constraints

- Keep the WeChat native mini-program stack; do not introduce React, Vue, Taro, uni-app, or third-party UI/state/request libraries.
- Pages consume service methods, not mock modules directly; future API work stays behind `services/` with a searchable `TODO(API)` contract.
- Use fixed, clearly fictional mock data and local assets under `miniprogram/assets/notifications/`.
- Reuse the existing `navigation-bar` and `bottom-tab-bar` components where their contracts fit; do not perform unrelated refactors.
- Use `rpx` for Figma dimensions, preserve the 393px reference layout, safe-area handling, card press feedback, and scroll behavior.
- Do not claim real contact, identity, backend, or notification functionality; “联系用户” is visual-only in this mock screen.

### Task 1: Define the notification data contract and failing tests

**Files:**
- Create: `miniprogram/types/notifications.ts`
- Create: `miniprogram/mocks/notifications.ts`
- Create: `miniprogram/services/notifications.ts`
- Modify: `tests/home-page.test.mjs`

**Interfaces:**
- `getNotifications(): Promise<NotificationsViewModel>` returns grouped notifications and filter labels.
- `NotificationCardViewModel` includes stable `id`, `visitorName`, `intent`, `intentLabel`, `action`, `relativeDate`, `avatarUrl`, `thumbnailUrls`, `recommendation`.

- [ ] **Step 1: Write the failing test**

Add assertions that the notification type, mock, and service exist, that the service contains the `TODO(API): 接入通知列表真实接口` marker, and that the home page binds the tab event plus the new page is registered in `app.json`.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/home-page.test.mjs`

Expected: FAIL because the notification data layer and navigation wiring do not exist yet.

- [ ] **Step 3: Write the minimal data layer**

Create the typed model, stable two-day mock cards matching the Figma content, and a Promise-returning service that returns the mock.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --test tests/home-page.test.mjs`

Expected: the data-layer and route assertions pass; existing home assertions remain green.

### Task 2: Build the notification page

**Files:**
- Create: `miniprogram/pages/notifications/notifications.json`
- Create: `miniprogram/pages/notifications/notifications.ts`
- Create: `miniprogram/pages/notifications/notifications.wxml`
- Create: `miniprogram/pages/notifications/notifications.less`

**Interfaces:**
- Page loads through `getNotifications()` and stores `notifications` plus `activeFilter` in page data.
- Filter buttons update only the selected visual state; the initial mock screen is the Figma “全部” state.

- [ ] **Step 1: Add markup assertions before page implementation**

Extend the focused test to require the custom back navigation, title “通知”, four filters, date groups, notification cards, local avatar/thumb paths, and press feedback.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/home-page.test.mjs`

Expected: FAIL because the page files are not present.

- [ ] **Step 3: Implement the WXML/TypeScript/Less page**

Use the existing `navigation-bar` with a right-slot local action icon; implement a `scroll-view` page body, filter row, grouped cards, image stacks, intent pills, recommendation text, and visual-only contact buttons. Keep all business values in the service response.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --test tests/home-page.test.mjs`

Expected: notification page structure and style assertions pass.

### Task 3: Wire home navigation and route registration

**Files:**
- Modify: `miniprogram/app.json`
- Modify: `miniprogram/pages/index/index.ts`
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.less` only if the event affordance needs a scoped pressed state.

**Interfaces:**
- `bottom-tab-bar` emits `{ id: string }`; home page handles `notifications` with `wx.navigateTo({ url: '/pages/notifications/notifications' })`.

- [ ] **Step 1: Add the event and route assertions first**

Require `bind:tabtap` on the home component, a typed handler containing the exact route, and the notification page path in `app.json`.

- [ ] **Step 2: Run tests to verify the new assertions fail**

Run: `node --test tests/home-page.test.mjs`

Expected: FAIL until the home handler and route are added.

- [ ] **Step 3: Implement the smallest navigation change**

Add the handler to the home page and bind it to the existing bottom tab component; register the page before the logs template route.

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/home-page.test.mjs`

Expected: all focused tests pass.

### Task 4: Verify the implementation and update handoff

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Run the full relevant checks**

Run: `node --test tests/home-page.test.mjs`

Run: `npx tsc --noEmit`

Run: `node -e "for (const p of ['miniprogram/app.json','miniprogram/pages/notifications/notifications.json']) JSON.parse(require('fs').readFileSync(p,'utf8'))"`

Run: `rg -n "TODO\(API\)|wx\.request|from ['\"].*mocks" miniprogram/pages miniprogram/components miniprogram/services`

Expected: tests pass, TypeScript exits 0, JSON parsing exits 0, and only the notification service owns its API placeholder with no page/component mock imports or scattered requests.

- [ ] **Step 2: Review the changed files and assets**

Confirm the page uses local Figma assets, stable `wx:key` ids, safe-area padding, no real personal data or credentials, and no unrelated template refactor.

- [ ] **Step 3: Update `HANDOFF.md`**

Mark the notification page and home-to-notification navigation done, record the Figma node and local asset directory, and state that contact actions remain visual-only mock behavior.
