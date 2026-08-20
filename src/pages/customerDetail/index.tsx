import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { request } from '../../services/api';
import { useUserStore } from '../../store/user';
import type { CustomerViewHistoryVO } from '../../types';

const CustomerDetailPage: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn } = useUserStore();
  const [historyList, setHistoryList] = useState<CustomerViewHistoryVO[]>([]);
  const [loading, setLoading] = useState(true);

  const customerId = router.params.customerId || '';
  const nickname = router.params.nickname || '用户';
  const avatar = router.params.avatar || '';

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '分析' });
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      if (customerId) {
        loadHistory(customerId);
      }
    } else {
      setHistoryList([]);
      setLoading(false);
    }
  }, [isLoggedIn, customerId]);

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

  const totalViews = historyList.length;
  const totalCompleted = historyList.filter(h => h.completed === 1).length;
  const totalForward = 0;
  const totalDuration = historyList.reduce((sum, h) => sum + (h.duration || 0), 0);

  const handleCopyNickname = () => {
    Taro.setClipboardData({
      data: nickname,
      success: () => {
        Taro.showToast({ title: '已复制', icon: 'none' });
      }
    });
  };

  const formatViewTime = (timeStr: string): string => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr.replace(/-/g, '/'));
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    } catch {
      return timeStr;
    }
  };

  if (!isLoggedIn) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyTip}>
          <Text>请先登录</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyTip}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <ScrollView scrollY className={styles.scrollView}>
        {/* 用户信息卡 */}
        <View className={styles.userCard}>
          <View className={styles.userHeader}>
            <View className={styles.avatarWrap}>
              {avatar ? (
                <Image src={avatar} className={styles.avatar} mode="aspectFill" />
              ) : (
                <View className={styles.avatarPlaceholder}>
                  <Text className={styles.avatarPlaceholderText}>
                    {nickname ? nickname.charAt(0) : '用'}
                  </Text>
                </View>
              )}
            </View>
            <View className={styles.userInfo}>
              <Text className={styles.nickname}>{nickname}</Text>
              <View className={styles.intentTag}>
                <Text className={styles.intentTagText}>高意向</Text>
              </View>
            </View>
            <View className={styles.copyBtn} onClick={handleCopyNickname}>
              <Text className={styles.copyBtnText}>复制用户名</Text>
            </View>
          </View>

          <View className={styles.statsRow}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{totalViews}</Text>
              <Text className={styles.statLabel}>阅读数</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{totalCompleted}</Text>
              <Text className={styles.statLabel}>完播</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{totalForward}</Text>
              <Text className={styles.statLabel}>转发</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{totalDuration}s</Text>
              <Text className={styles.statLabel}>观看时长</Text>
            </View>
          </View>
        </View>

        {/* 阅读记录 */}
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>阅读记录</Text>
          {historyList.length > 0 ? (
            <View className={styles.recordList}>
              {historyList.map((item, index) => (
                <View key={item.materialId || index} className={styles.recordCard}>
                  <View className={styles.recordCover}>
                    <View className={styles.coverPlaceholder}>
                      <View className={styles.coverPlayIcon} />
                    </View>
                  </View>
                  <View className={styles.recordBody}>
                    <Text className={styles.recordTitle}>{item.title || item.content || '未知内容'}</Text>
                    <View className={styles.recordMeta}>
                      <Text className={styles.recordDate}>{formatViewTime(item.viewTime)}</Text>
                      <View className={styles.typeTag}>
                        <Text className={styles.typeTagText}>{item.fileType || '视频'}</Text>
                      </View>
                    </View>
                    <View className={styles.recordStats}>
                      <Text className={styles.recordStat}>进度 {item.progress || 0}%</Text>
                      <Text className={styles.recordStat}>观看时长 {item.duration || 0}s</Text>
                      <Text className={styles.recordStat}>完播 {item.completed || 0}</Text>
                      <Text className={styles.recordStat}>转发 0</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyTip}>
              <Text>暂无阅读记录</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default CustomerDetailPage;