import {
  getNotifySettings,
  notifyIntentLevelOptions,
  updateNotifySettings,
} from '../../services/user'
import { logoutToAuth, runAuthed } from '../../services/auth'
import {
  DEFAULT_NOTIFY_INTENT_LEVEL,
  INTENT_RULES_TITLE,
  intentRuleSections,
} from '../../types/settings'
import type { NotifyIntentLevel } from '../../types/settings'
import { runPagePullRefresh } from '../../utils/pull-refresh'

Page({
  data: {
    notifyIntentLevelOptions,
    activeNotifyIntentLevel: DEFAULT_NOTIFY_INTENT_LEVEL as NotifyIntentLevel,
    saving: false,
    intentRulesVisible: false,
    intentRulesTitle: INTENT_RULES_TITLE,
    intentRuleSections,
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

  onIntentRulesTap() {
    this.setData({ intentRulesVisible: true })
  },

  onCloseIntentRules() {
    this.setData({ intentRulesVisible: false })
  },

  onIntentRulesNoop() {},

  onLogoutTap() {
    wx.showModal({
      title: '退出登录',
      content: '退出后需要重新登录才能使用',
      confirmText: '退出',
      cancelText: '取消',
      success: (result) => {
        if (result.confirm) logoutToAuth()
      },
    })
  },
})
