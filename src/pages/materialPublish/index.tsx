import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Textarea, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { request } from '../../services/api';
import { getFileUrls } from '../../utils/format';
import { resolveMediaUrl } from '../../utils/media';
import { readPublishDraft, savePublishDraft, clearPublishDraft } from '../../utils/publishDraft';
import type { Material } from '../../types';

function buildImageUrls(material: Material): string[] {
  if (material.fileType === 'IMAGE') {
    return getFileUrls(material.fileUrl).map(resolveMediaUrl).filter(Boolean);
  }
  if (material.coverUrl) {
    return [resolveMediaUrl(material.coverUrl)];
  }
  return [];
}

const MaterialPublishPage: React.FC = () => {
  const router = useRouter();
  const materialId = router.params.materialId || '';
  const initialDraft = useMemo(
    () => (materialId ? readPublishDraft(materialId) : null),
    [materialId]
  );

  const [material, setMaterial] = useState<Material | null>(() => {
    if (!initialDraft) return null;
    return {
      id: initialDraft.materialId as unknown as number,
      fileType: initialDraft.fileType,
    } as Material;
  });
  const [imageUrls, setImageUrls] = useState<string[]>(() => initialDraft?.imageUrls || []);
  const [copy, setCopy] = useState(() => initialDraft?.content || '');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!initialDraft);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!materialId) {
      setLoadError('缺少素材信息');
      setLoading(false);
      return;
    }
    loadMaterial(materialId);
  }, [materialId]);

  const loadMaterial = async (id: string) => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await request<Material>(`/material/${id}`);
      setMaterial(data);
      setCopy(data.content || '');
      const urls = buildImageUrls(data);
      setImageUrls(urls);
      savePublishDraft({
        materialId: String(data.id),
        fileType: data.fileType,
        imageUrls: urls,
        content: data.content || '',
      });
    } catch (e) {
      console.error('[MaterialPublish] load failed:', e);
      setLoadError('素材加载失败');
      if (!initialDraft && !imageUrls.length) {
        Taro.showToast({ title: '加载失败', icon: 'none' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async () => {
    if (!material || material.fileType !== 'IMAGE') return;
    const remain = 9 - imageUrls.length;
    if (remain <= 0) {
      Taro.showToast({ title: '最多上传9张图片', icon: 'none' });
      return;
    }
    try {
      const res = await Taro.chooseImage({
        count: remain,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
      });
      if (!res.tempFilePaths?.length) return;
      Taro.showLoading({ title: '上传中...' });
      const { uploadFileOnly } = await import('../../services/api');
      const uploads = await Promise.all(res.tempFilePaths.map((path) => uploadFileOnly(path)));
      setImageUrls((prev) => [...prev, ...uploads]);
      Taro.hideLoading();
    } catch (e) {
      Taro.hideLoading();
      console.error('[MaterialPublish] add image failed:', e);
    }
  };

  const saveMaterial = async (publish: boolean) => {
    if (!material?.id || saving) return;
    setSaving(true);
    try {
      Taro.showLoading({ title: publish ? '发表中...' : '保存中...' });
      const payload: { content: string; fileUrl?: string; coverUrl?: string } = {
        content: copy.trim(),
      };
      if (material.fileType === 'IMAGE' && imageUrls.length > 0) {
        payload.fileUrl = JSON.stringify(imageUrls);
        payload.coverUrl = imageUrls[0];
      }
      await request(`/material/${material.id}`, {
        method: 'PUT',
        data: payload,
      });
      if (publish) {
        await request(`/material/${material.id}/share`, { method: 'POST' });
      }
      clearPublishDraft();
      Taro.hideLoading();
      Taro.showToast({ title: publish ? '发表成功' : '已存草稿', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 500);
    } catch (e) {
      Taro.hideLoading();
      console.error('[MaterialPublish] save failed:', e);
      Taro.showToast({ title: '操作失败', icon: 'none' });
    } finally {
      setSaving(false);
    }
  };

  if (!materialId) {
    return (
      <View className={styles.page}>
        <View className={styles.loadingWrap}>
          <Text className={styles.loadingText}>缺少素材信息</Text>
        </View>
      </View>
    );
  }

  if (loading && !material) {
    return (
      <View className={styles.page}>
        <View className={styles.loadingWrap}>
          <Text className={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  if (!material) {
    return (
      <View className={styles.page}>
        <View className={styles.loadingWrap}>
          <Text className={styles.loadingText}>{loadError || '加载失败'}</Text>
        </View>
      </View>
    );
  }

  const isImageMaterial = material.fileType === 'IMAGE';

  return (
    <View className={styles.page}>
      {loadError ? (
        <View className={styles.errorBar}>
          <Text className={styles.errorText}>{loadError}</Text>
        </View>
      ) : null}

      <View className={styles.content}>
        <View className={styles.imageRow}>
          {imageUrls.map((url, index) => (
            <View key={`${url}-${index}`} className={styles.imageItem}>
              <Image className={styles.image} src={url} mode="aspectFill" />
            </View>
          ))}
          {isImageMaterial && imageUrls.length < 9 ? (
            <View className={styles.addBtn} onClick={handleAddImage}>
              <View className={styles.plusWrap}>
                <View className={styles.plusHorizontal} />
                <View className={styles.plusVertical} />
              </View>
            </View>
          ) : null}
        </View>

        <Textarea
          className={styles.copyInput}
          value={copy}
          onInput={(e) => setCopy(e.detail.value)}
          placeholder="添加文案"
          placeholderClass={styles.copyPlaceholder}
          maxlength={500}
          autoHeight
        />
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.draftBtn} onClick={() => saveMaterial(false)}>
          <Text className={styles.draftText}>存草稿</Text>
        </View>
        <View className={styles.publishBtn} onClick={() => saveMaterial(true)}>
          <Text className={styles.publishText}>发表</Text>
        </View>
      </View>
    </View>
  );
};

export default MaterialPublishPage;
