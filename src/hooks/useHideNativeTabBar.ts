import { useEffect } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';

/** 隐藏微信原生 tabBar，首页等使用自定义 BottomNav */
export function useHideNativeTabBar() {
  const hide = () => {
    Taro.hideTabBar({ animation: false }).catch(() => {});
  };

  useEffect(() => {
    hide();
  }, []);

  useDidShow(() => {
    hide();
  });
}
