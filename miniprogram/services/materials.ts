import { materialDetailsMock, materialDraftsMock, materialsMock } from '../mocks/materials'
import type { MaterialDetailViewModel, MaterialDraftEditViewModel, MaterialsViewModel } from '../types/materials'

// TODO(API): 接入素材列表真实接口
// Method: GET（待后端确认）
// Endpoint: 待后端确认
// Request: 待后端确认
// Response: MaterialsViewModel
// Auth/permission: 待后端确认
// Error states: 待后端确认
export function getMaterials(): Promise<MaterialsViewModel> {
  return Promise.resolve(materialsMock)
}

// TODO(API): 接入素材详情真实接口
// Method: GET（待后端确认）
// Endpoint: 待后端确认
// Request: materialId: string
// Response: MaterialDetailViewModel
// Auth/permission: 待后端确认
// Error states: 待后端确认
export function getMaterialDetail(materialId: string): Promise<MaterialDetailViewModel | null> {
  return Promise.resolve(materialDetailsMock[materialId] ?? null)
}

// TODO(API): 接入素材草稿详情真实接口
// Method: GET（待后端确认）
// Endpoint: 待后端确认
// Request: materialId: string
// Response: MaterialDraftEditViewModel
// Auth/permission: 待后端确认
// Error states: 待后端确认
export function getMaterialDraft(materialId: string): Promise<MaterialDraftEditViewModel | null> {
  return Promise.resolve(materialDraftsMock[materialId] ?? null)
}

// TODO(API): 接入素材发表与草稿真实接口
// Method: POST（待后端确认）
// Endpoint: 待后端确认
// Request: 待确认的图片资源与文案类型
// Response: 待确认
// Auth/permission: 待后端确认
// Error states: 待后端确认
