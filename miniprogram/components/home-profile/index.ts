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
    'profile.membership.cardKind, profile.membership.expireLabel, profile.membership.trackingLabel'(
      cardKind?: string,
    ) {
      const showPremiumCard = cardKind === 'premium'
      const showStandardCard = cardKind === 'standard'
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
