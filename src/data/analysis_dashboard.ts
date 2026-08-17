import type { DashboardVO } from '../types';

export default function(): DashboardVO {
  return {
    totalPublishCount: 28,
    totalViewCount: 1256,
    totalCompleteCount: 580,
    totalForwardCount: 142,
    completeRate: 46.2,
    forwardRate: 11.3,
    repeatViewCount: 89,
    totalViewerCount: 423,
    highIntentCount: 15,
    mediumIntentCount: 32,
    lowIntentCount: 67
  };
}