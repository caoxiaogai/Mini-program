import type {
  NotificationCardViewModel,
  NotificationFilterId,
  NotificationGroupViewModel,
} from '../types/notifications'

/** 长列表进入页面时先渲染的条数；后续随下滑追加。 */
export const LIST_PAGE_SIZE = 10

export function windowList<T>(items: T[], visibleCount: number): T[] {
  return items.slice(0, Math.max(0, visibleCount))
}

export function nextListWindow(visibleCount: number, total: number, pageSize = LIST_PAGE_SIZE): number {
  if (visibleCount >= total) return visibleCount
  return Math.min(total, visibleCount + pageSize)
}

export function filterNotificationGroups(
  groups: NotificationGroupViewModel[],
  filterId: NotificationFilterId,
): NotificationGroupViewModel[] {
  return groups
    .map((group) => ({
      ...group,
      items: filterId === 'all' ? group.items : group.items.filter((notification) => notification.intent === filterId),
    }))
    .filter((group) => group.items.length > 0)
}

export function countNotificationCards(groups: NotificationGroupViewModel[]): number {
  return groups.reduce((sum, group) => sum + group.items.length, 0)
}

export function flattenNotificationCards(groups: NotificationGroupViewModel[]): NotificationCardViewModel[] {
  return groups.flatMap((group) => group.items)
}

export function windowNotificationGroups(
  groups: NotificationGroupViewModel[],
  visibleCount: number,
): NotificationGroupViewModel[] {
  let remaining = Math.max(0, visibleCount)
  const result: NotificationGroupViewModel[] = []

  for (const group of groups) {
    if (remaining <= 0) break
    if (group.items.length <= remaining) {
      result.push(group)
      remaining -= group.items.length
    } else {
      result.push({ ...group, items: group.items.slice(0, remaining) })
      remaining = 0
    }
  }

  return result
}

export function buildNotificationListWindow(
  groups: NotificationGroupViewModel[],
  filterId: NotificationFilterId,
  visibleCount: number,
) {
  const filtered = filterNotificationGroups(groups, filterId)
  return {
    visibleGroups: windowNotificationGroups(filtered, visibleCount),
    hasVisibleGroups: filtered.length > 0,
    totalCards: countNotificationCards(filtered),
  }
}
