import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';

type IntentLevel = 'all' | 'high' | 'medium' | 'low';

interface NotificationItem {
  id: string;
  avatar: string;
  nickname: string;
  intentLevel: Exclude<IntentLevel, 'all'>;
  action: string;
  date: string;
  thumbnail: string;
  hint: string;
}

const MOCK_DATA: NotificationItem[] = [
  {
    id: '1',
    avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
    nickname: 'xiaogai',
    intentLevel: 'high',
    action: '阅读',
    date: '08月17日',
    thumbnail: 'https://img.yzcdn.cn/vant/apple-1.jpg',
    hint: '意向程度较高，建议优先联系',
  },
  {
    id: '2',
    avatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
    nickname: '王小二',
    intentLevel: 'medium',
    action: '转发',
    date: '08月17日',
    thumbnail: 'https://img.yzcdn.cn/vant/apple-2.jpg',
    hint: '意向程度中等，可适当跟进',
  },
];

const INTENT_LABEL: Record<string, string> = {
  high: '高意向',
  medium: '中意向',
  low: '低意向',
};

const NotificationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IntentLevel>('all');

  const tabs: { key: IntentLevel; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'high', label: '高意向' },
    { key: 'medium', label: '中意向' },
    { key: 'low', label: '低意向' },
  ];

  const filteredData =
    activeTab === 'all'
      ? MOCK_DATA
      : MOCK_DATA.filter((item) => item.intentLevel === activeTab);

  return (
    <View className={styles.page}>
      {/* 分类筛选栏 */}
      <View className={styles.filterBar}>
        <ScrollView scrollX className={styles.filterScroll}>
          <View className={styles.filterGroup}>
            {tabs.map((tab) => (
              <View
                key={tab.key}
                className={`${styles.filterTab} ${activeTab === tab.key ? styles.filterTabActive : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Text className={activeTab === tab.key ? styles.filterTextActive : styles.filterText}>
                  {tab.label}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 日期分组 */}
      <View className={styles.dateGroup}>
        <Text className={styles.dateLabel}>08月17日</Text>
      </View>

      {/* 通知卡片列表 */}
      <View className={styles.cardList}>
        {filteredData.map((item) => (
          <View key={item.id} className={styles.card}>
            {/* 卡片主体 */}
            <View className={styles.cardBody}>
              {/* 左侧头像 */}
              <Image className={styles.avatar} src={item.avatar} mode="aspectFill" />

              {/* 中间内容 */}
              <View className={styles.cardContent}>
                <View className={styles.cardHeader}>
                  <Text className={styles.nickname}>{item.nickname}</Text>
                  <View className={`${styles.intentTag} ${styles[`intentTag_${item.intentLevel}`]}`}>
                    <Text className={styles.intentTagText}>{INTENT_LABEL[item.intentLevel]}</Text>
                  </View>
                </View>
                <View className={styles.actionRow}>
                  <Text className={styles.actionText}>
                    「{item.action}」了你的作品
                  </Text>
                  <Text className={styles.actionDate}>{item.date}</Text>
                </View>
              </View>

              {/* 右侧缩略图 */}
              <Image className={styles.thumbnail} src={item.thumbnail} mode="aspectFill" />
            </View>

            {/* 卡片底部 */}
            <View className={styles.cardFooter}>
              <Text className={styles.hintText}>{item.hint}</Text>
              <View className={styles.contactBtn}>
                <Text className={styles.contactBtnText}>联系用户</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default NotificationPage;