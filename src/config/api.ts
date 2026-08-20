import Taro from '@tarojs/taro';

/** 真机调试：手机与电脑同一 WiFi 时使用 */
export const LAN_API_BASE = 'http://192.168.31.225:8080/api';

/** 开发者工具模拟器：走本机回环，避免 LAN IP 被工具代理成 502 */
export const LOCAL_API_BASE = 'http://127.0.0.1:8080/api';

export function resolveApiBaseUrl(): string {
  if (process.env.TARO_ENV === 'h5') {
    return LOCAL_API_BASE;
  }

  try {
    const platform = Taro.getSystemInfoSync()?.platform;
    if (platform === 'devtools') {
      return LOCAL_API_BASE;
    }
  } catch {
    // ignore
  }

  return LAN_API_BASE;
}

export const BASE_URL = resolveApiBaseUrl();
