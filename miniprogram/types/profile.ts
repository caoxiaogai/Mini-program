import type { MembershipTier } from './membership'

export interface ProfileMembershipTrackingSegment {
  id: string
  active: boolean
}

export type ProfileMembershipCardKind = 'inactive' | 'standard' | 'premium'

export interface ProfileMembershipViewModel {
  active: boolean
  tier: MembershipTier
  cardKind: ProfileMembershipCardKind
  isPremium: boolean
  isStandard: boolean
  isInactive: boolean
  expireLabel: string
  trackingLabel: string
  trackingSegments: ProfileMembershipTrackingSegment[]
}

export interface ProfilePageViewModel {
  avatarUrl: string
  nickname: string
  balance: string
  balanceLabel: string
  withdrawLabel: string
  membership: ProfileMembershipViewModel
  pendingTitle: string
  pendingDescription: string
}
