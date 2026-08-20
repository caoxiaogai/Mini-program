import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { request } from '../../services/api';
import { useUserStore } from '../../store/user';
import type { DashboardVO, ContentListVO, CustomerListVO } from '../../types';

type SubTabType = 'content' | 'user' | 'total';

const TIME_RANGES = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '总', value: 'all' },
];

const INTENT_TABS = [
  { label: '全部', value: 'all' },
  { label: '高意向', value: 'high' },
  { label: '中意向', value: 'medium' },
  { label: '低意向', value: 'low' },
];

// 柱状图模拟数据
const CHART_WEEK_DATA = [
  { label: '一', value: 650 },
  { label: '二', value: 650 },
  { label: '三', value: 1300 },
  { label: '四', value: 750 },
  { label: '五', value: 450 },
  { label: '六', value: 850 },
  { label: '日', value: 700 },
];

const AnalysisPage: React.FC = () => {
  const { isLoggedIn } = useUserStore();
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('content');
  const [timeRange, setTimeRange] = useState('week');
  const [intentLevel, setIntentLevel] = useState('all');
  const [chartMode, setChartMode] = useState<'week' | 'month'>('week');

  // 数据
  const [dashboard, setDashboard] = useState<DashboardVO | null>(null);
  const [contentList, setContentList] = useState<ContentListVO[]>([]);
  const [customerList, setCustomerList] = useState<CustomerListVO[]>([]);

  useEffect(() => {
    if (isLoggedIn) {
      loadDashboard();
    } else {
      setDashboard(null);
      setContentList([]);
      setCustomerList([]);
    }
  }, [isLoggedIn, timeRange]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (activeSubTab === 'content') loadContentList();
    else if (activeSubTab === 'user') loadCustomerList();
    else if (activeSubTab === 'total') loadDashboard();
  }, [activeSubTab, intentLevel, timeRange]);

  const buildQuery = () => {
    const params: any = { timeRange };
    if (activeSubTab === 'user' && intentLevel !== 'all') {
      params.intentLevel = intentLevel;
    }
    return params;
  };

  const loadDashboard = async () => {
    try {
      const data = await request<DashboardVO>('/analysis/dashboard', { data: { timeRange } });
      setDashboard(data);
    } catch (e) {
      console.error('[Analysis] loadDashboard failed:', e);
    }
  };

  const loadContentList = async () => {
    try {
      const data = await request<ContentListVO[]>('/analysis/content/list', { data: buildQuery() });
      setContentList(data || []);
    } catch (e) {
      console.error('[Analysis] loadContentList failed:', e);
    }
  };

  const loadCustomerList = async () => {
    try {
      const data = await request<CustomerListVO[]>('/analysis/customer/list', { data: buildQuery() });
      setCustomerList(data || []);
    } catch (e) {
      console.error('[Analysis] loadCustomerList failed:', e);
    }
  };

  const handleContentClick = (item: ContentListVO) => {
    Taro.navigateTo({ url: `/pages/contentDetail/index?materialId=${item.materialId}` });
  };

  const handleCustomerClick = (customerId: number) => {
    Taro.navigateTo({ url: `/pages/customerDetail/index?customerId=${customerId}` });
  };

  const handleTimeRangeChange = (e: any) => {
    setTimeRange(TIME_RANGES[e.detail.value].value);
  };

  // 意向标签样式
  const getIntentStyle = (level: string) => {
    switch (level) {
      case 'high': return { bg: '#E8FAFC', color: '#0EC8D9', text: '高意向' };
      case 'medium': return { bg: '#FFF3E0', color: '#FF8C00', text: '中意向' };
      default: return { bg: '#F5F5F5', color: '#999999', text: '低意向' };
    }
  };

  // 格式化数字
  const formatNum = (n: number | undefined): string => {
    if (n == null) return '0';
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    return n.toLocaleString();
  };

  if (!isLoggedIn) {
    return (
      <View className={styles.analysisPage}>
        <View className={styles.emptyTip}><Text>请先登录</Text></View>
      </View>
    );
  }

  return (
    <View className={styles.analysisPage}>
      {/* 子Tab切换 */}
      <View className={styles.subTabs}>
        {([
          { key: 'content', label: '内容分析' },
          { key: 'user', label: '用户分析' },
          { key: 'total', label: '总数据' },
        ] as const).map(tab => (
          <Text
            key={tab.key}
            className={classnames(styles.subTab, activeSubTab === tab.key && styles.subTabActive)}
            onClick={() => setActiveSubTab(tab.key)}
          >
            {tab.label}
          </Text>
        ))}
      </View>

      {/* 筛选栏 */}
      {activeSubTab === 'content' && (
        <View className={styles.filterBar}>
          <Picker mode='selector' range={TIME_RANGES} rangeKey='label' onChange={handleTimeRangeChange}>
            <View className={styles.filterItem}>
              <Text>{TIME_RANGES.find(t => t.value === timeRange)?.label || '周'}</Text>
              <View className={styles.filterArrow} />
            </View>
          </Picker>
          <View className={styles.filterItem}>
            <Text>完播数</Text>
            <View className={styles.filterArrow} />
          </View>
        </View>
      )}

      {/* ===== 内容分析 Tab ===== */}
      {activeSubTab === 'content' && (
        <ScrollView scrollY className={styles.scrollContent}>
          {/* 概览数据 */}
          <View className={styles.overviewRow}>
            <View className={styles.overviewItem}>
              <Text className={styles.overviewLabel}>总发布</Text>
              <Text className={styles.overviewValue}>{dashboard?.totalPublishCount || 0}</Text>
            </View>
            <View className={styles.overviewItem}>
              <Text className={styles.overviewLabel}>总阅读次数</Text>
              <Text className={styles.overviewValue}>{formatNum(dashboard?.totalViewCount)}</Text>
            </View>
            <View className={styles.overviewItem}>
              <Text className={styles.overviewLabel}>总转发</Text>
              <Text className={styles.overviewValue}>{formatNum(dashboard?.totalForwardCount)}</Text>
            </View>
          </View>

          {/* 内容列表 */}
          {contentList.length > 0 ? contentList.map(item => (
            <View key={item.materialId} className={styles.contentCard} onClick={() => handleContentClick(item)}>
              <Image className={styles.contentCover} src={item.coverUrl} mode="aspectFill" />
              <View className={styles.contentInfo}>
                <Text className={styles.contentTitle}>{item.content || item.title}</Text>
                <Text className={styles.contentDate}>{item.createTime?.substring(0, 10)}</Text>
                <View className={styles.contentStats}>
                  <Text className={styles.contentStat}>转发 {item.forwardCount}</Text>
                  <Text className={styles.contentStat}>播完 {item.completeCount}</Text>
                  <Text className={styles.contentStat}>浏览 {item.viewCount}</Text>
                  <Text className={styles.contentStat}>观看人数 {item.viewerCount}</Text>
                </View>
              </View>
              <View className={styles.contentArrow}>
                <View className={styles.arrowIcon} />
              </View>
            </View>
          )) : (
            <View className={styles.emptyTip}><Text>暂无数据</Text></View>
          )}
        </ScrollView>
      )}

      {/* ===== 用户分析 Tab ===== */}
      {activeSubTab === 'user' && (
        <ScrollView scrollY className={styles.scrollContent}>
          {/* 意向筛选 */}
          <View className={styles.intentFilter}>
            {INTENT_TABS.map(item => (
              <Text
                key={item.value}
                className={classnames(styles.intentBtn, intentLevel === item.value && styles.intentBtnActive)}
                onClick={() => setIntentLevel(item.value)}
              >
                {item.label}
              </Text>
            ))}
          </View>

          {/* 概览数据 */}
          <View className={styles.overviewRow}>
            <View className={styles.overviewItem}>
              <Text className={styles.overviewLabel}>总用户</Text>
              <Text className={styles.overviewValue}>{formatNum(dashboard?.totalViewerCount)}</Text>
            </View>
            <View className={styles.overviewItem}>
              <Text className={styles.overviewLabel}>完播人数</Text>
              <Text className={styles.overviewValue}>{dashboard?.totalCompleteCount || 0}</Text>
            </View>
            <View className={styles.overviewItem}>
              <Text className={styles.overviewLabel}>转发人数</Text>
              <Text className={styles.overviewValue}>{formatNum(dashboard?.totalForwardCount)}</Text>
            </View>
          </View>

          {/* 用户列表 */}
          {customerList.length > 0 ? customerList.map(item => {
            const intentStyle = getIntentStyle(
              (item as any).intentLevel || (item.completeCount > 0 ? 'high' : item.viewCount >= 2 ? 'medium' : 'low')
            );
            return (
              <View key={item.customerId} className={styles.userCard} onClick={() => handleCustomerClick(item.customerId)}>
                <View className={styles.userLeft}>
                  <View className={styles.userAvatarWrap}>
                    {item.avatar ? (
                      <Image className={styles.userAvatar} src={item.avatar} mode="aspectFill" />
                    ) : (
                      <View className={styles.userAvatarPlaceholder}>
                        <Text>{(item.nickname || '?')[0]}</Text>
                      </View>
                    )}
                    <View className={styles.userDot} />
                  </View>
                  <View className={styles.userInfo}>
                    <View className={styles.userNameRow}>
                      <Text className={styles.userName}>{item.nickname}</Text>
                      <Text className={styles.userIntentTag} style={{ backgroundColor: intentStyle.bg, color: intentStyle.color }}>
                        #{intentStyle.text}
                      </Text>
                    </View>
                    <View className={styles.userStats}>
                      <Text className={styles.userStat}>阅读 {item.viewCount}</Text>
                      <Text className={styles.userStat}>观看作品 {item.completeCount}</Text>
                      <Text className={styles.userStat}>转发 {item.completeCount}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }) : (
            <View className={styles.emptyTip}><Text>暂无数据</Text></View>
          )}
        </ScrollView>
      )}

      {/* ===== 总数据 Tab ===== */}
      {activeSubTab === 'total' && (
        <ScrollView scrollY className={styles.scrollContent}>
          {/* 作品数据总览 - 9宫格 */}
          <View className={styles.totalSection}>
            <Text className={styles.totalSectionTitle}>作品数据总览</Text>
            <View className={styles.totalGrid}>
              <View className={styles.totalGridItem}>
                <Text className={styles.totalGridLabel}>总发布</Text>
                <Text className={styles.totalGridValue}>{dashboard?.totalPublishCount || 0}</Text>
              </View>
              <View className={styles.totalGridItem}>
                <Text className={styles.totalGridLabel}>总阅读次数</Text>
                <Text className={styles.totalGridValue}>{formatNum(dashboard?.totalViewCount)}</Text>
              </View>
              <View className={styles.totalGridItem}>
                <Text className={styles.totalGridLabel}>总转发</Text>
                <Text className={styles.totalGridValue}>{formatNum(dashboard?.totalForwardCount)}</Text>
              </View>
              <View className={styles.totalGridItem}>
                <Text className={styles.totalGridLabel}>总阅读人数</Text>
                <Text className={styles.totalGridValue}>{formatNum(dashboard?.totalViewerCount)}</Text>
              </View>
              <View className={styles.totalGridItem}>
                <Text className={styles.totalGridLabel}>总完播</Text>
                <Text className={styles.totalGridValue}>{dashboard?.totalCompleteCount || 0}</Text>
              </View>
              <View className={styles.totalGridItem}>
                <Text className={styles.totalGridLabel}>总完播率</Text>
                <Text className={styles.totalGridValue}>{dashboard?.completeRate || 0}%</Text>
              </View>
              <View className={styles.totalGridItem}>
                <Text className={styles.totalGridLabel}>高意向</Text>
                <Text className={styles.totalGridValue}>{dashboard?.highIntentCount || 0}</Text>
              </View>
              <View className={styles.totalGridItem}>
                <Text className={styles.totalGridLabel}>中意向</Text>
                <Text className={styles.totalGridValue}>{dashboard?.mediumIntentCount || 0}</Text>
              </View>
              <View className={styles.totalGridItem}>
                <Text className={styles.totalGridLabel}>低意向</Text>
                <Text className={styles.totalGridValue}>{dashboard?.lowIntentCount || 0}</Text>
              </View>
            </View>
          </View>

          {/* 阅读数据 - 柱状图 */}
          <View className={styles.totalSection}>
            <View className={styles.totalSectionHeader}>
              <Text className={styles.totalSectionTitle}>阅读数据</Text>
              <View className={styles.chartSwitch}>
                <Text
                  className={classnames(styles.chartSwitchBtn, chartMode === 'week' && styles.chartSwitchBtnActive)}
                  onClick={() => setChartMode('week')}
                >
                  本周
                </Text>
                <Text
                  className={classnames(styles.chartSwitchBtn, chartMode === 'month' && styles.chartSwitchBtnActive)}
                  onClick={() => setChartMode('month')}
                >
                  本月
                </Text>
              </View>
            </View>
            <View className={styles.barChart}>
              {/* Y轴刻度 */}
              <View className={styles.barYAxis}>
                <Text>1500</Text>
                <Text>1000</Text>
                <Text>500</Text>
                <Text>0</Text>
              </View>
              {/* 柱状图 */}
              <View className={styles.barArea}>
                {CHART_WEEK_DATA.map((item, idx) => (
                  <View key={idx} className={styles.barCol}>
                    <View
                      className={styles.bar}
                      style={{ height: `${(item.value / 1500) * 100}%` }}
                    />
                    <Text className={styles.barLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default AnalysisPage;