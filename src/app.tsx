import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { restoreSession } from './services/auth';
import { useUserStore } from './store/user';
import './app.scss';

function App(props) {
  useEffect(() => {
    const session = restoreSession();
    if (session) {
      useUserStore.getState().setUserInfo(session.userInfo);
    }
    useUserStore.getState().setAuthReady(true);
  }, []);

  useDidShow(() => {});

  useDidHide(() => {});

  return props.children;
}

export default App;
