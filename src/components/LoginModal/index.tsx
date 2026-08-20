import React, { useState } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '../../store/user';
import { wechatLogin } from '../../services/auth';

const LoginModal: React.FC = () => {
  const { isLoggedIn, authReady, setUserInfo } = useUserStore();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { userInfo } = await wechatLogin();
      setUserInfo(userInfo);
      Taro.showToast({ title: '登录成功', icon: 'success' });
    } catch (e: any) {
      const msg = e?.message || '登录失败，请重试';
      console.error('[LoginModal] login failed:', msg, e);
      Taro.showToast({ title: msg.length > 20 ? '登录失败，请重试' : msg, icon: 'none', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  if (!authReady || isLoggedIn) return null;

  return (
    <View className={styles.mask} catchMove>
      <View className={styles.modal}>
        <Image
          className={styles.logo}
          src={require('../../assets/robot-avatar.png')}
          mode="aspectFit"
        />
        <Text className={styles.title}>欢迎使用阿宝AI</Text>
        <Text className={styles.desc}>登录后可使用素材管理、数据分析等全部功能</Text>
        <Button
          className={styles.loginBtn}
          loading={loading}
          disabled={loading}
          onClick={handleLogin}
        >
          微信一键登录
        </Button>
      </View>
    </View>
  );
};

export default LoginModal;
