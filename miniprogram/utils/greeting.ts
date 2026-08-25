export function getHomeGreeting(date: Date = new Date()): string {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) {
    return '早上好'
  }

  if (hour >= 12 && hour < 14) {
    return '中午好'
  }

  if (hour >= 14 && hour < 19) {
    return '下午好'
  }

  return '晚上好'
}
