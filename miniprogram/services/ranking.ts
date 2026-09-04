import type { ApiRankingEntry } from '../types/api'
import type { RankingEntry, RankingViewModel } from '../types/ranking'
import { DEFAULT_AVATAR_URL } from '../utils/auth'
import { prepareMediaUrls } from '../utils/media'
import { request, resolveMediaUrl } from './request'

export { sortRankingEntries } from '../utils/ranking'

function asCount(value: number | null | undefined): number {
  const count = Number(value)
  return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0
}

function mapRankingEntry(item: ApiRankingEntry, avatarUrl: string): RankingEntry {
  const name = (item.nickname ?? '').trim() || '微信用户'
  return {
    id: String(item.userId),
    avatarUrl: avatarUrl || DEFAULT_AVATAR_URL,
    name,
    workCount: asCount(item.workCount),
    views: asCount(item.viewCount),
    shares: asCount(item.forwardCount),
    completions: asCount(item.completeCount),
  }
}

export function getRankingOverview(): Promise<RankingViewModel> {
  return request<ApiRankingEntry[]>({ method: 'GET', path: '/analysis/ranking' }).then((items) => {
    const list = Array.isArray(items) ? items : []
    return prepareMediaUrls(list.map((item) => resolveMediaUrl(item.avatar))).then((avatars) => ({
      entries: list.map((item, index) => mapRankingEntry(item, avatars[index])),
    }))
  })
}
