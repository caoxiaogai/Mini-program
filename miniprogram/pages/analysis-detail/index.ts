import { enrichAudienceUsers, getAnalysisContentDetail } from '../../services/analysis'
import { runAuthed } from '../../services/auth'
import type { AnalysisAudienceUser, AnalysisContentDetailViewModel, AnalysisIntentLevel } from '../../types/analysis'
import { buildReturnPath } from '../../utils/auth'
import { fromDatasetId } from '../../utils/dataset-id'
import { LIST_PAGE_SIZE, nextListWindow, windowList } from '../../utils/list-window'
import { getNavigationBarLayout } from '../../utils/navigation-layout'
import { runPagePullRefresh } from '../../utils/pull-refresh'

type IntentFilter = 'all' | AnalysisIntentLevel

const intentTabs: Array<{ id: IntentFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'high', label: '高意向' },
  { id: 'medium', label: '中意向' },
  { id: 'low', label: '低意向' },
]

const intentSwipeThreshold = 40

function getVisibleIntentUsers(users: AnalysisAudienceUser[], filter: IntentFilter): AnalysisAudienceUser[] {
  return filter === 'all' ? users : users.filter((user) => user.level === filter)
}

Page({
  data: {
    analysisNavigationHeight: 91,
    detail: null as AnalysisContentDetailViewModel | null,
    intentTabs,
    activeIntentLevel: 'all' as IntentFilter,
    activeIntentIndex: 0,
    intentSwipeStartX: 0,
    visibleIntentUsers: [] as AnalysisAudienceUser[],
    hasVisibleIntentUsers: false,
    intentUsersVisibleCount: 0,
  },

  materialId: '',

  onLoad(options: Record<string, string | undefined>) {
    this.setData({ analysisNavigationHeight: getNavigationBarLayout().totalHeight })
    runAuthed(buildReturnPath('/pages/analysis-detail/index', options), () => {
      this.materialId = options.id ?? ''
      this.loadDetail()
    })
  },

  onPullDownRefresh() {
    runPagePullRefresh(this.loadDetail())
  },

  loadDetail() {
    if (!this.materialId) return Promise.resolve()

    return getAnalysisContentDetail(this.materialId).then((detail) => {
      this.setData({ detail })
      this.applyIntentUsersWindow(detail ? getVisibleIntentUsers(detail.intentUsers, this.data.activeIntentLevel) : [], LIST_PAGE_SIZE)
    })
  },
  applyIntentUsersWindow(users: AnalysisAudienceUser[], visibleCount: number) {
    const visibleIntentUsers = windowList(users, visibleCount)
    this.setData({
      visibleIntentUsers,
      intentUsersVisibleCount: visibleCount,
      hasVisibleIntentUsers: users.length > 0,
    })
    if (visibleIntentUsers.length === 0) return
    enrichAudienceUsers(visibleIntentUsers).then((patched) => {
      const byId = new Map(patched.map((user) => [user.id, user]))
      const detail = this.data.detail
      this.setData({
        visibleIntentUsers: this.data.visibleIntentUsers.map((user) => byId.get(user.id) ?? user),
        detail: detail
          ? { ...detail, intentUsers: detail.intentUsers.map((user) => byId.get(user.id) ?? user) }
          : detail,
      })
    })
  },
  onReachBottom() {
    const users = this.data.detail
      ? getVisibleIntentUsers(this.data.detail.intentUsers, this.data.activeIntentLevel)
      : []
    const next = nextListWindow(this.data.intentUsersVisibleCount, users.length)
    if (next === this.data.intentUsersVisibleCount) return
    this.applyIntentUsersWindow(users, next)
  },

  onIntentTabTap(event: WechatMiniprogram.CustomEvent<{ id: IntentFilter; index: number }>) {
    this.setIntentFilter(event.detail.index)
  },

  onIntentTouchStart(event: WechatMiniprogram.CustomEvent<{ clientX: number }>) {
    this.setData({ intentSwipeStartX: event.detail.clientX })
  },

  onIntentTouchEnd(event: WechatMiniprogram.CustomEvent<{ clientX: number }>) {
    const distance = event.detail.clientX - this.data.intentSwipeStartX
    if (Math.abs(distance) < intentSwipeThreshold) return
    this.setIntentFilter(this.data.activeIntentIndex + (distance < 0 ? 1 : -1))
  },

  setIntentFilter(tabIndex: number) {
    const tab = intentTabs[tabIndex]
    const detail = this.data.detail
    if (!tab || !detail) return

    this.setData({
      activeIntentLevel: tab.id,
      activeIntentIndex: tabIndex,
    })
    this.applyIntentUsersWindow(getVisibleIntentUsers(detail.intentUsers, tab.id), LIST_PAGE_SIZE)
  },

  onDetailUserTap(event: WechatMiniprogram.TouchEvent) {
    const userId = fromDatasetId(event.currentTarget.dataset.id)
    if (!userId) return
    wx.navigateTo({ url: `/pages/analysis-user-detail/index?id=${encodeURIComponent(userId)}` })
  },
})
