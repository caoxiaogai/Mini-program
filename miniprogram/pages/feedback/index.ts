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

  scrollFormToTop() {
    wx.createSelectorQuery()
      .select('.feedback-page__header')
      .boundingClientRect()
      .select('#feedback-form')
      .boundingClientRect()
      .selectViewport()
      .scrollOffset()
      .exec((result) => {
        const header = result[0] as WechatMiniprogram.BoundingClientRectCallbackResult | null
        const form = result[1] as WechatMiniprogram.BoundingClientRectCallbackResult | null
        const viewport = result[2] as WechatMiniprogram.ScrollOffsetCallbackResult | null
        if (!form || !viewport) return
        const headerHeight = header?.height ?? 0
        const scrollTop = viewport.scrollTop + form.top - headerHeight
        wx.pageScrollTo({
          scrollTop: scrollTop > 0 ? scrollTop : 0,
          duration: 300,
        })
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
        wx.showModal({
          content: '已提交成功',
          showCancel: false,
        })
        this.scrollFormToTop()
        return this.loadFeedback()
      })
      .catch(() => {
        this.setData({ submitting: false })
      })
  },
})
