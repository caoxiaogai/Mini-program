import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

test('查看更多 opens authorization even with an existing session and preserves the destination', async () => {
  const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
  const auth = await import(`data:text/javascript,${encodeURIComponent(stripTypeScriptTypes(read('miniprogram/utils/auth.ts')))}`)
  let page
  const destinations = []
  const source = stripTypeScriptTypes(read('miniprogram/pages/share-gate/index.ts').replace(/^import[^\n]+\n/gm, ''))
  new Function('Page', 'wx', 'buildAuthPath', 'buildMaterialDetailPath', 'resolveAuthGate', source)(
    (value) => { page = value },
    { navigateTo: ({ url }) => destinations.push(url), redirectTo: ({ url }) => destinations.push(url) },
    auth.buildAuthPath,
    (id, trackingId) => `/pages/material-detail/index?id=${id}&trackingId=${trackingId}`,
    () => Promise.resolve('ok'),
  )
  page.onLoad({ id: 'work-1', trackingId: 'track-2' })
  page.onMoreTap()
  await Promise.resolve()
  assert.deepEqual(destinations, [auth.buildAuthPath('/pages/material-detail/index?id=work-1&trackingId=track-2')])
})
