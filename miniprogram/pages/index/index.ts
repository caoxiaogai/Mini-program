import { getHomeOverview } from '../../services/home'
import type { HomeOverviewViewModel } from '../../types/home'

const tabItems = [
  { id: 'notifications', label: '通知', iconPath: '/assets/home/tab-notification.svg', badgeCount: 2 },
  { id: 'analysis', label: '分析', iconPath: '/assets/home/tab-analysis.svg' },
  { id: 'materials', label: '素材', iconPath: '/assets/home/tab-material.svg' },
  { id: 'ranking', label: '排名', iconPath: '/assets/home/tab-ranking.svg' },
]

Page({
  data: {
    homeData: null as HomeOverviewViewModel | null,
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

      this.setData({ homeData, tabItems: tabItemsWithBadge })
    })
  },
  onTabTap(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    if (event.detail.id === 'analysis') {
      wx.navigateTo({ url: '/pages/analysis/index' })
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
