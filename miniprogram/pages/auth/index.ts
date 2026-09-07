import { completeProfileLogin, continueAfterAuth } from '../../services/auth'
import { DEFAULT_AVATAR_URL, isLocalAvatarFile, isLoginProfileComplete, safeReturnPath } from '../../utils/auth'
import { getNavigationBarLayout } from '../../utils/navigation-layout'
import { HOME_PAGE_PATH } from '../../utils/share-material'

type ChooseAvatarEvent = WechatMiniprogram.CustomEvent<{ avatarUrl: string }>
type NicknameReviewEvent = WechatMiniprogram.CustomEvent<{ pass: boolean }>
type AuthFormValue = { nickname?: string }

Page({
  nicknameDraft: '',
  data: {
    returnPath: HOME_PAGE_PATH,
    navigationHeight: 0,
    nickname: '',
    avatarUrl: DEFAULT_AVATAR_URL,
    defaultAvatarUrl: DEFAULT_AVATAR_URL,
    avatarFilePath: '',
    nicknameFocused: false,
    busy: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    this.setData({
      returnPath: safeReturnPath(options.return),
      navigationHeight: getNavigationBarLayout().totalHeight,
    })
  },

  onChooseAvatar(event: ChooseAvatarEvent) {
    const avatarUrl = event.detail.avatarUrl
    if (!avatarUrl) return
    this.setData({
      avatarUrl,
      avatarFilePath: isLocalAvatarFile(avatarUrl) ? avatarUrl : '',
      nicknameFocused: false,
    }, () => {
      this.setData({ nicknameFocused: true })
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
    if (event.detail.pass) return
    this.nicknameDraft = ''
    this.setData({ nickname: '' })
    wx.showToast({ title: '昵称未通过安全检测', icon: 'none' })
  },

  onFormSubmit(event: WechatMiniprogram.FormSubmit) {
    if (this.data.busy) return

    const formValue = event.detail.value as AuthFormValue
    this.readNickname(String(formValue.nickname ?? '')).then((nickname) => {
      this.submitLogin(nickname)
    })
  },

  rememberNickname(value: string) {
    const nickname = value.trim()
    this.nicknameDraft = nickname
    if (this.data.nickname && this.data.nickname !== nickname) {
      this.setData({ nickname })
    }
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

  submitLogin(nickname: string) {
    if (this.data.busy) return

    const avatar = this.data.avatarFilePath || this.data.avatarUrl.trim()
    if (!isLoginProfileComplete({ nickname, avatar })) {
      wx.showToast({ title: '请选择头像并填写昵称', icon: 'none' })
      return
    }

    this.nicknameDraft = nickname
    this.setData({ nickname, busy: true, nicknameFocused: false })
    completeProfileLogin({ nickname, avatar })
      .then(() => continueAfterAuth(this.data.returnPath))
      .catch((error: unknown) => {
        console.error('[auth] login failed', error)
        const isWechatLoginError = error instanceof Error && error.message.includes('微信登录')
        wx.showToast({
          title: isWechatLoginError ? '微信登录失败，请重试' : '登录失败，请稍后重试',
          icon: 'none',
        })
        this.setData({ busy: false })
      })
  },
})
