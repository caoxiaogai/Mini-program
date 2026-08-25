import { getAnalysisDetail } from '../../services/analysis'
import type { AnalysisDetailViewModel, AnalysisIntentLevel, AnalysisIntentUser } from '../../types/analysis'

type IntentFilter = 'all' | AnalysisIntentLevel

const intentTabs: Array<{ id: IntentFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'high', label: '高意向' },
  { id: 'medium', label: '中意向' },
  { id: 'low', label: '低意向' },
]

const intentSwipeThreshold = 40

const getVisibleIntentUsers = (users: AnalysisIntentUser[], filter: IntentFilter) => {
  return filter === 'all' ? users : users.filter((user) => user.level === filter)
}

Page({
  data: {
    detail: null as AnalysisDetailViewModel | null,
    intentTabs,
    activeIntentLevel: 'all' as IntentFilter,
    activeIntentIndex: 0,
    intentSwipeStartX: 0,
    visibleIntentUsers: [] as AnalysisIntentUser[],
    hasVisibleIntentUsers: false,
  },
  onLoad(options: Record<string, string | undefined>) {
    const cardId = options.id
    if (!cardId) return

    getAnalysisDetail(cardId).then((detail) => {
      const visibleUsers = detail ? detail.intentUsers : []

      this.setData({
        detail,
        visibleIntentUsers: visibleUsers,
        hasVisibleIntentUsers: visibleUsers.length > 0,
      })
    })
  },
  onIntentTabTap(event: WechatMiniprogram.CustomEvent<{ index: number }>) {
    this.setIntentFilter(event.detail.index)
  },
  onIntentTouchStart(event: WechatMiniprogram.CustomEvent<{ clientX: number }>) {
    this.setData({ intentSwipeStartX: event.detail.clientX })
  },
  onIntentTouchEnd(event: WechatMiniprogram.CustomEvent<{ clientX: number }>) {
    const distance = event.detail.clientX - this.data.intentSwipeStartX
    if (Math.abs(distance) < intentSwipeThreshold) return

    const direction = distance < 0 ? 1 : -1
    this.setIntentFilter(this.data.activeIntentIndex + direction)
  },
  setIntentFilter(tabIndex: number) {
    const tab = intentTabs[tabIndex]
    const detail = this.data.detail
    if (!tab || !detail) return

    const visibleUsers = getVisibleIntentUsers(detail.intentUsers, tab.id)

    this.setData({
      activeIntentLevel: tab.id,
      activeIntentIndex: tabIndex,
      visibleIntentUsers: visibleUsers,
      hasVisibleIntentUsers: visibleUsers.length > 0,
    })
  },
  onDetailUserTap(event: WechatMiniprogram.TouchEvent) {
    const userId = event.currentTarget.dataset.id as string

    wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${userId}` })
  },
})
