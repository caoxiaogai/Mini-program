import {
  getNotifySettings,
  notifyIntentLevelOptions,
  updateNotifySettings,
} from '../../services/user'
import { runAuthed } from '../../services/auth'
import type { NotifyIntentLevel } from '../../types/settings'
import { DEFAULT_NOTIFY_INTENT_LEVEL } from '../../types/settings'
import { runPagePullRefresh } from '../../utils/pull-refresh'

Page({
  data: {
    notifyIntentLevelOptions,
    activeNotifyIntentLevel: DEFAULT_NOTIFY_INTENT_LEVEL as NotifyIntentLevel,
    saving: false,
  },

  onLoad() {
    runAuthed('/pages/settings/index', () => this.loadSettings())
  },

  onPullDownRefresh() {
    runPagePullRefresh(this.loadSettings())
  },

  loadSettings() {
    return getNotifySettings()
      .then((activeNotifyIntentLevel) => {
        this.setData({ activeNotifyIntentLevel })
      })
      .catch(() => {
        this.setData({ activeNotifyIntentLevel: DEFAULT_NOTIFY_INTENT_LEVEL })
      })
  },

  onNotifyIntentLevelChange(event: WechatMiniprogram.CustomEvent<{ id: NotifyIntentLevel; index: number }>) {
    const level = event.detail.id
    if (!notifyIntentLevelOptions.some((item) => item.id === level)) return
    if (level === this.data.activeNotifyIntentLevel || this.data.saving) return

    this.setData({ saving: true })

    updateNotifySettings(level)
      .then(() => {
        this.setData({
          activeNotifyIntentLevel: level,
          saving: false,
        })
        wx.showToast({ title: '推送设置已保存', icon: 'success' })
      })
      .catch(() => {
        this.setData({ saving: false })
        wx.showToast({ title: '保存失败，请重试', icon: 'none' })
      })
  },
})
