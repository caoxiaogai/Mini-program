import type { ContentDetailVO } from '../types';

export default function(): ContentDetailVO {
  return {
    materialId: 1,
    title: '产品介绍视频-2024新款',
    fileType: 'VIDEO',
    viewCount: 326,
    viewerCount: 198,
    completeCount: 142,
    forwardCount: 38,
    totalDuration: 28560,
    audienceList: [
      { customerId: 1, nickname: '张经理', avatar: 'https://picsum.photos/id/64/200/200', viewCount: 5, duration: 180, completed: 1, lastViewTime: '2026-08-05 14:30:00' },
      { customerId: 2, nickname: '李总', avatar: 'https://picsum.photos/id/91/200/200', viewCount: 4, duration: 165, completed: 1, lastViewTime: '2026-08-04 16:20:00' },
      { customerId: 3, nickname: '王先生', avatar: 'https://picsum.photos/id/177/200/200', viewCount: 3, duration: 120, completed: 0, lastViewTime: '2026-08-03 09:15:00' },
      { customerId: 4, nickname: '赵女士', avatar: 'https://picsum.photos/id/338/200/200', viewCount: 3, duration: 95, completed: 0, lastViewTime: '2026-08-02 11:45:00' },
      { customerId: 5, nickname: '陈总', avatar: 'https://picsum.photos/id/1027/200/200', viewCount: 2, duration: 180, completed: 1, lastViewTime: '2026-08-01 18:00:00' }
    ]
  };
}
