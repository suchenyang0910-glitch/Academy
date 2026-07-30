# ACAD-E-001：Legacy Bot / SQLite 退役收口计划

## 1. 目标

把 `bot/` 与 legacy 本地数据目录从“可能继续承载业务逻辑”的状态，收口成：

- Bot 只作为 Telegram 入口或运维辅助；
- 业务状态只来自 `mini-app` API；
- legacy SQLite 不再具备任何可用的业务写入口。

## 2. 收口原则

1. 不再新增任何 `bot.database` 写入或读取产品逻辑。
2. 不再在 `data/` 目录中保存产品运行数据库。
3. Bot 查询、记笔记、提醒一律经 `bot/academy_api.py` 调用主线 API。
4. 第一轮先封禁和标注，不做大规模物理删除，避免误删运维入口。

## 3. 扫描结果分类

### 3.1 必删（已进入物理删除范围）

- `scripts/init_db.py`
  - 价值判断：只服务于 14 天单机 SQLite 原型，已不属于当前产品。
  - 当前状态：已删除（ACAD-E-002）。
- `data/academy.db`
  - 价值判断：仅是历史遗留数据库文件，不可再作为产品事实源。
  - 当前状态：已从仓库主路径删除（ACAD-E-003）。
- `bot/database.py`
  - 价值判断：历史 SQLite 读写层，已不再被 Bot 主路径调用。
  - 当前状态：已删除（ACAD-E-002）。

### 3.2 必封禁（本轮立即失效）
- `scripts/add_note.py`
  - 当前状态：已删除（ACAD-E-009）。
- `scripts/save_lesson.py`
  - 当前状态：已删除（ACAD-E-009）。

### 3.3 可保留只读兼容 / 运维辅助

- `bot/academy_api.py`
  - 作用：Bot 与 mini-app 主线 API 的唯一桥接层。
- `bot/send_reminder.py`
  - 作用：提醒发送器；通过主线 API 拉取提醒内容，不读 legacy SQLite。
- `bot/setup_webhook.py`
  - 作用：Telegram webhook 运维工具。

## 4. 本轮代码动作

1. 在 `TASK_REGISTRY.md` 正式登记 `ACAD-E-001`。
2. 修正文档/注释，明确：
   - `bot/send_reminder.py` 与 `bot/academy_api.py` 走主线 API
3. 在 ACAD-E-002 中已删除 `bot/database.py` 与 `scripts/init_db.py`。
4. 保留运维型 Bot 工具，不做物理删除。
5. 在 ACAD-E-005 中把 legacy 文本兼容层收口到“今日摘要 + 快速记笔记”。
6. 在 ACAD-E-006 中把 `bot/commands.py` 物理折叠进 `bot/main.py` 并删除独立模块。
7. 在 ACAD-E-007 中删除 `bot/main.py` 的 `--text` 入口，仅保留 reminder 运维入口。
8. 在 ACAD-E-008 中删除 `bot/main.py`，以 `bot/send_reminder.py` 作为唯一 reminder 运维脚本。

## 5. 最小验收标准

- 仓库内不存在可用的 legacy SQLite 业务写入口。
- Bot 业务查询与写入只通过 `bot/academy_api.py` 访问主线。
- 文档明确哪些文件后续可以直接删除，哪些只保留运维用途。

## 6. 下一轮可继续清理的对象

- legacy CLI 兼容路径：已在 ACAD-E-008 中归档删除。
