import { getNavigationBarLayout } from '../../utils/navigation-layout'

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    src: {
      type: String,
      value: '',
    },
    poster: {
      type: String,
      value: '',
    },
  },
  data: {
    barStyle: 'padding-top: 47px; height: 91px;',
  },
  lifetimes: {
    attached() {
      const layout = getNavigationBarLayout()
      this.setData({
        barStyle: `padding-top: ${layout.statusBarHeight}px; height: ${layout.totalHeight}px;`,
      })
    },
  },
  methods: {
    onBlockMove() {},
    onCloseTap() {
      this.triggerEvent('close')
    },
  },
})
