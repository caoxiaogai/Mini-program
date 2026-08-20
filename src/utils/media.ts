import { BASE_URL } from '../config/api';

function getApiOrigin(): string {
  return BASE_URL.replace(/\/api\/?$/, '');
}

function getFileBaseUrl(): string {
  return `${getApiOrigin()}/api/files`;
}

/**
 * 将后端/占位图 URL 转为真机可访问地址。
 * - 内网 MinIO 直链 -> 走 /api/files 代理
 * - localhost -> 当前 BASE_URL 主机
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('wxfile://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('cloud://')
  ) {
    return trimmed;
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const fileBaseUrl = getFileBaseUrl();
  const apiOrigin = getApiOrigin();
  let resolved = trimmed;

  // MinIO 内网直链转文件代理
  resolved = resolved.replace(/^https?:\/\/10\.200\.0\.1:9000\//i, `${fileBaseUrl}/`);
  resolved = resolved.replace(/^https?:\/\/127\.0\.0\.1:9000\//i, `${fileBaseUrl}/`);

  // 本机后端地址转局域网地址（真机无法访问 localhost）
  resolved = resolved.replace(/^https?:\/\/(localhost|127\.0\.0\.1):8080/i, apiOrigin);

  return resolved;
}
