import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

const source = readFileSync(new URL('../miniprogram/services/request.ts', import.meta.url), 'utf8')
  .split('function joinApiFileUrl')[0]
  .replace(/^import[^\n]*\n/gm, '')
  .replace('export function', 'function')
const code = stripTypeScriptTypes(source)
const origin = 'https://www.yjxzhang.com'
function resolve(envVersion, platform, devtoolsOrigin = origin) {
  return new Function('wx', 'DEV_LAN_ORIGIN', 'DEVTOOLS_ORIGIN', 'PROD_API_ORIGIN', `${code}; return getApiBaseUrl()`)(
    { getAccountInfoSync: () => ({ miniProgram: { envVersion } }), getSystemInfoSync: () => ({ platform }) },
    origin, devtoolsOrigin, origin,
  )
}
test('developer tools use the online development API when configured with the production host', () => {
  assert.equal(resolve('develop', 'devtools'), `${origin}/dev/api`)
})
test('release and trial retain their respective API environments', () => {
  assert.equal(resolve('release', 'ios'), `${origin}/api`)
  assert.equal(resolve('trial', 'ios'), `${origin}/dev/api`)
})
test('local developer tools and device development retain their configured environments', () => {
  assert.equal(resolve('develop', 'devtools', 'http://127.0.0.1:8080'), 'http://127.0.0.1:8080/api')
  assert.equal(resolve('develop', 'ios'), `${origin}/dev/api`)
})
