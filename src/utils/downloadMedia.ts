import Taro from '@tarojs/taro';
import { resolveMediaUrl } from './media';

const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

function isRemoteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * 微信小程序真机需先 downloadFile，再用 tempFilePath 展示远程图片。
 */
export async function downloadMediaToLocal(url?: string | null): Promise<string> {
  const resolved = resolveMediaUrl(url);
  if (!resolved) return '';
  if (!isRemoteUrl(resolved)) return resolved;

  const cached = cache.get(resolved);
  if (cached) return cached;

  const inflight = pending.get(resolved);
  if (inflight) return inflight;

  const task = new Promise<string>((resolve) => {
    Taro.downloadFile({
      url: resolved,
      success: (res) => {
        if (res.statusCode === 200 && res.tempFilePath) {
          cache.set(resolved, res.tempFilePath);
          resolve(res.tempFilePath);
          return;
        }
        console.error('[downloadMedia] bad status:', resolved, res.statusCode);
        resolve('');
      },
      fail: (err) => {
        console.error('[downloadMedia] failed:', resolved, err);
        resolve('');
      },
      complete: () => {
        pending.delete(resolved);
      },
    });
  });

  pending.set(resolved, task);
  return task;
}

export async function downloadMediaList(urls: string[]): Promise<string[]> {
  const results = await Promise.all(urls.map((url) => downloadMediaToLocal(url)));
  return results.filter(Boolean);
}
