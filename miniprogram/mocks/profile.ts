import type { ProfilePageViewModel } from '../types/profile'

/** DEV_MOCK: 仅用于 Figma 519:5031 的视觉预览，不代表真实账户数据。 */
export function getProfileStyleMock(): ProfilePageViewModel {
  return {
    avatarUrl: '/assets/profile/profile-avatar.png',
    nickname: 'Sunny 1 号，起飞 🎉',
    balance: '870.39',
    balanceLabel: '我的余额',
    withdrawLabel: '提现',
    membershipTitle: '解锁言界阿乐会员',
    membershipSubtitle: '专属分析功能，不漏掉任何潜在用户',
    membershipActionLabel: '开通会员',
    pendingTitle: '尽情期待',
    pendingDescription: '更多功能，即将呈现',
  }
}
