import { homeOverviewMock } from '../mocks/home'
import type { HomeOverviewViewModel } from '../types/home'

// TODO(API): 接入首页摘要真实接口
export function getHomeOverview(): Promise<HomeOverviewViewModel> {
  return Promise.resolve(homeOverviewMock)
}
