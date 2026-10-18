import {
  promptOpenFullMiniProgram,
  registerSinglePageHint,
  SINGLE_PAGE_OPEN_HINT,
  unregisterSinglePageHint,
} from '../../utils/share-material'

const HINT_DURATION_MS = 2000

let hintTimer = 0
let activeHint: (() => void) | null = null

function clearHintTimer(): void {
  if (!hintTimer) return
  clearTimeout(hintTimer)
  hintTimer = 0
}

Component({
  properties: {
    active: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    hintVisible: false,
    hintText: SINGLE_PAGE_OPEN_HINT,
  },
  lifetimes: {
    attached() {
      const showHint = () => {
        clearHintTimer()
        if (!this.data.hintVisible) this.setData({ hintVisible: true })
        hintTimer = setTimeout(() => {
          hintTimer = 0
          this.setData({ hintVisible: false })
        }, HINT_DURATION_MS) as unknown as number
      }
      activeHint = showHint
      registerSinglePageHint(showHint)
    },
    detached() {
      if (activeHint) unregisterSinglePageHint(activeHint)
      activeHint = null
      clearHintTimer()
    },
  },
  methods: {
    onBlockedTap() {
      promptOpenFullMiniProgram()
    },
    onBlockedMove() {
      promptOpenFullMiniProgram()
    },
  },
})
