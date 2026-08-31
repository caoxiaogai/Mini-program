import { PUBLISH_ENTRY_TYPE_OPTIONS } from '../../utils/publish-media'
import type { PublishEntryType } from '../../utils/publish-media'

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    options: PUBLISH_ENTRY_TYPE_OPTIONS,
  },
  methods: {
    onMaskTap() {
      this.triggerEvent('cancel')
    },
    onCancelTap() {
      this.triggerEvent('cancel')
    },
    onOptionTap(event: WechatMiniprogram.TouchEvent) {
      const type = event.currentTarget.dataset.id as PublishEntryType
      this.triggerEvent('select', { type })
    },
  },
})
