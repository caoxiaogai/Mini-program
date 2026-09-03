import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { applyMaterialSelection, toggleMaterialSelection } from '../miniprogram/utils/material-select.ts'
import { MATERIAL_DELETED_CODE, MATERIAL_DELETED_MESSAGE, isMaterialDeletedError } from '../miniprogram/utils/material-deleted.ts'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('material selection toggles ids and marks visible cards', () => {
  assert.deepEqual(toggleMaterialSelection([], '12'), ['12'])
  assert.deepEqual(toggleMaterialSelection(['12', '13'], '12'), ['13'])
  assert.deepEqual(
    applyMaterialSelection(
      [
        { id: '12', title: 'A', date: '8月1日', thumbnailUrl: '', kind: 'image' },
        { id: '13', title: 'B', date: '8月2日', thumbnailUrl: '', kind: 'video' },
      ],
      ['13'],
    ).map((item) => item.selected),
    [false, true],
  )
})

test('material list long-press enters multi-select and turns publish into delete', () => {
  const homeMarkup = read('miniprogram/pages/index/index.wxml')
  const homeLogic = read('miniprogram/pages/index/index.ts')
  const materialsMarkup = read('miniprogram/pages/materials/index.wxml')
  const materialsLogic = read('miniprogram/pages/materials/index.ts')
  const service = read('miniprogram/services/materials.ts')
  const requestLayer = read('miniprogram/services/request.ts')
  const detailMarkup = read('miniprogram/pages/material-detail/index.wxml')
  const detailLogic = read('miniprogram/pages/material-detail/index.ts')
  const documentLogic = read('miniprogram/pages/document-reader/index.ts')

  assert.match(requestLayer, /method: 'GET' \| 'POST' \| 'PUT' \| 'DELETE'/)
  assert.match(service, /export function deleteMaterials/)
  assert.match(service, /method: 'DELETE'/)
  assert.match(service, /path: `\/material\/\$\{id\}`/)
  assert.match(homeMarkup, /bindlongpress="onMaterialCardLongPress"/)
  assert.match(materialsMarkup, /bindlongpress="onMaterialCardLongPress"/)
  assert.match(homeMarkup, /materialSelecting \? \(deletingMaterials \? '正在删除' : '删除'\) : '发布素材'/)
  assert.match(materialsMarkup, /materialSelecting \? \(deletingMaterials \? '正在删除' : '删除'\) : '发布素材'/)
  assert.match(homeLogic, /onMaterialCardLongPress/)
  assert.match(homeLogic, /deleteSelectedMaterials/)
  assert.match(homeLogic, /deleteMaterials\(ids\)/)
  assert.match(homeLogic, /stillThere/)
  assert.match(materialsLogic, /deleteMaterials\(ids\)/)
  assert.match(materialsLogic, /stillThere/)
  assert.match(homeLogic, /草稿和已发布作品都会删除/)
  assert.match(detailMarkup, /unavailableMessage/)
  assert.match(detailLogic, /MATERIAL_DELETED_MESSAGE/)
  assert.match(documentLogic, /MATERIAL_DELETED_MESSAGE/)
  assert.equal(MATERIAL_DELETED_MESSAGE, '发布者已删除作品')
  assert.equal(isMaterialDeletedError({ code: MATERIAL_DELETED_CODE, message: 'x' }), true)
  assert.equal(isMaterialDeletedError({ code: 404, message: MATERIAL_DELETED_MESSAGE }), true)
  assert.equal(isMaterialDeletedError({ code: 404, message: '素材不存在' }), true)
  assert.equal(isMaterialDeletedError({ code: 404, message: '素材不存在或未发布' }), true)
  assert.match(detailLogic, /unavailableMessage: MATERIAL_DELETED_MESSAGE/)
  assert.doesNotMatch(detailLogic, /作品加载失败/)
  assert.match(service, /path: `\/material\/\$\{materialId\}`, silent: true/)
})
