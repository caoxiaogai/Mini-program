import React, { useState, useEffect } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import MaterialCard from '../../components/MaterialCard';
import { request, uploadFile, uploadImages } from '../../services/api';
import { useUserStore } from '../../store/user';
import type { Material } from '../../types';

const MaterialPage: React.FC = () => {
  const { isLoggedIn } = useUserStore();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [editMaterialId, setEditMaterialId] = useState<number>(0);
  const [editCopy, setEditCopy] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      loadMaterials();
    } else {
      setMaterials([]);
    }
  }, [isLoggedIn]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await request<Material[]>('/material/mine');
      setMaterials(data || []);
    } catch (e) {
      console.error('[Material] loadMaterials failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      const { tapIndex } = await Taro.showActionSheet({
        itemList: ['上传图片', '上传视频', '上传文件(PDF/表格)']
      });
      if (tapIndex === 0) {
        await handleUploadImages();
      } else if (tapIndex === 1) {
        await handleUploadVideo();
      } else {
        await handleUploadFile();
      }
    } catch (e) {
      // 用户取消
    }
  };

  const handleUploadImages = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera']
      });
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        Taro.showLoading({ title: `上传中 0/${res.tempFilePaths.length}...` });
        const material = await uploadImages(res.tempFilePaths);
        Taro.hideLoading();
        if (material && material.id) {
          setEditMaterialId(material.id);
          setEditCopy('');
          setShowCopyModal(true);
        } else {
          Taro.showToast({ title: '上传成功', icon: 'success' });
          loadMaterials();
        }
      }
    } catch (e) {
      Taro.hideLoading();
      console.error('[Material] uploadImages failed:', e);
    }
  };

  const handleUploadVideo = async () => {
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['video'],
        sourceType: ['album', 'camera']
      });
      if (res.tempFiles && res.tempFiles.length > 0) {
        Taro.showLoading({ title: '上传中...' });
        const result = await uploadFile(res.tempFiles[0].tempFilePath);
        Taro.hideLoading();
        const material = (result as any) as Material;
        if (material && material.id) {
          setEditMaterialId(material.id);
          setEditCopy('');
          setShowCopyModal(true);
        } else {
          Taro.showToast({ title: '上传成功', icon: 'success' });
          loadMaterials();
        }
      }
    } catch (e) {
      Taro.hideLoading();
      console.error('[Material] uploadVideo failed:', e);
    }
  };

  const handleUploadFile = async () => {
    try {
      const res = await Taro.chooseMessageFile({
        count: 1,
        type: 'file'
      });
      if (res.tempFiles && res.tempFiles.length > 0) {
        Taro.showLoading({ title: '上传中...' });
        const result = await uploadFile(res.tempFiles[0].path);
        Taro.hideLoading();
        const material = (result as any) as Material;
        if (material && material.id) {
          setEditMaterialId(material.id);
          setEditCopy('');
          setShowCopyModal(true);
        } else {
          Taro.showToast({ title: '上传成功', icon: 'success' });
          loadMaterials();
        }
      }
    } catch (e) {
      Taro.hideLoading();
      console.error('[Material] upload failed:', e);
    }
  };

  const handleSaveCopy = async () => {
    if (!editCopy.trim()) {
      Taro.showToast({ title: '请输入文案', icon: 'none' });
      return;
    }
    try {
      Taro.showLoading({ title: '保存中...' });
      await request(`/material/${editMaterialId}`, {
        method: 'PUT',
        data: { content: editCopy }
      });
      Taro.hideLoading();
      setShowCopyModal(false);
      Taro.showToast({ title: '文案已保存', icon: 'success' });
      loadMaterials();
    } catch (e) {
      Taro.hideLoading();
      console.error('[Material] saveCopy failed:', e);
    }
  };

  const handleSkipCopy = () => {
    setShowCopyModal(false);
    Taro.showToast({ title: '上传成功', icon: 'success' });
    loadMaterials();
  };

  const handleMaterialClick = (material: Material) => {
    Taro.navigateTo({ url: `/pages/materialDetail/index?id=${material.id}` });
  };

  const filteredMaterials = activeTab === 'all'
    ? materials
    : materials.filter(m => m.fileType === activeTab);

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'VIDEO', label: '视频' },
    { key: 'PDF', label: 'PDF' },
    { key: 'IMAGE', label: '图片' },
    { key: 'TABLE', label: '表格' }
  ];

  return (
    <View className={styles.materialPage}>
      <View className={styles.header}>
        <Text className={styles.title}>素材管理</Text>
        <View className={styles.headerBtns}>
          <Text className={styles.uploadBtn} onClick={handleUpload}>上传素材</Text>
        </View>
      </View>

      <View className={styles.tabs}>
        {tabs.map(tab => (
          <Text
            key={tab.key}
            className={classnames(styles.tab, activeTab === tab.key && styles.tabActive)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Text>
        ))}
      </View>

      {!isLoggedIn ? (
        <View className={styles.emptyTip}>
          <Text className={styles.emptyText}>请先登录</Text>
        </View>
      ) : loading ? (
        <View className={styles.loading}>
          <Text>加载中...</Text>
        </View>
      ) : filteredMaterials.length > 0 ? (
        <View className={styles.materialList}>
          {filteredMaterials.map(item => (
            <MaterialCard key={item.id} material={item} onClick={handleMaterialClick} />
          ))}
        </View>
      ) : (
        <View className={styles.emptyTip}>
          <Text className={styles.emptyText}>暂无素材</Text>
          <Text className={styles.emptyBtn} onClick={handleUpload}>上传第一个素材</Text>
        </View>
      )}

      {showCopyModal && (
        <View className={styles.modalMask} key="copy-modal">
          <View className={styles.modalContent} key="copy-modal-content">
            <Text className={styles.modalTitle}>编辑文案</Text>
            <Textarea
              className={styles.copyTextarea}
              value={editCopy}
              onInput={(e) => setEditCopy(e.detail.value)}
              placeholder="请输入文案内容，方便后续查找和使用"
              maxlength={500}
              autoHeight
            />
            <View className={styles.modalBtns}>
              <Text className={styles.modalSkipBtn} onClick={handleSkipCopy}>跳过</Text>
              <Text className={styles.modalSaveBtn} onClick={handleSaveCopy}>保存</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default MaterialPage;
