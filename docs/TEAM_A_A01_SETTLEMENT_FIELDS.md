# Team A — A-01 结算状态信息梳理（字段与状态口径）

> Task ID：ACAD-A-001  
> 目的：给 Mini App 前端实现“订阅/结算/积分/活动”相关 UI 提供唯一字段口径，确保前端不自算价格、不硬编码活动，并且所有文案与状态均可解释。

## 1. 数据来源（前端禁止自算）

### 1.1 Bootstrap（首页/个人页主入口）

`GET /api/academy/bootstrap`

用途：

- Today 页面渲染主数据
- Profile 页面用户/订阅/邀请/积分状态
- 全局配置（支付目录、AI 状态、活动主优惠摘要）

前端原则：

- 订阅状态、积分余额、活动主优惠摘要必须来自 bootstrap 或专用 API，不得推断
- 价格计算必须来自结算预览 API，不得在前端重复实现

### 1.2 结算预览（支付前展示）

`POST /api/academy/pricing/preview`

用途：

- 展示原价、主优惠、积分抵扣、最终应付金额
- 展示本单最多可抵扣积分额度

### 1.3 锁单（支付前确认）

`POST /api/academy/pricing/lock`

用途：

- 将 preview 快照锁定为 locked，保证后续支付不重算价格
- 前端需要显式处理锁单失败、重复锁单、冲突锁单

### 1.4 发起支付（当前实现）

`POST /api/academy/payments/invoice`

当前请求体：

```json
{ "planKey": "monthly" }
```

说明：

- 支付发起后续会与“锁单快照”强制绑定（Team C / ACAD-C-001），前端要预留从 planKey 迁移到 pricingSnapshotId 的空间

## 2. 字段清单（Bootstrap）

### 2.1 `access`（订阅/试用/到期状态）

字段：

- `access.active: boolean`
- `access.state: "expired" | "trial" | "paid" | "reward"`
- `access.trialStartedAt: string`（ISO）
- `access.trialEndsAt: string`（ISO）
- `access.accessEndsAt: string`（ISO）
- `access.daysRemaining: number`
- `access.planKey: string | null`

UI 状态映射建议：

- `expired`：到期锁定（只读）
- `trial`：试用中
- `paid`：付费中
- `reward`：奖励（积分抵扣续费不会直接改变 `accessEndsAt`，奖励型订阅源未来不再新增）

### 2.2 `credits`（积分余额）

字段：

- `credits.balancePoints: number`
- `credits.availablePoints: number`
- `credits.pendingPoints: number`
- `credits.anchor.pointsPerUsd: number`（固定 100）
- `credits.anchor.rule: string`

UI 展示建议：

- “可用积分”= `availablePoints`
- “待入账”= `pendingPoints`（若后续引入延迟发放）

### 2.3 `pricing`（结算规则）

字段：

- `pricing.pointsPerUsd: number`（固定 100）
- `pricing.maxCreditsRedeemablePercent: number`（固定 50）

UI 文案建议：

- “积分仅用于抵扣下一单，单次最多抵扣 50%”

### 2.4 `campaign`（活动主优惠摘要）

字段：

- `campaign.mainOffer: null | { type, id, name, rewardMode, stackableWithCredits, validUntil }`

当存在活动时：

- `type: "campaign"`
- `rewardMode: string`（例如 "discount" / "credits"）
- `stackableWithCredits: boolean`
- `validUntil: string`（UTC 文本时间）

UI 原则：

- 活动是否存在、活动名称、是否可与积分抵扣并存必须来自服务端
- 前端不硬编码任何活动名称、时间、折扣

### 2.5 `payment`（支付目录）

字段来自 `getPaymentCatalog()`：

- `payment.provider: "telegram_stars"`
- `payment.currency: "XTR"`
- `payment.webhookConfigured: boolean`
- `payment.enabled: boolean`
- `payment.plans: Array<{ key,label,usdPrice,durationDays,recurring,stars,enabled }>`

UI 展示建议：

- 只展示 `enabled=true` 的 plan
- 若 `payment.enabled=false`，显示“支付暂不可用”与 Founder 模式提示

## 3. 字段清单（结算预览）

`POST /api/academy/pricing/preview` 返回：

- `snapshot.id: string`
- `snapshot.status: "preview" | "locked" | ...`
- `snapshot.planKey: string`
- `snapshot.currency: string`（XTR）
- `snapshot.originalAmountMinor: number`
- `snapshot.mainOfferType: string`（none/campaign）
- `snapshot.mainOfferId: string | null`
- `snapshot.mainDiscountAmountMinor: number`
- `snapshot.creditsRedeemedPoints: number`
- `snapshot.creditsRedeemedAmountMinor: number`
- `snapshot.finalPayableAmountMinor: number`
- `snapshot.maxCreditsRedeemablePoints: number`
- `snapshot.pricingRuleVersion: string`
- `snapshot.anchorRateVersion: string`
- `snapshot.createdAt: string`

UI 状态建议：

- 原价：`originalAmountMinor`
- 主优惠：`mainDiscountAmountMinor`（并展示 `mainOfferType`）
- 积分抵扣：`creditsRedeemedAmountMinor` + `creditsRedeemedPoints`
- 最终应付：`finalPayableAmountMinor`
- 本单最多可抵扣：`maxCreditsRedeemablePoints`（用于 slider/开关提示）

## 4. 错误态/空态清单（前端必须处理）

### 4.1 Bootstrap

- 401/403：身份失效，提示从 Telegram 内打开
- 500：服务异常，提示稍后重试

### 4.2 结算预览

- 400：缺少 planKey
- 503：Stars 价格未配置或支付不可用
- 500：服务异常

### 4.3 锁单

- 400：缺少 snapshotId / idempotencyKey
- 404：快照不存在（或不属于该用户）
- 409：快照已锁定（幂等 key 不一致或状态不允许）

## 5. 开发约束（强制）

1. 前端不得自行计算优惠、积分抵扣、应付金额；必须调用 `pricing/preview`；
2. 前端不得硬编码活动（团购/返现/免费天数/特殊折扣）；活动信息只来自 bootstrap 的 `campaign` 或活动接口；
3. 支付前必须先 lock 快照；支付发起与回调必须以 locked 快照为唯一事实来源（后续由 ACAD-C-001 落地）。
