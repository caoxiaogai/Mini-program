import { getProfileStyleMock } from '../mocks/profile'
import type { ProfilePageViewModel } from '../types/profile'

// TODO(API): 接入「我的页面账户与会员信息」真实接口
// Method: GET（待后端确认）
// Endpoint: 待后端确认
// Request: 无
// Response: ProfilePageViewModel 对应后端响应映射
// Auth/permission: 待后端确认
// Error states: 待后端确认
export function getProfilePageData(): Promise<ProfilePageViewModel> {
  return Promise.resolve(getProfileStyleMock())
}
