// API 返回统一结构
export interface ApiResult<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// 素材
export interface Material {
  id: number;
  userId: number;
  title: string;
  content: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  coverUrl: string;
  duration: number;
  aiCopy: string;
  shareUrl: string;
  trackingId: string;
  publishStatus: number;
  deleted: number;
  createTime: string;
  updateTime: string;
}

// AI生成请求
export interface AiGenerateDTO {
  title: string;
  content: string;
  materialId?: number;
}

// AI生成返回
export interface AiGenerateVO {
  copy: string;
  model: string;
  totalTokens: number;
  costMs: number;
}

// 素材创建DTO
export interface MaterialCreateDTO {
  title: string;
  content: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  coverUrl: string;
  duration: number;
}

// 数据看板
export interface DashboardVO {
  totalPublishCount: number;
  totalViewCount: number;
  totalCompleteCount: number;
  totalForwardCount: number;
  completeRate: number;
  forwardRate: number;
  repeatViewCount: number;
  totalViewerCount: number;
  highIntentCount: number;
  mediumIntentCount: number;
  lowIntentCount: number;
}

// 内容列表
export interface ContentListVO {
  materialId: number;
  title: string;
  content: string;
  fileType: string;
  coverUrl: string;
  viewCount: number;
  viewerCount: number;
  completeCount: number;
  forwardCount: number;
  totalDuration: number;
  createTime: string;
}

// 受众
export interface AudienceVO {
  customerId: number;
  nickname: string;
  avatar: string;
  viewCount: number;
  duration: number;
  completed: number;
  lastViewTime: string;
}

// 内容详情
export interface ContentDetailVO {
  materialId: number;
  title: string;
  content: string;
  fileType: string;
  viewCount: number;
  viewerCount: number;
  completeCount: number;
  forwardCount: number;
  totalDuration: number;
  audienceList: AudienceVO[];
}

// 客户列表
export interface CustomerListVO {
  customerId: number;
  nickname: string;
  avatar: string;
  viewCount: number;
  totalDuration: number;
  completeCount: number;
  lastViewTime: string;
}

// 客户观看历史
export interface CustomerViewHistoryVO {
  materialId: number;
  title: string;
  content: string;
  fileType: string;
  duration: number;
  progress: number;
  completed: number;
  viewTime: string;
}

// 分析查询
export interface AnalysisQuery {
  timeRange?: string;
  startDate?: string;
  endDate?: string;
  materialId?: number;
  customerId?: number;
  orderBy?: string;
  intentLevel?: string;
  current?: number;
  size?: number;
}

// 意向客户
export interface IntentCustomerVO {
  customerId: number;
  nickname: string;
  avatar: string;
  viewCount: number;
  hasForwarded: number;
  completed: number;
  materialId: number;
  materialTitle: string;
  intentLevel: string;
  lastViewTime: string;
}

// 用户信息
export interface UserInfo {
  openid: string;
  unionid: string;
  phone: string;
  nickname: string;
  avatar: string;
  status: number;
}
