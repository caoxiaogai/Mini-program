import type { Material } from '../types';

export default function(): Material[] {
  return [
    { id: 1, userId: 1, title: '产品介绍视频-2024新款', content: '最新产品功能介绍', fileType: 'VIDEO', fileUrl: 'https://picsum.photos/id/1/300/300', fileSize: 15728640, coverUrl: 'https://picsum.photos/id/1/200/200', duration: 180, aiCopy: '', shareUrl: 'https://share.example.com/h5/abc123', trackingId: 'abc123', publishStatus: 1, deleted: 0, createTime: '2026-07-28 10:30:00', updateTime: '2026-07-28 10:30:00' },
    { id: 2, userId: 1, title: '客户案例分享PDF', content: '标杆客户成功案例', fileType: 'PDF', fileUrl: 'https://picsum.photos/id/2/300/300', fileSize: 5242880, coverUrl: 'https://picsum.photos/id/2/200/200', duration: 0, aiCopy: '', shareUrl: 'https://share.example.com/h5/def456', trackingId: 'def456', publishStatus: 1, deleted: 0, createTime: '2026-07-25 14:20:00', updateTime: '2026-07-25 14:20:00' },
    { id: 3, userId: 1, title: '产品对比表格', content: '三款产品参数对比', fileType: 'TABLE', fileUrl: 'https://picsum.photos/id/3/300/300', fileSize: 1048576, coverUrl: 'https://picsum.photos/id/3/200/200', duration: 0, aiCopy: '', shareUrl: '', trackingId: '', publishStatus: 0, deleted: 0, createTime: '2026-07-22 09:15:00', updateTime: '2026-07-22 09:15:00' },
    { id: 4, userId: 1, title: '使用教程视频', content: '产品操作指南', fileType: 'VIDEO', fileUrl: 'https://picsum.photos/id/6/300/300', fileSize: 20971520, coverUrl: 'https://picsum.photos/id/6/200/200', duration: 300, aiCopy: '', shareUrl: 'https://share.example.com/h5/ghi789', trackingId: 'ghi789', publishStatus: 1, deleted: 0, createTime: '2026-07-18 16:45:00', updateTime: '2026-07-18 16:45:00' },
    { id: 5, userId: 1, title: '产品画册图片', content: '高清产品图集', fileType: 'IMAGE', fileUrl: 'https://picsum.photos/id/8/300/300', fileSize: 3145728, coverUrl: 'https://picsum.photos/id/8/200/200', duration: 0, aiCopy: '', shareUrl: '', trackingId: '', publishStatus: 0, deleted: 0, createTime: '2026-07-15 11:00:00', updateTime: '2026-07-15 11:00:00' },
    { id: 6, userId: 1, title: '销售话术培训视频', content: '高级销售技巧', fileType: 'VIDEO', fileUrl: 'https://picsum.photos/id/9/300/300', fileSize: 26214400, coverUrl: 'https://picsum.photos/id/9/200/200', duration: 420, aiCopy: '', shareUrl: 'https://share.example.com/h5/jkl012', trackingId: 'jkl012', publishStatus: 1, deleted: 0, createTime: '2026-07-10 13:30:00', updateTime: '2026-07-10 13:30:00' }
  ];
}
