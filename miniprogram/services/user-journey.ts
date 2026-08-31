import type { UserJourneyViewModel } from '../types/analysis'
import { getMockUserJourney } from '../mocks/user-journey'

/**
 * 用户在指定作品上的行为轨迹。
 * TODO(API): 接入「用户在指定作品上的行为轨迹」真实接口
 * Method: 待后端确认
 * Endpoint: 待后端确认
 * Request: { userId: string; materialId: string }
 * Response: UserJourneyViewModel
 * Auth/permission: 待后端确认
 * Error states: 待后端确认
 */
export function getUserJourney(userId: string, materialId: string): Promise<UserJourneyViewModel> {
  return Promise.resolve(getMockUserJourney(userId, materialId))
}
