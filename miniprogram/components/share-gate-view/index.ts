import { guardSinglePageAction } from '../../utils/share-material'

const SHARE_GATE_DEFAULT_ART = '/assets/share-gate/group-98.svg'

const friendAvatars = [
  '/assets/ranking/avatar-01.png',
  '/assets/ranking/avatar-02.png',
  '/assets/ranking/avatar-03.png',
  '/assets/ranking/avatar-04.png',
  '/assets/ranking/avatar-05.png',
  '/assets/ranking/avatar-06.png',
]

Component({
  properties: {
    artSrc: {
      type: String,
      value: SHARE_GATE_DEFAULT_ART,
    },
    artFromWork: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    friendAvatars,
  },
  methods: {
    onPageTap() {
      guardSinglePageAction()
    },
    onMoreTap() {
      if (guardSinglePageAction()) return
      this.triggerEvent('moretap')
    },
  },
})
