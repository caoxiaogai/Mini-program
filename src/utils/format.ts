/**
 * 格式化时长显示
 * 跳过值为0的单位，例如：60s→"1min"，90s→"1min30s"，3661s→"1h1min1s"
 * @param seconds 秒数
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(h + 'h');
  if (m > 0) parts.push(m + 'min');
  if (s > 0) parts.push(s + 's');
  return parts.length > 0 ? parts.join('') : '0s';
}

/**
 * 从 fileUrl 解析图片列表（支持 JSON 数组格式）
 * 单图返回 [url]，多图返回多个 url
 */
export function getFileUrls(fileUrl: string): string[] {
  if (!fileUrl) return [];
  if (fileUrl.startsWith('[')) {
    try {
      return JSON.parse(fileUrl);
    } catch {
      return [fileUrl];
    }

  }
  return [fileUrl];
}