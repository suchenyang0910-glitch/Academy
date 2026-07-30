# Team B — API 字段与接口定义（积分/结算/活动）

> Task IDs：ACAD-B-003、ACAD-B-004、ACAD-B-007  
> 目标：把“统一结算服务 + 统一账本 + 单订单单主优惠”落到可实现的接口契约；前端、Bot、支付回调不得自行重复计算。

## 1. 通用约定

鉴权：

- 全部接口使用现有 Telegram `initData` 身份校验机制，复用 `getIdentity(request)`。

错误响应：

- 统一返回 `{ error: string }`，并使用合理 HTTP status；
- 对于权限或身份问题，返回 401/403；
- 对于规则冲突（例如重复锁单、不可叠加），返回 409；
- 对于依赖未配置（例如 Stars 未配置），返回 503。

幂等：

- 所有“锁单”“发奖”“核销”等写操作必须支持幂等；
- 建议使用 `Idempotency-Key` header 或请求体 `idempotencyKey` 作为业务键。

金额字段：

- 所有金额使用 `*_amount_minor`（币种最小单位）；
- Stars 场景下 `currency = XTR`，`amount_minor` 为整数；
- 所有积分使用 `*_points`（整数）。

## 2. 结算与支付相关接口

### 2.1 获取结算预览（Pricing Preview）

`POST /api/academy/pricing/preview`

请求体：

```json
{
  "planKey": "monthly",
  "redeemCredits": true
}
```

响应体：

```json
{
  "snapshot": {
    "id": "ps_...",
    "status": "preview",
    "planKey": "monthly",
    "currency": "XTR",
    "originalAmountMinor": 990,
    "mainOfferType": "none",
    "mainOfferId": null,
    "mainDiscountAmountMinor": 0,
    "creditsRedeemedPoints": 49500,
    "creditsRedeemedAmountMinor": 495,
    "finalPayableAmountMinor": 495,
    "maxCreditsRedeemablePoints": 49500,
    "pricingRuleVersion": "pricing_v1",
    "anchorRateVersion": "stars_price_v1",
    "createdAt": "2026-07-25 12:00:00"
  }
}
```

规则要求：

- 必须按 `REQUIREMENTS.md` 11.2.3 的固定顺序计算；
- `creditsRedeemedAmountMinor` 不得超过“主优惠后金额”的 50%；
- 若存在可命中的活动主优惠，只返回一个主优惠结果，默认不可叠加。

### 2.2 锁定结算快照（Lock Snapshot）

`POST /api/academy/pricing/lock`

请求体：

```json
{
  "snapshotId": "ps_...",
  "idempotencyKey": "..."
}
```

响应体：

```json
{
  "snapshot": {
    "id": "ps_...",
    "status": "locked"
  }
}
```

规则要求：

- 只有 `preview` 状态可锁定；
- 同一 `idempotencyKey` 必须返回同一结果；
- 锁定后不得再改变主优惠与抵扣金额。

### 2.3 创建 Stars 发票（Create Invoice）

`POST /api/academy/payments/invoice`

请求体（建议替换现有仅 `planKey` 的接口口径）：

```json
{
  "pricingSnapshotId": "ps_..."
}
```

响应体：

```json
{
  "invoiceUrl": "https://t.me/...",
  "invoicePayload": "academy:...",
  "planKey": "monthly",
  "amountStars": 995,
  "pricingSnapshotId": "ps_..."
}
```

规则要求：

- 必须校验快照处于 `locked` 状态；
- 不得在创建发票时重新计算价格；
- `payment_orders` 必须绑定 `pricing_snapshot_id`，便于 webhook 侧追溯。

## 3. 积分相关接口

### 3.1 获取积分余额与可用额度

`GET /api/academy/credits/balance`

响应体：

```json
{
  "balancePoints": 120000,
  "availablePoints": 100000,
  "pendingPoints": 20000,
  "anchor": {
    "pointsPerUsd": 100,
    "rule": "100 points = 1 USD discount right"
  }
}
```

规则要求：

- `availablePoints` 只能来自 `credits_ledger` 聚合；
- 不允许依赖单一余额字段。

### 3.2 获取积分流水（分页）

`GET /api/academy/credits/ledger?cursor=<id>&limit=50`

响应体：

```json
{
  "items": [
    {
      "id": 1,
      "entryType": "earn",
      "rewardType": "referral_reward",
      "amountPoints": 1000,
      "status": "posted",
      "relatedOrderId": 12,
      "createdAt": "2026-07-25 12:00:00"
    }
  ],
  "nextCursor": 1
}
```

## 4. 活动相关接口

### 4.1 获取当前可命中的唯一主优惠（用于展示）

`GET /api/academy/campaigns/eligible?planKey=monthly`

响应体：

```json
{
  "mainOffer": {
    "type": "campaign",
    "id": "camp_...",
    "name": "xxx 活动",
    "rewardMode": "discount",
    "stackableWithCredits": true,
    "validUntil": "2026-08-01 00:00:00"
  }
}
```

规则要求：

- 若无可命中活动，返回 `mainOffer: null`；
- 必须保证“单订单单主优惠”。

## 5. Bootstrap 响应字段扩展建议

为了减少前端散落请求与口径不一致，建议 `GET /api/academy/bootstrap` 增加：

- `subscription`: 当前订阅状态与到期时间；
- `credits`: `balancePoints`、`availablePoints`；
- `pricing`: `pointsPerUsd`、`maxCreditsRedeemablePercent = 50`；
- `campaign`: 当前 `eligible mainOffer`（可空）。
