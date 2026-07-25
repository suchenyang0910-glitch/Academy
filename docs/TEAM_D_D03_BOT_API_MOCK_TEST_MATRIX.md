# ACAD-D-003：Bot 回归测试迁移到 API mock

## 1. 目标

- Bot 测试必须完全脱离 legacy SQLite 与真实网络请求（HTTP/Telegram），确保本地与 CI 稳定可复现。
- Bot 与 mini-app 的边界以 API 为准：命令、查询、提醒、笔记均以 mock API 进行断言。

## 2. 覆盖范围

### 2.1 命令解析（bot.commands）

| Case ID | 输入 | Mock | 预期 |
|---|---|---|---|
| D03-CMD-001 | `/academy note xxx` | mock `academy_api.create_note` | 入参为 `xxx`，返回提示文案 |
| D03-CMD-002 | `/academy next` | mock `academy_api.fetch_summary/fetch_day` | 根据 summary 推导 next day 并输出 |

### 2.2 API client（bot.academy_api）

| Case ID | API | 预期 |
|---|---|---|
| D03-API-001 | fetch_summary | URL `/api/academy/admin/bot/summary` + Bearer secret |
| D03-API-002 | fetch_day | URL `/api/academy/admin/bot/day` + payload.day |
| D03-API-003 | fetch_notes/create_note | URL `/api/academy/admin/bot/notes` + action list/create |
| D03-API-004 | fetch_reminder | URL `/api/academy/admin/bot/reminder` + level |

### 2.3 Telegram 发送与 webhook 配置（脚本类）

- `bot/send_reminder.py`：测试中 mock `post_json`，不发真实 Telegram
- `bot/setup_webhook.py`：测试中 mock `post_json`，确保不泄露 token

## 3. 门禁

- `python -m unittest discover -s tests -p "test_*.py"` 必须通过

