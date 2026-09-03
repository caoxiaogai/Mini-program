import { runAuthed } from '../../services/auth'
import {
  createMembershipOrder,
  getMembershipPageData,
  syncMembershipOrder,
} from '../../services/membership'
import { ApiError } from '../../services/request'
import type { ApiMembershipPayParams } from '../../types/api'
import {
  MEMBERSHIP_IOS_MIN_AMOUNT_FEN,
  MEMBERSHIP_TIER_QUERY,
  membershipPageUrl,
  parseMembershipUiTier,
  type MembershipPageViewModel,
  type MembershipPlanId,
  type MembershipPlanViewModel,
  type MembershipUiTier,
} from '../../types/membership'
import {
  getMembershipBenefits,
  isMembershipPlanId,
  isStandardMembershipLocked,
  membershipPayLabel,
  pickMembershipPlan,
  plansForUiTier,
} from '../../utils/membership'
import { runPagePullRefresh } from '../../utils/pull-refresh'

function isPayCancel(errMsg: string, errCode?: number): boolean {
  return errCode === -2 || /cancel|取消/.test(errMsg)
}

function isIosDevice(): boolean {
  try {
    return wx.getSystemInfoSync().platform === 'ios'
  } catch {
    return false
  }
}

function readPayErrCode(error: object): number | undefined {
  const raw =
    'errCode' in error && (error as { errCode?: unknown }).errCode != null
      ? (error as { errCode?: unknown }).errCode
      : 'errno' in error
        ? (error as { errno?: unknown }).errno
        : undefined
  if (raw == null || raw === '') return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

function iosWechatTooOld(): boolean {
  try {
    const info = wx.getSystemInfoSync()
    if (info.platform !== 'ios') return false
    return compareVersion(String(info.version || ''), '8.0.68') < 0
  } catch {
    return false
  }
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

function showMembershipResult(title: string, content: string): void {
  wx.showModal({
    title,
    content,
    showCancel: false,
    confirmText: '知道了',
  })
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
    selectedStandardPlanId: '' as MembershipPlanId | '',
    selectedPremiumPlanId: '' as MembershipPlanId | '',
    selectedPlan: null as MembershipPlanViewModel | null,
    selectedPayLabel: '立即开通',
    paying: false,
    agreementChecked: false,
    membershipTier: 'standard' as MembershipUiTier,
    membershipBenefits: getMembershipBenefits('standard'),
    visiblePlans: [] as MembershipPlanViewModel[],
    requestedTier: '' as MembershipUiTier | '',
    standardActionsDisabled: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    const requestedTier = parseMembershipUiTier(options[MEMBERSHIP_TIER_QUERY])
    if (requestedTier) {
      this.setData({
        requestedTier,
        membershipTier: requestedTier,
        membershipBenefits: getMembershipBenefits(requestedTier),
      })
    }
    this.setNavigationBarColor('#ffffff', '#040404')
    runAuthed(membershipPageUrl(requestedTier), () => this.loadMembership())
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
        const membershipTier = this.data.membership
          ? this.data.membershipTier
          : this.data.requestedTier || (membership.tier === 'pro' ? 'premium' : 'standard')
        this.setData({
          status: 'success',
          membership,
          ...this.selectionForTier(membership, membershipTier),
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
          visiblePlans: [],
          standardActionsDisabled: false,
        })
      })
  },

  selectionForTier(membership: MembershipPageViewModel, membershipTier: MembershipUiTier) {
    const visiblePlans = plansForUiTier(membership.plans, membershipTier)
    const storedPlanId = membershipTier === 'premium' ? this.data.selectedPremiumPlanId : this.data.selectedStandardPlanId
    const selectedPlan = pickMembershipPlan(membership.plans, storedPlanId, membershipTier)
    const selectedPlanId: MembershipPlanId | '' = selectedPlan?.id ?? ''
    const standardActionsDisabled = isStandardMembershipLocked(membership.tier, membershipTier)
    return {
      membershipTier,
      membershipBenefits: getMembershipBenefits(membershipTier),
      visiblePlans,
      selectedPlanId,
      selectedStandardPlanId: membershipTier === 'standard' ? selectedPlanId : this.data.selectedStandardPlanId,
      selectedPremiumPlanId: membershipTier === 'premium' ? selectedPlanId : this.data.selectedPremiumPlanId,
      selectedPlan,
      selectedPayLabel: membershipPayLabel(membership.tier, membershipTier),
      standardActionsDisabled,
    }
  },

  onPlanTap(event: WechatMiniprogram.TouchEvent) {
    const planId = event.currentTarget.dataset.id as string | undefined
    if (!isMembershipPlanId(planId) || this.data.paying || this.data.standardActionsDisabled || !this.data.membership) return
    const selectedPlan = pickMembershipPlan(this.data.membership.plans, planId, this.data.membershipTier)
    if (!selectedPlan || selectedPlan.id !== planId) return
    this.setData({
      selectedPlanId: selectedPlan.id,
      selectedStandardPlanId: this.data.membershipTier === 'standard' ? selectedPlan.id : this.data.selectedStandardPlanId,
      selectedPremiumPlanId: this.data.membershipTier === 'premium' ? selectedPlan.id : this.data.selectedPremiumPlanId,
      selectedPlan,
      selectedPayLabel: membershipPayLabel(this.data.membership.tier, this.data.membershipTier),
    })
  },

  onTierTap(event: WechatMiniprogram.TouchEvent) {
    if (this.data.paying || !this.data.membership) return
    const tier = event.currentTarget.dataset.tier as MembershipUiTier | undefined
    if (tier !== 'standard' && tier !== 'premium') return
    if (tier === this.data.membershipTier) return
    this.setData(this.selectionForTier(this.data.membership, tier))
  },

  onAgreementTap() {
    if (this.data.paying || this.data.standardActionsDisabled) return
    this.setData({ agreementChecked: !this.data.agreementChecked })
  },

  onPayTap() {
    const plan = this.data.selectedPlan
    if (!plan || this.data.paying || this.data.standardActionsDisabled) return
    if (!this.data.agreementChecked) {
      wx.showToast({ title: '请先阅读并同意付费协议', icon: 'none' })
      return
    }
    if (!supportsVirtualPayment()) {
      showMembershipResult('开通失败', '当前微信版本不支持虚拟支付，会员未开通。')
      return
    }
    if (iosWechatTooOld()) {
      showMembershipResult('开通失败', 'iPhone 支付需要微信 8.0.68 及以上版本，请先升级微信。会员未开通。')
      return
    }
    if (isIosDevice() && plan.amountFen < MEMBERSHIP_IOS_MIN_AMOUNT_FEN) {
      showMembershipResult(
        '开通失败',
        `苹果支付最低 1 元。当前套餐是联调测试价 ${plan.priceLabel}。iPhone 必须走 Apple 支付，这个金额无法在苹果手机上完成支付。请用安卓测试，或把套餐改到至少 1 元后再用 iPhone 付。会员未开通。`,
      )
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
          const planTitle = this.data.selectedPlan?.displayTitle || '会员'
          showMembershipResult('开通成功', `${planTitle}已开通，现在可以使用会员权益。`)
          this.loadMembership(true)
          return
        }
        showMembershipResult(
          '开通结果待确认',
          '支付已提交，但暂未确认会员是否开通成功。请稍后下拉刷新查看开通状态。',
        )
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
    if (error && typeof error === 'object' && ('errMsg' in error || 'errCode' in error || 'errno' in error)) {
      const errMsg = 'errMsg' in error ? String((error as WechatMiniprogram.GeneralCallbackResult).errMsg || '') : ''
      const errCode = readPayErrCode(error)
      if (isPayCancel(errMsg, errCode)) {
        showMembershipResult('未开通', '已取消支付，会员未开通。')
        return
      }
      if (errCode === -15010) {
        showMembershipResult(
          '开通失败',
          `道具未发布到现网。当前购买的道具 ID 是 ${productId || '未知'}。请到小程序后台「虚拟支付 → 道具管理」创建同名道具（month / quarter / half_year / month_pro / quarter_pro / half_year_pro），标价与套餐金额一致，并点「发布到现网」。只上传开发版不够。会员未开通。`,
        )
        return
      }
      if (errCode === -15014) {
        showMembershipResult('开通失败', '道具刚发布还未生效。发布到现网后大约 10 分钟才会生效，请稍后再试。会员未开通。')
        return
      }
      if (errCode === -15007) {
        showMembershipResult('开通失败', '登录态已过期，请重试。会员未开通。')
        return
      }
      if (errCode === -15013) {
        showMembershipResult(
          '开通失败',
          `道具 ${productId || ''} 的后台标价必须与当前套餐金额一致。改价后需重新发布到现网。会员未开通。`,
        )
        return
      }
      if (errCode === -15006) {
        showMembershipResult('开通失败', '支付签名错误，请检查 OfferId 和 AppKey。会员未开通。')
        return
      }
      if (errCode === -15005) {
        showMembershipResult('开通失败', '用户签名错误，请重新登录后再支付。会员未开通。')
        return
      }
      if (
        errCode === 4 ||
        errCode === -4 ||
        /App Store|苹果支付|Apple/.test(errMsg)
      ) {
        showMembershipResult(
          '开通失败',
          '苹果支付未完成。iPhone 走的是 Apple 支付。请确认：虚拟支付后台已打开「苹果支付」开关、小程序简称已审核通过、微信 8.0.68 以上、使用中国大陆 App Store 账号。当前测试价低于 1 元时苹果也会直接失败。会员未开通。',
        )
        return
      }
      if (/支付能力已被限制|支付能力已经被限制/.test(errMsg)) {
        showMembershipResult('开通失败', '当前仍走错支付通道，请重新编译后再试。会员未开通。')
        return
      }
      showMembershipResult(
        '开通失败',
        `错误码 ${errCode ?? '未知'}。${errMsg || '请稍后重试'}。会员未开通。`,
      )
      return
    }
    if (error instanceof ApiError) {
      const reason = error.code === 1006 ? '虚拟支付尚未配置' : error.message || '下单失败，请稍后重试'
      showMembershipResult('开通失败', `${reason}。会员未开通。`)
      return
    }
    showMembershipResult('开通失败', '支付失败，请稍后重试。会员未开通。')
  },
})
