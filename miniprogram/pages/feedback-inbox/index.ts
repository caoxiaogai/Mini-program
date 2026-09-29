import { runAuthed } from '../../services/auth'
import type { UserFeedbackItem } from '../../services/feedback'
import { getAllFeedback, replyFeedback } from '../../services/feedback'
import { fromDatasetId } from '../../utils/dataset-id'
import { runPagePullRefresh } from '../../utils/pull-refresh'

Page({
  data: {
    items: [] as UserFeedbackItem[],
    replyingId: '',
  },

  onLoad() {
    runAuthed('/pages/feedback-inbox/index', () => this.loadFeedback())
  },

  onPullDownRefresh() {
    runPagePullRefresh(this.loadFeedback())
  },

  loadFeedback() {
    return getAllFeedback()
      .then((items) => {
        const drafts = new Map(this.data.items.map((item) => [item.id, item.draft]))
        this.setData({
          items: items.map((item) => ({
            ...item,
            draft: drafts.get(item.id) ?? item.draft,
          })),
        })
      })
      .catch(() => {
        if (this.data.items.length === 0) wx.navigateBack()
      })
  },

  onReplyInput(event: WechatMiniprogram.Input) {
    const id = fromDatasetId(event.currentTarget.dataset.id)
    const draft = event.detail.value
    this.setData({
      items: this.data.items.map((item) => (item.id === id ? { ...item, draft } : item)),
    })
  },

  onReplyTap(event: WechatMiniprogram.TouchEvent) {
    const id = fromDatasetId(event.currentTarget.dataset.id)
    const item = this.data.items.find((entry) => entry.id === id)
    const reply = item?.draft.trim() ?? ''
    if (!id || !reply) {
      wx.showToast({ title: '请填写回复', icon: 'none' })
      return
    }
    if (this.data.replyingId) return
    this.setData({ replyingId: id })
    replyFeedback(id, reply)
      .then(() => {
        wx.showToast({ title: '已回复', icon: 'success' })
        this.setData({ replyingId: '' })
        return this.loadFeedback()
      })
      .catch(() => {
        this.setData({ replyingId: '' })
      })
  },
})
