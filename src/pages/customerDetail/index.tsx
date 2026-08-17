import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { request } from '../../services/api';
import { useUserStore } from '../../store/user';
import { formatDuration } from '../../utils/format';
import type { CustomerViewHistoryVO } from '../../types';

const CustomerDetailPage: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn } = useUserStore();
  const [historyList, setHistoryList] = useState<CustomerViewHistoryVO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn) {
      const customerId = router.params.customerId;
      if (customerId) {
        loadHistory(customerId);
      }
    } else {
      setHistoryList([]);
      setLoading(false);
    }
  }, [isLoggedIn]);

  const loadHistory = async (customerId: string) => {
    setLoading(true);
    try {
      const data = await request<CustomerViewHistoryVO[]>('/analysis/customer/history', {
        data: { customerId }
      });
      setHistoryList(data || []);
    } catch (e) {
      console.error('[CustomerDetail] loadHistory failed:', e);
    } finally {
      setLoading(false);
    }
  };

  // 统计汇总
  const totalViews = historyList.length;
  const totalCompleted = historyList.filter(h => h.completed === 1).length;
  const totalDuration = historyList.reduce((sum, h) => sum + (h.duration || 0), 0);

  if (!isLoggedIn) {
    return (
      <View className={styles.detailPage}>
        <View className={styles.emptyTip}>
          <Text>请先登录</Text>
        </View>
      </View>
    );
  }

  if (loading) {
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
      {/* 统计概要 */}
      <View className={styles.summaryCard}>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue}>{totalViews}</Text>
          <Text className={styles.summaryLabel}>观看内容数</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue}>{totalCompleted}</Text>
          <Text className={styles.summaryLabel}>完播数</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue}>{formatDuration(totalDuration)}</Text>
          <Text className={styles.summaryLabel}>总时长</Text>
        </View>
      </View>

      {/* 观看记录列表 */}
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>观看记录</Text>
        {historyList.length > 0 ? (
          <View className={styles.historyList}>
            {historyList.map((item, index) => (
              <View key={item.materialId || index} className={styles.historyItem}>
                <View className={styles.historyHeader}>
                  <Text className={styles.historyTitle}>{item.content || item.title || '未知内容'}</Text>
                  <Text className={item.completed === 1 ? styles.completedTag : styles.incompleteTag}>
                    {item.completed === 1 ? '已完播' : '未完播'}
                  </Text>
                </View>
                <View className={styles.historyStats}>
                  <Text className={styles.historyStat}>进度 {item.progress || 0}%</Text>
                  <Text className={styles.historyStat}>时长 {formatDuration(item.duration || 0)}</Text>
                  <Text className={styles.historyStat}>类型 {item.fileType || '-'}</Text>
                </View>
                <View className={styles.historyTime}>
                  <Text className={styles.timeText}>{item.viewTime}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className={styles.emptyTip}>
            <Text>暂无观看记录</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CustomerDetailPage;