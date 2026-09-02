import { afterAuthorizeLogin, continueAfterAuth } from '../../services/auth'
import { ensureLogin, patchCachedLogin } from '../../services/request'
import { updateUserProfile, uploadUserAvatar } from '../../services/user'
import { isLocalAvatarFile, isLoginProfileComplete, safeReturnPath, type AuthGate } from '../../utils/auth'
import { HOME_PAGE_PATH } from '../../utils/share-material'

type AuthStep = Exclude<AuthGate, 'ok'>
type ChooseAvatarEvent = WechatMiniprogram.CustomEvent<{ avatarUrl: string }>

Page({
  data: {
    step: 'login' as AuthStep,
    returnPath: HOME_PAGE_PATH,
    nickname: '',
    avatarUrl: '',
    avatarFilePath: '',
    nicknameFocused: false,
    busy: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    const step = options.step === 'profile' ? 'profile' : 'login'
    this.setData({
      step,
      returnPath: safeReturnPath(options.return),
    })
    if (step !== 'profile') return

    ensureLogin()
      .then((user) => {
        this.setData({
          nickname: (user.nickname ?? '').trim(),
          avatarUrl: user.avatar ?? '',
        })
      })
      .catch(() => undefined)
  },

  onAuthorizeTap() {
    if (this.data.busy) return
    this.setData({ busy: true })

    afterAuthorizeLogin()
      .then(({ user, gate }) => {
        if (gate === 'ok') {
          continueAfterAuth(this.data.returnPath)
          return
        }
        this.setData({
          step: 'profile',
          nickname: (user.nickname ?? '').trim(),
          avatarUrl: user.avatar ?? '',
          avatarFilePath: '',
          busy: false,
        })
      })
      .catch(() => {
        this.setData({ busy: false })
      })
  },

  onChooseAvatar(event: ChooseAvatarEvent) {
    this.applyWechatAvatar(event.detail.avatarUrl, false)
  },

  onUseWechatProfile(event: ChooseAvatarEvent) {
    this.applyWechatAvatar(event.detail.avatarUrl, true)
  },

  applyWechatAvatar(avatarUrl: string, focusNickname: boolean) {
    if (!avatarUrl) return
    this.setData({
      avatarUrl,
      avatarFilePath: isLocalAvatarFile(avatarUrl) ? avatarUrl : '',
      nicknameFocused: false,
    })
    if (!focusNickname) return
    wx.nextTick(() => this.setData({ nicknameFocused: true }))
  },

  onNicknameInput(event: WechatMiniprogram.Input) {
    this.setData({ nickname: event.detail.value })
  },

  onNicknameBlur(event: WechatMiniprogram.InputBlur) {
    this.setData({
      nickname: event.detail.value.trim(),
      nicknameFocused: false,
    })
  },

  onSaveProfileTap() {
    if (this.data.busy) return

    const nickname = this.data.nickname.trim()
    const avatarFilePath = this.data.avatarFilePath
    const avatarUrl = this.data.avatarUrl.trim()
    if (!avatarFilePath && !avatarUrl) {
      wx.showToast({ title: '请设置头像', icon: 'none' })
      return
    }
    if (!isLoginProfileComplete({ nickname, avatar: avatarFilePath || avatarUrl })) {
      wx.showToast({ title: '请填写微信昵称', icon: 'none' })
      return
    }

    this.setData({ busy: true })
    const persistAvatar = avatarFilePath
      ? uploadUserAvatar(avatarFilePath)
      : Promise.resolve(avatarUrl)

    persistAvatar
      .then((avatar) => updateUserProfile({ nickname, avatar }).then(() => avatar))
      .then((avatar) => {
        patchCachedLogin({ nickname, avatar })
        continueAfterAuth(this.data.returnPath)
      })
      .catch(() => {
        this.setData({ busy: false })
      })
  },
})
