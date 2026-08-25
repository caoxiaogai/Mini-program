import type { MaterialsViewModel } from '../types/materials'

/** DEV_MOCK: 素材首页的固定 Figma 视觉预览数据。 */
export function getMaterialsStyleMock(): MaterialsViewModel {
  return {
    filters: [
      { id: 'all', label: '全部' },
      { id: 'image', label: '图片' },
      { id: 'video', label: '视频' },
      { id: 'pdf', label: 'PDF' },
    ],
    items: [
      {
        id: 'mock-material-layout-course-draft',
        title: '版式设计 & AI创意综合提升课',
        date: '2026-08-10',
        thumbnailUrl: '/assets/materials/material-03.jpg',
        kind: 'image',
        isDraft: true,
      },
      {
        id: 'mock-material-layout-course-presentation',
        title: '版式设计 & AI创意综合提升课',
        date: '2026-08-10',
        thumbnailUrl: '/assets/materials/material-01.jpg',
        kind: 'video',
      },
      {
        id: 'mock-material-layout-course-river',
        title: '版式设计 & AI创意综合提升课',
        date: '2026-08-10',
        thumbnailUrl: '/assets/materials/material-04.jpg',
        kind: 'video',
      },
      {
        id: 'mock-material-layout-course-road',
        title: '版式设计 & AI创意综合提升课',
        date: '2026-08-10',
        thumbnailUrl: '/assets/materials/material-10.jpg',
        kind: 'video',
      },
    ],
  }
}
