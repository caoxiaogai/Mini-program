// app.ts
import { getProfilePageData } from './services/profile'
import { ensureLogin } from './services/request'

App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录：wx.login code 换取 userId，登录态由统一请求层携带；失败时页面请求会自动重试登录
    ensureLogin()
      .then(() => getProfilePageData())
      .catch(() => undefined)
  },
})
