import type { CustomerListVO } from '../types';

export default function(): CustomerListVO[] {
  return [
    { customerId: 1, nickname: '张经理', avatar: 'https://picsum.photos/id/64/200/200', viewCount: 28, totalDuration: 4520, completeCount: 15, lastViewTime: '2026-08-05 14:30:00' },
    { customerId: 2, nickname: '李总', avatar: 'https://picsum.photos/id/91/200/200', viewCount: 22, totalDuration: 3860, completeCount: 12, lastViewTime: '2026-08-04 16:20:00' },
    { customerId: 3, nickname: '王先生', avatar: 'https://picsum.photos/id/177/200/200', viewCount: 19, totalDuration: 3200, completeCount: 8, lastViewTime: '2026-08-03 09:15:00' },
    { customerId: 4, nickname: '赵女士', avatar: 'https://picsum.photos/id/338/200/200', viewCount: 15, totalDuration: 2680, completeCount: 6, lastViewTime: '2026-08-02 11:45:00' },
    { customerId: 5, nickname: '陈总', avatar: 'https://picsum.photos/id/1027/200/200', viewCount: 12, totalDuration: 2100, completeCount: 5, lastViewTime: '2026-08-01 18:00:00' },
    { customerId: 6, nickname: '刘经理', avatar: 'https://picsum.photos/id/64/200/200', viewCount: 10, totalDuration: 1800, completeCount: 4, lastViewTime: '2026-07-30 14:10:00' },
    { customerId: 7, nickname: '孙女士', avatar: 'https://picsum.photos/id/91/200/200', viewCount: 8, totalDuration: 1450, completeCount: 3, lastViewTime: '2026-07-28 10:30:00' },
    { customerId: 8, nickname: '周先生', avatar: 'https://picsum.photos/id/177/200/200', viewCount: 6, totalDuration: 980, completeCount: 2, lastViewTime: '2026-07-25 16:20:00' }
  ];
}
