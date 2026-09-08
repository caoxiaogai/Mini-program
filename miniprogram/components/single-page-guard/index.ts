import { promptOpenFullMiniProgram } from '../../utils/share-material'

Component({
  properties: {
    active: {
      type: Boolean,
      value: false,
    },
  },
  methods: {
    onBlockedTap() {
      promptOpenFullMiniProgram()
    },
  },
})
