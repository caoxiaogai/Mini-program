import Taro from '@tarojs/taro';

export interface PublishDraft {
  materialId: string;
  fileType: string;
  imageUrls: string[];
  content: string;
}

const STORAGE_KEY = 'publish_draft';

export function savePublishDraft(draft: PublishDraft): void {
  Taro.setStorageSync(STORAGE_KEY, draft);
}

export function readPublishDraft(materialId?: string): PublishDraft | null {
  try {
    const draft = Taro.getStorageSync(STORAGE_KEY) as PublishDraft | undefined;
    if (!draft?.materialId) return null;
    if (materialId && String(draft.materialId) !== String(materialId)) return null;
    return draft;
  } catch {
    return null;
  }
}

export function clearPublishDraft(): void {
  try {
    Taro.removeStorageSync(STORAGE_KEY);
  } catch {
    // ignore
  }
}
