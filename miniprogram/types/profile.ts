export interface ProfileMembershipTrackingSegment {
  id: string
  active: boolean
}

export interface ProfileMembershipViewModel {
  active: boolean
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
