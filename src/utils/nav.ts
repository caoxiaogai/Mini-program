import Taro from '@tarojs/taro';

/** 仍在原生 tabBar 中的页面用 switchTab */
export function goHome() {
  Taro.switchTab({ url: '/pages/home/index' });
}

export function goAnalysis() {
  Taro.switchTab({ url: '/pages/analysis/index' });
}

export function goRanking() {
  Taro.switchTab({ url: '/pages/mine/index' });
}

/** 已从 tabBar 移除，必须 navigateTo，否则会进失败或落到旧 tab 行为 */
export function goMaterial() {
  Taro.navigateTo({ url: '/pages/material/index' });
}

export function goNotification() {
  Taro.navigateTo({ url: '/pages/notification/index' });
}
