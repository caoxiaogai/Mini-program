import type { MaterialCardViewModel } from '../types/materials'

export function toggleMaterialSelection(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

export function applyMaterialSelection(
  items: MaterialCardViewModel[],
  selectedIds: string[],
): MaterialCardViewModel[] {
  if (selectedIds.length === 0) {
    return items.map((item) => (item.selected ? { ...item, selected: false } : item))
  }

  const selected = new Set(selectedIds)
  return items.map((item) => {
    const isSelected = selected.has(item.id)
    return item.selected === isSelected ? item : { ...item, selected: isSelected }
  })
}
