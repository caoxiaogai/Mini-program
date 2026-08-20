import React, { useState, useEffect } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { request } from '../../services/api';
import { useUserStore } from '../../store/user';
import type { ContentDetailVO, AudienceVO } from '../../types';

type IntentLevel = 'high' | 'medium' | 'low';

const getIntentLevel = (audience: AudienceVO): IntentLevel => {
  if (audience.completed === 1) return 'high';
  if (audience.viewCount >= 2) return 'medium';
  return 'low';
};

const getIntentLabel = (level: IntentLevel): string => {
  switch (level) {
    case 'high': return '高意向';
    case 'medium': return '中意向';
    case 'low': return '低意向';
  }
};

const formatNumber = (n: number): string => {
  if (n >= 10000) {
    const v = (n / 10000).toFixed(1);
    return v.replace(/\.0$/, '') + '万';
  }
  if (n >= 1000) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  return String(n);
};

const ContentDetailPage: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn } = useUserStore();
  const [detail, setDetail] = useState<ContentDetailVO | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      const materialId = router.params.materialId;
      if (materialId) {
        loadDetail(materialId);
      }
    } else {
      setDetail(null);
    }
  }, [isLoggedIn]);

  const loadDetail = async (materialId: string) => {
    try {
      const data = await request<ContentDetailVO>('/analysis/content/detail', {
        data: { materialId }
      });
      setDetail(data);
    } catch (e) {
      console.error('[ContentDetail] loadDetail failed:', e);
    }
  };

  const handleCustomerClick = (customerId: number) => {
    Taro.navigateTo({ url: `/pages/customerDetail/index?customerId=${customerId}` });
  };

  if (!isLoggedIn) {
    return (
      <View className={styles.detailPage}>
        <View className={styles.emptyTip}>
          <Text>请先登录</Text>
        </View>
      </View>
    );
  }

  if (!detail) {
    return (
      <View className={styles.detailPage}>
        <View className={styles.emptyTip}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.detailPage}>
      {/* 作品头部信息卡 */}
      <View className={styles.headerCard}>
        <Image
          className={styles.cover}
          src={detail.content}
          mode="aspectFill"
        />
        <View className={styles.headerInfo}>
          <View className={styles.headerTop}>
            <Text className={styles.title}>{detail.title}</Text>
          </View>
          <View className={styles.metricsRow}>
            <View className={styles.metricItem}>
              <Text className={styles.metricValue}>{formatNumber(detail.forwardCount)}</Text>
              <Text className={styles.metricLabel}>转发</Text>
            </View>
            <View className={styles.metricItem}>
              <Text className={styles.metricValue}>{formatNumber(detail.completeCount)}</Text>
              <Text className={styles.metricLabel}>完播</Text>
            </View>
            <View className={styles.metricItem}>
              <Text className={styles.metricValue}>{formatNumber(detail.viewCount)}</Text>
              <Text className={styles.metricLabel}>浏览</Text>
            </View>
            <View className={styles.metricItem}>
              <Text className={styles.metricValue}>{formatNumber(detail.viewerCount)}</Text>
              <Text className={styles.metricLabel}>观看人数</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 受众用户列表 */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>受众列表</Text>
        {detail.audienceList && detail.audienceList.length > 0 ? (
          <View className={styles.audienceCard}>
            {detail.audienceList.map(item => {
              const intentLevel = getIntentLevel(item);
              const intentLabel = getIntentLabel(intentLevel);
              const intentClass =
                intentLevel === 'high'
                  ? styles.intentHigh
                  : intentLevel === 'medium'
                    ? styles.intentMedium
                    : styles.intentLow;

              return (
                <View
                  key={item.customerId}
                  className={styles.audienceItem}
                  onClick={() => handleCustomerClick(item.customerId)}
                >
                  <Image
                    className={styles.avatar}
                    src={item.avatar}
                    mode="aspectFill"
                  />
                  <View className={styles.audienceInfo}>
                    <Text className={styles.nickname}>{item.nickname}</Text>
                    <View className={`${styles.intentTag} ${intentClass}`}>
                      <Text>{intentLabel}</Text>
                    </View>
                  </View>
                  <View className={styles.audienceStats}>
                    <View className={styles.statCol}>
                      <Text className={styles.statNum}>{item.viewCount}</Text>
                      <Text className={styles.statLabel}>阅读</Text>
                    </View>
                    <View className={styles.statCol}>
                      <Text className={styles.statNum}>{item.completed}</Text>
                      <Text className={styles.statLabel}>完播</Text>
                    </View>
                    <View className={styles.statCol}>
                      <Text className={styles.statNum}>0</Text>
                      <Text className={styles.statLabel}>转发</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className={styles.emptyTip}>
            <Text>暂无受众数据</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ContentDetailPage;