import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { request } from '../../services/api';
import { useUserStore } from '../../store/user';
import type { DashboardVO, ContentListVO, CustomerListVO, IntentCustomerVO } from '../../types';

type TabType = 'content' | 'customer' | 'dashboard' | 'intent';

const TIME_RANGES = [
  { label: '当日', value: 'today' },
  { label: '当周', value: 'week' },
  { label: '当月', value: 'month' },
  { label: '自定义', value: 'custom' },
];

const SORT_OPTIONS = [
  { label: '按查看数', value: 'view_count' },
  { label: '按转发数', value: 'forward_count' },
  { label: '按完播数', value: 'complete_count' },
];

const INTENT_TABS = [
  { label: '高意向', value: 'high' },
  { label: '中意向', value: 'medium' },
  { label: '低意向', value: 'low' },
];

const AnalysisPage: React.FC = () => {
  const { isLoggedIn } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [timeRange, setTimeRange] = useState('week');
  const [sortBy, setSortBy] = useState('view_count');
  const [intentLevel, setIntentLevel] = useState('high');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 数据
  const [dashboard, setDashboard] = useState<DashboardVO | null>(null);
  const [contentList, setContentList] = useState<ContentListVO[]>([]);
  const [customerList, setCustomerList] = useState<CustomerListVO[]>([]);
  const [intentList, setIntentList] = useState<IntentCustomerVO[]>([]);

  useEffect(() => {
    if (isLoggedIn) {
      loadDashboard();
    } else {
      setDashboard(null);
      setContentList([]);
      setCustomerList([]);
      setIntentList([]);
    }
  }, [isLoggedIn, timeRange, startDate, endDate]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (activeTab === 'content') loadContentList();
    else if (activeTab === 'customer') loadCustomerList();
    else if (activeTab === 'dashboard') loadDashboard();
    else if (activeTab === 'intent') loadIntentList();
  }, [activeTab, sortBy, intentLevel, timeRange, startDate, endDate]);

  const buildQuery = () => {
    const params: any = { timeRange, orderBy: sortBy };
    if (timeRange === 'custom') {
      params.startDate = startDate;
      params.endDate = endDate;
    }
    if (activeTab === 'intent') params.intentLevel = intentLevel;
    return params;
  };

  const loadDashboard = async () => {
    try {
      const params: any = { timeRange };
      if (timeRange === 'custom') {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const data = await request<DashboardVO>('/analysis/dashboard', { data: params });
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

  const loadIntentList = async () => {
    try {
      const data = await request<IntentCustomerVO[]>('/analysis/intent/list', { data: buildQuery() });
      setIntentList(data || []);
    } catch (e) {
      console.error('[Analysis] loadIntentList failed:', e);
    }
  };

  const handleContentClick = (item: ContentListVO) => {
    Taro.navigateTo({ url: `/pages/contentDetail/index?materialId=${item.materialId}` });
  };

  const handleCustomerClick = (customerId: number) => {
    Taro.navigateTo({ url: `/pages/customerDetail/index?customerId=${customerId}` });
  };

  const handleTimeRangeChange = (e: any) => {
    const val = TIME_RANGES[e.detail.value].value;
    setTimeRange(val);
    setShowCustomDate(val === 'custom');
  };

  const handleSortChange = (e: any) => {
    setSortBy(SORT_OPTIONS[e.detail.value].value);
  };

  const handleDateChange = (field: 'start' | 'end', e: any) => {
    const val = e.detail.value;
    if (field === 'start') setStartDate(val + ' 00:00:00');
    else setEndDate(val + ' 23:59:59');
  };

  // 获取当前日期（用于Picker的end属性）
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (!isLoggedIn) {
    return (
      <View className={styles.analysisPage}>
        <View className={styles.emptyTip}>
          <Text>请先登录</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.analysisPage}>
      {/* 顶部筛选栏 */}
      <View className={styles.filterBar}>
        <Picker mode='selector' range={TIME_RANGES} rangeKey='label' onChange={handleTimeRangeChange}>
          <View className={styles.filterItem}>
            <Text>{TIME_RANGES.find(t => t.value === timeRange)?.label || '当周'}</Text>
            <Text className={styles.filterArrow}>▼</Text>
          </View>
        </Picker>
        <Picker mode='selector' range={SORT_OPTIONS} rangeKey='label' onChange={handleSortChange}>
          <View className={styles.filterItem}>
            <Text>{SORT_OPTIONS.find(s => s.value === sortBy)?.label || '按查看数'}</Text>
            <Text className={styles.filterArrow}>▼</Text>
          </View>
        </Picker>
      </View>

      {/* 自定义日期选择 */}
      {showCustomDate && (
        <View className={styles.customDate}>
          <Picker mode='date' end={todayStr} onChange={(e) => handleDateChange('start', e)}>
            <View className={styles.datePicker}>
              <Text>{startDate ? startDate.substring(0, 10) : '开始日期'}</Text>
            </View>
          </Picker>
          <Text className={styles.dateSep}>至</Text>
          <Picker mode='date' end={todayStr} onChange={(e) => handleDateChange('end', e)}>
            <View className={styles.datePicker}>
              <Text>{endDate ? endDate.substring(0, 10) : '结束日期'}</Text>
            </View>
          </Picker>
        </View>
      )}

      {/* 四个Tab */}
      <View className={styles.tabs}>
        {(['content', 'customer', 'dashboard', 'intent'] as TabType[]).map(tab => (
          <Text
            key={tab}
            className={classnames(styles.tab, activeTab === tab && styles.tabActive)}
            onClick={() => setActiveTab(tab)}
          >
            {{ content: '内容分析', customer: '微信用户分析', dashboard: '总数据', intent: '意向分类' }[tab]}
          </Text>
        ))}
      </View>

      {/* 意向分类子Tab */}
      {activeTab === 'intent' && (
        <View className={styles.intentTabs}>
          {INTENT_TABS.map(item => (
            <Text
              key={item.value}
              className={classnames(styles.intentTab, intentLevel === item.value && styles.intentTabActive)}
              onClick={() => setIntentLevel(item.value)}
            >
              {item.label}
            </Text>
          ))}
        </View>
      )}

      {/* 总数据看板 */}
      {activeTab === 'dashboard' && dashboard && (
        <View className={styles.dashboardSection}>
          <View className={styles.dashboardGrid}>
            <View className={styles.dashboardItem}>
              <Text className={styles.dashboardValue}>{dashboard.totalPublishCount}</Text>
              <Text className={styles.dashboardLabel}>总发布个数</Text>
            </View>
            <View className={styles.dashboardItem}>
              <Text className={styles.dashboardValue}>{dashboard.totalViewCount}</Text>
              <Text className={styles.dashboardLabel}>总阅读数</Text>
            </View>
            <View className={styles.dashboardItem}>
              <Text className={styles.dashboardValue}>{dashboard.totalForwardCount}</Text>
              <Text className={styles.dashboardLabel}>总转发数</Text>
            </View>
            <View className={styles.dashboardItem}>
              <Text className={styles.dashboardValue}>{dashboard.totalCompleteCount}</Text>
              <Text className={styles.dashboardLabel}>完播数</Text>
            </View>
            <View className={styles.dashboardItem}>
              <Text className={styles.dashboardValue}>{dashboard.completeRate}%</Text>
              <Text className={styles.dashboardLabel}>总完播率</Text>
            </View>
            <View className={styles.dashboardItem}>
              <Text className={styles.dashboardValue}>{dashboard.repeatViewCount}</Text>
              <Text className={styles.dashboardLabel}>两次以上播放</Text>
            </View>
            <View className={styles.dashboardItem}>
              <Text className={styles.dashboardValue}>{dashboard.totalViewerCount}</Text>
              <Text className={styles.dashboardLabel}>观看人数</Text>
            </View>
            <View className={styles.dashboardItem}>
              <Text className={styles.dashboardValue}>{dashboard.highIntentCount}</Text>
              <Text className={styles.dashboardLabel}>高意向</Text>
            </View>
            <View className={styles.dashboardItem}>
              <Text className={styles.dashboardValue}>{dashboard.mediumIntentCount}</Text>
              <Text className={styles.dashboardLabel}>中意向</Text>
            </View>
            <View className={styles.dashboardItem}>
              <Text className={styles.dashboardValue}>{dashboard.lowIntentCount}</Text>
              <Text className={styles.dashboardLabel}>低意向</Text>
            </View>
          </View>
        </View>
      )}

      {/* 内容分析列表 */}
      {activeTab === 'content' && (
        <ScrollView scrollY className={styles.list}>
          {contentList.length > 0 ? contentList.map(item => (
            <View key={item.materialId} className={styles.listItem} onClick={() => handleContentClick(item)}>
              <Image className={styles.itemCover} src={item.coverUrl} mode="aspectFill" />
              <View className={styles.itemInfo}>
                <Text className={styles.itemTitle}>{item.content || item.title}</Text>
                <View className={styles.itemStats}>
                  <Text className={styles.itemStat}>浏览 {item.viewCount}</Text>
                  <Text className={styles.itemStat}>完播 {item.completeCount}</Text>
                  <Text className={styles.itemStat}>转发 {item.forwardCount}</Text>
                </View>
              </View>
              <Text className={styles.itemArrow}>›</Text>
            </View>
          )) : (
            <View className={styles.emptyTip}>
              <Text>暂无数据</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* 微信用户分析列表 */}
      {activeTab === 'customer' && (
        <ScrollView scrollY className={styles.list}>
          {customerList.length > 0 ? customerList.map(item => (
            <View key={item.customerId} className={styles.listItem} onClick={() => handleCustomerClick(item.customerId)}>
              <Image className={styles.itemAvatar} src={item.avatar} mode="aspectFill" />
              <View className={styles.itemInfo}>
                <Text className={styles.itemTitle}>{item.nickname}</Text>
                <View className={styles.itemStats}>
                  <Text className={styles.itemStat}>观看 {item.viewCount}次</Text>
                  <Text className={styles.itemStat}>完播 {item.completeCount}次</Text>
                </View>
              </View>
              <Text className={styles.itemArrow}>›</Text>
            </View>
          )) : (
            <View className={styles.emptyTip}>
              <Text>暂无数据</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* 意向分类列表 */}
      {activeTab === 'intent' && (
        <ScrollView scrollY className={styles.list}>
          {intentList.length > 0 ? intentList.map(item => (
            <View key={item.customerId} className={styles.listItem} onClick={() => handleCustomerClick(item.customerId)}>
              <Image className={styles.itemAvatar} src={item.avatar} mode="aspectFill" />
              <View className={styles.itemInfo}>
                <Text className={styles.itemTitle}>{item.nickname}</Text>
                <View className={styles.itemStats}>
                  <Text className={styles.itemStat}>观看 {item.viewCount}次</Text>
                  <Text className={styles.itemStat}>{item.completed ? '已完播' : '未完播'}</Text>
                  <Text className={styles.itemStat}>{item.hasForwarded ? '已转发' : ''}</Text>
                </View>
              </View>
              <Text className={styles.itemArrow}>›</Text>
            </View>
          )) : (
            <View className={styles.emptyTip}>
              <Text>暂无数据</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default AnalysisPage;