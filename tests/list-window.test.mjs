import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  buildNotificationListWindow,
  LIST_PAGE_SIZE,
  nextListWindow,
  windowList,
  windowNotificationGroups,
} from '../miniprogram/utils/list-window.ts'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('list window renders the first page then expands', () => {
  const items = Array.from({ length: 25 }, (_, index) => index + 1)

  assert.equal(LIST_PAGE_SIZE, 10)
  assert.deepEqual(windowList(items, LIST_PAGE_SIZE), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.equal(nextListWindow(LIST_PAGE_SIZE, items.length), 20)
  assert.equal(nextListWindow(20, items.length), 25)
  assert.equal(nextListWindow(25, items.length), 25)
})

test('notification groups window by card count across dates', () => {
  const groups = [
    { id: '2026-08-31', label: '8月31日', items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] },
    { id: '2026-08-30', label: '8月30日', items: [{ id: 'd' }, { id: 'e' }] },
  ]
  const visible = windowNotificationGroups(groups, 4)

  assert.equal(visible.length, 2)
  assert.deepEqual(visible[0].items.map((item) => item.id), ['a', 'b', 'c'])
  assert.deepEqual(visible[1].items.map((item) => item.id), ['d'])

  const filtered = buildNotificationListWindow(
    [{ id: 'g', label: '今天', items: [{ id: 'high', intent: 'high' }, { id: 'low', intent: 'low' }] }],
    'high',
    10,
  )
  assert.equal(filtered.totalCards, 1)
  assert.equal(filtered.visibleGroups[0].items[0].id, 'high')
})

test('scrollable list pages load more on scroll instead of rendering the full list', () => {
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const materialsLogic = read('miniprogram/pages/materials/index.ts')
  const notificationsLogic = read('miniprogram/pages/notifications/notifications.ts')
  const analysisLogic = read('miniprogram/pages/analysis/index.ts')
  const rankingLogic = read('miniprogram/pages/ranking/index.ts')
  const detailLogic = read('miniprogram/pages/analysis-detail/index.ts')
  const userDetailLogic = read('miniprogram/pages/analysis-user-detail/index.ts')
  const materialsService = read('miniprogram/services/materials.ts')

  assert.match(homeMarkup, /bindscrolltolower="onNotificationsScrollToLower"/)
  assert.match(homeMarkup, /bindscrolltolower="onMaterialsScrollToLower"/)
  assert.match(homeMarkup, /bindscrolltolower="onAnalysisScrollToLower"/)
  assert.match(homeLogic, /loadMoreNotifications\(\)/)
  assert.match(materialsLogic, /onMaterialsScrollToLower\(\)/)
  assert.match(notificationsLogic, /onReachBottom\(\)/)
  assert.match(analysisLogic, /onReachBottom\(\)/)
  assert.match(rankingLogic, /onReachBottom\(\)/)
  assert.match(detailLogic, /onReachBottom\(\)/)
  assert.match(userDetailLogic, /onReachBottom\(\)/)
  assert.match(materialsService, /rememberMaterialThumbnailSources/)
  assert.match(materialsService, /enrichThumbnailsByIds/)
  assert.doesNotMatch(
    materialsService.slice(materialsService.indexOf('export function getMaterials'), materialsService.indexOf('export function getMaterialDetail')),
    /prepareMaterialThumbnails/,
  )
})
