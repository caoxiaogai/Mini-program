/** WeChat `data-*` 纯数字会被转成 Number，雪花 ID 会丢精度。加此前缀保持字符串。 */
export const DATASET_ID_PREFIX = 'id:'

export function fromDatasetId(value: unknown): string {
  if (value == null || value === '') return ''
  const raw = String(value)
  return raw.startsWith(DATASET_ID_PREFIX) ? raw.slice(DATASET_ID_PREFIX.length) : raw
}
