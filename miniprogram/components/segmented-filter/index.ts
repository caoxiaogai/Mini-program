interface SegmentedFilterItem {
  id: string
  label: string
  iconPath?: string
}

const getValidItems = (items: unknown): SegmentedFilterItem[] => {
  if (!Array.isArray(items)) return []

  return items.filter((item): item is SegmentedFilterItem => (
    typeof item === 'object'
    && item !== null
    && typeof (item as SegmentedFilterItem).id === 'string'
    && typeof (item as SegmentedFilterItem).label === 'string'
    && ((item as SegmentedFilterItem).iconPath === undefined || typeof (item as SegmentedFilterItem).iconPath === 'string')
  ))
}

Component({
  properties: {
    items: { type: Array, value: [] },
    activeId: { type: String, value: '' },
    itemWidth: { type: Number, value: 0 },
  },
  data: {
    controlWidthStyle: '',
    selectionOffset: 0,
    selectionWidth: '0rpx',
  },
  observers: {
    'items, activeId, itemWidth'(items: unknown, activeId: string, itemWidth: number) {
      const validItems = getValidItems(items)
      const activeIndex = Math.max(0, validItems.findIndex((item) => item.id === activeId))
      const isFixedWidth = Number.isFinite(itemWidth) && itemWidth > 0

      this.setData({
        controlWidthStyle: isFixedWidth ? `width: ${validItems.length * itemWidth + 8}rpx;` : '',
        selectionOffset: activeIndex * 100,
        selectionWidth: isFixedWidth ? `${itemWidth}rpx` : `calc((100% - 8rpx) / ${validItems.length || 1})`,
      })
    },
  },
  methods: {
    onItemTap(event: WechatMiniprogram.TouchEvent) {
      const id = event.currentTarget.dataset.id as string
      const index = Number(event.currentTarget.dataset.index)
      if (!Number.isInteger(index)) return

      this.triggerEvent('change', { id, index })
    },
    onTouchStart(event: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('touchstart', { clientX: event.touches[0]?.clientX ?? 0 })
    },
    onTouchEnd(event: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('touchend', { clientX: event.changedTouches[0]?.clientX ?? 0 })
    },
  },
})
