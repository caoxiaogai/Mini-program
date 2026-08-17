import React, { useState } from 'react';
import { View, Text, Input, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { request } from '../../services/api';
import { useUserStore } from '../../store/user';
import type { AiGenerateVO } from '../../types';

const AiGeneratePage: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn } = useUserStore();
  const [title, setTitle] = useState(decodeURIComponent(router.params.title || ''));
  const [content, setContent] = useState(decodeURIComponent(router.params.content || ''));
  const [result, setResult] = useState<AiGenerateVO | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!title.trim() || !content.trim()) {
      Taro.showToast({ title: '请填写标题和内容', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      const data = await request<AiGenerateVO>('/ai/generate', {
        method: 'POST',
        data: {
          title,
          content,
          materialId: router.params.materialId ? Number(router.params.materialId) : undefined
        }
      });
      setResult(data);
    } catch (e) {
      console.error('[AiGenerate] generate failed:', e);
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.copy) {
      Taro.setClipboardData({ data: result.copy });
    }
  };

  if (!isLoggedIn) {
    return (
      <View className={styles.aiPage}>
        <View className={styles.formCard}>
          <Text>请先登录</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.aiPage}>
      <View className={styles.formCard}>
        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            素材标题<Text className={styles.required}>*</Text>
          </Text>
          <Input
            className={styles.input}
            value={title}
            onInput={e => setTitle(e.detail.value)}
            placeholder="请输入素材标题"
            maxlength={50}
          />
        </View>
        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            主题内容<Text className={styles.required}>*</Text>
          </Text>
          <Textarea
            className={styles.textarea}
            value={content}
            onInput={e => setContent(e.detail.value)}
            placeholder="请输入素材的主题内容或描述..."
            maxlength={500}
          />
        </View>
        <Text
          className={classnames(styles.generateBtn, loading && styles.btnDisabled)}
          onClick={loading ? undefined : handleGenerate}
        >
          {loading ? '生成中...' : '生成朋友圈配文'}
        </Text>
      </View>

      {loading && !result && (
        <View className={styles.loadingTip}>
          <Text>AI正在生成文案...</Text>
        </View>
      )}

      {result && (
        <View className={styles.resultCard}>
          <View className={styles.resultHeader}>
            <Text className={styles.resultTitle}>生成结果</Text>
            <Text className={styles.copyBtn} onClick={handleCopy}>复制文案</Text>
          </View>
          <Text className={styles.resultContent}>{result.copy}</Text>
          <View className={styles.resultMeta}>
            <Text className={styles.metaText}>模型: {result.model}</Text>
            <Text className={styles.metaText}>Token: {result.totalTokens}</Text>
            <Text className={styles.metaText}>耗时: {result.costMs}ms</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default AiGeneratePage;
