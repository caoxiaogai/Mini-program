import type { ProfileMembershipTrackingSegment, ProfilePageViewModel } from '../types/profile'
import { prepareMediaUrl } from '../utils/media'
import { ensureLogin } from './request'

const FALLBACK_AVATAR = '/assets/profile/profile-avatar.png'
const FALLBACK_NICKNAME = '微信用户'
const FIGMA_TRACKING_LABEL = '58/80'
const FIGMA_ACTIVE_SEGMENT_COUNT = 35
const FIGMA_TRACKING_SEGMENT_TOTAL = 80
const FIGMA_STANDARD_MEMBER_EXPIRE_LABEL = '2026.11.20'

function createFigmaTrackingSegments(): ProfileMembershipTrackingSegment[] {
  return Array.from({ length: FIGMA_TRACKING_SEGMENT_TOTAL }, (_, index) => ({
    id: `tracking-segment-${index + 1}`,
    active: index < FIGMA_ACTIVE_SEGMENT_COUNT,
  }))
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

    return prepareMediaUrl(avatarSource).then((avatarUrl) => ({
      avatarUrl: avatarUrl !== '' ? avatarUrl : FALLBACK_AVATAR,
      nickname,
      balance: '0',
      balanceLabel: '我的余额',
      withdrawLabel: '提现',
      membership: {
        // TODO(API): 接入会员状态、到期日、剩余追踪人数与实际进度。
        active: true,
        expireLabel: FIGMA_STANDARD_MEMBER_EXPIRE_LABEL,
        trackingLabel: FIGMA_TRACKING_LABEL,
        trackingSegments: createFigmaTrackingSegments(),
      },
      pendingTitle: '尽情期待',
      pendingDescription: '更多功能，即将呈现',
    }))
  })
}
