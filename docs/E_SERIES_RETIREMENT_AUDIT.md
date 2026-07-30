# ACAD-E-010：E 系列收口总审计

## 1. 审计目的

确认 `ACAD-E-001` 到 `ACAD-E-009` 是否已经把 legacy Bot / SQLite / CLI 路径从“仍可能继续长业务”的状态，收口到“只保留必要运维脚本或历史说明”的状态。

本审计只回答三件事：

1. 哪些 legacy 风险已经归零；
2. 哪些对象仍保留，但属于合理保留；
3. E 系列是否还需要继续新开删除任务。

## 2. 审计结论

### 2.1 已归零的风险

以下风险已被视为关闭：

- legacy SQLite 业务写入口：已删除或封禁完成；
- legacy CLI 兼容入口：已整体归档删除；
- `bot/main.py` / `bot/commands.py` 这类易误扩展的壳层：已删除；
- `scripts/add_note.py` / `scripts/save_lesson.py` 这类旧写入脚本：已删除；
- `bot/database.py`：已删除；
- 仓库主路径中的产品数据库文件：已删除。

### 2.2 合理保留对象

以下对象仍保留，但判断为合理：

| 路径 | 当前角色 | 是否应继续存在 |
|---|---|---|
| `bot/send_reminder.py` | reminder 运维发送脚本 | 保留 |
| `bot/setup_webhook.py` | Telegram webhook 运维脚本 | 保留 |
| `bot/reminders.py` | reminder 文案选择器 | 保留 |
| `bot/academy_api.py` | Bot 调用主线 API 的轻量 client | 保留 |
| `mini-app/drizzle/*` | 本地 D1 / SQLite 迁移快照 | 保留 |
| `mini-app/scripts/import-sqlite-to-postgres.mjs` | 历史数据导入工具 | 保留 |

这些对象的共同特征是：它们不再作为产品事实源，只承担运维、兼容迁移或本地开发职责。

### 2.3 剩余风险判断

当前最大剩余风险已不再是代码，而是**文档和认知层仍可能把 `bot/` 理解成“还能继续长业务”的地方**。

代码层面，legacy 入口已经足够轻：

- `bot/` 仅剩 reminder / webhook / API bridge；
- Telegram 文本命令已经由 `mini-app/lib/telegram-payments.ts` 主线处理；
- legacy CLI 已不存在。

因此，E 系列的主要目标已经完成。

## 3. 本轮核查证据

### 3.1 当前 `bot/` 目录

当前 `bot/` 仅剩：

- `academy_api.py`
- `reminders.py`
- `send_reminder.py`
- `setup_webhook.py`

未发现 `main.py`、`commands.py`、`database.py` 等 legacy 业务入口残留。

### 3.2 当前 `scripts/` 目录

当前顶层 `scripts/` 仅剩：

- `release-check.mjs`
- `reset_local_learning.ps1`
- `run-reminder-dispatch.sh`
- `setup_local.ps1`
- `start_local.ps1`

未发现 `add_note.py`、`save_lesson.py`、`init_db.py` 等 legacy 写入脚本残留。

### 3.3 当前 Telegram 命令事实来源

当前 Telegram 文本命令由 `mini-app/lib/telegram-payments.ts` 处理，仓库中可确认的命令面为：

- `/academy`
- `/academy today`
- `/academy pause`
- `/academy resume`
- `/paysupport`

这说明 Bot 命令主链路已经回到 `mini-app`，而不是 legacy CLI。

## 4. 删除建议

### 4.1 不建议继续删除的对象

当前不建议继续删除：

- `bot/send_reminder.py`
- `bot/setup_webhook.py`
- `bot/reminders.py`
- `bot/academy_api.py`
- 本地 SQLite / D1 迁移与导入脚本

原因是这些对象仍具有明确的运维、迁移或本地开发价值。

### 4.2 何时才适合继续删除

只有在以下条件同时满足时，才适合进一步删除剩余 `bot/` 运维脚本：

1. reminder 发送改由统一服务或任务平台接管；
2. webhook 配置不再依赖本地脚本；
3. 团队确认不再需要独立的 Bot 运维脚本调试方式。

在此之前，继续删除的商业收益不高。

## 5. 最终判断

E 系列从 `ACAD-E-001` 到 `ACAD-E-009` 已经完成了“代码收口”的核心目标；`ACAD-E-010` 完成的是“认知收口”与“关闭建议”。

结论如下：

- **E 系列可以视为完成态；**
- **不建议继续机械新增 E-011 之类的删除任务；**
- **后续若再发现 legacy 风险，应按独立问题单处理，而不是继续作为一条常驻收口线维护。**
