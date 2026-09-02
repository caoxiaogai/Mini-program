import type { ProfileMembershipTrackingSegment, ProfileMembershipViewModel, ProfilePageViewModel } from '../types/profile'
import { MEMBERSHIP_VISITOR_LIMIT_NONE } from '../utils/membership'
import { prepareMediaUrl } from '../utils/media'
import { getMembershipStatusSilent } from './membership'
import { ensureLogin } from './request'

const FALLBACK_AVATAR = '/assets/profile/profile-avatar.png'
const FALLBACK_NICKNAME = '微信用户'
const FIGMA_TRACKING_SEGMENT_TOTAL = 80

function createTrackingSegments(used: number, limit: number): ProfileMembershipTrackingSegment[] {
  const ratio = limit > 0 ? Math.min(1, Math.max(0, used / limit)) : 0
  const activeCount = Math.round(ratio * FIGMA_TRACKING_SEGMENT_TOTAL)
  return Array.from({ length: FIGMA_TRACKING_SEGMENT_TOTAL }, (_, index) => ({
    id: `tracking-segment-${index + 1}`,
    active: index < activeCount,
  }))
}

function formatCardExpireLabel(value: string): string {
  return value.replace(/-/g, '.')
}

function mapProfileMembership(
  membership: Awaited<ReturnType<typeof getMembershipStatusSilent>>,
): ProfileMembershipViewModel {
  const active = membership?.active === true
  const tier = membership?.tier ?? 'none'
  const isPremium = active && (tier === 'pro' || membership?.visitorLimit == null)
  const isStandard = active && !isPremium
  const isInactive = !active
  const cardKind: ProfileMembershipViewModel['cardKind'] = isPremium
    ? 'premium'
    : isStandard
      ? 'standard'
      : 'inactive'
  const limit = membership ? membership.visitorLimit : MEMBERSHIP_VISITOR_LIMIT_NONE
  const used = membership?.usedVisitorCount ?? 0
  const remaining = limit == null ? 0 : Math.max(0, limit - used)

  return {
    active,
    tier: isPremium ? 'pro' : tier,
    cardKind,
    isPremium,
    isStandard,
    isInactive,
    expireLabel: formatCardExpireLabel(membership?.expireLabel ?? ''),
    trackingLabel: limit == null ? '' : `${remaining}/${limit}`,
    trackingSegments: limit == null ? [] : createTrackingSegments(used, limit),
  }
}

// TODO(API): 接入「我的余额 / 提现」真实接口
// Method: 待后端确认
// Endpoint: 待后端确认（aisales 当前无余额、提现查询；资料仅来自 POST /wechat/login 的 nickname、avatar）
// Request: 待后端确认
// Response: 待后端确认
// Auth/permission: 待后端确认
// Error states: 待后端确认
export function getProfilePageData(): Promise<ProfilePageViewModel> {
  return ensureLogin().then((user) => {
    const nickname = user.nickname && user.nickname.trim() !== '' ? user.nickname.trim() : FALLBACK_NICKNAME
    const avatarSource = user.avatar && user.avatar.trim() !== '' ? user.avatar.trim() : FALLBACK_AVATAR

    return Promise.all([prepareMediaUrl(avatarSource), getMembershipStatusSilent()]).then(([avatarUrl, membership]) => ({
      avatarUrl: avatarUrl !== '' ? avatarUrl : FALLBACK_AVATAR,
      nickname,
      balance: '0',
      balanceLabel: '我的余额',
      withdrawLabel: '提现',
      membership: mapProfileMembership(membership),
      pendingTitle: '尽情期待',
      pendingDescription: '更多功能，即将呈现',
    }))
  })
}
