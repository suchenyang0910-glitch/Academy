# Academy 项目结构图

> 目的：明确当前主线、遗留模块与后续迁移边界，避免 `bot/` 与 `mini-app/` 双轨继续演进。

## 1. 总体结构

```text
E:\academy
├─ README.md
├─ REQUIREMENTS.md
├─ bot\                   # legacy 早期 Bot 原型
├─ data\                  # legacy SQLite 数据
├─ mini-app\              # 当前主线产品
│  ├─ app\                # Next / Vinext 页面与 API 路由
│  ├─ db\                 # PostgreSQL / D1 兼容访问层与 schema
│  ├─ lib\                # Academy 核心服务逻辑
│  ├─ postgres\           # PostgreSQL 迁移脚本
│  ├─ drizzle\            # 本地 D1 / SQLite 迁移快照
│  ├─ scripts\            # 迁移、导入、内容抓取脚本
│  └─ tests\              # mini-app 构建与结构测试
├─ scripts\               # 本地启动与初始化脚本
└─ tests\                 # legacy bot 单元测试
```

## 2. 当前主线模块清单

### `mini-app/` 是当前产品主线

| 路径 | 角色 | 状态 |
|---|---|---|
| `mini-app/app/page.tsx` | Mini App 主界面，承载 Today / Courses / Notes / Progress / Profile | 主线 |
| `mini-app/app/api/academy/*` | 课程、提交、笔记、提醒、反馈、支付等 API | 主线 |
| `mini-app/app/api/telegram/webhook/route.ts` | Telegram 支付回调入口 | 主线 |
| `mini-app/lib/academy-store.ts` | 核心服务层：身份、seed、bootstrap、选课、提交、提醒 | 主线 |
| `mini-app/lib/curriculum.ts` | 五门 60 天固定课程定义 | 主线 |
| `mini-app/lib/ai-feedback.ts` | DeepSeek / Ollama 点评与降级 | 主线 |
| `mini-app/lib/telegram-payments.ts` | Telegram Stars 发票、预结账、回调、退款 | 主线 |
| `mini-app/db/index.ts` | PostgreSQL 兼容 D1 访问层 | 主线 |
| `mini-app/db/schema.ts` | 统一业务数据模型 | 主线 |
| `mini-app/postgres/*` | PostgreSQL 迁移 | 主线 |
| `mini-app/drizzle/*` | 本地 D1 / SQLite 迁移历史 | 主线 |

### 主线事实源

当前 Academy 的业务事实源应统一为：

1. `mini-app/lib/academy-store.ts`
2. `mini-app/db/schema.ts`
3. `mini-app/db/index.ts`
4. `mini-app/app/api/academy/*`

凡是学习进度、课程完成、邀请、订阅、支付、提醒等级等核心口径，都应以这条链路为准。

## 3. 遗留模块清单

### `bot/` 为 legacy 路径

| 路径 | 现状 | 问题 |
|---|---|---|
| `bot/database.py` | 早期 SQLite 数据访问 | 与主线数据模型不一致 |
| `bot/commands.py` | 早期 `/academy` 文本命令 | 仍按 14 天原型口径返回内容 |
| `bot/main.py` | 早期 CLI 包装器 | 继续沿用会强化双轨维护 |
| `bot/reminders.py` | 本地提醒文案选择器 | 仍有参考价值，但需要和主线提醒口径统一 |
| `bot/send_reminder.py` | 本地提醒发送脚本 | 可保留为过渡层 |
| `bot/setup_webhook.py` | Telegram webhook 配置脚本 | 可保留，但职责应仅限运维配置 |
| `data/academy.db` | legacy SQLite 数据库 | 不应继续作为主学习事实源 |
| `tests/test_commands.py` | legacy 命令测试 | 仅覆盖旧原型 |

### legacy 的边界规则

1. 不再给 `bot/database.py` 和 `bot/commands.py` 增加新产品逻辑。
2. 不再把 `data/academy.db` 当作当前学习记录权威来源。
3. 所有新增功能优先进入 `mini-app/`。
4. `bot/` 只允许做两类事情：
   - Telegram 入口和运维辅助；
   - 过渡期兼容层。

## 4. 当前边界判断

```text
Telegram
  -> Bot 入口 / 提醒 / webhook 配置
  -> mini-app API
  -> academy-store 服务层
  -> 统一数据模型与数据库
```

不应该再出现：

```text
Telegram
  -> bot.commands
  -> bot.database
  -> legacy SQLite
```

因为这会造成：

1. 课程天数口径不一致：`14 天` vs `60 天`
2. 数据模型不一致：单机 SQLite vs 多用户主线模型
3. 业务口径不一致：提醒、进度、订阅、邀请、支付无法统一
4. 测试和维护成本持续上升

## 5. 建议的下一步迁移顺序

### P0

1. 让 Bot 查询类能力改为调用 `mini-app` API：
   - `/academy`
   - `/academy history`
   - `/academy next`
   - `/academy notes`
2. 保留 `bot/send_reminder.py` 作为发送器，但提醒内容和用户状态从主线 API 获取。
3. 停止在 `bot/database.py` 写入新的学习数据。

### P1

1. 为 Bot 新建一个轻量 API client，例如 `bot/academy_api.py`。
2. 把 `bot/commands.py` 改成格式化主线 API 返回值，而不是自己查 SQLite。
3. 将 `tests/test_commands.py` 从 SQLite fixture 改为 API mock。

### P2

1. 归档 `bot/database.py`。
2. 归档 `data/academy.db` 的产品用途，只保留迁移或历史备份意义。
3. 将 legacy 测试移入 `tests/legacy/` 或删除。

## 6. 一句话判断

`mini-app/` 是产品，`bot/` 应降级为入口和过渡层；如果继续让两边都长业务逻辑，后面一定会重复开发、重复修 bug、重复对口径。
