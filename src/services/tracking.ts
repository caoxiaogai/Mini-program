import Taro from '@tarojs/taro';
import { request } from './api';

/**
 * 埋点上报工具
 * 上报观看行为到后端 /tracking/event 接口
 */

export interface TrackingEvent {
  trackingId: string;
  materialId?: number;
  actionType: 'play' | 'pause' | 'seek' | 'end' | 'forward';
  duration?: number;
  progress?: number;
  visitorId?: string;
  sessionId?: string;
  nickname?: string;
  avatar?: string;
}

/**
 * 上报埋点事件
 */
export async function reportTracking(event: TrackingEvent): Promise<void> {
  console.log('[Tracking] sending:', event.trackingId || event.materialId, event.actionType);
  try {
    const res = await request('/tracking/event', {
      method: 'POST',
      data: {
        trackingId: event.trackingId || '',
        materialId: event.materialId || null,
        actionType: event.actionType,
        duration: event.duration || 0,
        progress: event.progress || 0,
        visitorId: event.visitorId || '',
        sessionId: event.sessionId || '',
        nickname: event.nickname || '',
        avatar: event.avatar || '',
      },
    });
    console.log('[Tracking] success:', res);
  } catch (e) {
    console.error('[Tracking] report failed:', e);
  }
}

/**
 * 生成访客标识（使用微信用户的 openid 或设备标识）
 */
export function getVisitorId(): string {
  const userId = Taro.getStorageSync('userId');
  if (userId) return `wx_${userId}`;
  return `guest_${Date.now()}`;
}