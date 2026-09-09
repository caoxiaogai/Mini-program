import type { ProfilePageViewModel } from '../../types/profile'

Component({
  properties: {
    profile: {
      type: Object,
      value: null,
    },
  },
  data: {
    showPremiumCard: false,
    showStandardCard: false,
    showInactiveCard: true,
    membershipCardClass: 'home-profile__membership--inactive',
    featureMaskClass: '',
  },
  observers: {
    profile(profile: ProfilePageViewModel | null) {
      const membership = profile?.membership
      const showPremiumCard = membership?.isPremium === true || membership?.cardKind === 'premium'
      const showStandardCard = !showPremiumCard && (membership?.isStandard === true || membership?.cardKind === 'standard')
      const showInactiveCard = !showPremiumCard && !showStandardCard
      this.setData({
        showPremiumCard,
        showStandardCard,
        showInactiveCard,
        membershipCardClass: showInactiveCard
          ? 'home-profile__membership--inactive'
          : showPremiumCard
            ? 'home-profile__membership--active home-profile__membership--premium'
            : 'home-profile__membership--active',
        featureMaskClass: showInactiveCard ? '' : 'home-profile__feature-mask--active',
      })
    },
  },
  methods: {
    onSettingsTap() {
      this.triggerEvent('settingstap')
    },
    onMembershipTap() {
      const cardKind = this.data.showPremiumCard
        ? 'premium'
        : this.data.showStandardCard
          ? 'standard'
          : 'inactive'
      this.triggerEvent('membershiptap', { cardKind })
    },
  },
})
