import type { MembershipAccess, VisitorLimitPromptAvatarViewModel, VisitorLimitPromptViewModel } from '../types/membership'
import { DEFAULT_AVATAR_URL } from '../utils/auth'
import { prepareMediaUrls } from '../utils/media'
import { resolveMediaUrl } from './request'

const LIMIT_PROMPT_VISITOR_AVATAR_LIMIT = 5

/** 通知接口已过滤被挡访客，人数和头像改从 /membership/me 读取。 */
export async function buildVisitorLimitPromptViewModel(
  access: MembershipAccess,
): Promise<VisitorLimitPromptViewModel> {
  if (access.hiddenVisitorCount <= 0) {
    return { visitorCount: 0, avatars: [] }
  }

  const displayedVisitors = access.hiddenVisitors.slice(0, LIMIT_PROMPT_VISITOR_AVATAR_LIMIT)
  const preparedUrls = await prepareMediaUrls(displayedVisitors.map((visitor) => resolveMediaUrl(visitor.avatar)))
  const avatars: VisitorLimitPromptAvatarViewModel[] = displayedVisitors.map((visitor, index) => {
    const url = preparedUrls[index] ?? ''
    return {
      id: visitor.customerId,
      url: url || DEFAULT_AVATAR_URL,
      shouldBlur: true,
    }
  })

  return {
    visitorCount: access.hiddenVisitorCount,
    avatars,
  }
}
