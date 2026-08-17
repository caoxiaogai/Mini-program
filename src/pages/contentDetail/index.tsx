import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { request } from '../../services/api';
import { useUserStore } from '../../store/user';
import { formatDuration } from '../../utils/format';
import type { ContentDetailVO } from '../../types';

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
      {/* 统计卡片 */}
      <View className={styles.statsCard}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{detail.viewCount}</Text>
          <Text className={styles.statLabel}>浏览次数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{detail.viewerCount}</Text>
          <Text className={styles.statLabel}>浏览人数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{detail.completeCount}</Text>
          <Text className={styles.statLabel}>完播数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{detail.forwardCount}</Text>
          <Text className={styles.statLabel}>转发数</Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>受众列表</Text>
        {detail.audienceList && detail.audienceList.length > 0 ? (
          <View className={styles.audienceList}>
            {detail.audienceList.map(item => (
              <View
                key={item.customerId}
                className={styles.audienceItem}
                onClick={() => handleCustomerClick(item.customerId)}
              >
                <Image className={styles.avatar} src={item.avatar} mode="aspectFill" />
                <View className={styles.audienceInfo}>
                  <Text className={styles.audienceName}>{item.nickname}</Text>
                  <View className={styles.audienceStats}>
                    <Text className={styles.audienceStat}>观看 {item.viewCount}次</Text>
                    <Text className={styles.audienceStat}>时长 {formatDuration(item.duration)}</Text>
                  </View>
                </View>
                <View className={styles.audienceRight}>
                  <Text className={classnames(item.completed ? styles.completedTag : styles.incompleteTag)}>
                    {item.completed ? '已完播' : '未完播'}
                  </Text>
                  <Text className={styles.arrow}>›</Text>
                </View>
              </View>
            ))}
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