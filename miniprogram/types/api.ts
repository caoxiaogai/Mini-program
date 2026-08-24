// 后端 aisales 项目（Spring Boot，context-path /api）的响应类型。
// 字段与后端 VO / Entity 一一对应；Long 类型 ID 由后端序列化为字符串。

/** 统一响应包装（对应后端 common/Result.java，成功码 200） */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

/** POST /wechat/login 响应 */
export interface ApiLoginData {
  userId: string
  openid: string
  nickname: string | null
  avatar: string | null
  phone: string | null
}

export type ApiNotifyIntentLevel = 'low' | 'medium' | 'high'

/** GET/PUT /user/notify-settings 响应 */
export interface ApiNotifySettings {
  notifyIntentLevel: ApiNotifyIntentLevel
}

export type ApiNotifyIntentLevel = 'low' | 'medium' | 'high'

/** GET/PUT /user/notify-settings */
export interface ApiNotifySettings {
  notifyIntentLevel: ApiNotifyIntentLevel
}

export type ApiNotifyIntentLevel = 'low' | 'medium' | 'high'

/** GET/PUT /user/notify-settings */
export interface ApiNotifySettings {
  notifyIntentLevel: ApiNotifyIntentLevel
}

/** GET /analysis/dashboard 响应（DashboardVO） */
export interface ApiDashboard {
  totalPublishCount: number | null
  totalViewCount: number | null
  totalCompleteCount: number | null
  totalForwardCount: number | null
  completeRate: number | null
  forwardRate: number | null
  repeatViewCount: number | null
  totalViewerCount: number | null
  highIntentCount: number | null
  mediumIntentCount: number | null
  lowIntentCount: number | null
}

/** GET /analysis/content/list 响应项（ContentListVO） */
export interface ApiContentListItem {
  materialId: string
  title: string | null
  content: string | null
  fileType: string | null
  coverUrl: string | null
  viewCount: number | null
  viewerCount: number | null
  completeCount: number | null
  forwardCount: number | null
  totalDuration: number | null
  createTime: string | null
}

/** 内容详情中的受众项（AudienceVO） */
export interface ApiAudience {
  customerId: string
  nickname: string | null
  avatar: string | null
  viewCount: number | null
  duration: number | null
  completed: number | null
  intentLevel: ApiIntentLevel | null
  lastViewTime: string | null
}

/** GET /analysis/content/detail 响应（ContentDetailVO） */
export interface ApiContentDetail {
  materialId: string
  title: string | null
  content: string | null
  fileType: string | null
  viewCount: number | null
  viewerCount: number | null
  completeCount: number | null
  forwardCount: number | null
  totalDuration: number | null
  audienceList: ApiAudience[] | null
}

/** GET /analysis/customer/list 响应项（CustomerListVO） */
export interface ApiCustomerListItem {
  customerId: string
  nickname: string | null
  avatar: string | null
  viewCount: number | null
  totalDuration: number | null
  completeCount: number | null
  lastViewTime: string | null
}

/** GET /analysis/customer/history 响应项（CustomerViewHistoryVO） */
export interface ApiCustomerViewHistory {
  materialId: string
  title: string | null
  content: string | null
  fileType: string | null
  duration: number | null
  progress: number | null
  completed: number | null
  viewTime: string | null
}

export type ApiIntentLevel = 'high' | 'medium' | 'low'

/** GET /analysis/intent/list 响应项（IntentCustomerVO，一名客户一行） */
export interface ApiIntentCustomer {
  customerId: string
  nickname: string | null
  avatar: string | null
  viewCount: number | null
  hasForwarded: number | null
  completed: number | null
  materialId: string | null
  materialTitle: string | null
  intentLevel: ApiIntentLevel
  lastViewTime: string | null
}

export type ApiMaterialFileType = 'PDF' | 'IMAGE' | 'VIDEO' | 'TABLE'

/** 素材实体（Material），fileUrl 为单个 URL 或多图 JSON 数组字符串 */
export interface ApiMaterial {
  id: string
  userId: string
  title: string | null
  content: string | null
  fileType: ApiMaterialFileType
  fileUrl: string | null
  fileSize: number | null
  coverUrl: string | null
  duration: number | null
  aiCopy: string | null
  shareUrl: string | null
  trackingId: string | null
  publishStatus: 0 | 1
  createTime: string | null
  updateTime: string | null
}
