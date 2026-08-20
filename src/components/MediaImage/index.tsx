import React, { useEffect, useState } from 'react';
import { View, Image, ImageProps } from '@tarojs/components';
import { resolveMediaUrl } from '../../utils/media';
import { downloadMediaToLocal } from '../../utils/downloadMedia';

const isWeapp = process.env.TARO_ENV === 'weapp';

/** 远程图片：小程序端先 downloadFile 再展示，避免 HTTP/IP 直链无法加载 */
const MediaImage: React.FC<ImageProps> = ({ src, className, style, onError, ...rest }) => {
  const [displaySrc, setDisplaySrc] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const raw = typeof src === 'string' ? src : '';
      const resolved = resolveMediaUrl(raw);
      if (!resolved) {
        if (!cancelled) setDisplaySrc('');
        return;
      }

      if (!isWeapp || !/^https?:\/\//i.test(resolved)) {
        if (!cancelled) setDisplaySrc(resolved);
        return;
      }

      const localPath = await downloadMediaToLocal(resolved);
      if (!cancelled) setDisplaySrc(localPath || resolved);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!displaySrc) {
    return <View className={className} style={style} />;
  }

  return (
    <Image
      {...rest}
      className={className}
      style={style}
      src={displaySrc}
      onError={(e) => {
        console.error('[MediaImage] render failed:', displaySrc, e);
        onError?.(e);
      }}
    />
  );
};

export default MediaImage;
