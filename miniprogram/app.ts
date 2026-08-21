// app.ts
import './services/auth'
import { refreshAuthGate } from './services/auth'

App<IAppOption>({
  globalData: {
    authGate: {
      showLogin: false,
      showProfile: false,
    },
  },
  onLaunch() {
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    refreshAuthGate()
  },
  onShow() {
    refreshAuthGate()
  },
})
