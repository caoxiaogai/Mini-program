import type { MaterialDetailViewModel, MaterialDraftEditViewModel, MaterialsViewModel } from '../types/materials'

export const materialsMock: MaterialsViewModel = {
  filters: [
    { id: 'all', label: '全部' },
    { id: 'image', label: '图片' },
    { id: 'video', label: '视频' },
    { id: 'pdf', label: 'PDF' },
  ],
  items: [
    {
      id: 'material-01',
      title: '版式设计 & AI创意综合提升课',
      date: '2026-08-10',
      thumbnailUrl: '/assets/materials/material-03.jpg',
      kind: 'image',
      isDraft: true,
    },
    {
      id: 'material-02',
      title: '版式设计 & AI创意综合提升课',
      date: '2026-08-10',
      thumbnailUrl: '/assets/materials/material-01.jpg',
      kind: 'video',
    },
    {
      id: 'material-03',
      title: '版式设计 & AI创意综合提升课',
      date: '2026-08-10',
      thumbnailUrl: '/assets/materials/material-04.jpg',
      kind: 'image',
    },
    {
      id: 'material-04',
      title: '版式设计 & AI创意综合提升课',
      date: '2026-08-10',
      thumbnailUrl: '/assets/materials/material-10.jpg',
      kind: 'video',
    },
    {
      id: 'material-05',
      title: '版式设计 & AI创意综合提升课',
      date: '2026-08-10',
      thumbnailUrl: '/assets/materials/material-09.jpg',
      kind: 'image',
    },
    {
      id: 'material-06',
      title: '版式设计 & AI创意综合提升课',
      date: '2026-08-10',
      thumbnailUrl: '/assets/materials/material-02.jpg',
      kind: 'pdf',
    },
  ],
}

export const materialDraftsMock: Record<string, MaterialDraftEditViewModel> = {
  'material-01': {
    id: 'material-01',
    images: [{ id: 'material-01-image-01', path: '/assets/materials/material-03.jpg' }],
    copy: '版式设计 & AI创意综合提升课',
  },
}

export const materialDetailsMock: Record<string, MaterialDetailViewModel> = {
  'material-01': {
    id: 'material-01',
    title: '作品',
    images: [
      '/assets/materials/detail-image-01.jpg',
      '/assets/materials/material-10.jpg',
      '/assets/materials/material-04.jpg',
      '/assets/materials/material-02.jpg',
      '/assets/materials/material-09.jpg',
      '/assets/materials/material-01.jpg',
    ],
    descriptionLines: [
      'MacBook 贴纸专业户',
      '👀 少数派历年周边逐件看',
      '🔥 今天是少数派原创贴纸合辑',
      '💧 贴纸表面采用防水覆膜，不惧水溅',
      '👍🏻 PCV 不留胶，撕下无残留',
      '👑 少数派会员专属 PRIME 系列贴纸',
      '👉 长按【图八】加入会员服务，兑换更多会员专属周边',
    ],
  },
  'material-02': {
    id: 'material-02',
    title: '作品',
    images: ['/assets/materials/material-01.jpg', '/assets/materials/material-02.jpg'],
    descriptionLines: ['版式设计 & AI创意综合提升课', '精选视频课程内容，适合分享给客户预览。'],
  },
  'material-03': {
    id: 'material-03',
    title: '作品',
    images: ['/assets/materials/material-04.jpg', '/assets/materials/material-03.jpg'],
    descriptionLines: ['版式设计 & AI创意综合提升课', '图片素材详情。'],
  },
  'material-04': {
    id: 'material-04',
    title: '作品',
    images: ['/assets/materials/material-10.jpg', '/assets/materials/material-09.jpg'],
    descriptionLines: ['版式设计 & AI创意综合提升课', '视频素材详情。'],
  },
  'material-05': {
    id: 'material-05',
    title: '作品',
    images: ['/assets/materials/material-09.jpg', '/assets/materials/material-04.jpg'],
    descriptionLines: ['版式设计 & AI创意综合提升课', '图片素材详情。'],
  },
  'material-06': {
    id: 'material-06',
    title: '作品',
    images: ['/assets/materials/material-02.jpg', '/assets/materials/material-01.jpg'],
    descriptionLines: ['版式设计 & AI创意综合提升课', 'PDF 素材详情。'],
  },
}
