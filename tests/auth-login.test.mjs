import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('existing WeChat users bypass profile setup after a successful login response', () => {
  const authService = read('miniprogram/services/auth.ts')
  const requestService = read('miniprogram/services/request.ts')

  assert.match(authService, /export function resolveAuthGate\(\): Promise<AuthGate> \{\s*return ensureLogin\(\)/)
  assert.doesNotMatch(authService, /if \(!hasAuthorizedLogin\(\)\) return Promise\.resolve\('login'\)/)
  assert.match(requestService, /function persistLogin\(data: ApiLoginData\): ApiLoginData \{[\s\S]*wx\.setStorageSync\(STORAGE_KEY_AUTHORIZED, '1'\)/)
})
