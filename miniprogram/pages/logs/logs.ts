// logs.ts
import { formatTime } from '../../utils/util'

const REFRESH_SETTLE_MS = 300
const refreshTimers = new WeakMap<object, ReturnType<typeof setTimeout>>()

Component({
  data: {
    logs: [] as Array<{ date: string; timeStamp: string }>,
    pullRefreshing: false,
  },
  lifetimes: {
    attached() {
      this.loadLogs()
    },
    detached() {
      this.clearRefreshTimer()
    },
  },
  methods: {
    loadLogs() {
      this.setData({
        logs: (wx.getStorageSync('logs') || []).map((log: string) => {
          return {
            date: formatTime(new Date(log)),
            timeStamp: log,
          }
        }),
      })
    },
    clearRefreshTimer() {
      const timer = refreshTimers.get(this)
      if (timer == null) return
      clearTimeout(timer)
      refreshTimers.delete(this)
    },
    onPullRefresh() {
      this.setData({ pullRefreshing: true })
      this.loadLogs()
      this.clearRefreshTimer()
      refreshTimers.set(
        this,
        setTimeout(() => {
          this.setData({ pullRefreshing: false })
          refreshTimers.delete(this)
        }, REFRESH_SETTLE_MS),
      )
    },
  },
})
