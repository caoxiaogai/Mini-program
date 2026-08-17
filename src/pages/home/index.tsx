import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import StatCard from '../../components/StatCard';
import MaterialCard from '../../components/MaterialCard';
import { request } from '../../services/api';
import { useUserStore } from '../../store/user';
import type { DashboardVO, Material } from '../../types';

const HomePage: React.FC = () => {
  const { isLoggedIn } = useUserStore();
  const [dashboard, setDashboard] = useState<DashboardVO | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    if (isLoggedIn) {
      loadDashboard();
      loadMaterials();
    } else {
      setDashboard(null);
      setMaterials([]);
    }
  }, [isLoggedIn]);

  const loadDashboard = async () => {
    try {
      const data = await request<DashboardVO>('/analysis/dashboard');
      setDashboard(data);
    } catch (e) {
      console.error('[Home] loadDashboard failed:', e);
    }
  };

  const loadMaterials = async () => {
    try {
      const data = await request<Material[]>('/material/mine');
      setMaterials(data || []);
    } catch (e) {
      console.error('[Home] loadMaterials failed:', e);
    }
  };

  const handleAction = (path: string) => {
    Taro.navigateTo({ url: path });
  };

  const handleMaterialClick = (material: Material) => {
    Taro.navigateTo({ url: `/pages/materialDetail/index?id=${material.id}` });
  };

  return (
    <View className={styles.homePage}>
      <View className={styles.header}>
        <Text className={styles.greeting}>你好，销售精英</Text>
        <Text className={styles.subGreeting}>AI赋能，让销售更高效</Text>
      </View>

      <View className={styles.statsGrid}>
        <View className={styles.statsCard}>
          <Text className={styles.statsValue}>{dashboard?.totalPublishCount || 0}</Text>
          <Text className={styles.statsLabel}>已发布</Text>
        </View>
        <View className={styles.statsCard}>
          <Text className={styles.statsValue}>{dashboard?.totalViewCount || 0}</Text>
          <Text className={styles.statsLabel}>总浏览</Text>
        </View>
        <View className={styles.statsCard}>
          <Text className={styles.statsValue}>{dashboard?.totalForwardCount || 0}</Text>
          <Text className={styles.statsLabel}>转发数</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>快捷操作</Text>
        </View>
        <View className={styles.quickActions}>
          <View className={styles.actionCard} onClick={() => handleAction('/pages/aiGenerate/index')}>
            <View className={`${styles.actionIcon} ${styles.actionIconBlue}`}>
              <Text>AI</Text>
            </View>
            <Text className={styles.actionText}>AI文案</Text>
          </View>
          <View className={styles.actionCard} onClick={() => Taro.switchTab({ url: '/pages/material/index' })}>
            <View className={`${styles.actionIcon} ${styles.actionIconGreen}`}>
              <Text>+</Text>
            </View>
            <Text className={styles.actionText}>上传素材</Text>
          </View>
          <View className={styles.actionCard} onClick={() => Taro.switchTab({ url: '/pages/analysis/index' })}>
            <View className={`${styles.actionIcon} ${styles.actionIconOrange}`}>
              <Text>📊</Text>
            </View>
            <Text className={styles.actionText}>数据分析</Text>
          </View>
          <View className={styles.actionCard} onClick={() => Taro.switchTab({ url: '/pages/mine/index' })}>
            <View className={`${styles.actionIcon} ${styles.actionIconPurple}`}>
              <Text>👤</Text>
            </View>
            <Text className={styles.actionText}>个人中心</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>最近素材</Text>
          <Text className={styles.sectionMore} onClick={() => Taro.switchTab({ url: '/pages/material/index' })}>查看全部</Text>
        </View>
        {!isLoggedIn ? (
          <View className={styles.emptyTip}>
            <Text>请先登录</Text>
          </View>
        ) : materials.length > 0 ? (
          <View className={styles.materialList}>
            {materials.slice(0, 3).map((item) => (
              <MaterialCard key={item.id} material={item} onClick={handleMaterialClick} />
            ))}
          </View>
        ) : (
          <View className={styles.emptyTip}>
            <Text>暂无素材，快去上传吧</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default HomePage;
