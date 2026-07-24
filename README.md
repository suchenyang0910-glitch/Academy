# Academy

Academy 是一个运行在 Telegram Bot 与 Telegram Mini App 中的学习监督系统。

当前版本采用“暖白学习手账”界面，通过固定课程、每日主动练习、规则评分、DeepSeek AI 点评、Ollama 本地降级和灰色幽默提醒，帮助用户在 60 天内留下可验证的学习成果。

## 已完成

### Mini App

- English、AI、Business、Founder Note、Quiz 五门 60 天固定课程
- 必选 1 门、最多同时启用 3 门，并保留每门课的独立进度
- 每门课每天约 15–20 分钟
- 今日课程、主动练习提交、规则评分与 DeepSeek AI 点评
- DeepSeek 不可用时尝试本地 Ollama；所有模型不可用时仍保存规则评分
- 只有完成当天全部已选课程，才形成一个有效学习日
- 课程完成后等待用户所在时区的下一自然日解锁下一课
- 中断、落后、今日完成等监督状态
- 学习笔记、进度和今日证据
- Telegram Mini App 身份校验；未设置 Token 时进入 Founder 本地自测模式
- 自动记录经过签名验证的 Telegram ID、姓名、用户名、语言和 Premium 状态
- 个人中心展示 Telegram 身份、学习时区、当前课程和邀请进度
- 分享 Academy Mini App、唯一邀请码与 `start_param` 邀请绑定
- 被邀请者完成认证、选课并在 7 天内形成 3 个有效学习日后才计为有效邀请
- 21 天免费试用与到期状态
- 到期后保留历史查看，但锁定换课、课程提交和新增笔记
- 每累计 3 位有效邀请自动、幂等地发放 30 天使用权限
- 月付、季度、半年和年付四档价格展示
- 订阅权限数据模型已建立，可接入后续支付回调
- Cloudflare D1 本地持久化

### Telegram 提醒

- 34 条灰色幽默提醒，分为 L1–L4
- 最近 5 条不重复
- 根据中断天数自动提高提醒等级
- 提醒消息包含“打开 Academy”按钮
- 本地提醒接口使用独立密钥保护
- 支持模拟发送，不接触 Telegram

## 本地启动

需要 Node.js 20+。

首次启动或数据库结构有变化时，在 PowerShell 执行：

```powershell
cd E:\academy
powershell -ExecutionPolicy Bypass -File .\scripts\start_local.ps1
```

然后打开：

```text
http://localhost:3000
```

脚本会先构建应用、检查本地 D1 数据库，并仅应用缺失的迁移。重复执行不会清空学习记录。

如需清空本机自测记录并从 Day 1 重新开始：

```powershell
cd E:\academy
powershell -ExecutionPolicy Bypass -File .\scripts\reset_local_learning.ps1
```

此脚本只删除本地测试用户的学习记录，不删除课程和提醒文案。

## 本地配置

复制并编辑：

```text
E:\academy\.env.example
E:\academy\mini-app\.env.example
```

主要变量：

| 名称 | 用途 |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Telegram 身份校验与 Bot 发消息 |
| `TELEGRAM_BOT_USERNAME` | 生成带 `startapp` 邀请参数的 Mini App 分享链接 |
| `TELEGRAM_CHAT_ID` | 接收本地测试提醒的聊天 ID |
| `ACADEMY_CRON_SECRET` | 保护提醒生成接口 |
| `ACADEMY_API_BASE_URL` | 默认 `http://localhost:3000` |
| `ACADEMY_MINI_APP_URL` | 提醒按钮打开的地址 |
| `DEEPSEEK_API_KEY` | DeepSeek 服务端 API Key，不得暴露到前端 |
| `DEEPSEEK_BASE_URL` | 默认 `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | 默认 `deepseek-v4-flash` |
| `DEEPSEEK_TIMEOUT_MS` | 点评调用超时，默认 20000ms |
| `OLLAMA_BASE_URL` | 可选降级，例如 `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | 可选本地 Ollama 模型名 |

不要提交真实 Token 或密钥；`.env` 与 `.env.local` 已被忽略。课程原始回答会发送给 DeepSeek 生成点评，因此不要在学习答案中填写密码、Token、身份证件或其他不必要的敏感信息。

## 测试 Telegram 提醒

只生成提醒、不发送：

```powershell
cd E:\academy
python .\bot\send_reminder.py --level 1 --dry-run
```

真实发送：

```powershell
python .\bot\send_reminder.py --level 1
```

可使用 Windows 任务计划程序定时运行该命令。发送前必须保持 Academy 本地服务可访问；如果 Bot 和 Mini App 不在同一台机器，需把 API 地址换成服务器内网地址或受保护的 HTTPS 地址。

## 验证

```powershell
cd E:\academy\mini-app
npm.cmd run lint
npm.cmd test

cd E:\academy
python -m unittest discover -s tests -v
```

## 当前边界

本地版本已经覆盖“选课 → 每日学习 → 主动输出 → 评分 → 笔记 → 进度 → 提醒 → 次日解锁”的核心闭环。

尚未实现：

- 设备/IP 风险评分与邀请奖励人工撤销
- English TTS、录音与真人 10 分钟对话证据
- Day 0 / 21 / 30 / 60 能力测评
- 后台人工抽查与反馈工单
- Telegram Stars 真实收款尚待补齐 Stars 定价与公开 HTTPS Webhook 配置

这些功能应在 Founder 连续自测 7–10 天并修复核心学习阻断问题后再进入下一批开发。

完整产品定义见 [REQUIREMENTS.md](./REQUIREMENTS.md)。

## Telegram Stars 支付

Mini App 已接入 Telegram Stars 的本地支付闭环：

- 月付使用 Telegram Stars 自动续订；季付、半年付、年付使用一次性 Stars 发票；
- 发票只使用 `XTR`，每张发票只有一个价格项目；
- 只有收到 Telegram `successful_payment` 回调后才增加学习权限；
- 支持预结账校验、重复回调幂等处理、退款回调和 `/paysupport`；
- Bot Token、Webhook Secret 和 Stars 数量均从本机环境变量读取，不写入代码或数据库。

真实美元价格只是商业目标价。Telegram 内的实际售价必须配置为 Stars 数量，系统不会自行猜测美元与 Stars 的换算结果。

先复制：

```powershell
Copy-Item E:\academy\mini-app\.dev.vars.example E:\academy\mini-app\.dev.vars
Copy-Item E:\academy\.env.example E:\academy\.env
```

然后只在本机填写：

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_BOT_USERNAME
TELEGRAM_WEBHOOK_SECRET
ACADEMY_PAYMENT_SUPPORT
ACADEMY_STARS_MONTHLY
ACADEMY_STARS_QUARTERLY
ACADEMY_STARS_HALF_YEAR
ACADEMY_STARS_YEARLY
ACADEMY_PUBLIC_BASE_URL
```

不要把 Bot Token 发到聊天、截图、Git 提交或日志中。`.dev.vars`、`.env` 已被忽略。

Telegram Webhook 必须指向可公开访问的 HTTPS 地址。本地应用通过 HTTPS 隧道或后续服务器地址可访问后，执行：

```powershell
cd E:\academy
python .\bot\setup_webhook.py
python .\bot\setup_webhook.py --info
```

如需取消：

```powershell
python .\bot\setup_webhook.py --delete
```
