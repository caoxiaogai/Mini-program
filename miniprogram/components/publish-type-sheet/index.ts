import { PUBLISH_ENTRY_TYPE_OPTIONS, PUBLISH_SOURCE_OPTIONS, PUBLISH_TYPE_OPTIONS } from '../../utils/publish-media'
import type { PublishEntryType, PublishMediaSource } from '../../utils/publish-media'

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    kind: {
      type: String,
      value: 'type',
    },
  },
  data: {
    options: PUBLISH_TYPE_OPTIONS,
    dialogLabel: '选择发布素材类型',
  },
  observers: {
    kind(kind: string) {
      if (kind === 'source') {
        this.setData({ options: PUBLISH_SOURCE_OPTIONS, dialogLabel: '选择素材来源' })
        return
      }
      this.setData({
        options: kind === 'entry' ? PUBLISH_ENTRY_TYPE_OPTIONS : PUBLISH_TYPE_OPTIONS,
        dialogLabel: '选择发布素材类型',
      })
    },
  },
  methods: {
    onMaskTap() {
      this.triggerEvent('cancel')
    },
    onOptionTap(event: WechatMiniprogram.TouchEvent) {
      const id = event.currentTarget.dataset.id as string
      if (this.properties.kind === 'source') {
        this.triggerEvent('select', { source: id as PublishMediaSource })
        return
      }
      this.triggerEvent('select', { type: id as PublishEntryType })
    },
  },
})
