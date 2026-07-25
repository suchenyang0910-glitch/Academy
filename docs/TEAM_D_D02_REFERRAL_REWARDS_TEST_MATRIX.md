# ACAD-D-002：邀请奖励测试矩阵

## 1. 目标与边界

**目标**
- 为“有效邀请判定 + 梯度返积分 + 幂等发奖”建立回归矩阵，防止后续迭代引入套利通道或重复发奖。

**本矩阵覆盖对象**
- `invitations` 状态从 `pending → qualified`
- `credits_ledger` 写入 `reward_type = referral_reward` 的发奖分录

**不在本任务范围**
- Bot 侧展示文案与 UI 体验（属于 Team A）
- 活动折扣与积分抵扣叠加（属于 ACAD-D-001）

## 2. 关键规则（必须保持）

### 2.1 有效邀请（qualified）判定

被邀请人满足以下全部条件后，邀请记录才从 `pending` 变为 `qualified`：
- 已完成选课（存在至少 1 门 `enrollments.active = 1`）
- 首单支付成功（`payment_transactions.status='paid'` 且 `paid_at >= invitation.created_at`）
- 首单后 7 天窗口内，至少 3 个有效学习日  
  - 有效学习日定义：同一天内完成的课程数 `>= active course count`（用于防止只完成其中一门课程刷天数）

### 2.2 梯度返积分（只对邀请人）

- 第 1/2/3 个有效邀请：返首单实付金额的 10% / 15% / 20% 积分
- 第 4 个及之后：固定 10%
- 记账单位：`POINTS_PER_USD = 100`
- 金额锚点：优先使用 plan 的 `usdPrice` 与 stars 锚点换算，避免被支付金额偏差打穿

### 2.3 幂等（必须）

- 每条邀请最多发奖一次，`credits_ledger.business_key` 必须唯一
- 业务键规范：`referral_reward:${inviterUserId}:${invitationId}`

## 3. 用例矩阵

### 3.1 资格判定（pending → qualified）

| Case ID | 前置 | 输入 | 预期 |
|---|---|---|---|
| D02-Q-001 | invited 未选课 | 有支付 | 不应 qualified |
| D02-Q-002 | invited 已选课 | 无支付 | 不应 qualified |
| D02-Q-003 | invited 已选课且有支付 | `paid_at < created_at` | 不应 qualified |
| D02-Q-004 | invited 已选课且有支付 | 7 天内有效学习日 < 3 | 不应 qualified |
| D02-Q-005 | invited 已选课且有支付 | 7 天内有效学习日 ≥ 3 | 应 qualified 且 `qualified_at` 写入 |

### 3.2 发奖与梯度

| Case ID | qualified 计数 | 预期 rate | 预期 reward_type |
|---|---:|---:|---|
| D02-R-001 | 1 | 10% | referral_reward |
| D02-R-002 | 2 | 15% | referral_reward |
| D02-R-003 | 3 | 20% | referral_reward |
| D02-R-004 | 4+ | 10% | referral_reward |

### 3.3 幂等

| Case ID | 输入 | 预期 |
|---|---|---|
| D02-I-001 | 同一邀请重复触发结算 | `credits_ledger` 仅 1 条记录（business_key 冲突 do nothing） |

### 3.4 统计字段一致性

| Case ID | 输入 | 预期 |
|---|---|---|
| D02-S-001 | qualified=0 | `nextRewardRemaining` 不应出现 3 |
| D02-S-002 | qualified=3 | `nextRewardRemaining` 应为 0 |

## 4. 回归门禁（本仓库当前做法）

由于当前 mini-app 以 `node:test` 做构建型回归，工程门禁为：
- 在 `mini-app/tests/rendered-html.test.mjs` 增加关键实现断言（资格 SQL、梯度、businessKey、nextRewardRemaining）
- `npm test` 必须通过

