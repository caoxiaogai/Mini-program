import { getHomeOverview } from '../../services/home'
import type { HomeOverviewViewModel, HomeSummaryViewModel } from '../../types/home'
import { getHomeGreeting } from '../../utils/greeting'
import { buildHomeSummaryViewModel } from '../../utils/home'

const tabItems = [
  { id: 'notifications', label: '通知', iconPath: '/assets/home/tab-notification.svg', badgeCount: 0 },
  { id: 'analysis', label: '分析', iconPath: '/assets/home/tab-analysis.svg' },
  { id: 'materials', label: '素材', iconPath: '/assets/home/tab-material.svg' },
  { id: 'ranking', label: '排名', iconPath: '/assets/home/tab-ranking.svg' },
]

Page({
  data: {
    greeting: getHomeGreeting(),
    homeData: null as HomeOverviewViewModel | null,
    homeSummary: null as HomeSummaryViewModel | null,
    tabItems,
  },
  onLoad() {
    getHomeOverview().then((homeData) => {
      const tabItemsWithBadge = this.data.tabItems.map((item) => {
        if (item.id !== 'notifications') {
          return item
        }

        return {
          ...item,
          badgeCount: homeData.unreadNotificationCount,
        }
      })

      this.setData({
        homeData,
        homeSummary: buildHomeSummaryViewModel(homeData),
        tabItems: tabItemsWithBadge,
      })
    })
  },
  onShow() {
    this.setData({ greeting: getHomeGreeting() })
  },
  onSummaryCardTap(event: WechatMiniprogram.TouchEvent) {
    const analysisTab = event.currentTarget.dataset.analysisTab as string
    if (analysisTab !== 'user' && analysisTab !== 'work') {
      return
    }

    wx.navigateTo({ url: `/pages/analysis/index?tab=${analysisTab}` })
  },
  onTabTap(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    if (event.detail.id === 'analysis') {
      wx.navigateTo({ url: '/pages/analysis/index' })
      return
    }

    if (event.detail.id === 'ranking') {
      wx.navigateTo({ url: '/pages/ranking/index' })
      return
    }

    if (event.detail.id === 'materials') {
      wx.navigateTo({ url: '/pages/materials/index' })
      return
    }

    if (event.detail.id !== 'notifications') {
      return
    }

    wx.navigateTo({
      url: '/pages/notifications/notifications',
    })
  },
})
