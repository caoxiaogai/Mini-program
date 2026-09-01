/// <reference path="./types/index.d.ts" />

declare namespace WechatMiniprogram {
  interface RequestVirtualPaymentOption {
    signData: string
    paySig: string
    signature: string
    mode: 'short_series_goods' | 'short_series_coin'
    success?: (res: GeneralCallbackResult) => void
    fail?: (res: GeneralCallbackResult & { errCode?: number }) => void
    complete?: (res: GeneralCallbackResult) => void
  }

  interface Wx {
    requestVirtualPayment(option: RequestVirtualPaymentOption): void
  }
}

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}