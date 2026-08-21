import {
  completeProfileSetup,
  getAuthSession,
  loginWithWechat,
  refreshAuthGate,
  type AuthGateState,
} from '../../services/auth'
import { resolveMediaUrl } from '../../services/request'

const DEFAULT_AVATAR = '/assets/home/ai-assistant.png'

function hasChosenAvatar(avatarPath: string, avatarPreview: string): boolean {
  const path = (avatarPath || avatarPreview || '').trim()
  return path !== '' && path !== DEFAULT_AVATAR
}

function canSubmitProfileForm(nickname: string, avatarPath: string, avatarPreview: string): boolean {
  return nickname.trim().length > 0 && hasChosenAvatar(avatarPath, avatarPreview)
}

Component({
  properties: {
    loginSubtitle: {
      type: String,
      value: '登录后可使用素材发布与客户分析功能',
    },
    profileSubtitle: {
      type: String,
      value: '首次登录，请设置头像和昵称',
    },
  },

  data: {
    showLogin: false,
    showProfile: false,
    loginLoading: false,
    profileLoading: false,
    nickname: '',
    avatarPreview: DEFAULT_AVATAR,
    avatarPath: '',
    canSubmitProfile: false,
    profileFormInitialized: false,
  },

  lifetimes: {
    attached() {
      this.syncFromApp()
    },
  },

  pageLifetimes: {
    show() {
      this.syncGateVisibility()
    },
  },

  methods: {
    syncGateVisibility() {
      const gate = refreshAuthGate()
      this.setData({
        showLogin: gate.showLogin,
        showProfile: gate.showProfile,
      })

      if (gate.showProfile && !this.data.profileFormInitialized) {
        this.initProfileForm()
      }

      if (!gate.showProfile) {
        this.setData({ profileFormInitialized: false })
      }
    },

    syncFromApp() {
      this.syncGateVisibility()
    },

    initProfileForm() {
      const session = getAuthSession()
      const nickname = session?.nickname ?? ''
      const avatarPath = session?.avatar ?? ''
      const avatarPreview = avatarPath ? resolveMediaUrl(avatarPath) : DEFAULT_AVATAR

      this.setData({
        profileFormInitialized: true,
        nickname,
        avatarPath,
        avatarPreview,
        canSubmitProfile: canSubmitProfileForm(nickname, avatarPath, avatarPreview),
      })
    },

    refreshProfileSubmitState(extra: WechatMiniprogram.Component.DataOption = {}) {
      const nickname = typeof extra.nickname === 'string' ? extra.nickname : this.data.nickname
      const avatarPath = typeof extra.avatarPath === 'string' ? extra.avatarPath : this.data.avatarPath
      const avatarPreview = typeof extra.avatarPreview === 'string' ? extra.avatarPreview : this.data.avatarPreview

      this.setData({
        ...extra,
        canSubmitProfile: canSubmitProfileForm(nickname, avatarPath, avatarPreview),
      })
    },

    readNicknameInput(): Promise<string> {
      return new Promise((resolve) => {
        this.createSelectorQuery()
          .in(this)
          .select('.auth-overlay__nickname-input')
          .fields({ properties: ['value'] })
          .exec((result) => {
            const fromInput = (result[0] as { value?: string } | undefined)?.value ?? ''
            resolve(fromInput.trim() || this.data.nickname.trim())
          })
      })
    },

    syncNicknameFromInput(retry = 0) {
      this.readNicknameInput().then((nickname) => {
        if (nickname) {
          this.refreshProfileSubmitState({ nickname })
          return
        }

        if (retry < 3) {
          setTimeout(() => this.syncNicknameFromInput(retry + 1), 80 * (retry + 1))
        }
      })
    },

    applyGate(gate: AuthGateState) {
      const updates: WechatMiniprogram.Component.DataOption = {
        showLogin: gate.showLogin,
        showProfile: gate.showProfile,
      }

      if (gate.showProfile && !this.data.profileFormInitialized) {
        const session = getAuthSession()
        const nickname = session?.nickname ?? ''
        const avatarPath = session?.avatar ?? ''
        const avatarPreview = avatarPath ? resolveMediaUrl(avatarPath) : DEFAULT_AVATAR
        updates.profileFormInitialized = true
        updates.nickname = nickname
        updates.avatarPath = avatarPath
        updates.avatarPreview = avatarPreview
        updates.canSubmitProfile = canSubmitProfileForm(nickname, avatarPath, avatarPreview)
      }

      if (!gate.showProfile) {
        updates.profileFormInitialized = false
      }

      this.setData(updates)
    },

    notifyAuthReady() {
      const gate = refreshAuthGate()
      if (!gate.showLogin && !gate.showProfile) {
        this.triggerEvent('authready')
      }
    },

    onPanelTap() {},

    onLoginTap() {
      if (this.data.loginLoading) return

      this.setData({ loginLoading: true })
      loginWithWechat()
        .then(() => {
          this.applyGate(refreshAuthGate())
          this.notifyAuthReady()
        })
        .catch(() => undefined)
        .finally(() => {
          this.setData({ loginLoading: false })
        })
    },

    onChooseAvatar(event: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>) {
      const avatarUrl = event.detail.avatarUrl
      if (!avatarUrl) return

      this.refreshProfileSubmitState({
        avatarPreview: avatarUrl,
        avatarPath: avatarUrl,
      })
    },

    onNicknameInput(event: WechatMiniprogram.Input) {
      this.refreshProfileSubmitState({
        nickname: event.detail.value ?? '',
      })
    },

    onNicknameBlur(event: WechatMiniprogram.Input) {
      this.refreshProfileSubmitState({
        nickname: event.detail.value ?? '',
      })
    },

    onNicknameReview(event: WechatMiniprogram.CustomEvent<{ pass: boolean }>) {
      if (!event.detail.pass) return
      this.syncNicknameFromInput()
    },

    onProfileSubmitTap() {
      if (this.data.profileLoading) return

      this.readNicknameInput().then((nickname) => {
        if (!nickname) {
          wx.showToast({ title: '请填写昵称', icon: 'none' })
          return
        }

        const avatarPath = this.data.avatarPath || this.data.avatarPreview
        if (!hasChosenAvatar(this.data.avatarPath, this.data.avatarPreview)) {
          wx.showToast({ title: '请选择头像', icon: 'none' })
          return
        }

        this.setData({ profileLoading: true, nickname })
        completeProfileSetup({ nickname, avatarPath })
          .then(() => {
            this.applyGate(refreshAuthGate())
            this.notifyAuthReady()
          })
          .catch((error: Error) => {
            wx.showToast({ title: error.message || '保存失败，请稍后重试', icon: 'none' })
          })
          .finally(() => {
            this.setData({ profileLoading: false })
          })
      })
    },
  },
})
