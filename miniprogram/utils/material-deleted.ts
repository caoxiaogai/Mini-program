export const MATERIAL_DELETED_CODE = 1008
export const MATERIAL_DELETED_MESSAGE = '发布者已删除作品'

const DELETED_OR_MISSING_MESSAGES = new Set([
  MATERIAL_DELETED_MESSAGE,
  '素材不存在',
  '素材不存在或未发布',
  '资源不存在',
])

export function isMaterialDeletedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? Number((error as { code?: unknown }).code) : Number.NaN
  const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : ''
  return code === MATERIAL_DELETED_CODE || code === 404 || DELETED_OR_MISSING_MESSAGES.has(message)
}
