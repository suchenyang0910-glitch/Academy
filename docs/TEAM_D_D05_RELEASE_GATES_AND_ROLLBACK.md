# ACAD-D-005：发布门禁与回滚预案

## 1. 发布门禁（必须全部满足）

### 1.1 任务与文档门禁

- `docs/TASK_REGISTRY.md` 中本次发布涉及的任务均为 `done`
- `docs/DEVELOPMENT_CHECKLIST.md` 的 “上线前最终 Checklist” 已逐项确认

### 1.2 测试门禁（本仓库当前可执行）

- Python（Bot/脚本层）：
  - `python -m unittest discover -s tests -p "test_*.py"`
- mini-app（构建 + node:test 回归）：
  - `cd mini-app && npm test`

### 1.3 数据库门禁

- SQLite（本地）：
  - `cd mini-app && npm run db:verify -- --mode sqlite --database-path data/academy.sqlite`
- Postgres（线上/云端）：
  - `cd mini-app && npm run db:verify -- --mode postgres`（需要 `ACADEMY_DATABASE_URL`）

### 1.4 支付门禁（Telegram Stars）

必须满足：
- `TELEGRAM_BOT_TOKEN` 已配置
- `TELEGRAM_WEBHOOK_SECRET` 已配置（`webhookConfigured=true`）
- 至少一个 plan 价格已配置（任意 `ACADEMY_STARS_*` 为正整数，`enabled=true`）
- Webhook 已设置且 `allowed_updates` 包含 `pre_checkout_query`

### 1.5 结算/快照门禁（防价格漂移）

发布前要确认以下约束仍在：
- Invoice 仅接受 `snapshotId`（而不是 planKey）
- 支付金额来自 `order_pricing_snapshots.final_payable_amount_minor`
- `payment_orders.pricing_snapshot_id` 唯一（1 个快照只能创建 1 个订单）
- 允许的状态流转：`preview → locked → paid/refunded`

## 2. 上线观察项（必须建立日常监控）

### 2.1 支付链路

- `payment_transactions` 的状态分布：`paid/pending/refunded/failed`
- `pre_checkout_query` 拒绝率（应用日志或 Telegram 回调错误统计）
- invoice 创建 409（快照非 locked / 已存在订单）的比例

### 2.2 结算快照

建议定期检查：
- `order_pricing_snapshots` 状态分布：`preview/locked/paid/refunded`
- `locked` 卡住比例（长时间未支付的 locked 快照）
- `final_payable_amount_minor <= original_amount_minor` 恒成立

### 2.3 积分与抵扣

- 积分抵扣是否被封顶：`credits_redeemed_amount_minor <= floor((original_amount_minor - main_discount_amount_minor)/2)`
- 每个 `paid` 快照若存在 `credits_redeemed_points > 0`，应存在且仅存在 1 条 `credits_ledger` 的抵扣分录（business_key 幂等）

### 2.4 邀请奖励

- `invitations` 状态分布：`pending/qualified`
- `qualified` 数增长与 `credits_ledger.reward_type='referral_reward'` 增长的对应关系
- 是否存在重复发奖（理论上业务键唯一不应出现）

## 3. 回滚策略（分级）

### 3.1 立即止血（不改代码）

**目标：停止新增交易/新增激励，保留可访问性与历史可查。**

- 关闭支付：
  - 将所有 `ACADEMY_STARS_*` 环境变量置空或非正整数
  - 或暂时移除 `TELEGRAM_BOT_TOKEN`
  - 结果：`getPaymentCatalog().enabled=false`，前端不再提供 Stars 支付入口
- 关闭活动主优惠：
  - 通过 Admin API 将 `campaign_rewards.status` 置为非 active，或将 `end_at` 调到当前时间之前
  - 结果：主优惠不再生效，结算回到“仅原价/仅积分（如允许）”
- 临时关闭积分抵扣（保留积分累积）：
  - 将活动配置为 `stackable_with_credits=false`（如果你正在跑活动折扣且出现叠加风险）

### 3.2 交易修复（数据一致性）

**目标：修复“支付成功但状态没落库 / 积分抵扣未扣 / 重复扣减”**

- 快照卡在 locked：
  - 优先排查 Telegram webhook 可达性与 secret
  - 若确实支付已成功但未落库：以 `payment_transactions` 为准补齐快照状态为 paid，并补齐抵扣分录（必须使用同一 business_key）
- 积分重复扣减：
  - 检查 `credits_ledger.business_key = credits_redeem:${userId}:${pricingSnapshotId}` 是否重复（理论上不应）
  - 发现异常时，通过写 `revoke` 分录撤销（禁止直接 delete）

### 3.3 版本回滚（改代码/回退发布）

**目标：回退到上一稳定版本，同时保留已产生的交易数据。**

- 回滚应遵守：
  - 不回滚数据库迁移文件本身（迁移一旦上线，不回退 schema）
  - 仅回退 API 行为与前端入口（例如禁用某些 route 或隐藏支付入口）
- 回滚后必须复核：
  - Invoice 与 webhook 的幂等键是否仍匹配（避免重复记账/重复发奖）

## 4. 推荐上线命令（本地/CI 可复用）

仓库根目录执行：

```bash
node scripts/release-check.mjs
```

