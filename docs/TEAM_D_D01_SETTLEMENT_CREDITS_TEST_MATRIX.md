# ACAD-D-001：结算与积分测试矩阵

## 1. 范围与口径

**目标**
- 建立对“结算序列 + 抵扣上限 + 不可叠加”这三条硬约束的回归矩阵，确保后续迭代不会引入“偷偷重算价格 / 叠加优惠 / 超额抵扣”的回归。

**本矩阵覆盖的主线结算序列**
- Original Price（原价） → Main Offer（主优惠：campaign discount） → Credits Deduction（积分抵扣，最多 50%） → Final Payable（应付）

**关键规则（必须保持）**
- 积分抵扣上限：单订单最多抵扣 `amount_after_main_discount` 的 50%
- 唯一激励 / 不可叠加：当活动配置 `stackable_with_credits=false` 时，即便用户勾选抵扣也不允许使用积分
- 快照是支付事实源：支付金额来自 `order_pricing_snapshots.final_payable_amount_minor`，而不是结算时重新计算

## 2. 变量定义（用于测试用例统一表达）

| 变量 | 含义 |
|---|---|
| `P` | 原价（minor，Stars） |
| `D` | 主优惠折扣额（minor） |
| `A` | 折后价：`A = max(0, P - D)` |
| `CmaxAmt` | 最大可抵扣金额：`CmaxAmt = floor(A / 2)` |
| `usdCents` | `usdPrice` 解析成 cents（如 `$9.9` → 990） |
| `CmaxPts` | 最大可抵扣积分：`CmaxPts = floor(CmaxAmt * usdCents / P)` |
| `B` | 可用积分余额（points） |
| `R` | 实际抵扣积分：`R = min(B, CmaxPts)`（仅在允许抵扣时） |
| `Camt` | 抵扣金额：`Camt = floor(R * P / usdCents)`，并再 `min(Camt, CmaxAmt)` 进行封顶 |
| `Pay` | 应付：`Pay = max(0, P - D - Camt)` |

## 3. 用例矩阵（必须覆盖）

### 3.1 基础：无活动

| Case ID | 输入 | 预期 |
|---|---|---|
| D01-B-001 | `redeemCredits=false` | `R=0`，`Pay=P` |
| D01-B-002 | `redeemCredits=true` 且 `B=0` | `R=0`，`Pay=P` |
| D01-B-003 | `redeemCredits=true` 且 `0 < B < CmaxPts` | `R=B`，`0 < Camt <= CmaxAmt`，`Pay=P-Camt` |
| D01-B-004 | `redeemCredits=true` 且 `B >= CmaxPts` | `R=CmaxPts`，`Camt=CmaxAmt`，`Pay=P-CmaxAmt` |

### 3.2 主优惠：活动折扣 + 允许叠加积分

| Case ID | 输入 | 预期 |
|---|---|---|
| D01-C-001 | 活动折扣 `D>0`，`stackable_with_credits=true`，`redeemCredits=true` | 积分上限按 `A=P-D` 计算：`CmaxAmt=floor((P-D)/2)`；`Pay=P-D-Camt` |
| D01-C-002 | 活动折扣 `D>0`，`stackable_with_credits=true`，`redeemCredits=false` | `R=0`；`Pay=P-D` |

### 3.3 主优惠：活动折扣 + 禁止叠加积分（不可叠加原则）

| Case ID | 输入 | 预期 |
|---|---|---|
| D01-N-001 | 活动折扣 `D>0`，`stackable_with_credits=false`，`redeemCredits=true` | 必须强制 `R=0`；`Pay=P-D` |
| D01-N-002 | 活动折扣 `D>0`，`stackable_with_credits=false`，`redeemCredits=false` | `R=0`；`Pay=P-D` |

### 3.4 负面与边界

| Case ID | 输入 | 预期 |
|---|---|---|
| D01-E-001 | `usdPrice` 无法解析（空串/非数字/<=0） | 必须抛错，拒绝进入结算 |
| D01-E-002 | `D >= P`（折扣异常） | `A=0`，`CmaxAmt=0`，`Pay=0` |
| D01-E-003 | 积分换算造成 `Camt > CmaxAmt` | 必须二次封顶为 `CmaxAmt`，防超额抵扣 |

## 4. 回归门禁（本仓库当前做法）

由于当前 mini-app 仅使用 `node:test` 做“构建 + 静态回归断言”，因此本任务对应的工程门禁为：
- 在 `mini-app/tests/rendered-html.test.mjs` 增加关键实现断言（序列、封顶、不可叠加、快照字段写入）
- `npm test` 必须通过（含 `npm run build`）
