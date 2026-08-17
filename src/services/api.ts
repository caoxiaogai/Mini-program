import Taro from '@tarojs/taro';
import type { ApiResult, Material } from '../types';

// export const BASE_URL = 'http://59.110.21.49:8080/api';
export const BASE_URL = 'http://192.168.31.225:8080/api';

// H5 环境使用 mock 数据
const isH5 = process.env.TARO_ENV === 'h5';

export async function request<T = any>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    header?: Record<string, string>;
  } = {}
): Promise<T> {
  const { method = 'GET', data, header } = options;

  if (isH5) {
    // H5 预览时走 mock
    const mockPath = url.replace(/^\//, '').replace(/\//g, '_');
    try {
      const mockModule = await import(`../data/${mockPath}`);
      if (mockModule.default) {
        return mockModule.default(data) as T;
      }
    } catch (e) {
      console.error(`[API] mock not found for: ${url}`, e);
    }
    return null as T;
  }

  const userId = Taro.getStorageSync('userId');
  const res = await Taro.request({
    url: `${BASE_URL}${url}`,
    method,
    data,
    header: {
      'Content-Type': 'application/json',
      ...(userId ? { 'X-User-Id': String(userId) } : {}),
      ...header
    }
  });

  const result = res.data as ApiResult<T>;
  if (result.code !== 200) {
    console.error(`[API] ${url} failed:`, result.message);
    throw new Error(result.message || '请求失败');
  }
  return result.data;
}

export async function uploadFile(filePath: string): Promise<any> {
  if (isH5) {
    return 'https://picsum.photos/id/1/300/300';
  }
  const userId = Taro.getStorageSync('userId');
  const res = await Taro.uploadFile({
    url: `${BASE_URL}/material/upload`,
    filePath,
    name: 'file',
    header: {
      ...(userId ? { 'X-User-Id': String(userId) } : {})
    }
  });
  const result = JSON.parse(res.data) as ApiResult<any>;
  if (result.code !== 200) {
    throw new Error(result.message || '上传失败');
  }
  return result.data;
}

/** 批量上传图片，返回一个包含多图的 Material */
export async function uploadImages(filePaths: string[]): Promise<Material> {
  if (isH5) {
    return { id: 1000, title: '图片集', fileType: 'IMAGE', fileUrl: '[]', coverUrl: '', fileSize: 0, duration: 0 } as Material;
  }
  const userId = Taro.getStorageSync('userId');
  // 逐个上传文件到存储（仅上传，不创建素材）
  const uploads = filePaths.map(filePath =>
    Taro.uploadFile({
      url: `${BASE_URL}/material/upload-file`,
      filePath,
      name: 'file',
      header: {
        ...(userId ? { 'X-User-Id': String(userId) } : {})
      }
    })
  );
  const results = await Promise.all(uploads);
  const fileUrls: string[] = [];
  for (const res of results) {
    const result = JSON.parse(res.data) as ApiResult<string>;
    if (result.code !== 200) throw new Error(result.message || '上传失败');
    fileUrls.push(result.data);
  }
  // 创建一个素材，fileUrl 为 JSON 数组
  const createRes = await request<Material>('/material', {
    method: 'POST',
    data: {
      title: '图片素材',
      content: '',
      fileType: 'IMAGE',
      fileUrl: JSON.stringify(fileUrls),
      fileSize: 0,
      coverUrl: fileUrls[0] || '',
      duration: 0
    }
  });
  return createRes;
}
