import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

function loadShareGatePage(auth, destinations) {
  let page
  const source = stripTypeScriptTypes(read('miniprogram/pages/share-gate/index.ts').replace(/^import[^\n]+\n/gm, ''))
  new Function(
    'Page',
    'wx',
    'buildAuthPath',
    'buildMaterialDetailPath',
    'HOME_PAGE_PATH',
    'safeReturnPath',
    source,
  )(
    (value) => {
      page = value
    },
    {
      navigateTo: ({ url }) => destinations.push(url),
      redirectTo: ({ url }) => destinations.push(url),
    },
    auth.buildAuthPath,
    (id, trackingId) => `/pages/material-detail/index?id=${id}${trackingId ? `&trackingId=${trackingId}` : ''}`,
    '/pages/index/index',
    auth.safeReturnPath,
  )
  return page
}

test('查看更多 opens authorization even with an existing session and preserves the destination', async () => {
  const auth = await import(`data:text/javascript,${encodeURIComponent(stripTypeScriptTypes(read('miniprogram/utils/auth.ts')))}`)
  const destinations = []
  const page = loadShareGatePage(auth, destinations)
  page.onLoad({ id: 'work-1', trackingId: 'track-2' })
  page.onMoreTap()
  await Promise.resolve()
  assert.deepEqual(destinations, [auth.buildAuthPath('/pages/material-detail/index?id=work-1&trackingId=track-2')])
})

test('first launch without a shared work still opens WeChat authorization from 查看更多', async () => {
  const auth = await import(`data:text/javascript,${encodeURIComponent(stripTypeScriptTypes(read('miniprogram/utils/auth.ts')))}`)
  const destinations = []
  const page = loadShareGatePage(auth, destinations)
  page.onLoad({ return: '/pages/index/index' })
  page.onMoreTap()
  await Promise.resolve()
  assert.deepEqual(destinations, [auth.buildAuthPath('/pages/index/index')])
})
