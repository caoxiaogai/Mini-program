const greetingSuffix = '，有什么可以帮助你的吗'

export function getHomeGreeting(date: Date = new Date()): string {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) {
    return `早上好${greetingSuffix}`
  }

  if (hour >= 12 && hour < 14) {
    return `中午好${greetingSuffix}`
  }

  if (hour >= 14 && hour < 19) {
    return `下午好${greetingSuffix}`
  }

  return `晚上好${greetingSuffix}`
}
