# Academy VPS Deployment Runbook

更新时间：2026-07-28

这份清单用于服务器更新。目标是减少“代码已经更新，但数据库/环境变量没跟上”导致的 Mini App 崩溃。

## 1. 更新代码后固定执行顺序

在 `/srv/academy/app/mini-app` 执行：

```bash
npm install
npm run deploy:preflight
npm run deploy:check
sudo systemctl restart academy
sudo systemctl status academy --no-pager
```

`npm run deploy:preflight` 是非破坏性预检，不连接或迁移 PostgreSQL，适合在本地或服务器拉代码后先跑一遍。它会依次执行：

1. `npm run build`
2. `npm run templates:check`
3. `npm run access:check`
4. `npm run content:quality:check`
5. `npm run content:i18n:check-copy`
6. `npm run db:check:schema`
7. `npm run acceptance:check`

只有 `deploy:preflight` 通过后，才继续执行 `npm run deploy:check`。`deploy:check` 会依次执行：

1. `npm run build`
2. `npm run templates:check`
3. `npm run access:check`
4. `npm run content:quality:check`
5. `npm run content:i18n:check-copy`
6. `npm run db:check:schema`
7. `npm run acceptance:check`
8. `npm run db:migrate:postgres`
9. `npm run db:check:postgres`

`npm run acceptance:check` 是静态 P0 验收门禁，会检查 Mini App 真机验收所依赖的关键入口是否还在：Telegram 身份、选课、选择题提交、移动端键盘样式、提醒、Stars、邀请、证据、后台 Dashboard 和 `page.tsx` 可见文案约束。它不能替代真机点击；它只是防止发布前已经缺少关键验收面。

如果 `npm run deploy:preflight` 或 `npm run deploy:check` 报错，不要重启服务，先修复构建、多语言文案、P0 静态验收、schema/migration 断档、缺失表、缺失索引或迁移校验问题。

服务重启后，继续执行真机验收清单：

- [Telegram Mini App 真机验收清单](./TELEGRAM_MINI_APP_ACCEPTANCE_CHECKLIST.md)

建议每次真机验收前先生成一份记录文件：

```bash
npm run acceptance:new -- --operator "founder" --device "iPhone / Telegram"
```

该命令会在 `docs/acceptance-runs/` 下生成一份带时间戳的 Markdown 记录。它不会自动判定真机通过；它用于把设备、环境、P0 勾选项、失败原因和最终结论沉淀下来，方便 7–10 天个人试用和第二位种子用户进入前复盘。

如果该清单的 P0 发布判定没有全部通过，不要邀请新种子用户。

## 2. 数据库自检看什么

`npm run db:check:postgres` 会检查：

- `ACADEMY_DATABASE_URL` 是否存在；
- PostgreSQL 是否能连接；
- 必要业务表是否存在；
- 关键索引是否存在；
- `__academy_migrations` 是否包含当前 `mini-app/postgres/*.sql` 的全部迁移；
- 已应用迁移的 checksum 是否与代码中的迁移文件一致。

正常输出最后应包含：

```text
OK postgres production schema
restart_safe=yes
next_action=restart_academy_service
```

失败输出会包含：

```text
restart_safe=no
next_action=fix_database_before_restart
repair_hint=...
```

只要看到 `restart_safe=no`，就不要重启 `academy` 服务。先按 `repair_hint` 处理；常见情况是漏跑迁移，可以先执行：

```bash
npm run db:migrate:postgres
npm run db:check:postgres
```

如果提示 `Checksum mismatch`，不要直接改库或重启。它表示已经应用过的迁移文件和当前代码里的迁移文件内容不一致，需要先确认是不是误改了历史迁移。

## 3. 服务启动日志

Mini App 第一次连接数据库时，会在服务日志中输出类似：

```text
[academy-db] type=postgres database=academy user=academy_app tables=... migrations=...
```

如果缺关键表，会输出：

```text
[academy-db] ... missing_tables=credits_ledger,campaign_rewards
```

这类告警通常表示忘记执行：

```bash
npm run db:migrate:postgres
```

## 3.1 本地上传目录

里程碑附件只保存在 VPS 本地，不生成公开文件 URL。首次部署或换服务器时需要创建上传目录：

```bash
sudo mkdir -p /var/lib/academy/uploads
sudo chown academy:academy /var/lib/academy/uploads
sudo chmod 750 /var/lib/academy/uploads
```

环境变量建议写入 `/etc/academy/academy.env`：

```bash
ACADEMY_UPLOAD_DIR=/var/lib/academy/uploads
ACADEMY_UPLOAD_MAX_BYTES=5242880
```

上传文件支持截图、PDF、Markdown、JSON 等轻量证据材料；Day 7 / Day 21 的可运行原型仍需要 Demo / README / workflow 链接，附件不能替代运行链接。

## 4. Telegram Stars 配置

支付必须同时满足：

- `TELEGRAM_BOT_TOKEN` 已配置；
- `TELEGRAM_WEBHOOK_SECRET` 已配置；
- 至少一个 Stars 价格为正整数；
- 用户从 Telegram Mini App 内发起支付。

Stars 价格支持以下变量名：

| 方案 | 推荐变量 | 可用别名 |
| --- | --- | --- |
| 30 天 | `ACADEMY_STARS_MONTHLY` | `ACADEMY_STARS_MONTH`, `ACADEMY_STARS_30D`, `ACADEMY_STARS_30_DAYS` |
| 90 天 | `ACADEMY_STARS_QUARTERLY` | `ACADEMY_STARS_QUARTER`, `ACADEMY_STARS_90D`, `ACADEMY_STARS_90_DAYS` |
| 180 天 | `ACADEMY_STARS_HALF_YEAR` | `ACADEMY_STARS_HALF_YEARLY`, `ACADEMY_STARS_180D`, `ACADEMY_STARS_180_DAYS` |
| 365 天 | `ACADEMY_STARS_YEARLY` | `ACADEMY_STARS_YEAR`, `ACADEMY_STARS_365D`, `ACADEMY_STARS_365_DAYS` |

## 5. Telegram 提醒排查

如果页面显示“连续中断”，但 Telegram 没收到提醒：

1. 在 Mini App 的“我的 → 学习提醒”点击“发送测试提醒”；
2. 查看“提醒记录”是否新增 delivered / failed；
3. 在服务器查看定时器状态：

```bash
sudo systemctl status academy-reminders.timer --no-pager
sudo journalctl -u academy-reminders.service -n 80 --no-pager
```

也可以直接运行一条健康检查命令，把 systemd timer 和后台提醒健康面板一起检查：

```bash
set -a
source /etc/academy/academy.env
set +a

npm run reminders:check -- --base-url https://academy.linkx.club
```

正常输出应包含：

```text
reminder_health=ok
systemd_checked=yes
next_action=send_test_reminder_from_mini_app_and_confirm_telegram_delivery
```

也可以打开轻后台查看提醒投递健康：

```text
/api/academy/admin/ops-dashboard
```

该面板会展示 24 小时内的提醒总数、送达数、失败数、点击数、完成数和最近 10 条脱敏事件。  
如果 24 小时无事件，优先检查 `academy-reminders.timer` 是否启用；如果 failed 增加，优先检查 Bot Token、用户是否拉黑 Bot、Telegram chat ID 是否有效。

测试提醒只验证 Telegram 投递链路，不受“今天已完成 / 未到提醒时间”的限制。

## 6. 种子验证 Dashboard

首轮 10 人验证指标已经有 HTML 看板，入口：

```text
/api/academy/admin/bot/validation-dashboard
```

该入口必须使用 `ACADEMY_CRON_SECRET` 作为 Bearer Token，不支持把 secret 放在 URL 参数里，避免被浏览器历史、Nginx 日志或 Cloudflare 分析记录。

服务器上可这样拉取页面：

```bash
set -a
source /etc/academy/academy.env
set +a

curl -sS \
  -H "Authorization: Bearer ${ACADEMY_CRON_SECRET}" \
  https://academy.linkx.club/api/academy/admin/bot/validation-dashboard \
  -o /tmp/academy-validation-dashboard.html
```

Dashboard 会展示：

- Seed Users；
- FWPR-7；
- Day21 DoD；
- Evidence 提交率；
- D1 / D7 / D21 留存；
- Quiz Needs Review；
- Payment & Referral Conversion Funnel；
- Reminder Conversion。

## 7. 审核项目里程碑

Day 7 / Day 21 的可运行原型证据会先进入 `pending_review`，不会直接计入 FWPR-7 或 Day21 DoD。管理员审核通过后才会写入 accepted evidence。

进入 `pending_review` 前，服务端会先对用户提交的 Demo / README / workflow 链接做轻量运行校验：使用 HEAD，必要时回退 GET；链接不可访问时会要求用户补充证据，不进入人工审核队列。

Day 7 / Day 21 还会做结构化运行测试预检：用户必须提交至少 3 个测试问题、期望结果和实际回答；其中至少 2 条需要包含来源/引用线索。Day 21 还必须提供 workflow/export 证据。预检失败时状态为 `needs_revision`，不会进入 `pending_review`。

审核通过：

```bash
curl -sS \
  -H "Authorization: Bearer ${ACADEMY_CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -X POST \
  https://academy.linkx.club/api/academy/admin/goals/milestones \
  -d '{"milestoneId":1,"action":"approve","reviewedBy":"founder"}'
```

要求用户补充证据：

```bash
curl -sS \
  -H "Authorization: Bearer ${ACADEMY_CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -X POST \
  https://academy.linkx.club/api/academy/admin/goals/milestones \
  -d '{"milestoneId":1,"action":"request_revision","reviewedBy":"founder","note":"请补充可打开的 Demo 链接和 3 条测试结果。"}'
```
