import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('existing WeChat users bypass profile setup after a successful login response', () => {
  const authService = read('miniprogram/services/auth.ts')
  const requestService = read('miniprogram/services/request.ts')

  assert.match(authService, /export function resolveAuthGate\(\): Promise<AuthGate> \{\s*if \(hasCompletedLogin\(\)\) return Promise\.resolve\('ok'\)/)
  assert.match(authService, /if \(!hasAuthorizedLogin\(\)\) return Promise\.resolve\('login'\)/)
  assert.match(requestService, /function persistLogin\(data: ApiLoginData\): ApiLoginData \{[\s\S]*wx\.setStorageSync\(STORAGE_KEY_AUTHORIZED, '1'\)/)
  assert.match(requestService, /return restoreStoredProfile\(data, persisted\)\.then\(\(\) => persisted\)/)
  assert.match(requestService, /function restoreStoredProfile\(server: ApiLoginData, persisted: ApiLoginData\)[\s\S]*if \(isLoginProfileComplete\(server\)\) return Promise\.resolve\(\)[\s\S]*isLocalAvatarFile\(avatar\)[\s\S]*path: '\/user\/profile'/)
})
