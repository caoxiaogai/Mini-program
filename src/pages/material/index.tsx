import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { request, uploadFile, uploadImages } from '../../services/api';
import { useUserStore } from '../../store/user';
import type { Material } from '../../types';
import LoginModal from '../../components/LoginModal';
import MediaImage from '../../components/MediaImage';
import { getFileUrls } from '../../utils/format';
import { resolveMediaUrl } from '../../utils/media';
import { savePublishDraft } from '../../utils/publishDraft';

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'IMAGE', label: '图片' },
  { key: 'VIDEO', label: '视频' },
  { key: 'PDF', label: 'PDF' },
  { key: 'EXCEL', label: '表格' },
] as const;

function formatDate(value?: string) {
  if (!value) return '';
  return value.slice(0, 10);
}

function getDisplayTitle(material: Material) {
  const content = (material.content || '').trim();
  if (content) return content.length > 28 ? `${content.slice(0, 28)}...` : content;
  return material.title || '未命名素材';
}

function getCover(material: Material) {
  if (material.coverUrl) return resolveMediaUrl(material.coverUrl);
  if (material.fileType === 'IMAGE') {
    const urls = getFileUrls(material.fileUrl);
    return urls[0] ? resolveMediaUrl(urls[0]) : '';
  }
  return '';
}

const MaterialPage: React.FC = () => {
  const { isLoggedIn } = useUserStore();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useDidShow(() => {
    if (isLoggedIn) loadMaterials();
  });

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

  const filtered = useMemo(() => {
    if (activeTab === 'all') return materials;
    if (activeTab === 'EXCEL') {
      return materials.filter((m) => ['EXCEL', 'XLS', 'XLSX', 'CSV', 'TABLE'].includes(m.fileType));
    }
    if (activeTab === 'PDF') {
      return materials.filter((m) => ['PDF', 'DOC', 'DOCX'].includes(m.fileType));
    }
    return materials.filter((m) => m.fileType === activeTab);
  }, [materials, activeTab]);

  const goPublishPage = (material: Material) => {
    const imageUrls =
      material.fileType === 'IMAGE'
        ? getFileUrls(material.fileUrl).map(resolveMediaUrl).filter(Boolean)
        : material.coverUrl
          ? [resolveMediaUrl(material.coverUrl)]
          : [];
    savePublishDraft({
      materialId: String(material.id),
      fileType: material.fileType,
      imageUrls,
      content: material.content || '',
    });
    Taro.navigateTo({ url: `/pages/materialPublish/index?materialId=${material.id}` });
  };

  const handleUpload = async () => {
    try {
      const { tapIndex } = await Taro.showActionSheet({
        itemList: ['上传图片', '上传视频', '上传文件(PDF/表格)'],
      });
      if (tapIndex === 0) await handleUploadImages();
      else if (tapIndex === 1) await handleUploadVideo();
      else await handleUploadFile();
    } catch {
      // 用户取消
    }
  };

  const handleUploadImages = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
      });
      if (!res.tempFilePaths?.length) return;
      Taro.showLoading({ title: `上传中 0/${res.tempFilePaths.length}...` });
      const material = await uploadImages(res.tempFilePaths);
      Taro.hideLoading();
      if (material?.id) goPublishPage(material);
      else {
        Taro.showToast({ title: '上传成功', icon: 'success' });
        loadMaterials();
      }
    } catch (e) {
      Taro.hideLoading();
      console.error('[Material] uploadImages failed:', e);
      Taro.showToast({ title: '上传失败', icon: 'none' });
    }
  };

  const handleUploadVideo = async () => {
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['video'],
        sourceType: ['album', 'camera'],
      });
      if (!res.tempFiles?.length) return;
      Taro.showLoading({ title: '上传中...' });
      const material = (await uploadFile(res.tempFiles[0].tempFilePath)) as Material;
      Taro.hideLoading();
      if (material?.id) goPublishPage(material);
      else {
        Taro.showToast({ title: '上传成功', icon: 'success' });
        loadMaterials();
      }
    } catch (e) {
      Taro.hideLoading();
      console.error('[Material] uploadVideo failed:', e);
    }
  };

  const handleUploadFile = async () => {
    try {
      const res = await Taro.chooseMessageFile({ count: 1, type: 'file' });
      if (!res.tempFiles?.length) return;
      Taro.showLoading({ title: '上传中...' });
      const material = (await uploadFile(res.tempFiles[0].path)) as Material;
      Taro.hideLoading();
      if (material?.id) goPublishPage(material);
      else {
        Taro.showToast({ title: '上传成功', icon: 'success' });
        loadMaterials();
      }
    } catch (e) {
      Taro.hideLoading();
      console.error('[Material] uploadFile failed:', e);
    }
  };

  const handleCardClick = (material: Material) => {
    if (material.publishStatus === 0) {
      goPublishPage(material);
      return;
    }
    Taro.navigateTo({ url: `/pages/materialDetail/index?id=${material.id}` });
  };

  if (!isLoggedIn) {
    return (
      <View className={styles.page}>
        <LoginModal />
        <View className={styles.emptyTip}>
          <Text>请先登录</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <LoginModal />

      <View className={styles.filterBar}>
        {FILTERS.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.filterTab, activeTab === tab.key && styles.filterTabActive)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text
              className={classnames(
                styles.filterText,
                activeTab === tab.key && styles.filterTextActive
              )}
            >
              {tab.label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY className={styles.listScroll} enhanced showScrollbar={false}>
        {loading && materials.length === 0 ? (
          <View className={styles.emptyTip}>
            <Text>加载中...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View className={styles.emptyTip}>
            <Text>暂无素材</Text>
          </View>
        ) : (
          <View className={styles.grid}>
            {filtered.map((item) => {
              const cover = getCover(item);
              const isVideo = item.fileType === 'VIDEO';
              const isDraft = item.publishStatus === 0;
              return (
                <View
                  key={item.id}
                  className={styles.card}
                  onClick={() => handleCardClick(item)}
                >
                  <View className={styles.coverWrap}>
                    {cover ? (
                      <MediaImage className={styles.cover} src={cover} mode="aspectFill" />
                    ) : (
                      <View className={styles.coverPlaceholder}>
                        <Text className={styles.coverPlaceholderText}>{item.fileType || 'FILE'}</Text>
                      </View>
                    )}
                    {isDraft ? (
                      <View className={styles.draftTag}>
                        <Text className={styles.draftTagText}>草稿</Text>
                      </View>
                    ) : null}
                    {isVideo ? <View className={styles.playIcon} /> : null}
                  </View>
                  <View className={styles.cardBody}>
                    <Text className={styles.cardTitle}>{getDisplayTitle(item)}</Text>
                    <Text className={styles.cardDate}>{formatDate(item.createTime)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View className={styles.listBottomSpacer} />
      </ScrollView>

      <View className={styles.publishBar}>
        <View className={styles.publishBtn} onClick={handleUpload}>
          <Text className={styles.publishBtnText}>发布作品</Text>
          <Text className={styles.publishPlus}>+</Text>
        </View>
      </View>
    </View>
  );
};

export default MaterialPage;
