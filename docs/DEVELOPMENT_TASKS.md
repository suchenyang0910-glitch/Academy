# Academy 开发任务拆解

> 目的：把 [docs/ENGINEERING_EXECUTION_PLAN.md](file:///e:/academy/docs/ENGINEERING_EXECUTION_PLAN.md) 进一步拆成可直接开工的团队任务包。  
> 使用方式：每个 Team 以本文件作为每日开发任务来源，以 [docs\DEVELOPMENT_CHECKLIST.md](file:///e:/academy/docs/DEVELOPMENT_CHECKLIST.md) 作为阶段验收与上线门禁。

## 1. 总规则

所有 Team 开发前必须确认：

1. 已完整阅读 [REQUIREMENTS.md](file:///e:/academy/REQUIREMENTS.md)、[README.md](file:///e:/academy/README.md)、[docs/PROJECT_STRUCTURE.md](file:///e:/academy/docs/PROJECT_STRUCTURE.md)、[docs/ENGINEERING_EXECUTION_PLAN.md](file:///e:/academy/docs/ENGINEERING_EXECUTION_PLAN.md)；
2. 当前产品主线是 `mini-app/`，`bot/` 不再新增独立业务事实逻辑；
3. 结算、支付、积分、邀请必须遵守“统一结算服务 + 统一账本 + 单订单单主优惠”；
4. 活动必须配置化，不得硬编码；
5. 任何任务必须关联 [docs/TASK_REGISTRY.md](file:///e:/academy/docs/TASK_REGISTRY.md) 中的唯一任务编号后才可启动；
6. 每项任务完成后，必须更新共享进度板并完成对应 checklist 勾选。

## 2. Team A 任务包：Mini App 体验与业务流

负责模块：

- `mini-app/app/page.tsx`
- `mini-app/app/layout.tsx`
- `mini-app/app/globals.css`
- `mini-app/lib/i18n.ts`
- `mini-app/app/api/academy/bootstrap/route.ts`

### A-01 结算状态信息梳理

- 目标：确定前端需要展示的订阅、积分、邀请、订单结算字段；
- 输入：
  - Team B 提供的结算字段草案；
  - `REQUIREMENTS.md` 第 11、15、16 章；
- 输出：
  - 页面字段清单；
  - 状态文案清单；
  - 空态 / 错误态 / 到期态清单。

完成定义：

- 页面不再依赖推断字段；
- 所有金额、积分、折扣状态均来自服务端响应。

### A-02 Profile 中接入积分与订阅状态

- 目标：在个人页展示试用状态、订阅状态、积分余额、可抵扣额度、邀请进度；
- 输出：
  - Profile UI 更新；
  - i18n 文案键；
  - 状态映射表。

完成定义：

- 用户能看到当前积分余额和本次最多可抵扣额度；
- 到期、试用中、已付费、可续费状态展示正确；
- 不出现“免费天数奖励”旧文案。

### A-03 支付前结算预览界面

- 目标：让用户在支付前看到完整结算快照；
- 输入：
  - Team B 的 `pricing preview` API；
- 输出：
  - 原价、主优惠、积分抵扣、最终应付金额展示；
  - “本单最多抵扣 50%”提示；
  - 主优惠说明与不可叠加提示。

完成定义：

- 前端不自行计算价格；
- 结算预览展示与服务端返回完全一致；
- 异常状态下阻止错误支付。

### A-04 支付发起与结果反馈体验

- 目标：打通从结算预览到支付结果反馈的用户体验；
- 输入：
  - Team C 的支付发起与回调状态；
- 输出：
  - 支付中、成功、失败、重试提示；
  - 已使用积分和剩余积分更新反馈；
  - 失败后的恢复路径。

完成定义：

- 用户能明确知道是否支付成功；
- 支付失败不会错误扣减前端展示状态；
- 成功后订阅与积分界面刷新一致。

### A-05 邀请与积分规则展示统一

- 目标：让邀请奖励规则在 UI 中可解释；
- 输出：
  - 前 3 个有效邀请阶梯规则展示；
  - 第 4 个及之后固定 10% 展示；
  - 有效邀请条件展示；
  - 风险提示与发奖时点说明。

完成定义：

- 不再出现“邀请送 30 天免费使用”旧文案；
- 邀请规则、积分规则、支付规则用户可读。

### A-06 多语言文案复核

- 目标：确保支付、邀请、积分、试用相关文案符合第 16.1 章；
- 输出：
  - 中文优先文案；
  - 其他语言占位与缺失清单。

完成定义：

- 用户可见关键商业规则文案不缺失；
- 未审核译文不会覆盖正式中文文案。

## 3. Team B 任务包：核心服务、数据与结算

负责模块：

- `mini-app/lib/academy-store.ts`
- `mini-app/db/schema.ts`
- `mini-app/db/index.ts`
- `mini-app/postgres/*`
- `mini-app/drizzle/*`
- `mini-app/app/api/academy/*`

### B-01 扩展数据库 schema

- 目标：落地 `credits_ledger`、`campaign_rewards`、`order_pricing_snapshots`；
- 输出：
  - schema 变更；
  - Postgres 迁移；
  - 本地 D1/SQLite 对齐迁移；
  - 唯一约束与索引。

完成定义：

- 三张表结构与 `REQUIREMENTS.md` 一致；
- 唯一约束、业务键、时间字段完整；
- 本地迁移和 PostgreSQL 迁移均可执行。

### B-02 建立积分账本服务

- 目标：提供统一积分分录与余额聚合能力；
- 输出：
  - earn / hold / redeem / expire / revoke 账本写入逻辑；
  - 余额聚合查询；
  - 审计字段与业务键。

完成定义：

- 不需要单独“当前积分余额”字段也能正确计算余额；
- 撤销、退款、过期都通过新增分录实现；
- 重复请求不会重复记账。

### B-03 建立统一结算服务

- 目标：实现单订单单主优惠的统一定价逻辑；
- 输出：
  - 主优惠选择器；
  - 积分抵扣计算；
  - order pricing snapshot 持久化；
  - pricing rule version。

完成定义：

- 订单结算顺序符合 11.2.3；
- 任意订单只能命中一个主优惠；
- 积分抵扣不超过 50%；
- 所有金额可回放、可审计。

### B-04 结算预览与支付前锁定 API

- 目标：提供前端和支付发起所需的统一接口；
- 输出：
  - `GET/POST pricing preview`；
  - `lock pricing snapshot`；
  - snapshot version 校验。

完成定义：

- 没有结算快照不能发起支付；
- 预览和锁单使用同一套规则；
- 重试不会生成冲突快照。

### B-05 邀请返积分梯度结算

- 目标：实现前 3 个邀请阶梯、后续固定 10%；
- 输入：
  - `invitations`、首单支付状态、有效学习日统计；
- 输出：
  - 有效邀请资格判断；
  - 阶梯比例计算；
  - `credits_ledger` 发放分录；
  - 异常撤销能力。

完成定义：

- 只有“首单付费 + 7 天 3 个有效学习日”才发奖；
- 第 1/2/3 个邀请比例正确；
- 第 4 个及以后固定 10%；
- 不会重复发奖。

### B-06 活动配置能力最小版

- 目标：建立 `campaign_rewards` 的最小配置能力；
- 输出：
  - 活动创建、启停、版本字段；
  - 活动资格校验；
  - 是否可与积分抵扣并存逻辑。

完成定义：

- 活动必须来自表配置；
- 活动结束不能静默修改历史规则；
- 没有活动配置时系统仍能正常结算。

### B-07 Bootstrap / Profile / Payments API 对齐

- 目标：让 Team A、Team C 可以读取统一状态；
- 输出：
  - bootstrap 增加积分、订阅、活动资格、可抵扣额度；
  - payments invoice 接口接入结算快照；
  - profile 所需字段响应统一。

完成定义：

- 前端和支付不再使用散落字段；
- 所有状态口径一致。

## 4. Team C 任务包：Telegram、Bot 兼容与支付集成

负责模块：

- `bot/send_reminder.py`
- `bot/reminders.py`
- `bot/setup_webhook.py`
- `mini-app/app/api/telegram/webhook/route.ts`
- `mini-app/lib/telegram-payments.ts`

### C-01 Telegram 支付闭环接入

- 目标：把支付发起、预结账、支付成功、退款串起来；
- 输入：
  - Team B 的锁单与结算快照；
- 输出：
  - payment invoice 调用主线结算；
  - webhook 回调校验；
  - 支付状态同步；
  - 退款与撤销路径。

完成定义：

- 支付回调只消费快照，不重算价格；
- 重复回调不重复发奖励或延长订阅；
- 退款后积分与订阅状态可追溯修正。

### C-02 Bot 查询能力 API 化

- 目标：让 Bot 查询不再读 legacy SQLite；
- 输出：
  - `bot/academy_api.py` 或等价轻量 client；
  - reminder 运维入口继续通过主线 API 获取内容；
  - 不再保留 legacy CLI 壳层。

完成定义：

- `bot/send_reminder.py` 等运维脚本不再自己查 legacy 本地数据库；
- Bot 与 Mini App 返回同一业务口径。

### C-03 提醒链路收敛到主线状态

- 目标：让发送提醒时读取主线学习与订阅状态；
- 输出：
  - 提醒用户筛选逻辑调整；
  - 过期、已完成、不可写状态过滤；
  - 主线 API 或 DB 读取方案。

完成定义：

- 提醒不依赖 legacy 学习进度；
- 提醒等级与主线口径一致。

### C-04 停止 legacy 写入

- 目标：彻底冻结 legacy 本地数据库的新业务写入路径；
- 输出：
  - 写入点排查清单；
  - 替换为 API 调用或只读兼容；
  - legacy 注释或封禁措施。

完成定义：

- 不再有新学习数据写入 legacy SQLite；
- Bot 保持入口与过渡职责，不再演进业务逻辑。

## 5. Team D 任务包：测试、质量与发布

负责模块：

- `tests/*`
- `mini-app/tests/*`
- `scripts/start_local.ps1`
- `scripts/setup_local.ps1`
- `scripts/reset_local_learning.ps1`

### D-01 结算与积分测试矩阵

- 目标：建立支付、主优惠、积分抵扣的回归矩阵；
- 输出：
  - 单订单单主优惠测试；
  - 积分抵扣上限 50% 测试；
  - 重复回调幂等测试；
  - 退款与撤销测试。

完成定义：

- 所有关键结算分支均有自动化覆盖；
- 能证明“支付链路不重算价格”。

### D-02 邀请奖励与防刷测试矩阵

- 目标：覆盖有效邀请与积分发放边界；
- 输出：
  - 资格判断测试；
  - 第 1/2/3/4 个邀请比例测试；
  - 重复发奖测试；
  - 异常撤销测试。

完成定义：

- 发奖时机、比例、幂等、防刷覆盖完整；
- 无法通过简单重复请求刷奖励。

### D-03 Bot 回归测试迁移

- 目标：把 legacy Bot 测试从 SQLite 事实切到 API mock；
- 输出：
  - `tests/test_send_reminder.py` 等运维脚本测试更新；
  - API mock fixture；
  - legacy 边界用例。

完成定义：

- 测试可以证明 Bot 只是主线 API 的展示层；
- 不再把 SQLite 当作业务真相。

### D-04 本地启动与迁移验证脚本

- 目标：保证研发和测试环境可重复启动；
- 输出：
  - 启动脚本检查；
  - 迁移脚本检查；
  - reset 脚本检查；
  - 回归运行说明。

完成定义：

- 新 schema 和迁移能在本地顺利跑通；
- 本地重置不会破坏课程主数据。

### D-05 发布门禁与回滚预案

- 目标：建立上线前必须通过的检查；
- 输出：
  - 发布前测试门禁；
  - 数据回滚说明；
  - 支付回调观察项；
  - 风险观察 dashboard 字段。

完成定义：

- 上线前可以明确回答“是否可发版”；
- 线上异常时可快速定位支付、积分、邀请三条链路。

## 6. 跨团队依赖

### Team A 依赖

- 依赖 Team B 提供：
  - 结算预览字段；
  - 用户状态字段；
  - 积分余额与可抵扣额度接口。

### Team B 依赖

- 依赖 Team D 提供：
  - 迁移校验与回归覆盖；
- 依赖 Team C 提供：
  - 支付回调真实需求与 Telegram 字段。

### Team C 依赖

- 依赖 Team B 提供：
  - 锁单接口；
  - 结算快照结构；
  - 奖励回写策略。

### Team D 依赖

- 依赖 Team A/B/C 完成功能分支后提供：
  - 测试入口；
  - 样例数据；
  - 异常场景说明。

## 7. 每日推进规则

每个 Team 每天必须更新：

1. 当前在做的任务编号；
2. 当前阻塞属于“需求 / 数据 / 接口 / 支付 / 测试 / 运维”哪一类；
3. 是否影响本周 deadline；
4. 是否需要跨团队裁决。

推荐日同步格式：

```text
Team:
Today Task IDs:
Completed Yesterday:
Blockers:
Need From Other Teams:
ETA:
```

## 8. 完成顺序建议

推荐真实开工顺序：

1. Team B 先做 `B-01`、`B-02`、`B-03`、`B-04`
2. Team D 并行做 `D-01`、`D-04`
3. Team A 在 Team B 提供字段草案后启动 `A-01`、`A-02`、`A-03`
4. Team C 在 Team B 锁单接口稳定后启动 `C-01`、`C-02`
5. Team B 再完成 `B-05`、`B-06`、`B-07`
6. Team D 最后汇总 `D-02`、`D-03`、`D-05`

## 9. 删除建议

以下事项不进入当前开发任务：

- 新增免费天数奖励机制；
- 新增现金返还机制；
- 长期团购返利常驻化；
- 任何绕开 `credits_ledger` 的奖励方案；
- 任何绕开 `order_pricing_snapshots` 的支付实现。
