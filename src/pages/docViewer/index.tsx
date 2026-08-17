import React, { useCallback } from 'react';
import { WebView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { BASE_URL } from '../../services/api';
import { useUserStore } from '../../store/user';

const DocViewerPage: React.FC = () => {
  const router = useRouter();
  const { userInfo } = useUserStore();
  const { materialId, trackingId, sessionId } = router.params;
  const apiBase = BASE_URL.replace('/api', '');
  const userId = Taro.getStorageSync('userId') || 0;
  const nickname = encodeURIComponent(userInfo?.nickname || '');
  const avatar = encodeURIComponent(userInfo?.avatar || '');
  const src = `${apiBase}/api/doc-viewer?materialId=${materialId}&userId=${userId}&trackingId=${trackingId || ''}&sessionId=${sessionId || ''}&nickname=${nickname}&avatar=${avatar}&_t=${Date.now()}`;

  const handleError = (e: any) => {
    console.error('[DocViewer] load error:', e.detail);
    Taro.showToast({ title: '页面加载失败', icon: 'none' });
  };

  // WebView 退出时，微信原生层触发 onMessage，取最后一条 postMessage 的 maxProgress 上报
  const handleMessage = useCallback((e: any) => {
    const dataList = e.detail.data;
    if (!dataList || dataList.length === 0) return;
    const lastMsg = dataList[dataList.length - 1];
    const maxProgress = lastMsg.maxProgress || 0;
    if (maxProgress <= 0) return;

    const payload = {
      trackingId: lastMsg.trackingId || '',
      materialId: lastMsg.materialId,
      actionType: 'play',
      progress: maxProgress,
      duration: 0,
      visitorId: lastMsg.visitorId || '',
      sessionId: lastMsg.sessionId || '',
      nickname: lastMsg.nickname || '',
      avatar: lastMsg.avatar || ''
    };

    console.log('[DocViewer] 上报进度 maxProgress=', maxProgress, 'sessionId=', lastMsg.sessionId);

    Taro.request({
      url: `${BASE_URL}/api/tracking/event`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-User-Id': String(userId)
      },
      data: payload
    }).catch(err => {
      console.error('[DocViewer] 上报进度失败:', err);
    });

    // 如果已看完，也上报 end 事件
    if (lastMsg.hasEnded) {
      Taro.request({
        url: `${BASE_URL}/api/tracking/event`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'X-User-Id': String(userId)
        },
        data: { ...payload, actionType: 'end', progress: 100 }
      }).catch(err => {
        console.error('[DocViewer] 上报end事件失败:', err);
      });
    }
  }, [userId]);

  return (
    <WebView
      src={src}
      onError={handleError}
      onMessage={handleMessage}
    />
  );
};

export default DocViewerPage;