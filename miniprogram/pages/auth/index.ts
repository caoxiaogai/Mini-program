import { completeProfileLogin, continueAfterAuth, hasCompletedLogin } from '../../services/auth'
import { DEFAULT_AVATAR_URL, isLocalAvatarFile, isLoginProfileComplete, safeReturnPath } from '../../utils/auth'
import { getNavigationBarLayout } from '../../utils/navigation-layout'
import { HOME_PAGE_PATH } from '../../utils/share-material'

type ChooseAvatarEvent = WechatMiniprogram.CustomEvent<{ avatarUrl: string }>
type NicknameReviewEvent = WechatMiniprogram.CustomEvent<{ pass: boolean; timeout?: boolean }>
type AuthFormValue = { nickname?: string }

Page({
  nicknameDraft: '',
  nicknameReviewPassed: false,
  loginStarted: false,
  autoLoginTimer: 0,
  data: {
    returnPath: HOME_PAGE_PATH,
    navigationHeight: 0,
    nickname: '',
    avatarUrl: DEFAULT_AVATAR_URL,
    defaultAvatarUrl: DEFAULT_AVATAR_URL,
    avatarFilePath: '',
    nicknameFocused: false,
    busy: false,
    hasAvatar: false,
    loginFailed: false,
    ready: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    const returnPath = safeReturnPath(options.return)
    this.setData({
      returnPath,
      navigationHeight: getNavigationBarLayout().totalHeight,
    })
    if (hasCompletedLogin()) {
      continueAfterAuth(returnPath)
      return
    }
    this.setData({ ready: true })
  },

  onUnload() {
    if (this.autoLoginTimer) clearTimeout(this.autoLoginTimer)
  },

  onChooseAvatar(event: ChooseAvatarEvent) {
    const avatarUrl = event.detail.avatarUrl
    if (!avatarUrl) return
    this.setData({
      avatarUrl,
      avatarFilePath: isLocalAvatarFile(avatarUrl) ? avatarUrl : '',
      nicknameFocused: false,
      loginFailed: false,
    }, () => {
      this.syncAuthAction()
      if (this.nicknameReviewPassed) {
        this.scheduleAutoLogin()
        return
      }
      this.focusNickname()
    })
  },

  onNicknameChange(event: WechatMiniprogram.Input) {
    this.rememberNickname(event.detail.value)
  },

  onNicknameBlur(event: WechatMiniprogram.InputBlur) {
    this.rememberNickname(event.detail.value)
    if (this.data.nicknameFocused) this.setData({ nicknameFocused: false })
  },

  onNicknameReview(event: NicknameReviewEvent) {
    if (!event.detail.pass && !event.detail.timeout) {
      this.nicknameReviewPassed = false
      this.nicknameDraft = ''
      this.setData({ nickname: '' })
      this.syncAuthAction()
      wx.showToast({ title: '昵称未通过安全检测', icon: 'none' })
      return
    }
    this.nicknameReviewPassed = true
    this.scheduleAutoLogin()
  },

  onFormSubmit(event: WechatMiniprogram.FormSubmit) {
    const formValue = event.detail.value as AuthFormValue
    const nickname = String(formValue.nickname ?? '').trim()
    if (nickname) this.rememberNickname(nickname)
    if (this.nicknameReviewPassed) this.scheduleAutoLogin()
  },

  onRetryLogin() {
    this.scheduleAutoLogin()
  },

  rememberNickname(value: string) {
    this.nicknameDraft = value.trim()
    this.syncAuthAction()
  },

  focusNickname() {
    this.setData({ nicknameFocused: false }, () => {
      this.setData({ nicknameFocused: true })
    })
  },

  syncAuthAction() {
    const avatar = this.data.avatarFilePath || this.data.avatarUrl
    this.setData({
      hasAvatar: Boolean(avatar && avatar !== DEFAULT_AVATAR_URL),
    })
  },

  scheduleAutoLogin() {
    if (this.autoLoginTimer) clearTimeout(this.autoLoginTimer)
    this.autoLoginTimer = setTimeout(() => {
      this.autoLoginTimer = 0
      if (this.loginStarted || !this.nicknameReviewPassed) return
      this.readNickname('').then((nickname) => {
        this.submitLogin(nickname, true)
      })
    }, 100) as unknown as number
  },

  readNickname(formNickname: string): Promise<string> {
    const fromForm = formNickname.trim()
    if (fromForm) return Promise.resolve(fromForm)
    if (this.nicknameDraft.trim()) return Promise.resolve(this.nicknameDraft.trim())
    if (this.data.nickname.trim()) return Promise.resolve(this.data.nickname.trim())

    return new Promise((resolve) => {
      this.createSelectorQuery()
        .select('#auth-nickname')
        .fields({ properties: ['value'] })
        .exec((nodes) => {
          const node = nodes[0] as { value?: string } | undefined
          resolve(String(node?.value ?? '').trim())
        })
    })
  },

  submitLogin(nickname: string, silentIfIncomplete = false) {
    if (this.loginStarted) return

    const avatar = this.data.avatarFilePath || this.data.avatarUrl.trim()
    if (!isLoginProfileComplete({ nickname, avatar })) {
      if (!silentIfIncomplete) {
        wx.showToast({ title: '请选择头像并填写昵称', icon: 'none' })
      }
      return
    }

    this.loginStarted = true
    this.nicknameDraft = nickname
    this.setData({ nickname, busy: true, loginFailed: false, nicknameFocused: false })
    completeProfileLogin({ nickname, avatar })
      .then(() => continueAfterAuth(this.data.returnPath))
      .catch((error: unknown) => {
        console.error('[auth] login failed', error)
        this.loginStarted = false
        const isWechatLoginError = error instanceof Error && error.message.includes('微信登录')
        wx.showToast({
          title: isWechatLoginError ? '微信登录失败，请重试' : '登录失败，请稍后重试',
          icon: 'none',
        })
        this.setData({ busy: false, loginFailed: true })
      })
  },
})
