import type {
  HomeOverviewViewModel,
  HomeSummaryCardViewModel,
  HomeSummaryViewModel,
  HomeSummaryVisitorsViewModel,
} from '../types/home'

const createCardViewModel = (
  total: number,
  dataPrimaryPrefix: string,
  dataPrimaryValue: string,
  dataPrimarySuffix: string,
  dataSecondaryPrefix: string,
  dataSecondaryValue: string,
  dataSecondarySuffix: string,
  emptyPrimaryText: string,
  emptySecondaryText: string,
): HomeSummaryCardViewModel => {
  const isEmpty = !(total > 0)

  return {
    state: isEmpty ? 'empty' : 'data',
    isEmpty,
    primaryPrefix: isEmpty ? emptyPrimaryText : dataPrimaryPrefix,
    primaryValue: isEmpty ? '' : dataPrimaryValue,
    primarySuffix: isEmpty ? '' : dataPrimarySuffix,
    secondaryPrefix: isEmpty ? emptySecondaryText : dataSecondaryPrefix,
    secondaryValue: isEmpty ? '' : dataSecondaryValue,
    secondarySuffix: isEmpty ? '' : dataSecondarySuffix,
  }
}

export function buildHomeSummaryViewModel(homeOverview: HomeOverviewViewModel): HomeSummaryViewModel {
  const newVisitorsCard = createCardViewModel(
    homeOverview.newVisitors.total,
    '今日有 ',
    String(homeOverview.newVisitors.total),
    ' 个新增用户',
    '其中有 ',
    String(homeOverview.newVisitors.highIntentCount),
    ' 位高意向用户',
    '今日暂无新增用户',
    '分享素材后，客户进入小程序即可开始记录',
  )
  const reading = createCardViewModel(
    homeOverview.reading.total,
    '今日累计阅读数 ',
    String(homeOverview.reading.total),
    ' 次',
    '查看详细',
    '',
    '',
    '今日暂无阅读',
    '去分享素材给好友吧',
  )
  const sharing = createCardViewModel(
    homeOverview.sharing.total,
    '今日累计转发次数 ',
    String(homeOverview.sharing.total),
    ' 次',
    `“${homeOverview.sharing.highlightedContentTitle}”被转发了 ${homeOverview.sharing.highlightedContentShareCount} 次`,
    '',
    '',
    '今日暂无转发',
    '内容被转发后，这里会展示数据',
  )

  const newVisitors: HomeSummaryVisitorsViewModel = {
    ...newVisitorsCard,
    showVisitors: !newVisitorsCard.isEmpty,
    visitors: newVisitorsCard.isEmpty ? [] : homeOverview.newVisitors.visitors,
  }

  return {
    newVisitors,
    reading,
    sharing,
  }
}
