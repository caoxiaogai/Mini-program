import type { ApiNotificationEvent } from '../types/api'
import type { VisitorLimitPromptAvatarViewModel, VisitorLimitPromptViewModel } from '../types/membership'
import { keepEventsForVisitorLimit } from '../utils/membership'
import { prepareMediaUrls } from '../utils/media'
import { resolveMediaUrl } from './request'

/** 视觉验收期间固定展示 Figma 1055:2593；真实会员状态接入后移除。 */
export const SHOW_VISITOR_LIMIT_PROMPT_PREVIEW = true
const LIMIT_PROMPT_VISITOR_AVATAR_LIMIT = 5
const LIMIT_PROMPT_FIGMA_AVATAR_PATHS = [
  '/assets/home-new/limit-prompt/avatar-01.png',
  '/assets/home-new/limit-prompt/avatar-02.png',
  '/assets/home-new/limit-prompt/avatar-03.png',
  '/assets/home-new/limit-prompt/avatar-04.png',
  '/assets/home-new/limit-prompt/avatar-05.png',
] as const

interface LimitPromptVisitorSource {
  id: string
  avatarUrl: string
}

function collectHiddenVisitorSources(
  events: ApiNotificationEvent[],
  visitorLimit: number | null,
): LimitPromptVisitorSource[] {
  const visibleVisitorIds = new Set(
    keepEventsForVisitorLimit(events, visitorLimit)
      .map((event) => String(event.customerId ?? '').trim())
      .filter((customerId) => customerId !== ''),
  )
  const visitorsById = new Map<string, LimitPromptVisitorSource>()

  for (const event of [...events].sort((left, right) => String(right.viewTime ?? '').localeCompare(String(left.viewTime ?? '')))) {
    const id = String(event.customerId ?? '').trim()
    if (!id || visibleVisitorIds.has(id) || visitorsById.has(id)) continue
    visitorsById.set(id, { id, avatarUrl: resolveMediaUrl(event.avatar) })
  }

  return [...visitorsById.values()]
}

export async function buildVisitorLimitPromptViewModel(
  events: ApiNotificationEvent[],
  visitorLimit: number | null,
): Promise<VisitorLimitPromptViewModel> {
  const hiddenVisitors = collectHiddenVisitorSources(events, visitorLimit)
  const displayedVisitors = hiddenVisitors.slice(0, LIMIT_PROMPT_VISITOR_AVATAR_LIMIT)
  const preparedUrls = await prepareMediaUrls(displayedVisitors.map((visitor) => visitor.avatarUrl))
  const avatars: VisitorLimitPromptAvatarViewModel[] = displayedVisitors.map((visitor, index) => {
    const url = preparedUrls[index] ?? ''
    return {
      id: visitor.id,
      url: url || LIMIT_PROMPT_FIGMA_AVATAR_PATHS[index],
      shouldBlur: url !== '',
    }
  })

  if (avatars.length > 0) {
    return { visitorCount: hiddenVisitors.length, avatars }
  }

  return {
    visitorCount: LIMIT_PROMPT_VISITOR_AVATAR_LIMIT,
    avatars: LIMIT_PROMPT_FIGMA_AVATAR_PATHS.map((url, index) => ({
      id: `figma-limit-visitor-${index + 1}`,
      url,
      shouldBlur: false,
    })),
  }
}
