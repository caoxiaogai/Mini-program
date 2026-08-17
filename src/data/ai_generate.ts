import type { AiGenerateVO } from '../types';

export default function(): AiGenerateVO {
  return {
    copy: '🔥 2024新款震撼上市！\n\n告别传统，拥抱创新。全新升级的产品，带给你前所未有的体验。\n\n✅ 超强性能，效率翻倍\n✅ 精致设计，颜值在线\n✅ 用户好评率99%\n\n限时优惠，先到先得！\n点击链接了解更多 👆',
    model: 'gpt-4o-mini',
    totalTokens: 256,
    costMs: 1820
  };
}
