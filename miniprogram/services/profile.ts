import type { ProfilePageViewModel } from '../types/profile'
import { prepareMediaUrl } from '../utils/media'
import { ensureLogin } from './request'

const FALLBACK_AVATAR = '/assets/profile/profile-avatar.png'
const FALLBACK_NICKNAME = '微信用户'

// TODO(API): 接入「我的余额 / 提现 / 会员」真实接口
// Method: 待后端确认
// Endpoint: 待后端确认（aisales 当前无余额、提现、会员查询；资料仅来自 POST /wechat/login 的 nickname、avatar）
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
      membershipTitle: '解锁言界阿乐会员',
      membershipSubtitle: '专属分析功能，不漏掉任何潜在用户',
      membershipActionLabel: '开通会员',
      pendingTitle: '尽情期待',
      pendingDescription: '更多功能，即将呈现',
    }))
  })
}
