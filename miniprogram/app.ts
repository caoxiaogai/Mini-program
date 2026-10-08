// app.ts
import { getProfilePageData } from './services/profile'
import { ensureLogin, hasAuthorizedLogin, setRequestForeground } from './services/request'
import { pauseMaterialCreatesForBackground, resumeMaterialCreatesForForeground } from './utils/material-create'
import { cancelVisitorLeave, reportVisitorLeave, startVisitorHeartbeat, stopVisitorHeartbeat } from './services/tracking'

App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 已授权用户预热登录态；未授权时由页面引导授权登录，不在启动时静默建号
    if (!hasAuthorizedLogin()) return
    ensureLogin()
      .then(() => getProfilePageData())
      .catch(() => undefined)
  },
  onShow() {
    setRequestForeground(true)
    resumeMaterialCreatesForForeground()
    cancelVisitorLeave()
    startVisitorHeartbeat()
  },
  onHide() {
    setRequestForeground(false)
    pauseMaterialCreatesForBackground()
    stopVisitorHeartbeat()
    reportVisitorLeave()
  },
})
