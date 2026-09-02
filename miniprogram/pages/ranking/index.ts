import { getRankingOverview, sortRankingEntries } from '../../services/ranking'
import { runAuthed } from '../../services/auth'
import type { RankingEntryViewModel, RankingMetric, RankingTab, RankingViewModel } from '../../types/ranking'
import { calculateRankingHeaderOpacity } from '../../utils/ranking'
import { runPagePullRefresh } from '../../utils/pull-refresh'

const rankingTabs: RankingTab[] = [
  { id: 'views', label: '浏览量' },
  { id: 'shares', label: '转发量' },
  { id: 'completions', label: '完播量' },
]

Page({
  data: {
    rankingData: null as RankingViewModel | null,
    rankingTabs,
    activeRankingMetric: 'views' as RankingMetric,
    visibleRankingEntries: [] as RankingEntryViewModel[],
    hasRankingEntries: false,
    rankingHeaderOpacity: 0,
  },
  onLoad() {
    runAuthed('/pages/ranking/index', () => this.loadRanking())
  },
  onPullDownRefresh() {
    runPagePullRefresh(this.loadRanking())
  },
  loadRanking() {
    return getRankingOverview().then((rankingData) => {
      const visibleRankingEntries = sortRankingEntries(rankingData.entries, this.data.activeRankingMetric)

      this.setData({
        rankingData,
        visibleRankingEntries,
        hasRankingEntries: visibleRankingEntries.length > 0,
      })
    })
  },
  onPageScroll(event: WechatMiniprogram.PageScrollOption) {
    const rankingHeaderOpacity = calculateRankingHeaderOpacity(event.scrollTop)

    if (rankingHeaderOpacity === this.data.rankingHeaderOpacity) return

    this.setData({ rankingHeaderOpacity })
  },
  onRankingTabTap(event: WechatMiniprogram.CustomEvent<{ id: RankingMetric; index: number }>) {
    const { id: metric, index: tabIndex } = event.detail

    if (!rankingTabs.some((tab) => tab.id === metric) || !Number.isInteger(tabIndex)) return

    const visibleRankingEntries = sortRankingEntries(this.data.rankingData?.entries ?? [], metric)

    this.setData({
      activeRankingMetric: metric,
      visibleRankingEntries,
      hasRankingEntries: visibleRankingEntries.length > 0,
    })
  },
})
