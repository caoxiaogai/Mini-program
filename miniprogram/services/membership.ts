import type { ApiMembershipOrder, ApiMembershipPayParams, ApiMembershipStatus } from '../types/api'
import type { MembershipOrderStatus, MembershipPageViewModel, MembershipPlanId } from '../types/membership'
import { MEMBERSHIP_PAGE_PATH } from '../types/membership'
import { mapMembershipPage } from '../utils/membership'
import { request } from './request'

export { MEMBERSHIP_PAGE_PATH, mapMembershipPage }

function isOrderStatus(value: string | null | undefined): value is MembershipOrderStatus {
  return value === 'pending' || value === 'paid' || value === 'closed'
}

/** GET /membership/me */
export function getMembershipPageData(): Promise<MembershipPageViewModel> {
  return request<ApiMembershipStatus>({
    method: 'GET',
    path: '/membership/me',
  }).then(mapMembershipPage)
}

/** GET /membership/me，失败时返回空，供「我的」页降级展示 */
export function getMembershipStatusSilent(): Promise<MembershipPageViewModel | null> {
  return request<ApiMembershipStatus>({
    method: 'GET',
    path: '/membership/me',
    silent: true,
  })
    .then(mapMembershipPage)
    .catch(() => null)
}

/** POST /membership/order */
export function createMembershipOrder(planId: MembershipPlanId, code: string): Promise<ApiMembershipPayParams> {
  return request<ApiMembershipPayParams>({
    method: 'POST',
    path: '/membership/order',
    data: { planId, code },
    silent: true,
  })
}

/** POST /membership/orders/:outTradeNo/sync */
export function syncMembershipOrder(outTradeNo: string): Promise<MembershipOrderStatus> {
  return request<ApiMembershipOrder>({
    method: 'POST',
    path: `/membership/orders/${encodeURIComponent(outTradeNo)}/sync`,
    silent: true,
  }).then((order) => (isOrderStatus(order.status) ? order.status : 'pending'))
}
