import React from 'react';
import { View, Text, Image, Video } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Material } from '../../types';
import { getFileUrls } from '../../utils/format';

interface MaterialCardProps {
  material: Material;
  onClick?: (material: Material) => void;
}

const fileTypeMap: Record<string, string> = {
  VIDEO: '视频',
  PDF: 'PDF',
  IMAGE: '图片',
  TABLE: '表格'
};

const MaterialCard: React.FC<MaterialCardProps> = ({ material, onClick }) => {
  const coverUrl = material.fileType === 'IMAGE'
    ? getFileUrls(material.fileUrl)[0] || material.coverUrl
    : material.coverUrl;
  const imageCount = material.fileType === 'IMAGE'
    ? getFileUrls(material.fileUrl).length
    : 0;

  return (
    <View
      className={styles.materialCard}
      onClick={() => onClick?.(material)}
    >
      <View className={styles.coverWrap}>
        {material.fileType === 'VIDEO' ? (
          <Video
            className={styles.cover}
            src={material.fileUrl}
            controls={false}
            autoplay={false}
            showCenterPlayBtn={false}
            showPlayBtn={false}
            showFullscreenBtn={false}
            objectFit="cover"
          />
        ) : coverUrl ? (
          <Image
            className={styles.cover}
            src={coverUrl}
            mode="aspectFill"
          />
        ) : (
          <View className={styles.coverPlaceholder}>
            <Text className={styles.placeholderText}>
              {fileTypeMap[material.fileType] || material.fileType}
            </Text>
          </View>
        )}
        <View className={styles.fileTypeTag}>
          <Text className={styles.fileTypeText}>
            {fileTypeMap[material.fileType] || material.fileType}
          </Text>
        </View>
        {imageCount > 1 && (
          <View className={styles.multiTag}>
            <Text className={styles.multiText}>{imageCount}张</Text>
          </View>
        )}
        {material.publishStatus === 1 && (
          <View className={styles.publishedTag}>
            <Text className={styles.publishedText}>已发布</Text>
          </View>
        )}
      </View>
      <View className={styles.info}>
        <Text className={styles.title}>{material.content || fileTypeMap[material.fileType]}</Text>
        <View className={styles.footer}>
          <Text className={styles.time}>{material.createTime?.slice(0, 10)}</Text>
          {material.shareUrl ? (
            <Text className={classnames(styles.status, styles.published)}>已分享</Text>
          ) : (
            <Text className={classnames(styles.status, styles.draft)}>草稿</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default MaterialCard;
