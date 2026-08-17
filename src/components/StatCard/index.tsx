import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit, trend }) => {
  return (
    <View className={styles.statCard}>
      <Text className={styles.label}>{label}</Text>
      <View className={styles.valueRow}>
        <Text className={styles.value}>{value}</Text>
        {unit && <Text className={styles.unit}>{unit}</Text>}
      </View>
      {trend && <Text className={styles.trend}>{trend}</Text>}
    </View>
  );
};

export default StatCard;
