import type { ApiUserJourney } from '../types/api'
import type { UserJourneyViewModel } from '../types/analysis'
import { mapUserJourney } from '../utils/user-journey'
import { prepareMaterialThumbnail } from './materials'
import { request, resolveMediaUrl } from './request'

/**
 * 用户在指定作品上的行为轨迹。
 * GET /analysis/customer/journey
 * Request: { customerId: string; materialId: string }
 * Response: ApiUserJourney → UserJourneyViewModel
 */
export function getUserJourney(userId: string, materialId: string): Promise<UserJourneyViewModel> {
  return request<ApiUserJourney>({
    method: 'GET',
    path: '/analysis/customer/journey',
    query: {
      customerId: userId,
      materialId,
    },
  }).then(async (raw) => {
    if (!raw) {
      throw new Error('用户轨迹为空')
    }

    const thumbnailUrl = await prepareMaterialThumbnail({
      id: String(raw.materialId ?? materialId),
      fileType: raw.fileType,
      coverUrl: raw.coverUrl,
      fileUrl: raw.fileUrl,
    }).catch(() => resolveMediaUrl(raw.coverUrl) || '')

    return mapUserJourney(raw, thumbnailUrl)
  })
}
