import { getApiBaseUrl, request } from './request'
import { prepareMediaUrl } from '../utils/media'

const PAGE_COUNT_TIMEOUT_MS = 60000
const PAGE_IMAGE_TIMEOUT_MS = 60000

/** GET /material/{id}/page-count */
export function getDocumentPageCount(materialId: string): Promise<number> {
  return request<number>({
    method: 'GET',
    path: `/material/${materialId}/page-count`,
    silent: true,
    timeout: PAGE_COUNT_TIMEOUT_MS,
  }).then((count) => Number(count) || 0)
}

/** 文档页图片 URL（仅作下载源，真机需再转本地路径） */
export function buildDocumentPageImageUrl(materialId: string, pageIndex: number): string {
  return `${getApiBaseUrl()}/material/${materialId}/page/${pageIndex}/image`
}

/** 真机先 downloadFile 为 png 再给 <image>；模拟器可直接用 HTTP */
export function prepareDocumentPageImage(materialId: string, pageIndex: number): Promise<string> {
  return prepareMediaUrl(buildDocumentPageImageUrl(materialId, pageIndex), {
    timeout: PAGE_IMAGE_TIMEOUT_MS,
    fileExtension: 'png',
  })
}
