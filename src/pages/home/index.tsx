import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import './page.scss';
import styles from './index.module.scss';
import { request } from '../../services/api';
import { useUserStore } from '../../store/user';
import LoginModal from '../../components/LoginModal';
import BottomNav from '../../components/BottomNav';
import { useHideNativeTabBar } from '../../hooks/useHideNativeTabBar';
import { goAnalysis } from '../../utils/nav';
import type { DashboardVO } from '../../types';

const FALLBACK_AVATARS = [
  require('../../assets/home/avatar-1.png'),
  require('../../assets/home/avatar-2.png'),
  require('../../assets/home/avatar-3.png'),
  require('../../assets/home/avatar-4.png'),
  require('../../assets/home/avatar-5.png'),
];

const HomePage: React.FC = () => {
  const { isLoggedIn } = useUserStore();
  const [dashboard, setDashboard] = useState<DashboardVO | null>(null);

  useHideNativeTabBar();

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    } else {
      setDashboard(null);
    }
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      const dashboardData = await request<DashboardVO>('/analysis/dashboard', { data: { timeRange: 'today' } });
      setDashboard(dashboardData);
    } catch (e) {
      console.error('[Home] loadData failed:', e);
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '上午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }, []);

  const newUserCount = dashboard?.newCustomerCount ?? 0;
  const highIntentNewCount = dashboard?.highIntentNewCount ?? 0;
  const viewCount = dashboard?.totalViewCount ?? 0;
  const forwardCount = dashboard?.totalForwardCount ?? 0;
  const topForwardTitle = dashboard?.topForwardMaterialTitle;
  const topForwardCount = dashboard?.topForwardMaterialCount ?? 0;

  const avatarUrls = useMemo(() => {
    const fromApi = (dashboard?.recentCustomers ?? [])
      .map((item) => item.avatar)
      .filter(Boolean);
    if (fromApi.length > 0) return fromApi.slice(0, 5);
    return FALLBACK_AVATARS;
  }, [dashboard?.recentCustomers]);

  const forwardSubtitle = topForwardTitle && topForwardCount > 0
    ? `“${topForwardTitle.length > 8 ? `${topForwardTitle.slice(0, 8)}...` : topForwardTitle}”被转发了 ${topForwardCount} 次`
    : '了解更多';

  return (
    <View className={styles.homePage}>
      <LoginModal />
      <View className={styles.contentArea}>
        <View className={styles.hero}>
          <View className={styles.avatarWrap}>
            <Image
              className={styles.avatar}
              src={require('../../assets/robot-avatar.png')}
              mode="aspectFit"
            />
          </View>
          <Text className={styles.greetingText}>{greeting}，有什么可以帮助你的吗</Text>
        </View>

        <View className={styles.cards}>
          <View className={`${styles.card} ${styles.cardWide}`} onClick={goAnalysis}>
            <View className={styles.cardText}>
              <View className={styles.cardTitleRow}>
                <Text className={styles.cardTitle}>今日有 </Text>
                <Text className={styles.cardNumber}>{newUserCount}</Text>
                <Text className={styles.cardTitle}> 个新增用户</Text>
              </View>
              <Text className={styles.cardAction}>
                其中有 {highIntentNewCount} 位高意向用户
              </Text>
            </View>
            {avatarUrls.length > 0 ? (
              <View className={styles.avatarStack}>
                {avatarUrls.map((src, index) => (
                  <Image
                    key={index}
                    className={styles.stackAvatar}
                    src={src}
                    mode="aspectFill"
                    style={{ zIndex: avatarUrls.length - index }}
                  />
                ))}
              </View>
            ) : null}
          </View>

          <View className={`${styles.card} ${styles.cardRead}`} onClick={goAnalysis}>
            <View className={styles.cardText}>
              <View className={styles.cardTitleRow}>
                <Text className={styles.cardTitle}>今日累计阅读数 </Text>
                <Text className={styles.cardNumber}>{viewCount}</Text>
                <Text className={styles.cardTitle}> 次</Text>
              </View>
              <Text className={styles.cardAction}>查看详细</Text>
            </View>
          </View>

          <View className={`${styles.card} ${styles.cardForward}`} onClick={goAnalysis}>
            <View className={styles.cardText}>
              <View className={styles.cardTitleRow}>
                <Text className={styles.cardTitle}>今日累计转发次数 </Text>
                <Text className={styles.cardNumber}>{forwardCount}</Text>
                <Text className={styles.cardTitle}> 次</Text>
              </View>
              <Text className={styles.cardAction}>{forwardSubtitle}</Text>
            </View>
          </View>
        </View>
      </View>

      <BottomNav />
    </View>
  );
};

export default HomePage;
