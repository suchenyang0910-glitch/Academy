# 2026-09-14 作业提交失败修复

线上：143.198.192.193 /opt/academy，原基线 fad9275。

现象：Telegram 内提交 AI 作业显示 request_failed，/api/academy/submissions 返回 500。

证据：PostgreSQL 日志 2026-09-14 15:42:30 UTC 显示 COALESCE types text and timestamp with time zone cannot be matched。失败查询是 reminder_events.completed_at 的更新。该字段在迁移中定义为 TEXT，但 COALESCE 的另一个参数 CURRENT_TIMESTAMP 是 timestamptz。

修复：completed_at、clicked_at 两处改用 CAST(CURRENT_TIMESTAMP AS TEXT)。保留已有非空时间，无表结构或课程变更。

发布：从线上版本单独构建，只应用上述两行变更，重启 academy 进程。本地英语功能没有混入此次发布。

回滚备份：/opt/academy-hotfix-20260914/backup 保存原 academy-store.ts 与 dist。

验证：线上 PostgreSQL 确认空值可生成时间、已有值不被覆盖；独立生产构建成功；发布后首页、CSS、JavaScript 均返回 200 且类型正确；无认证 bootstrap 返回 401；部署产物包含修复 SQL。

限制：未代替用户提交真实作业，仍需本人重试完成带身份的端到端验收。提交流程先保存作业再更新提醒，此次失败可能留下已保存作业，不能把 500 等同于作业丢失。
