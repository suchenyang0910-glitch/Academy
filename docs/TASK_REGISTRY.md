# Academy 任务登记册（唯一任务编号）

> 规则：任何开发、测试、文档、迁移、发布相关工作，必须先在本登记册中创建唯一任务编号后才可启动；口头派活与无编号承接一律无效。  
> 关联：任务完成必须勾选 [docs/DEVELOPMENT_CHECKLIST.md](file:///e:/academy/docs/DEVELOPMENT_CHECKLIST.md) 中对应条目。

## 1. 状态定义

- `not_started`：已登记未开工
- `in_progress`：已开工
- `blocked`：阻塞中
- `in_review`：已提交评审
- `done`：完成并通过 checklist 验收

## 2. Phase 1–4 任务列表

| Task ID | Team | 对应任务包 | 标题 | 前置 Checklist | 交付物 | 状态 |
|---|---|---|---|---|---|---|
| ACAD-A-001 | A | A-01 | 结算状态信息梳理 | Kickoff + Team A A-01 | 字段清单、状态文案清单 | done |
| ACAD-A-002 | A | A-02 | Profile 接入积分与订阅状态 | Kickoff + Team A A-02 | Profile UI、i18n 文案键 | done |
| ACAD-A-003 | A | A-03 | 支付前结算预览界面 | Kickoff + Team A A-03 | 结算预览 UI | done |
| ACAD-A-004 | A | A-04 | 支付结果反馈体验 | Kickoff + Team A A-04 | 支付中/成功/失败状态反馈 | done |
| ACAD-A-005 | A | A-05 | 邀请与积分规则展示统一 | Kickoff + Team A A-05 | 邀请规则展示模块 | done |
| ACAD-A-006 | A | A-06 | 商业关键文案多语言复核 | Kickoff + Team A A-06 | 文案清单、缺失项清单 | done |
| ACAD-B-001 | B | B-01 | 新增 credits_ledger / campaign_rewards / order_pricing_snapshots schema 与迁移 | Kickoff + Team B B-01 | schema 变更、迁移脚本 | done |
| ACAD-B-002 | B | B-02 | 积分账本服务（记账与余额聚合） | Kickoff + Team B B-02 | 账本写入与查询能力 | done |
| ACAD-B-003 | B | B-03 | 统一结算服务（单订单单主优惠 + 积分抵扣 50%） | Kickoff + Team B B-03 | 结算逻辑、快照持久化 | done |
| ACAD-B-004 | B | B-04 | 结算预览与锁单 API | Kickoff + Team B B-04 | pricing preview、lock snapshot | done |
| ACAD-B-005 | B | B-05 | 邀请返积分梯度结算 | Kickoff + Team B B-05 | 有效邀请判断、发奖分录 | done |
| ACAD-B-006 | B | B-06 | 活动配置能力最小版（campaign_rewards） | Kickoff + Team B B-06 | 活动配置、资格校验 | done |
| ACAD-B-007 | B | B-07 | Bootstrap / Profile / Payments API 对齐 | Kickoff + Team B B-07 | bootstrap/payments 响应字段统一 | done |
| ACAD-C-001 | C | C-01 | Telegram Stars 支付闭环接入（不重算价格） | Kickoff + Team C C-01 | invoice/webhook/refund | done |
| ACAD-C-002 | C | C-02 | Bot 查询能力 API 化（不读 legacy SQLite） | Kickoff + Team C C-02 | bot api client、命令改造 | done |
| ACAD-C-003 | C | C-03 | 提醒链路收敛到主线状态 | Kickoff + Team C C-03 | 发送筛选与状态一致 | done |
| ACAD-C-004 | C | C-04 | 停止 legacy SQLite 写入 | Kickoff + Team C C-04 | 写入点封禁或替换 | done |
| ACAD-D-001 | D | D-01 | 结算与积分测试矩阵 | Kickoff + Team D D-01 | 回归测试用例 | done |
| ACAD-D-002 | D | D-02 | 邀请奖励测试矩阵 | Kickoff + Team D D-02 | 发奖/幂等/撤销用例 | done |
| ACAD-D-003 | D | D-03 | Bot 回归测试迁移到 API mock | Kickoff + Team D D-03 | Bot API mock 测试矩阵与脚本回归 | done |
| ACAD-D-004 | D | D-04 | 本地启动与迁移验证脚本复核 | Kickoff + Team D D-04 | 脚本可重复启动与迁移 | done |
| ACAD-D-005 | D | D-05 | 发布门禁与回滚预案 | Kickoff + Team D D-05 | 门禁、回滚、观察项 | done |
| ACAD-E-001 | E | E-01 | Legacy Bot / SQLite 彻底退役收口 | Kickoff + Team E E-01 | 只读兼容清单、删除/封禁清单、迁移说明 | done |
| ACAD-E-002 | E | E-02 | Legacy Bot / SQLite 物理归档删除 | Kickoff + Team E E-02 | 删除记录、文档更新、回归验证 | done |
| ACAD-E-003 | E | E-03 | Legacy 数据文件与 CLI 语义最终收口 | Kickoff + Team E E-03 | 数据文件清理、入口说明更新、回归验证 | done |
| ACAD-E-004 | E | E-04 | Bot 兼容壳层最小化 | Kickoff + Team E E-04 | CLI 收口、文档更新、回归验证 | done |
| ACAD-E-005 | E | E-05 | Bot 文本兼容面最小化 | Kickoff + Team E E-05 | 文本命令收口、文档更新、回归验证 | done |
| ACAD-E-006 | E | E-06 | Bot 文本兼容层物理折叠 | Kickoff + Team E E-06 | 模块删除、文档更新、回归验证 | done |
| ACAD-E-007 | E | E-07 | Bot CLI 最终收口到 reminder | Kickoff + Team E E-07 | 删除 `--text`、文档更新、回归验证 | done |
| ACAD-E-008 | E | E-08 | Legacy CLI 整体归档删除 | Kickoff + Team E E-08 | 删除 `bot/main.py`、文档更新、回归验证 | done |
| ACAD-E-009 | E | E-09 | Disabled legacy 写入脚本物理删除 | Kickoff + Team E E-09 | 删除 `scripts/add_note.py`、`scripts/save_lesson.py`、文档更新、回归验证 | done |
| ACAD-E-010 | E | E-10 | E 系列收口总审计 | Kickoff + Team E E-10 | 最终审计文档、口径修正、关闭建议 | done |
| ACAD-B-008 | B | B-08 | Runtime 远程执行增强第一段 | Kickoff + Team B B-08 | Flowise 远程执行探测、审计增强、回归验证 | done |

## 3. 本轮文档产出任务（已完成）

| Task ID | 标题 | 交付物 | 状态 |
|---|---|---|---|
| ACAD-PM-001 | 工程启动与分工计划 | [docs/ENGINEERING_EXECUTION_PLAN.md](file:///e:/academy/docs/ENGINEERING_EXECUTION_PLAN.md) | done |
| ACAD-PM-002 | 开发任务拆解 | [docs/DEVELOPMENT_TASKS.md](file:///e:/academy/docs/DEVELOPMENT_TASKS.md) | done |
| ACAD-PM-003 | 开发检查清单 | [docs/DEVELOPMENT_CHECKLIST.md](file:///e:/academy/docs/DEVELOPMENT_CHECKLIST.md) | done |
| ACAD-B-DOC-001 | Team B schema 草案 | [docs/TEAM_B_SCHEMA_DRAFT.md](file:///e:/academy/docs/TEAM_B_SCHEMA_DRAFT.md) | done |
| ACAD-B-DOC-002 | Team B API 接口定义 | [docs/TEAM_B_API_SPEC.md](file:///e:/academy/docs/TEAM_B_API_SPEC.md) | done |
| ACAD-OPS-001 | 任务登记册 | [docs/TASK_REGISTRY.md](file:///e:/academy/docs/TASK_REGISTRY.md) | done |
