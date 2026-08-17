import React, { useState } from 'react';
import { View, Text, Image, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '../../store/user';
import { request, BASE_URL } from '../../services/api';

const PLACEHOLDER_AVATAR = 'https://picsum.photos/id/64/200/200';

const MinePage: React.FC = () => {
  const { userInfo, isLoggedIn, setUserInfo, logout } = useUserStore();
  const [stats] = useState({ publishCount: 0, viewCount: 0, forwardCount: 0 });
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempAvatarUrl, setTempAvatarUrl] = useState('');
  const [tempNickname, setTempNickname] = useState('');

  const handleLogin = async () => {
    try {
      const { code } = await Taro.login();
      const result = await request<{ userId: string; openid: string; nickname?: string; avatar?: string; phone?: string }>('/wechat/login?code=' + code, { method: 'POST' });
      Taro.setStorageSync('userId', result.userId);
      setUserInfo({
        openid: result.openid,
        unionid: '',
        phone: result.phone || '',
        nickname: result.nickname || '微信用户',
        avatar: result.avatar || '',
        status: 1
      });
      Taro.showToast({ title: '登录成功', icon: 'success' });
    } catch (e) {
      console.error('[Mine] login failed:', e);
      Taro.showToast({ title: '登录失败', icon: 'none' });
    }
  };

  const handleOpenEdit = () => {
    setTempAvatarUrl(userInfo?.avatar || '');
    setTempNickname(userInfo?.nickname || '');
    setShowEditModal(true);
  };

  const handleChooseAvatar = async (e: any) => {
    const avatarUrl = e.detail.avatarUrl;
    setTempAvatarUrl(avatarUrl);
    try {
      Taro.showLoading({ title: '上传中...' });
      const userId = Taro.getStorageSync('userId');
      const res = await Taro.uploadFile({
        url: `${BASE_URL}/user/avatar`,
        filePath: avatarUrl,
        name: 'file',
        header: userId ? { 'X-User-Id': String(userId) } : {}
      });
      const result = JSON.parse(res.data);
      if (result.code === 200 && result.data?.avatar) {
        setTempAvatarUrl(result.data.avatar);
      }
      Taro.hideLoading();
    } catch (err) {
      Taro.hideLoading();
      console.error('[Mine] upload avatar failed:', err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      Taro.showLoading({ title: '保存中...' });
      await request('/user/profile', {
        method: 'PUT',
        data: { nickname: tempNickname, avatar: tempAvatarUrl }
      });
      setUserInfo({
        ...userInfo!,
        nickname: tempNickname,
        avatar: tempAvatarUrl
      });
      setShowEditModal(false);
      Taro.hideLoading();
      Taro.showToast({ title: '保存成功', icon: 'success' });
    } catch (e) {
      Taro.hideLoading();
      console.error('[Mine] save profile failed:', e);
      Taro.showToast({ title: '保存失败', icon: 'none' });
    }
  };

  return (
    <View className={styles.minePage}>
      <View className={styles.header}>
        {isLoggedIn ? (
          <>
            <View onClick={handleOpenEdit}>
              <Image className={styles.avatar} src={userInfo?.avatar || PLACEHOLDER_AVATAR} mode="aspectFill" />
            </View>
            <View key="logged-in" className={styles.userInfo} onClick={handleOpenEdit}>
              <Text className={styles.nickname}>{userInfo?.nickname || '微信用户'}</Text>
              <Text className={styles.phone}>{userInfo?.phone || '未绑定手机号'}</Text>
            </View>
          </>
        ) : (
          <>
            <Image className={styles.avatar} src={require('../../assets/tabbar/avatar.jpeg')} mode="aspectFill" />
            <View key="logged-out" className={styles.userInfo}>
              <Text className={styles.nickname}>未登录</Text>
              <Text className={styles.loginBtn} onClick={handleLogin}>微信登录</Text>
            </View>
          </>
        )}
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{stats.publishCount}</Text>
          <Text className={styles.statLabel}>已发布</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{stats.viewCount}</Text>
          <Text className={styles.statLabel}>总浏览</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{stats.forwardCount}</Text>
          <Text className={styles.statLabel}>转发数</Text>
        </View>
      </View>

      <View className={styles.menuList}>
        <View className={styles.menuItem} onClick={() => Taro.switchTab({ url: '/pages/material/index' })}>
          <Text className={styles.menuText}>我的素材</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => Taro.navigateTo({ url: '/pages/aiGenerate/index' })}>
          <Text className={styles.menuText}>AI文案生成</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => Taro.showToast({ title: 'AI销售助手 v1.0', icon: 'none' })}>
          <Text className={styles.menuText}>关于我们</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
      </View>

      {isLoggedIn && (
        <View className={styles.menuList}>
          <View className={styles.menuItem} onClick={() => { logout(); Taro.showToast({ title: '已退出', icon: 'none' }); }}>
            <Text className={styles.menuText}>退出登录</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>
      )}

      {showEditModal && (
        <View key="modal-mask" className={styles.modalMask} onClick={() => setShowEditModal(false)}>
          <View key="modal-content" className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>编辑资料</Text>
            <View className={styles.avatarSection}>
              <Button className={styles.avatarBtn} openType="chooseAvatar" onChooseAvatar={handleChooseAvatar}>
                <Image className={styles.avatarPreview} src={tempAvatarUrl || PLACEHOLDER_AVATAR} mode="aspectFill" />
              </Button>
              <Text className={styles.avatarTip}>点击更换头像</Text>
            </View>
            <View className={styles.nicknameSection}>
              <Text className={styles.fieldLabel}>昵称</Text>
              <Input className={styles.nicknameInput} type="nickname" value={tempNickname} onInput={(e) => setTempNickname(e.detail.value)} placeholder="请输入昵称" />
            </View>
            <View className={styles.modalBtnRow}>
              <View className={styles.modalCancelBtn} onClick={() => setShowEditModal(false)}>取消</View>
              <View className={styles.modalSaveBtn} onClick={handleSaveProfile}>保存</View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default MinePage;