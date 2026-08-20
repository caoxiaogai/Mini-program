import Taro from '@tarojs/taro';
import { request } from './api';
import type { UserInfo } from '../types';

interface LoginResult {
  userId: string;
  openid: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
}

export function buildUserInfo(result: LoginResult): UserInfo {
  return {
    openid: result.openid,
    unionid: '',
    phone: result.phone || '',
    nickname: result.nickname || '微信用户',
    avatar: result.avatar || '',
    status: 1,
  };
}

export function persistSession(userId: string, userInfo: UserInfo) {
  Taro.setStorageSync('userId', userId);
  Taro.setStorageSync('userInfo', userInfo);
}

export function clearSession() {
  Taro.removeStorageSync('userId');
  Taro.removeStorageSync('userInfo');
}

export function restoreSession(): { userId: string; userInfo: UserInfo } | null {
  const userId = Taro.getStorageSync('userId');
  if (!userId) return null;

  const stored = Taro.getStorageSync('userInfo') as UserInfo | undefined;
  if (stored?.openid) {
    return { userId: String(userId), userInfo: stored };
  }

  return {
    userId: String(userId),
    userInfo: {
      openid: '',
      unionid: '',
      phone: '',
      nickname: '微信用户',
      avatar: '',
      status: 1,
    },
  };
}

export async function wechatLogin(): Promise<{ userId: string; userInfo: UserInfo }> {
  const { code } = await Taro.login();
  const result = await request<LoginResult>('/wechat/login?code=' + code, { method: 'POST' });
  const userInfo = buildUserInfo(result);
  persistSession(result.userId, userInfo);
  return { userId: result.userId, userInfo };
}
