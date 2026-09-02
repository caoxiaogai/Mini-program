import { runAuthed } from '../../services/auth'
import {
  createMembershipOrder,
  getMembershipPageData,
  syncMembershipOrder,
} from '../../services/membership'
import { ApiError } from '../../services/request'
import type { ApiMembershipPayParams } from '../../types/api'
import type { MembershipPageViewModel, MembershipPlanId, MembershipPlanViewModel, MembershipTier } from '../../types/membership'
import { MEMBERSHIP_PAGE_PATH } from '../../types/membership'
import { getMembershipBenefits, pickMembershipPlan } from '../../utils/membership'
import { runPagePullRefresh } from '../../utils/pull-refresh'

function isPlanId(value: string | undefined): value is MembershipPlanId {
  return value === 'month' || value === 'quarter' || value === 'half_year'
}

function payLabel(membership: MembershipPageViewModel | null): string {
  return membership?.active ? '立即续费' : '立即开通'
}

function isPayCancel(errMsg: string, errCode?: number): boolean {
  return errCode === -2 || /cancel|取消/.test(errMsg)
}

function supportsVirtualPayment(): boolean {
  try {
    if (typeof wx.canIUse === 'function' && wx.canIUse('requestVirtualPayment')) return true
    const version = wx.getSystemInfoSync().SDKVersion
    return compareVersion(version, '2.19.2') >= 0
  } catch {
    return false
  }
}

function compareVersion(left: string, right: string): number {
  const a = left.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const b = right.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const length = Math.max(a.length, b.length)
  for (let i = 0; i < length; i += 1) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff > 0 ? 1 : -1
  }
  return 0
}

Page({
  data: {
    status: 'loading' as 'loading' | 'success' | 'error',
    errorMessage: '会员信息加载失败',
    membership: null as MembershipPageViewModel | null,
    selectedPlanId: '' as MembershipPlanId | '',
    selectedPlan: null as MembershipPlanViewModel | null,
    selectedPayLabel: '立即开通',
    paying: false,
    agreementChecked: false,
    membershipTier: 'standard' as MembershipTier,
    membershipBenefits: getMembershipBenefits('standard'),
  },

  onLoad() {
    this.setNavigationBarColor('#ffffff', '#040404')
    runAuthed(MEMBERSHIP_PAGE_PATH, () => this.loadMembership())
  },

  onShow() {
    this.setNavigationBarColor('#ffffff', '#040404')
  },

  onUnload() {
    this.setNavigationBarColor('#000000', '#ffffff')
  },

  setNavigationBarColor(frontColor: '#ffffff' | '#000000', backgroundColor: string) {
    wx.setNavigationBarColor({ frontColor, backgroundColor })
  },

  onPullDownRefresh() {
    runPagePullRefresh(this.loadMembership(true))
  },

  onRetryTap() {
    this.loadMembership()
  },

  loadMembership(silent = false) {
    if (!silent) this.setData({ status: 'loading', errorMessage: '会员信息加载失败' })

    return getMembershipPageData()
      .then((membership) => {
        const selectedPlan = pickMembershipPlan(membership.plans, this.data.selectedPlanId)
        this.setData({
          status: 'success',
          membership,
          selectedPlanId: selectedPlan?.id ?? '',
          selectedPlan,
          selectedPayLabel: payLabel(membership),
        })
        if (membership.lastPaidOutTradeNo) {
          return syncMembershipOrder(membership.lastPaidOutTradeNo).catch(() => undefined)
        }
      })
      .catch(() => {
        if (silent) return
        this.setData({
          status: 'error',
          errorMessage: '无法加载会员套餐，请稍后重试',
          membership: null,
          selectedPlan: null,
        })
      })
  },

  onPlanTap(event: WechatMiniprogram.TouchEvent) {
    const planId = event.currentTarget.dataset.id as string | undefined
    if (!isPlanId(planId) || this.data.paying) return
    const selectedPlan = pickMembershipPlan(this.data.membership?.plans ?? [], planId)
    if (!selectedPlan) return
    this.setData({
      selectedPlanId: selectedPlan.id,
      selectedPlan,
      selectedPayLabel: payLabel(this.data.membership),
    })
  },

  onTierTap(event: WechatMiniprogram.TouchEvent) {
    if (this.data.paying) return
    const tier = event.currentTarget.dataset.tier as MembershipTier | undefined
    if (tier !== 'standard' && tier !== 'premium') return
    this.setData({ membershipTier: tier, membershipBenefits: getMembershipBenefits(tier) })
  },

  onAgreementTap() {
    if (this.data.paying) return
    this.setData({ agreementChecked: !this.data.agreementChecked })
  },

  onPayTap() {
    const plan = this.data.selectedPlan
    if (!plan || this.data.paying) return
    if (!this.data.agreementChecked) {
      wx.showToast({ title: '请先阅读并同意付费协议', icon: 'none' })
      return
    }
    if (!supportsVirtualPayment()) {
      wx.showToast({ title: '当前微信版本不支持虚拟支付', icon: 'none' })
      return
    }

    this.setData({ paying: true })
    this.loginCode()
      .then((code) => createMembershipOrder(plan.id, code))
      .then((pay) => this.requestVirtualPay(pay))
      .then((outTradeNo) => this.confirmPaid(outTradeNo))
      .then((paid) => {
        this.setData({ paying: false })
        if (paid) {
          wx.showToast({ title: '开通成功', icon: 'success' })
          this.loadMembership(true)
          return
        }
        wx.showToast({ title: '支付已提交，请稍后刷新查看开通状态', icon: 'none' })
        this.loadMembership(true)
      })
      .catch((error: unknown) => {
        this.setData({ paying: false })
        console.error('membership pay failed', error)
        this.showPayError(error)
      })
  },

  loginCode(): Promise<string> {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (result) => {
          if (result.code) {
            resolve(result.code)
            return
          }
          reject(new ApiError(-1, '获取登录态失败'))
        },
        fail: (error) => reject(error),
      })
    })
  },

  requestVirtualPay(pay: ApiMembershipPayParams): Promise<string> {
    return new Promise((resolve, reject) => {
      wx.requestVirtualPayment({
        signData: pay.signData,
        paySig: pay.paySig,
        signature: pay.signature,
        mode: (pay.mode || 'short_series_goods') as 'short_series_goods',
        success: () => resolve(pay.outTradeNo),
        fail: (error) => reject(error),
      })
    })
  },

  confirmPaid(outTradeNo: string): Promise<boolean> {
    const delays = [0, 800, 1600, 2400]
    return delays.reduce(
      (chain, delay) =>
        chain.then((paid) => {
          if (paid) return true
          return this.wait(delay)
            .then(() => syncMembershipOrder(outTradeNo))
            .then((status) => status === 'paid')
            .catch(() => false)
        }),
      Promise.resolve(false),
    )
  },

  wait(ms: number): Promise<void> {
    if (ms <= 0) return Promise.resolve()
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  },

  showPayError(error: unknown) {
    const productId = this.data.selectedPlan?.id || ''
    if (error && typeof error === 'object' && 'errMsg' in error) {
      const errMsg = String((error as WechatMiniprogram.GeneralCallbackResult).errMsg || '')
      const errCode = 'errCode' in error ? Number((error as { errCode?: number }).errCode) : undefined
      if (isPayCancel(errMsg, errCode)) {
        wx.showToast({ title: '已取消支付', icon: 'none' })
        return
      }
      if (errCode === -15010) {
        wx.showModal({
          title: '道具未发布到现网',
          content: `当前购买的道具 ID 是 ${productId || '未知'}。请到小程序后台「虚拟支付 → 道具管理」创建 ID 为 month / quarter / half_year 的道具（价格 1 / 2 / 3 分），并点「发布到现网」。只上传开发版不够。`,
          showCancel: false,
        })
        return
      }
      if (errCode === -15014) {
        wx.showModal({
          title: '道具刚发布还未生效',
          content: '道具发布到现网后大约 10 分钟才会生效，请稍后再试。',
          showCancel: false,
        })
        return
      }
      if (errCode === -15007) {
        wx.showToast({ title: '登录态已过期，请重试', icon: 'none' })
        return
      }
      if (errCode === -15013) {
        wx.showModal({
          title: '价格与后台不一致',
          content: `道具 ${productId || ''} 的后台标价必须与下单金额一致：month=1分，quarter=2分，half_year=3分。改价后需重新发布到现网。`,
          showCancel: false,
        })
        return
      }
      if (errCode === -15006) {
        wx.showToast({ title: '支付签名错误，请检查 OfferId 和 AppKey', icon: 'none' })
        return
      }
      if (errCode === -15005) {
        wx.showToast({ title: '用户签名错误，请重新登录后再支付', icon: 'none' })
        return
      }
      if (/支付能力已被限制|支付能力已经被限制/.test(errMsg)) {
        wx.showToast({ title: '当前仍走错支付通道，请重新编译后再试', icon: 'none' })
        return
      }
      wx.showToast({ title: '支付失败，请稍后重试', icon: 'none' })
      return
    }
    if (error instanceof ApiError) {
      wx.showToast({
        title: error.code === 1006 ? '虚拟支付尚未配置' : error.message || '下单失败，请稍后重试',
        icon: 'none',
      })
      return
    }
    wx.showToast({ title: '支付失败，请稍后重试', icon: 'none' })
  },
})
