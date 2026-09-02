import type { ProfilePageViewModel } from '../../types/profile'

type GradientChar = {
  id: string
  char: string
  color: string
}

const INACTIVE_MEMBERSHIP_SUBTITLE = '专属分析功能，不漏掉任何潜在用户'
const SUBTITLE_GRADIENT_STOPS: ReadonlyArray<{ offset: number; rgb: readonly [number, number, number] }> = [
  { offset: 0, rgb: [255, 235, 176] },
  { offset: 0.39904, rgb: [234, 131, 255] },
  { offset: 1, rgb: [24, 158, 145] },
]

function mixChannel(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t)
}

function colorAlongGradient(t: number): string {
  const clamped = Math.min(1, Math.max(0, t))
  let start = SUBTITLE_GRADIENT_STOPS[0]
  let end = SUBTITLE_GRADIENT_STOPS[SUBTITLE_GRADIENT_STOPS.length - 1]
  for (let index = 0; index < SUBTITLE_GRADIENT_STOPS.length - 1; index += 1) {
    const left = SUBTITLE_GRADIENT_STOPS[index]
    const right = SUBTITLE_GRADIENT_STOPS[index + 1]
    if (clamped >= left.offset && clamped <= right.offset) {
      start = left
      end = right
      break
    }
  }
  const span = end.offset - start.offset
  const local = span === 0 ? 0 : (clamped - start.offset) / span
  return `rgb(${mixChannel(start.rgb[0], end.rgb[0], local)}, ${mixChannel(start.rgb[1], end.rgb[1], local)}, ${mixChannel(start.rgb[2], end.rgb[2], local)})`
}

function gradientSubtitleChars(text: string): GradientChar[] {
  const last = Math.max(text.length - 1, 1)
  return Array.from(text).map((char, index) => ({
    id: `inactive-subtitle-${index}`,
    char,
    color: colorAlongGradient(index / last),
  }))
}

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
    inactiveSubtitleChars: gradientSubtitleChars(INACTIVE_MEMBERSHIP_SUBTITLE),
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
