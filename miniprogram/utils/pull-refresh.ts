/** 下拉刷新结束后收起动画；任务失败也要收起，避免转圈卡住。 */

export function runPullRefresh(task: Promise<unknown> | void, onDone: () => void): void {
  Promise.resolve(task)
    .catch(() => undefined)
    .then(onDone)
}

export function runPagePullRefresh(task: Promise<unknown> | void): void {
  runPullRefresh(task, () => wx.stopPullDownRefresh())
}
