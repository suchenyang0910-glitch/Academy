# Academy 工程启动与团队分工计划

> 生效日期：2026-07-25  
> 目标：将当前 `REQUIREMENTS.md`、`README.md` 与 `docs/PROJECT_STRUCTURE.md` 中已确认的产品、结算、数据与边界规则，正式转化为可执行的研发分工、deadline、同步机制与验收标准。

## 1. 工程启动原则

1. 当前产品主线为 `mini-app/`，`bot/` 仅允许作为 Telegram 入口、提醒发送器与过渡兼容层存在；
2. 所有学习、支付、邀请、积分、提醒、订阅与结算事实源统一以 `mini-app/app/api/academy/*`、`mini-app/lib/academy-store.ts`、`mini-app/db/schema.ts`、`mini-app/db/index.ts` 为准；
3. 常驻营销激励仅允许 `Academy Credits` 一套底座，禁止新建“免费天数”“现金返还”“长期团购返利”等并行机制；
4. 单用户、单订单只允许一个主优惠策略；积分抵扣是支付工具，不计入第二主优惠；
5. 所有团队开发必须围绕统一数据模型、统一结算服务、统一 API 和统一验收标准推进。

## 1.1 工作规范（强制执行）

1. 所有工作必须先在 [docs/TASK_REGISTRY.md](file:///e:/academy/docs/TASK_REGISTRY.md) 登记并获得唯一任务编号后才可启动；不携带任务编号的口头派活与任务承接一律无效；
2. 所有技术产出必须完成对应流程的 checklist 校验环节；跳过 [docs/DEVELOPMENT_CHECKLIST.md](file:///e:/academy/docs/DEVELOPMENT_CHECKLIST.md) 的“先写了再说”开发模式一律不允许合并或发布。

配套说明：

- Team B 文档交付与流程规范更新说明：[TEAM_B_DELIVERY_AND_PROCESS_NOTICE.md](file:///e:/academy/docs/TEAM_B_DELIVERY_AND_PROCESS_NOTICE.md)

## 2. 开发前强制对齐资料

所有参与开发的工程师必须在开始编码前完整阅读以下文档：

1. [REQUIREMENTS.md](file:///e:/academy/REQUIREMENTS.md)
2. [README.md](file:///e:/academy/README.md)
3. [docs/PROJECT_STRUCTURE.md](file:///e:/academy/docs/PROJECT_STRUCTURE.md)
4. 本文档 [docs/ENGINEERING_EXECUTION_PLAN.md](file:///e:/academy/docs/ENGINEERING_EXECUTION_PLAN.md)

强制对齐内容：

- 产品目标：Telegram Bot + Mini App 学习监督闭环；
- 当前主线：`mini-app/`；
- legacy 边界：`bot/database.py` 与 `bot/main.py` 已退役删除，仅保留 reminder / webhook 运维脚本；
- 商业规则：试用、订阅、邀请返积分、单订单单主优惠、积分抵扣上限 50%；
- 数据规则：`credits_ledger`、`campaign_rewards`、`order_pricing_snapshots`；
- 技术规则：统一结算、账本优先、快照先于支付、活动配置化、默认不可叠加。

## 3. 工程团队正式分工

### Team A：Mini App 体验与业务流团队

负责范围：

- `mini-app/app/page.tsx`
- `mini-app/app/layout.tsx`
- `mini-app/app/globals.css`
- `mini-app/lib/i18n.ts`
- `mini-app/app/api/academy/bootstrap/route.ts`

核心交付：

1. Today / Courses / Notes / Progress / Profile 的稳定体验；
2. 试用、订阅状态、积分余额、可抵扣额度、邀请状态的前端呈现；
3. 订单结算预览页与支付前确认信息；
4. 所有用户端文案与状态提示和商业规则保持一致。

禁止事项：

- 不得在前端自行计算优惠、积分或应付金额；
- 不得在前端硬编码团购、返现、免费天数等活动逻辑。

### Team B：核心服务、数据与结算团队

负责范围：

- `mini-app/lib/academy-store.ts`
- `mini-app/db/schema.ts`
- `mini-app/db/index.ts`
- `mini-app/postgres/*`
- `mini-app/drizzle/*`
- `mini-app/app/api/academy/*`

核心交付：

1. `credits_ledger`、`campaign_rewards`、`order_pricing_snapshots` 数据模型落地；
2. 统一订单结算服务；
3. 单订单单主优惠、积分抵扣上限 50%、奖励异步发放、幂等保障；
4. 邀请返积分梯度结算与审计日志；
5. PostgreSQL 为唯一生产事实源。

禁止事项：

- 不得直接维护可变“当前积分余额”作为唯一事实源；
- 不得在支付回调、脚本或单独 API 中重复实现一套价格逻辑；
- 不得绕过结算快照直接发起支付或写奖励。

### Team C：Telegram、Bot 兼容与支付集成团队

负责范围：

- `bot/send_reminder.py`
- `bot/reminders.py`
- `bot/setup_webhook.py`
- `mini-app/app/api/telegram/webhook/route.ts`
- `mini-app/lib/telegram-payments.ts`

核心交付：

1. Bot 仅保留入口、提醒与 webhook 相关职责；
2. Bot 查询能力逐步改为调用主线 API；
3. Telegram Stars 支付、预结账、支付回调与退款闭环；
4. 提醒发送链路与主线学习状态、订阅状态保持一致。

禁止事项：

- 不得恢复 `bot/database.py`、`bot/main.py` 或重新引入 legacy CLI 业务能力；
- 不得让 Bot 成为新的业务事实源。

### Team D：测试、质量与发布团队

负责范围：

- `tests/*`
- `mini-app/tests/*`
- `scripts/start_local.ps1`
- `scripts/setup_local.ps1`
- `scripts/reset_local_learning.ps1`

核心交付：

1. 冒烟测试、回归测试、支付结算测试、邀请奖励测试；
2. legacy Bot 测试向 API mock 迁移；
3. 本地启动、迁移、回归验证脚本标准化；
4. 发布门禁、验收清单、上线回滚预案。

禁止事项：

- 不得仅验证 happy path；
- 不得跳过幂等、重试、退款、重复回调、活动冲突等边界测试。

## 4. 开发阶段与 deadlines

## 阶段 0：工程启动与强制对齐

- 时间：2026-07-25 至 2026-07-26
- 负责人：各团队 TL
- 交付：
  - 全员阅读并确认上述 4 份文档；
  - 输出每个团队的风险清单与依赖清单；
  - 建立每日同步机制；
  - 确认不再新增 legacy 双轨逻辑。

验收标准：

- 每个团队明确负责模块、输入输出与阻塞点；
- 对 `mini-app` 主线、`bot` legacy 边界、营销与结算原则无歧义。

## 阶段 1：数据模型与统一结算底座

- 时间：2026-07-27 至 2026-08-02
- 主责：Team B
- 协同：Team D
- 交付：
  - `credits_ledger` schema 与迁移；
  - `campaign_rewards` schema 与迁移；
  - `order_pricing_snapshots` schema 与迁移；
  - 统一结算服务 API；
  - 支付前结算预览与幂等业务键设计。

验收标准：

- 任意订单可生成唯一快照；
- 任意积分余额可由账本重算；
- 任意活动必须来自配置表；
- 结算、支付、奖励回写流程具备幂等保护。

## 阶段 2：前端接入与用户可见结算流

- 时间：2026-08-03 至 2026-08-09
- 主责：Team A
- 协同：Team B、Team D
- 交付：
  - 结算预览 UI；
  - 积分余额与可抵扣额度展示；
  - 订阅、邀请、积分文案统一；
  - 到期、续费、抵扣、支付前确认流程。

验收标准：

- 前端不自算价格；
- 用户可清楚看到原价、主优惠、积分抵扣和最终应付金额；
- 所有关键状态与服务端返回一致。

## 阶段 3：Telegram 支付与 Bot 边界收敛

- 时间：2026-08-10 至 2026-08-16
- 主责：Team C
- 协同：Team B、Team D
- 交付：
  - Telegram 支付闭环接入；
  - Bot 查询逻辑切到主线 API；
  - legacy SQLite 写入停止；
  - 提醒链路改为读取主线状态。

验收标准：

- Bot 不再写学习事实数据；
- 支付回调只依赖结算快照；
- 提醒、订阅、积分口径统一。

## 阶段 4：邀请返积分、活动配置与回归上线

- 时间：2026-08-17 至 2026-08-23
- 主责：Team B
- 协同：Team A、Team C、Team D
- 交付：
  - 邀请返积分梯度逻辑；
  - `campaign_rewards` 管理能力最小版；
  - 结算回归测试、支付回归测试；
  - 上线清单与灰度发布方案。

验收标准：

- 前 3 个有效邀请梯度结算正确；
- 第 4 个及后续恢复固定 10%；
- 单次抵扣上限 50% 生效；
- 所有奖励、核销、退款与撤销可审计。

## 5. 每日进度同步机制

每日固定机制：

1. 每天 10:00 进行 15 分钟站会；
2. 每个团队只回答 3 个问题：
   - 昨天完成了什么；
   - 今天要交付什么；
   - 当前阻塞是什么；
3. 每天 18:00 更新一次共享进度板；
4. 所有阻塞必须标明归属团队、影响范围、预计解除时间；
5. 同一阻塞持续超过 24 小时，自动升级给项目 TL；
6. 同一阻塞持续超过 48 小时，必须调整范围、顺序或资源，不允许静默拖延。

共享进度板字段：

- 模块
- 负责人
- 当前状态
- 本日完成
- 明日计划
- 阻塞项
- 风险级别
- 预计完成时间

## 6. 开发阻塞点识别与升级规则

P0 阻塞：

- 数据模型无法确定；
- 结算规则有歧义；
- 支付回调无法闭环；
- `bot/` 与 `mini-app/` 边界重新混淆；
- 影响试用、付费、邀请、积分、学习提交任一主链路。

处理规则：

1. P0 阻塞出现后 2 小时内必须同步；
2. 24 小时内给出临时方案或降级方案；
3. 超过 48 小时未解除，必须由架构负责人直接裁决；
4. 任何人不得私自通过新增第二套数据口径绕过阻塞。

## 7. 交付标准与验收门禁

所有团队共同遵守以下交付标准：

1. 功能必须与 `REQUIREMENTS.md` 一致，不得自行扩 scope；
2. 所有新增表结构必须有迁移脚本；
3. 所有支付、结算、奖励链路必须幂等；
4. 所有活动必须配置化，不得硬编码；
5. 所有关键接口必须有异常、重试与审计日志；
6. 所有用户可见规则必须能在 UI 中解释清楚；
7. 测试必须覆盖：
   - 单订单单主优惠；
   - 积分抵扣上限 50%；
   - 邀请返积分梯度；
   - 重复回调与重复发奖；
   - 活动过期与撤销；
   - legacy Bot 不再写主线数据。

发布前最终验收清单：

- 支付成功后订阅状态正确；
- 邀请奖励只在满足有效邀请条件后发放；
- 订单快照、账本分录、支付记录可相互追溯；
- 前端展示金额与服务端结算金额一致；
- Bot 仅做入口与提醒，不再承载新业务事实。

## 8. 立即启动指令

从本文档生效起，项目开发按以下顺序立即启动：

1. 全员完成文档对齐；
2. Team B 先行启动数据模型、结算服务与迁移；
3. Team A 并行准备结算预览与积分展示 UI；
4. Team C 准备 Telegram 支付闭环和 Bot API 兼容改造；
5. Team D 同步搭建回归测试与发布门禁；
6. 每日执行站会、阻塞升级、共享进度更新；
7. 任何偏离统一结算、统一账本、统一主优惠原则的实现，一律不允许合并。
