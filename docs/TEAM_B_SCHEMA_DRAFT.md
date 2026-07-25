# Team B — Schema 草案（结算/活动/积分）

> Task IDs：ACAD-B-001、ACAD-B-002、ACAD-B-003  
> 依据：`REQUIREMENTS.md` 11.2.1–11.2.3、14.1、16.2  
> 目标：给 Team B 落地迁移与 API 实现提供统一数据口径；所有字段命名遵循现有 `mini-app/db/schema.ts` 的 snake_case 规则。

## 1. 现状与改造原则

现有相关表（已存在）：

- `users`
- `subscriptions`
- `invitations`
- `payment_orders`
- `payment_transactions`

新增表（本草案覆盖）：

- `credits_ledger`
- `campaign_rewards`
- `order_pricing_snapshots`

改造建议（需要评估后由 Team B 决策是否纳入本轮迁移）：

- 为 `payment_orders` 增加 `pricing_snapshot_id` 外键以绑定结算快照；
- 为 `payment_orders` 增加 `currency` 与 `amount_minor`（或复用 `amount_stars`）的统一字段口径。

## 2. `credits_ledger`（积分账本）

用途：

- Academy 唯一积分事实账本；
- 所有积分发放、冻结、核销、作废、撤销必须写入账本；
- 余额通过账本聚合计算，不维护“单一可变余额”作为唯一事实源。

字段草案：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | integer (auto inc) | 是 | 主键 |
| user_id | text | 是 | 归属用户 |
| entry_type | text | 是 | `earn` / `hold` / `redeem` / `expire` / `revoke` |
| reward_type | text | 是 | `study_reward` / `referral_reward` / `campaign_reward` |
| amount_points | integer | 是 | 积分变动值，允许负数用于冲销 |
| status | text | 是 | `pending` / `posted` / `voided` |
| business_key | text | 是 | 幂等键，确保同一事件不重复记账 |
| related_order_id | integer | 否 | 关联 `payment_orders.id` |
| related_invitation_id | integer | 否 | 关联 `invitations.id` |
| related_campaign_reward_id | text | 否 | 关联 `campaign_rewards.id` |
| expires_at | text | 否 | 过期时间（UTC） |
| created_at | text | 是 | 创建时间（UTC） |

索引与唯一约束：

- unique(`business_key`)
- index(`user_id`, `created_at`)
- index(`user_id`, `status`, `expires_at`)

账本聚合规则（余额口径）：

- `posted` 状态且未过期的分录参与余额聚合；
- `pending` 不计入可用余额；
- `voided` 不参与聚合；
- `expire`、`revoke` 用负向分录冲销，不允许直接覆盖历史分录。

## 3. `campaign_rewards`（活动与主优惠配置）

用途：

- 所有活动层优惠与奖励唯一配置来源；
- 任何团购、节日促销、渠道活动必须先配置到此表；
- 活动规则变更必须通过版本化，而不是静默覆盖历史。

字段草案：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | text | 是 | 活动 ID，建议 `camp_<uuid>` |
| name | text | 是 | 活动名称 |
| status | text | 是 | `draft` / `active` / `paused` / `ended` |
| reward_mode | text | 是 | `discount` / `credits` |
| main_offer_type | text | 是 | 主优惠类型：`campaign` / `referral` / `first_purchase` 等（本轮最小实现建议只保留 `campaign`） |
| stackable_with_credits | integer(boolean) | 是 | 是否允许与积分抵扣并存 |
| budget_cap_minor | integer | 否 | 活动预算上限（币种最小单位），为空表示不设上限 |
| start_at | text | 是 | 生效时间（UTC） |
| end_at | text | 是 | 失效时间（UTC） |
| eligibility_rule_json | text | 是 | 资格规则 JSON（最小实现可为 `{}`） |
| settlement_rule_version | text | 是 | 结算规则版本号，例如 `v1` |
| created_by | text | 否 | 创建者标识（后台或脚本） |
| created_at | text | 是 | 创建时间（UTC） |
| updated_at | text | 是 | 更新时间（UTC） |

索引与唯一约束：

- index(`status`, `start_at`, `end_at`)
- index(`end_at`)

版本规则：

- 活动结束后不得修改历史规则；若规则变化必须新建 `id` 或新版本字段并显式停用旧版本。

## 4. `order_pricing_snapshots`（订单结算快照）

用途：

- 单订单单主优惠的权威结算快照；
- 支付前展示、支付回调校验、退款处理、奖励回写必须引用同一快照；
- 支付回调不得脱离快照重算价格。

字段草案：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | text | 是 | 快照 ID，建议 `ps_<uuid>` |
| user_id | text | 是 | 下单用户 |
| plan_key | text | 是 | 订阅方案，如 `monthly` |
| currency | text | 是 | 例如 `XTR` |
| original_amount_minor | integer | 是 | 原价（币种最小单位；Stars 即整数） |
| main_offer_type | text | 是 | 主优惠类型（为空也应明确为 `none`） |
| main_offer_id | text | 否 | 主优惠来源（如 `campaign_rewards.id`） |
| main_discount_amount_minor | integer | 是 | 主优惠减免金额 |
| credits_redeemed_points | integer | 是 | 本单核销积分数 |
| credits_redeemed_amount_minor | integer | 是 | 本单积分抵扣金额（币种最小单位） |
| final_payable_amount_minor | integer | 是 | 最终应付金额 |
| anchor_rate_version | text | 是 | 锚定版本（例如 `stars_price_v1`） |
| pricing_rule_version | text | 是 | 结算规则版本（例如 `pricing_v1`） |
| status | text | 是 | `preview` / `locked` / `paid` / `voided` |
| idempotency_key | text | 否 | 锁单幂等键 |
| created_at | text | 是 | 创建时间（UTC） |

索引与唯一约束：

- index(`user_id`, `created_at`)
- index(`status`, `created_at`)
- unique(`idempotency_key`)（若启用）

结算约束（与 REQUIREMENTS 对齐）：

- 结算顺序：原价 → 主优惠 → 积分抵扣（最多 50%）→ 最终应付；
- `credits_redeemed_amount_minor` 必须小于等于 `floor((original_amount_minor - main_discount_amount_minor) * 0.5)`；
- `final_payable_amount_minor = original_amount_minor - main_discount_amount_minor - credits_redeemed_amount_minor`；
- 任意订单只允许一个主优惠策略；积分抵扣不计入主优惠。

## 5. 与现有表的最小关联建议

### `payment_orders`

建议增加：

- `pricing_snapshot_id`：text，关联 `order_pricing_snapshots.id`

理由：

- 支付回调时可通过 `invoice_payload → payment_orders → pricing_snapshot_id` 找到唯一快照；
- 保证“快照先于支付”的工程约束可落地。
