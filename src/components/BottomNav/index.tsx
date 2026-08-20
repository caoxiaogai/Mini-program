import React, { useEffect, useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import styles from './index.module.scss';
import { request } from '../../services/api';
import { useUserStore } from '../../store/user';
import { goAnalysis, goMaterial, goNotification, goRanking } from '../../utils/nav';

export type BottomNavKey = 'notification' | 'analysis' | 'material' | 'ranking';

interface NavItem {
  key: BottomNavKey;
  label: string;
  icon: string;
  go: () => void;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'notification',
    label: '通知',
    icon: require('../../assets/home/nav-notification.png'),
    go: goNotification,
  },
  {
    key: 'analysis',
    label: '分析',
    icon: require('../../assets/home/nav-analysis.png'),
    go: goAnalysis,
  },
  {
    key: 'material',
    label: '素材',
    icon: require('../../assets/home/nav-material.png'),
    go: goMaterial,
  },
  {
    key: 'ranking',
    label: '排名',
    icon: require('../../assets/home/nav-ranking.png'),
    go: goRanking,
  },
];

interface BottomNavProps {
  activeKey?: BottomNavKey | null;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeKey = null }) => {
  const { isLoggedIn } = useUserStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }

    request<{ count: number }>('/notification/unread-count', { data: { timeRange: 'today' } })
      .then((data) => setUnreadCount(data?.count ?? 0))
      .catch(() => setUnreadCount(0));
  }, [isLoggedIn]);

  const handleNavClick = (item: NavItem) => {
    if (item.key === activeKey) return;
    item.go();
  };

  return (
    <View className={styles.bottomNav}>
      {NAV_ITEMS.map((item) => (
        <View
          key={item.key}
          className={styles.navItem}
          onClick={() => handleNavClick(item)}
        >
          <View className={styles.navIconWrap}>
            {item.key === 'notification' && unreadCount > 0 ? (
              <View className={styles.navBadge}>
                <Text className={styles.navBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            ) : null}
            <Image className={styles.navIcon} src={item.icon} mode="aspectFit" />
          </View>
          <Text
            className={`${styles.navLabel} ${activeKey === item.key ? styles.navLabelActive : ''}`}
          >
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default BottomNav;
