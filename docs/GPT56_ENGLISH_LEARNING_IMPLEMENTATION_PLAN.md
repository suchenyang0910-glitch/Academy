# Academy 英语学习体验开发交接

版本：1.0；日期：2026-09-14；目标执行者：GPT-5.6。
交付性质：实施方案与任务合同。本文件不代表代码已实现或已部署。

## 1. 目标与不可混淆的事实

本人未来 60 天的主要项目是英语学习；主要困难是听不懂，使用场景为柬埔寨日常生活和同事沟通，每天可稳定投入两小时。两小时包含真实交流、复习和模拟练习，不是强制 App 在线时长。

首版目标：打开 Academy 后能迅速开始一个有实际用途的听力任务；遇到困难获得适量帮助；完成后知道哪里进步；换设备可以继续；在新材料和真人任务中验证。

继续复用既有 Academy、Telegram 身份、选课、订阅、数据库与模型配置。保持一门主课、不限选修的原则。不要把本人两小时预算改成所有用户的必修时间。

研究依据见 LEARNING_APPS_TOP5_DUE_DILIGENCE.md。借鉴短任务、即时帮助、场景对话与任务管理；不以竞争 App 下载量承诺留存或学习效果。

## 2. 开工前需要阅读与核实

工作目录：E:\academy。依次读：
1. REQUIREMENTS.md 中身份、访问权限、课程、证据、监督、API 和部署相关段落。
2. docs/ENGLISH_LISTENING.md、docs/ENGLISH_CONVERSATION.md。
3. docs/DEPLOYMENT_HOTFIX_20260914.md、docs/DEPLOYMENT_RUNBOOK.md。
4. 本文，以及 docs/LEARNING_APPS_TOP5_DUE_DILIGENCE.md 的结论与实施建议。

代码定位优先使用项目要求的知识图谱工具；工具不可用时明确说明并检索源码。定位 → 调用关系 → 实现 → 修改。

先执行 git status --short 并记录已有修改。当前存在大量未提交英语代码，属于现有工作成果；不要 reset、覆盖、把未跟踪文件当垃圾删除，或凭旧提交还原整个目录。

### 已核实基线

| 模块 | 本地状态 | 接下来的工作 |
|---|---|---|
| app/english-listening-panel.tsx | 两场景、设备朗读、四题、原文与反思；localStorage 保存 | 拆步骤、细化求助、服务端持久化 |
| lib/english-listening.ts | 点咖啡、同事任务，答案与正文同包发送客户端 | 版本化内容，拆服务端评分数据与客户端展示数据 |
| app/english-conversation-panel.tsx | 课程内对话、浏览器语音、反馈历史 | 复用，不新建第二套聊天记录 |
| lib/english-conversation*.ts | 身份权限、会话、幂等、模型降级等 | 接收明确场景入口，后续复用语音通道 |
| /api/academy/english-conversations | 服务端 GET/POST 已存在 | 保持契约兼容 |
| lib/academy-store.ts | 作业、提醒、课程事实主线 | 保留两处时间 CAST 修复，避免业务逻辑继续膨胀 |
| db/index.ts / db/schema.ts | PostgreSQL 运行层，兼容 schema 定义 | 新迁移同步覆盖检查，不能把命名中的 D1 误读为线上使用 Cloudflare D1 |
| /api/telegram/webhook | 既有支付/命令分发 | 后续增加语音时保留支付处理分支 |

线上最近核查位置为 143.198.192.193 的 /opt/academy，PM2 academy，Caddy 代理到 3000。最近已部署仅包含提交/提醒时间类型热修复；本地英语新增代码未因此自动上线。部署前重新核实，不把这一快照当作永久配置。

## 3. 固定范围与批次

### 批次 A：P0 可恢复的听力闭环，首先完成

交付两节样板、分步训练、服务端历史、分层帮助、错误恢复、清晰进度。沿用现有设备朗读作为标明限制的临时方式。完整样板流程可评审；没有可靠音频的真机验收，不得宣布听力产品正式上线。

### 批次 B：P1 稳定音频、Day 0 与 Day 1–7

交付审核过的固定音频、七天场景、独立基线与新材料复测、复习队列、场景化提醒和每周对照。完成 A 的数据与交互后再做。

### 批次 C：P1 Bot 原生语音陪练

复用现有对话逻辑，增加语音识别、合成、队列、预算与失败恢复。依赖可用供应商配置或可运行的语音服务，不得把文本模型当作语音服务。

### P2：数据证明有用后再做

轻量里程碑、好友陪练提醒、更多口音与 Day 8–60 内容、知识沉淀。暂不新增社区、排行榜、能量经济、无限短视频流、数字人或通用插件平台。

## 4. 用户端流程

今日页对已选 English 的用户显示“英语听力练习”卡：具体任务、预计 5–10 分钟、上次进度、继续按钮。若英语为选修，仍标记选修且遵循现有访问与解锁规则。不得自动更换用户主课。

两小时计划作为可展开的个人安排：短复习、场景学习、对话、现实使用、复盘。一次只推进一个小任务，不要求完成两小时才保存成绩。

训练状态：READY → LISTEN → ANSWER → FEEDBACK → EXPLAIN → TRANSFER → SUMMARY。

- READY：说明本课要听懂什么；可恢复已有会话。
- LISTEN：用户主动点击播放，原文默认隐藏。播放失败显示重试和文字学习入口。
- ANSWER：3–5 道题，一屏一道或紧凑卡片；保持返回修改能力。题目都对应已备课知识点。
- FEEDBACK：指出听对和听漏的具体信息，不只给分数。
- EXPLAIN：逐句原文、翻译、词组说明与重听，按需展开。
- TRANSFER：同场景不同细节的新录音，至少一道独立检查；不能复用刚展示过的答案冒充新测试。
- SUMMARY：显示本次辅助条件、正确题数、下一次复习、一个现实任务；可结束也可自主加练。

任何阶段退出都保存已经确认的状态。不要因为返回、刷新或切换课程停止保存，也不要自动开一个新会话使之前的文字帮助记录消失。

### 求助层次

“没听清”提供原速重听和慢速；“词组不懂”只解释目标词组；“想看整句”展开该句及译文；“选项分不清”给具体差异。使用任何文字提示都记录帮助类型。

解析不能把所有错误都归因于词汇。自选原因保存为本人报告，不能称为 AI 已确诊的学习障碍。

### 手机要求

点击目标至少 44px，输入字号至少 16px，支持窄屏、系统文字放大和安全区。键盘打开后提交/保存可见，滚动不跳回页面顶部。按钮忙碌态可读、不可重复提交。切换到后台或离开训练停止当前音频；返回不自动播放。

## 5. 完成、成绩与旧课程的关系

本批次“今日听力练习完成”是补充练习状态，不伪装成旧 English 课程已通关。使用单独且明确的卡片标题。旧课程考核与订阅、积分、邀请、毕业条件保持既有事实口径；不因一次听力练习自动推进 currentDay。

不要求本人为了保存听力记录再完成一遍旧课程作业。总结页提供“返回今日”即可。后续若将新内容替换旧 English 必修，必须先做内容版本与完成规则迁移设计，不能在页面里偷偷调用 submitLesson 伪造通过。

练习尝试保存三类信息：
1. 本次表现：正确数、总题数、题目和音频版本。
2. 辅助条件：完整播放次数、慢速、单句播放、词义、原文、译文、解析。
3. 熟悉程度：是否首次遇到该题组、之前是否看过同版本原文/答案。

“第一次播放就答对”和“第一次见到就独立答对”不同。曾看过该题组解析，再建会话也只能是复习成绩。服务端以 user + materialVersion + questionSetId 查询既往曝光；新变式使用新的题组 ID。浏览器 onended 只是客户端事件，不是注意力或身份可信证据。

## 6. 建议的数据结构

先检查已存在的数据表能否复用。以下字段为逻辑合同，不要求照抄类型命名；明确写入实现映射，避免多套重复事实源。

### 版本化材料

为 english-listening 内容添加 materialId、version、contentLocale、audioManifest、objective、knowledgePoints、practiceQuestionSet、transferQuestionSet、mission。发布版本不可原地改答案或音频。用服务端内容模块作为首版来源即可，不急建 CMS。

audioManifest 最少包括音频 ID、语言、版本、文件路径、MIME、内容校验值、生成来源、审核状态。整段和逐句文件均有稳定标识。客户端 bundle 不携带题目标准答案；创建训练只返回所需展示数据，提交后返回对应解析。

### 新增 listening_sessions

- id、user_id、enrollment_id、lesson_id、material_id、material_version、question_set_id。
- mode：practice / baseline / transfer / review。
- stage、answers_draft_json、support_json、version、status。
- started_at、updated_at、completed_at、start_request_id。
- UNIQUE(user_id, start_request_id)，按 user/lesson/update 建索引。

### 新增 listening_events

- id、user_id、session_id、request_id、sequence、type、payload_json、created_at。
- UNIQUE(user_id, request_id)。仅允许固定事件：audio_completed、audio_failed、slow_audio、line_audio、glossary_opened、transcript_opened、translation_opened、feedback_opened。
- payload 限定音频/句子/知识点 ID，不接受任意 HTML 或用户传入成绩。

### 新增 listening_attempts

- id、user_id、session_id、material_version、question_set_id、request_id。
- answers_json、correct_count、question_count、support_snapshot_json、prior_exposure、submitted_at。
- UNIQUE(user_id, request_id)。尝试不可覆盖；修订形成新尝试。

反思笔记复用 notes 并关联 lesson/material/attempt；现实任务先用带结构化元数据的笔记记录 simulated / real、taskCompleted、misunderstanding、nextStep。原始录音不是 P0 存储要求。

新表的时间统一使用项目可稳定序列化的 UTC 格式，DDL 与 SQL 表达式必须同类型。若为兼容适配层使用 TEXT，就明确 ISO UTC 字符串或 CAST；不再将 TEXT 直接与 CURRENT_TIMESTAMP 放入 COALESCE。不得顺手重构全部历史时间字段。

迁移编号以开工时目录最大编号为准。兼容 schema、PostgreSQL 迁移与 schema 检查同批更新；不修改已执行迁移、不重新导入覆盖用户数据。

## 7. API 合同

建议复用一个 /api/academy/listening-sessions 资源，GET 获取详情/历史，POST 使用 action 分发；也可拆子路由，但必须保留下列行为。

| 操作 | 输入 | 输出与约束 |
|---|---|---|
| GET history | lessonId、cursor | 只返回本人，分页，每页最多 20 条 |
| GET session | sessionId | 当前草稿、版本、允许的动作、已解锁反馈 |
| POST start | lessonId、materialId、mode、requestId | 服务端验证材料与课程关系、已解锁状态，返回 version 和无答案题组 |
| POST save | sessionId、version、answersDraft、requestId | 乐观锁，冲突返回 409；不覆盖另一设备新稿 |
| POST event | sessionId、eventType、允许的 ID、requestId | 去重并记录帮助；不能事后撤销曝光 |
| POST submit | sessionId、version、answers、requestId | 服务端评分、事务保存结果、推进阶段，重复请求返回原结果 |
| POST finish | sessionId、version、requestId | 校验所需阶段，设置练习完成，返回现实任务入口 |

GET 用 getIdentity；写入同时使用 assertLearningAccess 与 getLessonItem 验证本人课程归属、未来课/到期规则。到期用户按既有规则保留本人历史只读。不得相信客户端 Telegram ID、分数、完成日期或 user_id。

请求体限制 16KB，答案只接受当前题组允许的选项 ID。每次 action 带稳定 requestId，网络重试复用 ID。错误返回 {error:{code,message,requestId}}；message 是可展示的简短文案，不含 SQL、Token 或用户整段录音文字。

提交事务覆盖 attempt 写入、session 更新及必要的复习标记；通知、模型点评等附加工作不得把已经提交成功的结果伪装成失败。跨设备曝光记录在提交时合并查询，防止一台看答案、另一台被记为首次独立答对。

### 浏览器记录迁移

旧 localStorage 内容保持可读并标为“本设备历史，未经服务端验证”。首次登录可提供一次导入笔记/草稿，不自动导入为已验证分数。恢复服务端记录优先；失败稿保留本地待同步标记。不能迁移一次又重复加分或加学习日。

## 8. 稳定音频与七天内容（批次 B）

优先固定文件播放，浏览器 Speech Synthesis 仅作带说明的回退。采用原生 audio 控件能力或封装播放器；清晰的播放/暂停/重试/速度、加载与错误状态。不要使用自动播放开始课程。

课程录音只用有权使用的内容。固定课音频提前生成、试听、缓存，记录声线与内容版本；文件类型核对实际 MIME。若尚无供应商预算或音频素材，则实现接口和测试替身，交付状态明确为“等待音频”，不能以系统默认声音假装完成统一音频验收。

Day 0 基线与 Day 7 复测的录音和题目不得被训练正文提前暴露。只评价能完成的任务，不输出未经校准的 CEFR 等级。

| 内容 | 核心任务 | 教学与验证 |
|---|---|---|
| Day 0 | 听辨价格、时间、一个工作请求 | 基线先测，不提前教答案；按帮助条件保存，不扣连续学习记录 |
| Day 1 | 咖啡点单 | 冷热、大小、堂食/外带 |
| Day 2 | 点餐 | 数量、额外需求、澄清 |
| Day 3 | 购物付款 | 单价与总额、付款方式 |
| Day 4 | 确认同事时间 | today/tomorrow、before/by 等语境 |
| Day 5 | 确认工作任务 | 事项、接收者、渠道、截止时间 |
| Day 6 | 修复听漏 | 请求重复、换种说法、复述确认 |
| Day 7 | 同难度新材料 | 换细节和说话者，比较基线，不重复背题 |

每课 1–3 个知识点、3–5 道题、正反例、一个变式和一个现实任务。题目必须能映射到知识点；丰富内容通过例子和解释实现，不增加冗长输入作业。

UI 文案使用 zh-Hans/vi/km/th 现有体系。英语语料保持英文，讲解翻译分离；缺译稿按既有 fallback 显示内容语言，不把中文硬编码成四语言已完成，也不未经审核自动发布批量翻译。

## 9. 复习、提醒与指标

复习优先复用 review_queue_items 及现有 API，先读允许的 source_type。若现有约束不支持听力，扩展枚举/适配而非建立无关联的第二套队列。

建议间隔 1/3/7 天只是首版配置，错误后回看和变式练习；不宣传为最佳算法。分别记录知识不懂、语音未辨认及自报不确定。通过熟题不能自动清空全部知识缺口。

提醒复用既有 scheduler 和 reminder_events，按用户时区、主课/选修、安静时间与现有次数上限执行。按钮带目标 lesson/session 引用，但后台仍验证权限。英语补充任务完成只停止对应补充提醒，不宣称所有旧必修已完成。

事件范围仅收集本人的学习流程事实：mission_opened、practice_started、audio_error、attempt_submitted、help_used、practice_finished、extra_practice_started、real_task_reported。保留手动/提醒来源，但不能仅因点过提醒就推定所有后续学习均由提醒造成。

有效指标：练习启动、有效练习日、主动加练、陌生材料表现、真人任务结果、提交/播放失败率。页面打开和播放时长不能称为掌握。

## 10. Bot 语音（批次 C）

入口 /english 或菜单按钮只在用户主动开启英语对话后接管普通语音，不影响其他命令和 Stars 消息。使用 Telegram 签名/密钥验证与已绑定身份，共用 english_conversations。明确会话退出和超时行为。

流程：Telegram voice → 持久化待处理任务 → STT → 原有对话服务 → TTS → sendVoice → 保存结果。

- webhook 校验并持久化 job 后尽快返回；不在 webhook 内等待全部模型过程。
- Telegram update_id 去重；同一会话按顺序处理；重复投递不重复扣预算。
- 首版语音限制建议 60 秒、5MB；文件真实类型与大小服务端检查。上限可配置。
- 识别后允许用户更正关键转写；识别失败不生成假反馈。
- 服务端下载只使用 Telegram 返回的文件标识和受控 URL，不能让用户提供任意下载地址。
- 语音只作对话输入，不宣称专业发音评测。默认处理后删除临时原音频，文本按现有对话保留规则处理；记录明确清理期限并测试失败清理。
- 配置 STT/TTS provider、语言、声线、预算、超时；默认关闭未配置能力，界面给文字回退。
- 单日语音预算与既有文字操作预算分开说明，失败/重试计费策略透明。
- 外部 sendVoice 发送后、数据库标记前崩溃可能造成重复。Telegram 发送接口不能据此保证严格 exactly-once；记录 ambiguous 状态并限制自动重发，避免声称完全消除重复。

批次 C 不新增实时电话、打断式音频、数字人或多 Agent 课堂。

## 11. GPT-5.6 执行任务清单

| ID | 优先级 | 具体修改 | 依赖 | DoD |
|---|---|---|---|---|
| A0 | P0 | 读取基线、保护未提交改动、记录本地/线上差异 | 无 | 输出简短差异与文件范围；确认时间 CAST 修复未被覆盖 |
| A1 | P0 | listening 内容模型与客户端/服务端分离 | A0 | 两个样板与变式通过内容校验，客户端不直接携带标准答案 |
| A2 | P0 | listening store、增量迁移、API | A1 | 真实 PostgreSQL 隔离实例验证归属、幂等、事务、跨设备恢复 |
| A3 | P0 | listening panel 分步骤、分层求助、错误恢复 | A2 | 刷新可继续，帮助状态不丢，非法与失败操作不会产生假进度 |
| A4 | P0 | Today 入口、状态边界、四语言 UI | A3 | 补充练习与旧课完成不混淆；缺译有说明；移动端可用 |
| A5 | P0 | 自动与浏览器验收、更新交付文档 | A4 | 给出可复查结果、剩余真机门槛与部署包，不用“全绿”遮盖未验收项 |
| B1 | P1 | 固定音频 manifest、播放器和回退 | A5 | 实际 MP3/其他支持格式可播放，MIME 正确，手机停止/恢复有效 |
| B2 | P1 | Day 0 / Day 1–7、复测、复习与提醒 | B1 | 首周可连续使用；基线/复测题没有被正文泄露 |
| C1 | P1 | Bot voice job、STT/TTS 与预算 | A5 | 确认配置后跑通真实五轮；重试、超时、退出与支付兼容 |
| C2 | P1 | 发布并本人试用 | B2、C1 可分别发布 | 实际设备验收并核查线上资源/API，保留版本回滚 |

建议每个批次形成一个可评审 diff；用户未要求提交时不自动提交全部工作区，更不能把全部未跟踪文件直接加入版本库。

## 12. 必须覆盖的验收案例

1. 新会话不含原文或标准答案；首次检查后只展示允许解析。
2. 完整播放前尝试提交，服务端按练习规则拒绝或明确标记非听力学习，不能显示独立听懂。
3. 回放、慢速、词义和原文帮助各自记入结果；同版本新会话不洗掉曝光历史。
4. 断网后稿件保留；重试同 requestId 只产生一次 attempt；两个不同提交都保存。
5. 两台客户端同时保存，旧版本收到 409，不覆盖新稿。
6. 其他用户 session/lesson、未选课程、锁定未来课、到期写入均不能绕过。
7. 真实 PostgreSQL 运行 SQL，不仅 SQLite 替身；覆盖提醒 completed_at/clicked_at 的 TEXT 时间回归。
8. session/attempt 事务故障整体回滚；通知或模型失败不把已完成数据库提交回报为失败。
9. 旧 localStorage 只作为待确认历史，不计入正式成绩，不跨用户导入。
10. 320/390px 宽度、软键盘、系统大字、按钮忙碌态、后台停止音频；桌面浏览器检查与 Telegram 真机分别报告。
11. A 批次关闭英语面板不影响其他课程、支付、邀请和原有作业路径。
12. C 批次包含更新重复、语音超限、识别失败、模型超时、合成失败、发送结果不确定、并行文本/语音等情况。

现有 npm.cmd test 包含构建及课程/对话/听力回归。按顺序运行会改 dist 的命令，避免 Windows 并行清理冲突。新增文件跑定向 lint；如全仓存在旧问题，明确范围，不宣称全仓通过。根据迁移修改执行 db:check:schema、隔离 PG 检查和 access:check。不要在未知生产环境执行带迁移副作用的 deploy:check 作为普通测试。

## 13. 发布与回滚

沿用现有 VPS PostgreSQL、PM2、Caddy，不更换服务器角色或代理软件。新英语对话迁移与新增听力迁移都要按实际未应用顺序核查。

先在独立数据库验证，生成备份与版本化发布包；检查实际磁盘、内存、端口、环境变量是否存在，只报告配置状态不打印值。该 VPS 同时运行其他产品，构建尽量在本地或独立受限目录完成。

正式发布前做数据库备份、校验可恢复性、保留旧产物。增量加表迁移优先向后兼容，应用回滚不自动删除新表或用户记录。使用独立预览端口，只有必要服务切换，不批量重启 PM2 全部应用。

上线验收：域名 HTML + 实际 JS/CSS/音频 MIME、带合法身份的目标 API、未授权拒绝、一次完整练习、一次恢复、Bot 入口和已配置提醒。仅首页 200 或进程 online 不算完成。

本交接文档授权范围为规划；执行者根据新的实施指令及会话已有授权开展开发/发布，不凭文档自行购买服务、向其他用户发消息或变更 DNS。

## 14. 交付报告格式

每批结束提供：完成的任务 ID、实际用户流程、修改文件、测试证据、迁移/部署状态、未通过或依赖外部服务的项。明确本地可用、预览可用、线上可用、手机真机已验收四者的区别。

第一轮从 A0 开始，持续完成 A1–A5。若外部音频供应商未配置，仍完成 A 批次和 B/C 的可测试适配设计，报告具体缺项；不能伪造音频效果或用演示数据冒充真实用户学习成果。
