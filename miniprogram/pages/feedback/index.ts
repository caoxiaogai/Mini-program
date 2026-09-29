import { runAuthed } from '../../services/auth'
import type { UserFeedbackItem } from '../../services/feedback'
import { getMyFeedback, submitFeedback } from '../../services/feedback'
import { runPagePullRefresh } from '../../utils/pull-refresh'

Page({
  data: {
    draft: '',
    submitting: false,
    items: [] as UserFeedbackItem[],
  },

  onLoad() {
    runAuthed('/pages/feedback/index', () => this.loadFeedback())
  },

  onPullDownRefresh() {
    runPagePullRefresh(this.loadFeedback())
  },

  loadFeedback() {
    return getMyFeedback()
      .then((items) => {
        this.setData({ items })
      })
      .catch(() => {
        this.setData({ items: [] })
      })
  },

  onDraftInput(event: WechatMiniprogram.Input) {
    this.setData({ draft: event.detail.value })
  },

  onSubmitTap() {
    const content = this.data.draft.trim()
    if (!content) {
      wx.showToast({ title: '请填写问题', icon: 'none' })
      return
    }
    if (this.data.submitting) return
    this.setData({ submitting: true })
    submitFeedback(content)
      .then(() => {
        this.setData({ draft: '', submitting: false })
        wx.showToast({ title: '已提交', icon: 'success' })
        return this.loadFeedback()
      })
      .catch(() => {
        this.setData({ submitting: false })
      })
  },
})
