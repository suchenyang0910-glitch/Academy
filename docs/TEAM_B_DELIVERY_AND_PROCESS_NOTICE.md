# Team B 技术文档交付与流程规范更新说明

## 已完成文档产出及关联任务

1. **Schema 草案文档**：[TEAM_B_SCHEMA_DRAFT.md](file:///e:/academy/docs/TEAM_B_SCHEMA_DRAFT.md)  
   - 已完成的核心覆盖内容：包含 `credits_ledger`、`campaign_rewards`、`order_pricing_snapshots` 三张核心数据表的全量字段定义、数据库索引配置、数据完整性约束要求，以及上述三张表与现有核心表 `payment_orders` 的最小关联逻辑建议  
   - 对应正式任务编号（任务登记册已标记完成）：`ACAD-B-DOC-001`

2. **API 接口定义文档**：[TEAM_B_API_SPEC.md](file:///e:/academy/docs/TEAM_B_API_SPEC.md)  
   - 已完成的核心覆盖内容：包含 `pricing preview`、`lock snapshot`、`create invoice`、`credits balance`、`credits ledger`、`eligible campaign` 接口及 `bootstrap` 扩展字段的完整接口定义  
   - 对应正式任务编号（任务登记册已标记完成）：`ACAD-B-DOC-002`

3. **本轮所有文档产出任务统一登记路径**：详见 [TASK_REGISTRY.md](file:///e:/academy/docs/TASK_REGISTRY.md)

## 强制流程约束更新

所有团队成员必须严格执行以下流程规范，彻底废除原有不合规的工作习惯：

1. 永久删除「仅通过口头派工即可启动开发任务」的默认工作模式，所有开发、改造类任务必须依托正式登记的任务编号下达，无正式任务编号的工作一律不得启动
2. 永久关闭「未完成 checklist 校验也可执行代码合并/版本发布」的特权通道，所有合并、发布操作必须通过完整的 checklist 合规校验，任何岗位的人员都不得突破该流程要求

## 执行入口

- 任务登记册（唯一任务编号）：[TASK_REGISTRY.md](file:///e:/academy/docs/TASK_REGISTRY.md)
- 开发检查清单（合并/发布门禁）：[DEVELOPMENT_CHECKLIST.md](file:///e:/academy/docs/DEVELOPMENT_CHECKLIST.md)
- 工程执行计划（含工作规范条款）：[ENGINEERING_EXECUTION_PLAN.md](file:///e:/academy/docs/ENGINEERING_EXECUTION_PLAN.md)
