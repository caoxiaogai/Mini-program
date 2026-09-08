import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

function loadShareGatePage(auth, destinations, session = { completed: false }, preview = { url: '', requestedId: '' }) {
  let page
  const source = stripTypeScriptTypes(read('miniprogram/pages/share-gate/index.ts').replace(/^import[^\n]+\n/gm, ''))
  new Function(
    'Page',
    'wx',
    'buildAuthPath',
    'buildMaterialDetailPath',
    'HOME_PAGE_PATH',
    'safeReturnPath',
    'hasCompletedLogin',
    'resolveAuthGate',
    'continueAfterAuth',
    'getMaterialListPreview',
    source,
  )(
    (value) => {
      page = value
      page.setData = function setData(patch) {
        this.data = { ...this.data, ...patch }
      }
    },
    {
      navigateTo: ({ url }) => destinations.push(url),
      redirectTo: ({ url }) => destinations.push(url),
      reLaunch: ({ url }) => destinations.push(url),
    },
    auth.buildAuthPath,
    (id, trackingId) => `/pages/material-detail/index?id=${id}${trackingId ? `&trackingId=${trackingId}` : ''}`,
    '/pages/index/index',
    auth.safeReturnPath,
    () => session.completed,
    () => Promise.resolve(session.completed ? 'ok' : 'login'),
    (url) => destinations.push(url),
    (id) => {
      preview.requestedId = id
      return Promise.resolve(preview.url)
    },
  )
  return page
}

test('logged-in users skip the share gate and open the destination', async () => {
  const auth = await import(`data:text/javascript,${encodeURIComponent(stripTypeScriptTypes(read('miniprogram/utils/auth.ts')))}`)
  const destinations = []
  const page = loadShareGatePage(auth, destinations, { completed: true })
  page.onLoad({ id: 'work-1', trackingId: 'track-2' })
  await Promise.resolve()
  assert.deepEqual(destinations, ['/pages/material-detail/index?id=work-1&trackingId=track-2'])
})

test('查看更多 opens authorization for first-time users and preserves the destination', async () => {
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

test('shared work replaces the default share-gate art with the list thumbnail', async () => {
  const auth = await import(`data:text/javascript,${encodeURIComponent(stripTypeScriptTypes(read('miniprogram/utils/auth.ts')))}`)
  const preview = { url: 'https://cdn.example/thumb.jpg', requestedId: '' }
  const page = loadShareGatePage(auth, [], { completed: false }, preview)
  page.onLoad({ id: 'work-1', trackingId: 'track-2' })
  await Promise.resolve()
  await Promise.resolve()
  assert.equal(preview.requestedId, 'work-1')
  assert.equal(page.data.artSrc, 'https://cdn.example/thumb.jpg')
  assert.equal(page.data.artFromWork, true)
})

test('first launch without a shared work keeps the default share-gate art', async () => {
  const auth = await import(`data:text/javascript,${encodeURIComponent(stripTypeScriptTypes(read('miniprogram/utils/auth.ts')))}`)
  const preview = { url: 'https://cdn.example/thumb.jpg', requestedId: '' }
  const page = loadShareGatePage(auth, [], { completed: false }, preview)
  page.onLoad({ return: '/pages/index/index' })
  await Promise.resolve()
  await Promise.resolve()
  assert.equal(preview.requestedId, '')
  assert.equal(page.data.artSrc, '/assets/share-gate/group-98.svg')
  assert.equal(page.data.artFromWork, false)
})
