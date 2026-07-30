# Academy 当前代码与 v3.6 需求差距清单 / 开发任务拆解

更新时间：2026-07-28

本文用于把最新版需求落到可执行开发任务。当前代码已经具备 Telegram Mini App 基座、PostgreSQL 数据层、固定课程、选课、今日任务、选择题检查、提交、笔记、进度、提醒、邀请、积分账本、Telegram Stars 雏形、DeepSeek/Ollama AI 点评、四语言 UI 基础和若干后台接口。

但 Academy 的目标已经从“课程展示工具”升级为“目标驱动 + Evidence-first 的学习运行时”。因此后续重点不是继续堆课程，而是让用户每天打开后能完成一个真实推进目标的 Mission，并留下可审核证据。

---

## 1. 当前已具备能力

### 1.1 Mini App 学习基座

- Telegram 身份验证与用户资料记录：Telegram ID、昵称、用户名、头像、语言、时区。
- 课程目录与选课：必选 1 门，最多 3 门，支持独立 enrollment day。
- 今日任务：聚合已选课程的当天任务，并支持额外学习入口。
- 课程完成：选择题检查、提交、修正提交、规则评分、AI 点评降级。
- 学习资产：笔记、进度、复习队列、阶段测评、提醒历史。
- 移动端体验：已处理 iOS 输入框聚焦放大、键盘遮挡提交按钮等问题。

### 1.2 数据、支付与邀请基座

- 生产方向已迁移到 PostgreSQL，SQLite 作为本地开发/迁移来源保留。
- 已有 pricing、credits、payment orders、subscriptions、invitations 等核心表和迁移。
- Telegram Stars invoice / pre-checkout / successful payment / refund 主流程已接入。
- 月付目标价调整为 $9.9；Stars 未配置时会显示禁用原因，不再误导用户点击。
- 有效邀请规则已明确：注册不算，必须认证、付费并产生有效学习行为。
- 积分账本已接入，可展示最近积分流水。
- 已新增 `npm run acceptance:check` 静态 P0 验收门禁，并接入 `deploy:preflight` / `deploy:check`，用于发布前确认身份、选课、选择题提交、移动端键盘样式、提醒、Stars、邀请、证据、后台 Dashboard 等关键验收面没有缺失。
- 已新增 `npm run acceptance:new` 真机验收记录生成工具，会在 `docs/acceptance-runs/` 生成带时间戳的 P0 勾选记录，用于个人 7–10 天试用和第二位种子用户进入前复盘。

### 1.3 多语言基座

- UI 支持中文、越南语、高棉语、泰文。
- UI 语言可保存到 `users.ui_locale`。
- 课程正文与 UI 文案开始分离；课程缺少翻译时回退中文审核版，并显示提示。
- 已新增 `mini-app/lib/runtime-copy.ts`，将 Today Mission、课程、笔记、进度、Lesson、Assessment、Review、个人中心、支付、邀请、提醒等高频 runtime copy 从 `page.tsx` 抽出。
- 已新增 `npm run content:i18n:check-copy`，用于检查关键 UI/提醒/支付/邀请文案是否覆盖四语言。
- 今日监督状态文案已抽到 `supervisionRuntimeCopy`，连续中断、需要补课、今日完成、今日监督不再散落在 `page.tsx`。
- 积分流水类型与状态文案已抽到 `creditsLedgerTypeCopy` / `creditsLedgerStatusCopy`，Profile/邀请奖励相关 copy 不再由页面组件直接维护。
- Goal Template / Agent Lab 的 Runtime 检查、workflow export、上传证据、提交里程碑等文案已抽到 `goalRuntimeCopy`，首个 AI 21 天模板的核心交互开始进入四语言文案池。
- 能力证明分享页的生成按钮、公开页标签和成功/失败通知已进入 `progressRuntimeCopy`，Evidence-first 的对外证明交互不再在页面中硬编码中文。
- 个人中心续用规则、月价展示、Stars 数量、订阅价格区块和积分抵扣开关已进入 `profileRuntimeCopy`，支付/访问状态页继续向四语言可替换文案收敛。
- Today 页的阶段测试标题、复习队列标题、未选课卡片、课程未准备兜底、Evidence 引用语和学习进度 aria label 已进入 `todayRuntimeCopy`；Profile 的 Telegram 用户名兜底和 Telegram 信息 label、Progress 的 Day 0 / Day 21 对比标题也已进入对应文案池。
- 启动/请求失败文案已通过 `requestRuntimeCopy` 做四语映射；60 天后 Level 2 / Extension 课程卡片已进入 `courseRuntimeCopy.extensionPaths`。`page.tsx` 已加测试约束，不允许再直接出现中文/泰文/高棉语 UI 文案。

---

## 2. 当前主要差距

### Gap A：产品形态仍偏课程中心

需求目标是“用户每天打开 Academy，是为了完成目标的下一步”，而当前页面仍保留较强的“今日课程 / 课程列表 / 提交状态”结构。

已完成：

- 已有首个 AI Goal Template：`personal-knowledge-assistant-21d`。
- 已有 Day 0 / Day 7 / Day 21 检查点。
- 首页开始展示 Today Mission、Prototype Progress、Next Evidence。
- AI Prototype Progress 已开始从 accepted evidence 聚合。
- 已补齐 `TEMPLATE_DESIGN_GUIDE.md`：新增目标模板准入标准、Template Card、Definition of Done、Evidence Model、Progress Mapping、Recovery Loop 和拒绝清单。
- 已新增 `npm run templates:check`：发布前确认模板规范存在、需求文档链接有效、首个目标模板仍保留 DoD、检查点、证据和进度映射。

仍缺：

- 首页还需要进一步弱化课程列表，把 Mission、Evidence、Prototype Progress 放到更核心位置。
- 不同课程目标与 Evidence 的映射还不够统一。

### Gap B：Evidence Model 已有骨架，但还没完全成为唯一事实来源

需求铁律是：Nothing counts unless it is evidenced.

已完成：

- 已新增 `evidence_items`。
- Quiz、项目里程碑、复习、测评等已开始写入 evidence。
- Progress 中的有效学习日、证据数、AI Prototype Progress 已开始基于 accepted evidence。

仍缺：

- Today 页按钮状态仍有部分逻辑依赖 submission，而不是完全依赖 evidence。
- Runtime Success 已从纯手工记录升级为结构化审计记录，但还未做到真正远程自动执行用户 Demo。
- 课程完成、能力节点和证书之间的映射还需要更清晰。

### Gap C：AI 课程教学结构还要继续打磨

用户反馈很明确：不能还没讲懂基本概念，就让用户写复杂 prompt。

已完成：

- AI Day 1–7 已按基础概念优先重构。
- 知识检查改为 3 道选择题，至少答对 2 题通过。
- 主观输入改为实操证据/反思，不再作为基础知识唯一通过条件。
- AI 课程正文已显式展示核心原则与能力目标：通用选择题考到的“核心原则 / 能力目标”必须先出现在正文里，避免用户觉得还没学就被考。
- 课程质量门禁已补齐：`npm run content:quality:check` 会检查 AI Day 1–14 是否先教学再检查、选择题数量是否为 3–5、Day 8–14 是否包含知识/例子/检查/最小实操，并已接入发布预检。
- 选择题提交后会即时聚合该 lesson 的首交表现；首交样本达到 3 次且通过率低于 60% 时，自动写入 Course Review Center 的 open quality event。
- Course Review Center 的 `create_new_version` 已改为幂等：同一质量事件会创建或复用对应 draft 课程版本，并在 metrics 中记录 rewriteTarget，避免重复点击生成多个无效版本。
- Quiz Attempt 已记录 `content_version_id`，低通过率质量事件按 lesson + course content version 分开归因；旧版低通过率不会污染新版课程发布后的观察数据。

仍缺：

- 每课正文是否真正“讲得好”仍需要真实答题数据验证；静态门禁只能证明结构完整，不能证明用户已经理解。
- AI Day 8–14 已按“知识 → 示例 → 检查 → 最小实操”补齐第一版；Day 15–21 通过 Round 2 复用 Level 1–7 进入更高要求，后续重点是根据真实答题数据继续改写低通过率课程。
- 低通过率课程已经可自动入队，并能安全创建改版 draft；后续还要基于真实质量事件形成试学、审核、发布和新版课程通过率对比复盘。

### Gap D：多语言仍是 UI 基座，不是完整本地化产品

已完成：

- UI 四语言基础已接入。
- 关键 runtime copy 正在模块化。
- AI Day 1–7 的 vi/km/th draft 已有内容生产流程。

仍缺：

- Lesson / Assessment / Review runtime copy 已抽出到正式文案池；后续重点是接入正式翻译审核与发布流程。
- vi/km/th 课程草稿需要导入并人工审核后才能发布。
- 多语言课程版本、审核状态、回退提示需要继续做运营闭环。

### Gap E：提醒系统已可观察，但还需要更强运营闭环

已完成：

- 我的页展示提醒历史、下一次提醒窗口和诊断原因。
- 有测试提醒按钮。
- 有服务端提醒诊断接口。
- 已修复 PostgreSQL 下连续中断提醒日期函数问题。
- Ops Dashboard 已展示提醒投递健康：24 小时 total/delivered/failed/queued/opened/completed、最近送达时间和最近 10 条脱敏提醒事件。
- 新增 `npm run reminders:check`：在 VPS 上检查 `academy-reminders.timer`、systemd timer 列表和 Ops Dashboard 的 Reminder Delivery Health 标识，用于上线后快速确认提醒链路基础设施不是“只在页面上显示中断，但后台没跑”。

仍缺：

- 线上仍需验证 `academy-reminders.timer` 是否已安装启用，并确认 Telegram 真实投递可达。
- 提醒转化数据应继续和 Day 7 / Day 21 目标完成率关联。

### Gap F：支付与邀请可用，但商业验证还没完成

已完成：

- $9.9/月价格已落地。
- Stars 配置状态、禁用原因、订单状态、退款说明已展示。
- 邀请与积分账本已接入。

仍缺：

- 还没有真实 10 人种子用户数据。
- 还没有真实 $9.9 支付验证。
- 积分抵扣、活动优惠、邀请奖励还需要后台运营视图继续打磨。

---

## 3. P0 开发任务：Mini App 基座稳定可用

目标：10 个种子用户能稳定进入、选课、学习、提交、收到提醒、查看进度，不被支付、数据库、多语言或移动端体验阻断。

- [x] PostgreSQL 迁移与启动自检。
- [x] 缺失新表时首页降级，不直接崩溃。
- [x] 今日页聚合所有启用课程。
- [x] 选择题检查替代高失败率自然语言匹配。
- [x] 输入框聚焦不放大，提交按钮不被键盘挡住。
- [x] AI Day 1–7 基础课程重构。
- [x] 个人中心精简为头像昵称、ID、语言、时区、课程数。
- [x] UI 语言保存与四语言基础。
- [x] 提醒历史、测试提醒、提醒诊断。
- [x] $9.9/月价格与 Stars 禁用原因展示。
- [x] Runtime copy 初步模块化：Today/Course/Notes/Progress/Profile/Payment/Invite/Reminder。
- [x] 学习写入服务端权限门禁：`resolveReviewQueueEntry` 已补上 `assertLearningAccess`，并新增 `npm run access:check` 检查选课、提交、笔记、阶段测试、复习队列、上传、里程碑和 Agent Lab 写入都在服务端检查访问权限。

剩余 P0：

- [x] 把 Lesson / Assessment / Review runtime copy 从 `page.tsx` 继续抽出。
- [x] 部署前自检命令已补齐：`npm run deploy:check` 会串起 build、四语言文案检查、schema/migration coverage、PostgreSQL 迁移和生产库结构自检；失败时输出 `restart_safe=no`、`next_action` 和 `repair_hint`，避免带病重启。
- [x] 非破坏性发布预检已补齐：`npm run deploy:preflight` 只执行 build、四语言文案检查和 schema/migration coverage，不连接或迁移 PostgreSQL，适合本地或部署前先跑一遍。
- [x] 目标模板设计门禁：`npm run templates:check` 已接入 `deploy:preflight` / `deploy:check`，防止后续新增目标模板绕过 Evidence-first 和 DoD 规范。
- [x] 访问权限门禁：`npm run access:check` 已接入 `deploy:preflight` / `deploy:check`，防止试用到期后仍可通过写入 API 推进学习状态。
- [ ] 线上发布前仍需在 VPS 执行 `npm run deploy:check`，确认当前服务器数据库已同步到最新迁移。
- [x] 真机验收清单已补齐：`docs/TELEGRAM_MINI_APP_ACCEPTANCE_CHECKLIST.md` 覆盖登录、语言、选课、答题、提交、笔记、提醒、Stars、邀请和后台检查。
- [ ] 线上发布后仍需按真机验收清单实际执行一次，确认 iOS/Android Telegram Mini App 体验通过。

---

## 4. P1 开发任务：21 天验证闭环

目标：招募 10 人，至少 3 人完成 21 天，至少 1 人真实支付 $9.9。

### P1-1 Evidence Model

- [x] 新增统一 `evidence_items`。
- [x] Quiz / 阶段测评 / 项目里程碑写入 evidence。
- [x] Progress 使用 accepted evidence 计算关键指标。
- [x] Today Mission 完成状态已切到 evidence-first：今日计数、主任务选择、提前学习解锁、课程路径、提醒跳过判断和跨日推进均要求 `lesson_submission` 的 accepted evidence。
- [x] 建立课程完成 → 能力节点 → 目标进度的统一映射表：`COURSE_COMPETENCY_MAPPINGS` 负责 evidence 到 competency node，`GOAL_PROGRESS_MAPPINGS` 负责 lesson evidence / milestone 到目标进度。

### P1-2 首个目标模板

- [x] `Build a Personal Knowledge Assistant` 模板。
- [x] Day 0 / Day 7 / Day 21 检查点。
- [x] 项目里程碑提交入口。
- [x] 人工审核与 pending review。
- [x] 本地附件上传与 metadata 记录。
- [x] Runtime Success 从纯手工记录升级为结构化审计：Agent Lab 会检查测试用例、引用线索、workflow export 和可访问 runtime/reference 链接，并把 audit 写入 `agent_runtime_checks.result_json`。
- [x] Runtime audit 已接入 Validation Dashboard：可直接查看 structured runtime check 的测试数、引用数、workflow export、链接状态和失败原因。
- [ ] Runtime Success 继续升级到真正远程自动执行用户 Demo。

### P1-3 留存与转化指标

- [x] D1 / D7 / D21 留存基础统计。
- [x] FWPR-7、Day 21 DoD、Evidence 提交率进入后台。
- [x] 选择题首交通过率、修正通过率、低通过题进入质量事件。
- [x] 试用结束后进入 $9.9 续费路径。
- [x] 10 人种子验证执行模板已补齐：`docs/SEED_VALIDATION_SPRINT.md` 覆盖招募表、每日跟进、Day 0/7/21 检查、付费验证和每周复盘。
- [x] 种子用户跟进记录入口已补齐：新增 `seed_user_notes` 表，Ops Dashboard 可读取并通过受保护 POST 记录完成来源、失败原因、付费异议和人工跟进。
- [x] 种子验证记录与结果校验已补齐：`npm run seed:new` 生成 cohort 记录，`npm run seed:validate -- --file <记录文件>` 校验 10 人、3 人完成、1 人付费、完成来源、不付费原因和阻断 Bug 记录。
- [ ] 种子用户真实数据跑满 21 天。
- [ ] 记录未付费原因：价格、价值不足、提醒过强、课程难度、支付阻塞。

---

## 5. P2 开发任务：能力证明与课程扩展

目标：从“能学”升级为“能证明能力”，并为更多课程与长期商业化打基础。

### P2-1 Competency Graph

- [x] 定义 AI 基础、Prompt 指挥、知识检查、原型构建、运行验证等最小能力节点。
- [x] accepted evidence 聚合到能力节点。
- [x] Progress 页展示能力图谱和导出能力证明。
- [x] 能力证明加入外部展示页/分享卡第一版：Progress 页可生成公开 proof token；`/proof/<token>` 展示能力总分、证据节点、生成时间和 Evidence-first 原则；公开页不暴露 Telegram ID。
- [x] 能力证明分享表已补齐 migration、自检和 Drizzle schema：`competency_proof_shares` 不再只存在于 SQL，后续生成迁移/检查 schema 时不会丢模型定义。

### P2-2 Agent Lab / Runtime

- [x] Flowise 作为 Agent Builder Adapter 的轻入口。
- [x] Academy Core 保存项目身份、workflow/export 引用、runtime check 结果。
- [x] Flowise workflow export 结构校验第一版：Runtime Audit 会检查 export 是否可识别为 Flowise 图结构，至少包含节点、边和 Agent/RAG/LLM/Tool 等关键节点；Dashboard 展示节点数、边数、关键节点数和失败原因。
- [x] Remote Runtime Probe 第一版：Runtime Audit 会访问用户提供的 runtime/reference URL，读取有限内容样本，检查 HTML/API/Chat/Demo/Flowise 等运行线索；Dashboard 展示 probe signals，避免只凭 HTTP 200 误判。
- [x] Flowise 远程执行增强第一段：当 runtime/reference 可推导出 prediction endpoint 时，Runtime Audit 会真实发送测试问题，记录远程执行成功条数与回答摘要。
- [x] Runtime 远程探测安全边界：只允许公网 http/https 地址，拒绝 localhost、内网 IP、metadata 主机和自动跳转，避免用户提交的 Demo URL 被滥用为服务器内网探测入口。
- [ ] 真正远程 Runtime 自动执行用户 Demo。
- [ ] 校验 Flowise workflow 真实运行结果。

### P2-3 内容与本地化运营

- [x] Knowledge Hub 素材库：资料只进入 pending review，不自动生成课程。
- [x] Course Review Center：课程版本、翻译版本、质量事件。
- [x] 本地化模板生成、草稿校验、导入前质量检查。
- [x] AI Day 1–7 vi/km/th draft。
- [ ] 导入并人工审核 vi/km/th 课程草稿。
- [x] 扩写 AI Day 8–14：每课补齐知识解释、真实例子、检查重点和最小实操。
- [ ] 根据 Day 15–21 的真实答题数据，继续改写 Round 2 中低通过率课程。
- [ ] English / Business 先不要扩展新体系，等首个 AI 21 天模板数据跑出来。

---

## 6. 建议执行顺序

1. 在 VPS 上执行 `npm run deploy:check`，同步 PostgreSQL 迁移并运行生产自检，确认线上 Mini App 不再因为表缺失或文案错误崩溃。
2. 部署并同步数据库迁移，先保证线上 Mini App 不再因为表缺失或文案错误崩。
3. 按 `docs/TELEGRAM_MINI_APP_ACCEPTANCE_CHECKLIST.md` 做真机测试：进入、选课、学习、选择题、提交、笔记、语言、提醒、Stars、邀请和后台检查。
4. 跑 7–10 天个人试用，重点记录：哪里阻断、哪里太难、哪里提醒有效。
5. 再邀请第二位用户进入，开始 21 天种子验证。
6. 只在真实数据证明有效后，再继续改写 AI Day 15–21 低通过率课程、English 深度课和 Business 延展课。

---

## 7. 下一轮实际开发队列

### P0：上线稳定与真机验收

- [ ] 在 VPS 执行 `npm run deploy:check`，确认生产 PostgreSQL 已包含最新迁移与自检表。
- [x] 本地/服务器发布前静态 P0 验收门禁：`npm run acceptance:check` 已覆盖 Mini App 真机验收依赖的关键入口，并已接入发布预检。
- [x] 真机验收记录模板：`npm run acceptance:new` 可生成一次验收记录文件，避免 P0 检查只停留在口头或临时笔记。
- [x] 真机验收结果校验：`npm run acceptance:validate -- --file <记录文件>` 会检查记录文件是否仍有未勾选 P0 项，并要求 `acceptance_result: pass`，避免还没验收完就邀请第二位用户。
- [ ] 按 `docs/TELEGRAM_MINI_APP_ACCEPTANCE_CHECKLIST.md` 完成一次 iOS / Android Telegram Mini App 真机验收。
- [x] 验证 Today / Course / Lesson / Assessment / Review / Profile 的四语 UI 文案不再从 `page.tsx` 内散落输出；本轮已抽出监督状态、积分流水类型/状态、Agent Lab / Goal Runtime、能力证明分享、续用规则与订阅价格、Today 课程选择/复习/阶段测试、Profile Telegram 信息、Day0/Day21 对比、启动前请求错误和 60 天后扩展课程卡片文案，并用测试约束 `page.tsx` 不再直接出现中文/泰文/高棉语 UI 文案。
- [x] 后台提醒健康面板：展示 24 小时投递、失败、点击、完成和最近提醒事件，用于排查 dispatcher / Telegram 投递问题。
- [x] 提醒健康命令：`npm run reminders:check -- --base-url https://academy.linkx.club` 会检查 systemd timer 和后台 Reminder Delivery Health 面板。
- [ ] 线上验证提醒链路：中断提醒、测试提醒、提醒历史和后台诊断能闭环，并记录 Telegram 实际送达结果。
- [x] 本地课程结构门禁：`npm run content:quality:check` 已覆盖 AI Day 1–14；其中 Day 8–14 必须具备“知识 / 例子 / 检查 / 最小实操”，并确认选择题在正文之后。
- [ ] 发布后仍需在 Telegram 真机中复测 AI Day 8–14 的实际阅读体验，确认页面呈现顺序和滚动体验符合预期。

### P1：21 天种子验证闭环

- [ ] 个人连续试用 7–10 天，记录阻断点、低通过率题目、提醒是否有效、是否愿意继续打开。
- [ ] 招募 10 位种子用户，记录来源、英语/AI 基线、每日可投入时间、是否接受强提醒。
- [ ] 在 Ops Dashboard 记录每天跟进：完成来源、自主/提醒/强监督、失败原因、付款异议。
- [x] 21 天结果判定器：`npm run seed:validate` 会校验至少 10 名合格种子用户、3 人完成 21 天、1 人真实支付 $9.9、FWPR-7、Day21 DoD、Day0/Day21 对比、完成来源和不付费原因。
- [ ] 跑满 21 天后填入真实数据并通过 `npm run seed:validate`。
- [x] 低通过率课程自动进入 Course Review Center：选择题提交后即时聚合，首交样本 ≥3 且通过率 <60% 自动创建/更新质量事件。
- [x] 质量事件改版入口幂等化：`create_new_version` 会创建或复用同一质量事件对应的 draft 课程版本，并记录 rewriteTarget。
- [x] Quiz 质量数据按课程版本归因：提交时记录当前 published content version，低通过率事件使用 `quiz_low_first_pass:<lessonId>:<contentVersionId>` 作为幂等来源。
- [ ] 对质量事件执行完整运营闭环：优先改正文和选择题，而不是降低通过标准；试学后发布新版本，并用新旧版本首交通过率对比判断课程是否真的变好。

### P2：能力证明、Runtime 与课程扩展

- [ ] 将 Runtime Success 从结构化人工审计升级为真实远程 Demo 自动执行。
- [ ] 校验 Flowise workflow 不只“结构像”，还要能运行并返回符合测试用例的结果。
- [ ] 导入 vi / km / th 课程草稿，并进入人工审核流程后再发布。
- [ ] 根据 Day 15–21 真实数据改写 Round 2 中低通过率课程。
- [ ] 在首个 AI 21 天模板跑出数据前，不扩张 English / Business 新体系，只做必要修补。

当前最重要的产品原则保持不变：

> Nothing counts unless it is evidenced.  
> 没有证据，就不算完成。
