import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Video, Button, Swiper, SwiperItem } from '@tarojs/components';
import Taro, { useRouter, useShareAppMessage, useUnload } from '@tarojs/taro';
import styles from './index.module.scss';
import { request } from '../../services/api';
import { useUserStore } from '../../store/user';
import { reportTracking, getVisitorId } from '../../services/tracking';
import { formatDuration, getFileUrls } from '../../utils/format';
import type { Material } from '../../types';

const MaterialDetailPage: React.FC = () => {
  console.log('[MaterialDetail] component rendering');
  const router = useRouter();
  const { isLoggedIn, setUserInfo, userInfo } = useUserStore();
  const [material, setMaterial] = useState<Material | null>(null);
  const [hasReportedPlay, setHasReportedPlay] = useState(false);
  const viewSessionIdRef = useRef(Date.now().toString());
  const enterTimeRef = useRef(Date.now());
  const materialRef = useRef<Material | null>(null);

  // 保持 ref 与 state 同步，确保 useUnload 中能拿到最新的 material
  useEffect(() => {
    materialRef.current = material;
  }, [material]);

  // 退出素材详情页时上报真实观看时长（从进入页面到退出的时间差）
  useUnload(() => {
    const mat = materialRef.current;
    if (!mat?.id) return;
    const duration = Math.floor((Date.now() - enterTimeRef.current) / 1000);
    if (duration <= 0) return;
    console.log('[MaterialDetail] 退出上报时长: duration=', duration, 's');
    reportTracking({
      trackingId: mat.trackingId || '',
      materialId: mat.id,
      actionType: 'play',
      duration: duration,
      visitorId: getVisitorId(),
      sessionId: viewSessionIdRef.current,
      nickname: userInfo?.nickname || '',
      avatar: userInfo?.avatar || '',
    });
  });

  const handleLogin = async () => {
    try {
      const { code } = await Taro.login();
      const result = await request<{ userId: string; openid: string; nickname?: string; avatar?: string; phone?: string }>('/wechat/login?code=' + code, { method: 'POST' });
      Taro.setStorageSync('userId', result.userId);
      setUserInfo({
        openid: result.openid,
        unionid: '',
        phone: result.phone || '',
        nickname: result.nickname || '微信用户',
        avatar: result.avatar || '',
        status: 1
      });
      Taro.showToast({ title: '登录成功', icon: 'success' });
    } catch (e) {
      console.error('[MaterialDetail] login failed:', e);
      Taro.showToast({ title: '登录失败', icon: 'none' });
    }
  };

  useEffect(() => {
    const userId = Taro.getStorageSync('userId');
    console.log('[MaterialDetail] isLoggedIn:', isLoggedIn, 'userId:', userId);
    if (isLoggedIn && userId) {
      const id = router.params.id;
      console.log('[MaterialDetail] loading material id:', id);
      if (id) {
        loadMaterial(id);
      }
    } else {
      setMaterial(null);
    }
  }, [isLoggedIn]);

  // 素材加载完成后上报观看埋点
  useEffect(() => {
    if (material && !hasReportedPlay) {
      setHasReportedPlay(true);
      console.log('[MaterialDetail] reporting play, trackingId=', material.trackingId, 'materialId=', material.id, 'sessionId=', viewSessionIdRef.current);
      reportTracking({
        trackingId: material.trackingId || '',
        materialId: material.id,
        actionType: 'play',
        visitorId: getVisitorId(),
        sessionId: viewSessionIdRef.current,
        nickname: userInfo?.nickname || '',
        avatar: userInfo?.avatar || '',
      });
    }
  }, [material, hasReportedPlay]);

  useShareAppMessage(() => {
    if (!material) return { title: 'AI销售助手', path: '/pages/home/index' };
    // 分享时上报转发事件
    reportTracking({
      trackingId: material.trackingId || '',
      materialId: material.id,
      actionType: 'forward',
      visitorId: getVisitorId(),
      sessionId: viewSessionIdRef.current,
      nickname: userInfo?.nickname || '',
      avatar: userInfo?.avatar || '',
    });
    return {
      title: material.content || material.title,
      path: `/pages/materialDetail/index?id=${material.id}`,
      imageUrl: material.coverUrl || ''
    };
  });

  const loadMaterial = async (id: string) => {
    try {
      const data = await request<Material>(`/material/${id}`);
      setMaterial(data);
    } catch (e) {
      console.error('[MaterialDetail] loadMaterial failed:', e);
    }
  };

  const handleOpenFile = () => {
    if (!material) return;
    Taro.navigateTo({
      url: `/pages/docViewer/index?materialId=${material.id}&trackingId=${material.trackingId || ''}&sessionId=${viewSessionIdRef.current}`
    });
  };

  // 图片素材：点击全屏预览
  const handlePreviewImage = () => {
    if (!material?.fileUrl) return;
    const urls = getFileUrls(material.fileUrl);
    Taro.previewImage({
      urls,
      current: urls[0]
    });
  };

  if (!isLoggedIn) {
    console.log('[MaterialDetail] rendering login view');
    return (
      <View className={styles.detailPage}>
        <View className={styles.infoCard} style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text style={{ display: 'block', marginBottom: '20px', color: '#86909c' }}>请先登录后查看素材详情</Text>
          <Button className={styles.btnShare} onClick={handleLogin}>微信登录</Button>
        </View>
      </View>
    );
  }

  if (!material) {
    return (
      <View className={styles.detailPage}>
        <View className={styles.infoCard}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  const fileTypeMap: Record<string, string> = {
    VIDEO: '视频', PDF: 'PDF', IMAGE: '图片', TABLE: '表格'
  };

  const imageUrls = material.fileType === 'IMAGE' ? getFileUrls(material.fileUrl) : [];

  return (
    <View className={styles.detailPage}>
      <View className={styles.coverWrap}>
        {material.fileType === 'VIDEO' ? (
          <Video
            className={styles.cover}
            src={material.fileUrl}
            controls
            autoplay={false}
            objectFit="cover"
            showCenterPlayBtn
          />
        ) : material.fileType === 'IMAGE' && imageUrls.length > 1 ? (
          <Swiper
            className={styles.coverSwiper}
            indicatorDots
            indicatorColor="rgba(255,255,255,0.4)"
            indicatorActiveColor="#fff"
            circular
          >
            {imageUrls.map((url, idx) => (
              <SwiperItem key={idx} className={styles.coverSwiperItem}>
                <Image
                  className={styles.cover}
                  src={url}
                  mode="aspectFill"
                  onClick={handlePreviewImage}
                />
              </SwiperItem>
            ))}
          </Swiper>
        ) : material.coverUrl ? (
          <Image
            className={styles.cover}
            src={material.coverUrl}
            mode="aspectFill"
            onClick={material.fileType === 'IMAGE' ? handlePreviewImage : undefined}
          />
        ) : (
          <View className={styles.coverPlaceholder} onClick={material.fileType === 'IMAGE' ? handlePreviewImage : handleOpenFile}>
            <Text className={styles.placeholderText}>
              {fileTypeMap[material.fileType] || material.fileType}
            </Text>
            <Text className={styles.openFileTip}>点击在线预览</Text>
          </View>
        )}
      </View>

      <View className={styles.infoCard}>
        <Text className={styles.title}>{material.content || fileTypeMap[material.fileType]}</Text>
        <View className={styles.metaRow}>
          <Text className={styles.metaItem}>类型: {fileTypeMap[material.fileType] || material.fileType}</Text>
          <Text className={styles.metaItem}>大小: {(material.fileSize / 1024 / 1024).toFixed(1)}MB</Text>
          {material.duration > 0 && (
            <Text className={styles.metaItem}>时长: {formatDuration(material.duration)}</Text>
          )}
          <Text className={styles.metaItem}>{material.createTime?.slice(0, 10)}</Text>
        </View>
      </View>

      {material.aiCopy && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>AI文案</Text>
          <Text className={styles.aiCopy}>{material.aiCopy}</Text>
        </View>
      )}

      <View className={styles.bottomBar}>
        <Button className={styles.btnShare} openType="share">发送给朋友</Button>
        <Text className={styles.btnPrimary} onClick={() => Taro.showToast({ title: '请点击右上角"..."分享到朋友圈', icon: 'none' })}>分享到朋友圈</Text>
      </View>
    </View>
  );
};

export default MaterialDetailPage;
