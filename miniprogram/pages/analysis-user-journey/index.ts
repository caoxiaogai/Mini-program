import { runAuthed } from '../../services/auth'
import { getUserJourney } from '../../services/user-journey'
import type { UserJourneyViewModel } from '../../types/analysis'
import { buildReturnPath } from '../../utils/auth'
import { runPagePullRefresh } from '../../utils/pull-refresh'

Page({
  data: {
    status: 'loading' as 'loading' | 'success' | 'error',
    errorMessage: '轨迹加载失败',
    journey: null as UserJourneyViewModel | null,
  },
  userId: '',
  materialId: '',
  onLoad(options: Record<string, string | undefined>) {
    runAuthed(buildReturnPath('/pages/analysis-user-journey/index', options), () => {
      this.userId = options.userId ?? ''
      this.materialId = options.materialId ?? ''
      if (!this.userId || !this.materialId) {
        this.setData({ status: 'error', errorMessage: '无法打开用户轨迹' })
        return
      }

      this.loadJourney()
    })
  },
  onPullDownRefresh() {
    runPagePullRefresh(this.loadJourney(true))
  },
  onRetryTap() {
    this.loadJourney()
  },
  loadJourney(silent = false) {
    if (!this.userId || !this.materialId) return Promise.resolve()
    if (!silent) this.setData({ status: 'loading', errorMessage: '轨迹加载失败' })

    return getUserJourney(this.userId, this.materialId)
      .then((journey) => this.setData({ status: 'success', journey }))
      .catch((error) => {
        console.warn('[analysis-user-journey] load failed', error)
        if (silent) return
        this.setData({
          status: 'error',
          errorMessage: '无法加载用户轨迹，请稍后重试',
          journey: null,
        })
      })
  },
})
