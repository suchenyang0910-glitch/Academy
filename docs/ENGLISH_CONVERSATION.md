# Academy 英语对话接入

日期：2026-09-08。范围：在现有 English 课程内练习，与课程检查题并存。当前交付为本地代码与隔离环境验证，尚未更新线上 VPS。

## 使用流程

英语课程详情 → 英语对话练习 → 选择场景和难度 → 开始新对话 → 文字或语音输入 → 检查文字并发送 → 至少 3 轮后结束 → 查看反馈与改进表达 → 再次练习。

- 场景：自我介绍、餐厅点单、日常聊天；难度：入门、基础、进阶。
- 教练读取课程目标和本次历史，保持简短英文交流，结束后以界面语言解释。
- 支持简体中文、越南语、高棉语、泰语界面。
- 最近 10 次练习可恢复或查看；超过 10 次的记录保留在数据库，当前没有完整历史翻页界面。
- 每次最多 12 轮。每个用户每个 UTC 自然日最多 60 次创建、回复、结束操作；失败的模型请求也占用预算。重复的已成功回复不重复调用模型。
- 英语练习不产生课程完成、积分、正式能力证据或发音分数。原有检查题、选修解锁和订阅规则继续有效。
- 暂只对当前已解锁及过去的英语课开放写入；未来的 EXTRA 课程对话仍锁定。

## 语音边界

本版使用浏览器 Web Speech 识别和 Speech Synthesis 朗读，无新增语音供应商密钥。点击语音输入开始，点击结束或 45 秒后停止。转写结果先放入可编辑输入框，用户发送后才进入 Academy 对话。

识别依赖浏览器支持、麦克风权限、网络及安全上下文，不能承诺所有 Telegram WebView 都可用。可能由浏览器的在线服务处理音频；页面在使用前说明。Academy 不上传、保存原始音频。不支持或拒绝权限时继续使用文字输入。退出面板时停止识别、朗读与客户端请求。

后续如果需要覆盖更多 Telegram 设备，应接入独立 STT 服务并重新明确音频处理、保留和成本策略；当前未实现实时双向通话或可打断的流式 AI 音频。

参考：[MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)、[MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)。

## 实现与接口

- `app/english-conversation-panel.tsx`：课程内交互、识别、播放、反馈、重练。
- `lib/english-conversation.ts`：共享类型、输入和模型输出校验。
- `lib/english-conversation-store.ts`：权限、课程归属、持久化、预算、锁、幂等。
- `lib/english-conversation-ai.ts`：DeepSeek → Ollama，单个供应商超时 20 秒。
- `lib/english-conversation-copy.ts`：四语言文案。
- PostgreSQL 表：`english_conversations`、`english_conversation_usage`。不建立新的学习事实源。

`GET /api/academy/english-conversations?lessonId=english-day-1`

使用现有 `x-telegram-init-data` 签名鉴权，返回 `{sessions, aiEnabled}`。只读历史允许已到期账户访问其自己的课程记录。

`POST /api/academy/english-conversations`

创建：`{action:"start", lessonId, scenario, level, requestId}`。

回复：`{action:"reply", sessionId, version, text, inputMode:"text"|"speech", requestId}`。

结束：`{action:"finish", sessionId, version, requestId}`。

返回 `{session}`。客户端不能提交完整历史、系统提示或自己的评分。用户消息最多 1000 字符，请求体最多 8192 字节。`requestId` 使用 UUID，失败后以相同 ID 重试同一请求。客户端并行防抖；数据库版本号与 90 秒租约阻止并发覆盖，超时释放后可恢复。

模型输出与用户输入均以普通文本显示。纠错中的原句必须能在用户消息中找到。模型失败不写入半条对话，客户端保留输入，不伪造 AI 回复。

普通回复使用文本格式，反馈使用经过校验的 JSON。真实验证中 JSON 模式曾返回空白，因此普通对话无需结构化输出；[DeepSeek 文档](https://api-docs.deepseek.com/guides/json_mode/)也说明 JSON 模式可能偶发空内容。失败时尝试已配置的 Ollama，均失败则返回 503。

## 配置与发布

复用已有 `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`、`OLLAMA_BASE_URL`、`OLLAMA_MODEL`。所有密钥只在服务端。`OLLAMA_MODEL` 必须是该实例实际安装的模型，否则降级会失败。

当前 Academy 运行于 Node/Vinext + VPS PostgreSQL；`.openai/hosting.json` 为历史配置，不应据此把现有产品迁回 Workers 或 D1。

依照现有 VPS runbook，先执行发布预检，应用 PostgreSQL 迁移并核验，再在授权发布时重启服务。新迁移为 `postgres/0026_english_conversations.sql`，数据库自检已纳入新表和索引。兼容 schema 及 Drizzle SQL 一并提供；`drizzle/0029_english_conversations.sql` 由隔离的两表 schema 生成，未重写旧迁移和历史 journal。

本机验证未改 `.env`，未迁移或写入既有数据库，未发送 Telegram 消息。

## 本轮验证

2026-09-08：

- Vinext 生产构建成功，包含新 API 路由。
- 原有 12 项回归测试通过。
- 新增 8 项执行型测试：完整对话与持久化、权限/归属、非法和超大输入、幂等/并发、模型失败恢复/降级、轮数和预算、拒绝虚构引文、空输出降级。测试使用真实服务 SQL、隔离 SQLite，身份与模型边界使用替身。`npm run test:english` 可重复运行，已纳入 `npm test`。
- PostgreSQL 18 隔离实例：27/27 迁移通过，schema 自检通过。
- HTTP + 真实 DeepSeek + 隔离 PostgreSQL：选英语课 → 开始 → 3 轮回复 → 结束反馈 → 重新读取历史成功；原有课程提交保持为空。三轮回复耗时约 1.315 / 0.898 / 1.192 秒，仅为本机一次样本。
- 本次新增代码定向 ESLint 通过；访问控制、schema、多语言与静态 P0 检查通过。
- 全仓 ESLint 与 `tsc --noEmit` 尚存在原有问题，涉及 `page.tsx`、`academy-store.ts`、脚本和 legacy worker 等，不能宣称全仓静态检查全绿。
- 未进行 Telegram 手机麦克风/朗读真机验收或浏览器交互测试；上述 HTTP/API 验证不替代真机体验。

上线前需要在目标 Android / iOS Telegram 中实际验证录音许可、转写、拒绝权限后的文字回退、朗读、关闭时停止音频、软键盘和三轮练习；确认部署环境有可用模型。正式发音测评与录音证据不属于本版。
