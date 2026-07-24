# Academy 相邻开源项目研究

> 调研日期：2026-07-24  
> 目的：识别 Academy 的互动课堂、学习运行时与 Agent Lab 可借鉴能力；不是选择一个项目替换 Academy。

## 结论

Academy 不应 fork 或整合一套完整 LMS。它应保留自己的 Telegram 身份、监督、21 天留存、进度、学习证据与订阅系统；把互动课堂、课程管理或 Agent 构建平台视为可替换的外部能力。

```text
Academy Core（必须自有）
├── 用户、课程版本、进度、错题、提醒、付费、证据
├── 规则化 Agent Coach
│
├── Classroom Adapter → OpenMAIC（专题互动课）
├── Lab Adapter → Dify / Flowise（工作流与 Agent 原型）
└── Content Admin 参考 → LearnHouse / Open edX（后期）
```

## 对比总览

| 项目 | 最接近 Academy 的模块 | 强项 | 不应承担的职责 | Academy 的结论 |
|---|---|---|---|---|
| [OpenMAIC](https://github.com/THU-MAIC/OpenMAIC) | Interactive Classroom | 多智能体课堂、TTS、白板、PBL、互动模拟、自动生成课堂 | 用户事实、订阅、21 天监督、毕业认证 | 首选“专题互动课堂”候选，先独立评估 |
| [LearnHouse](https://github.com/learnhouse/learnhouse) | 现代 LMS / 内容后台 | 课程编辑、作业、代码运行、协作白板、分析、证书 | Telegram-first 学习监督与轻量移动闭环 | 借鉴内容后台与 Lab 信息架构，不集成 |
| [Open edX](https://github.com/openedx/openedx-platform) | 大规模 LMS / CMS | CMS + LMS 分离、可扩展学习交付、成熟运营模型 | 10 人验证、轻量部署、快速迭代 | 架构案例，不引入代码或运行时 |
| [Dify](https://github.com/langgenius/dify) | Agent Lab / RAG | 工作流、RAG、模型管理、可观测性、API 化 | 课程节奏、能力判定、学生监督 | 后期用于 Lab 原型或企业交付，不做课程平台 |
| [Flowise](https://github.com/FlowiseAI/Flowise) | 可视化 Agent Lab | Node 图、低代码 Agent、快速自托管、Apache-2.0 | 复杂学习档案、教学内容、认证 | 小型 MVP Lab 的优先试验对象 |

## 1. OpenMAIC — 互动课堂引擎候选

### 功能

- 输入主题或资料，生成课纲与互动场景；
- AI 教师、同学和助教进行讲解、讨论与问答；
- 幻灯、Quiz、互动 HTML 模拟、PBL、白板、TTS/ASR；
- 支持从 Telegram 等消息入口生成课堂；
- 支持导出 PPTX、互动 HTML 等内容。

### 架构与技术栈

- 以 TypeScript 为主；Node.js 20+、pnpm 10+；
- 多模型供应商配置，支持 Ollama 与 OpenAI-compatible API；
- 课程生成遵循“课纲 → 场景”的两阶段流程；
- 最新公开 v0.3.0 引入 `@openmaic/*` SDK、编辑器和 PBL v2，并改为 MIT 许可。版本与许可必须在接入时再次核验。

### 优点

- 最接近“课堂不是视频、而是互动体验”的目标；
- 适合 LangGraph、MCP、RAG、区块链机制等需要图示、讨论或模拟的专题；
- 比 Academy 当前的文本课更适合作为“深讲一节”的体验增强。

### 缺点与风险

- 生成成本、首屏等待、TTS/多 Agent 延迟和移动端体验都可能伤害 15–20 分钟日课；
- 自动生成课堂不等于准确课程，需要来源、人工审阅和版本管理；
- 它是完整产品，不是已验证的嵌入式 SDK；需先验证登录、会话、事件回传与数据边界；
- 开源许可近期有变动，商业使用前必须做当期许可证核验。

### 对 Academy 的正确用法

先独立部署，选一个固定主题（例如“RAG 基础”）与 Academy 固定课 A/B 对比；仅当完成率、正确率或真实项目表现有明显改善时，做“Academy 启动课堂 → OpenMAIC 返回完成事件”的适配器。

## 2. LearnHouse — 现代课程平台参考

### 功能

- 课程与合集、内容编辑器、作业、讨论、播客、分析；
- AI 互动元素、代码运行与自动评分、协作白板、证书、用户组；
- 后台管理、品牌站点与企业功能。

### 架构与技术栈

- Monorepo：Web、API、协作服务和 CLI；
- Web：Next.js、React、Tailwind、Tiptap；
- API：FastAPI、Python、SQLModel、Alembic；
- 协作：Hocuspocus、Yjs、WebSocket；依赖 PostgreSQL、Redis；
- AGPL-3.0，另有企业许可证。

### 优点

- 最完整地展示“内容作者后台 + 学生学习器 + Lab + 分析”应怎样解耦；
- 对未来 Academy 的 Knowledge Hub、课程编辑和 Lab 信息架构有很高参考价值；
- 已将代码运行、协作与证书纳入同一学习产品。

### 缺点与风险

- 对单用户、Telegram Mini App 和 2GB VPS 明显过重；
- 社区、组织、SEO、支付等能力会稀释当前的 21 天验证；
- AGPL 与企业功能边界意味着不能直接当作私有商业产品底座。

### 对 Academy 的正确用法

只借鉴数据模型与模块边界；不迁移、不 fork、不并行运行。

## 3. Open edX — 大规模 LMS 的反例与架构教材

### 功能

- Studio（CMS）负责课程创作；LMS 负责学习交付；
- 支持大规模课程运营、插件、微前端和独立应用。

### 架构与技术栈

- Python + JavaScript，核心为 Django；
- 模块化单体 + 独立部署应用 + React 微前端；
- 生产运行涉及 MySQL、MongoDB、Memcached 等服务；
- AGPL-3.0。

### 优点

- 清晰说明“课程创作系统”和“学习交付系统”应该分离；
- 大规模运行、内容版本、权限与运营经验丰富。

### 缺点与风险

- 官方明确提示生产自托管不简单；
- 基础设施和运维复杂度远超 Academy 当前阶段；
- 多人课程运营模型不匹配 Telegram-first、监督型个人学习。

### 对 Academy 的正确用法

把 CMS/LMS 分离作为长期原则；不采用其运行时或基础设施。

## 4. Dify — Agent Lab 与企业交付候选

### 功能

- 可视化工作流、RAG 管道、Agent、模型管理、工具调用和 LLMOps；
- 文档摄取、检索、可观测性和 API/BaaS；
- 支持自托管和云部署。

### 架构与技术栈

- 容器化多服务部署；官方建议 Docker Compose；
- 提供 API，可嵌入自己的业务逻辑；
- 以 Python、Next.js/TypeScript 等技术为主，依赖 PostgreSQL 等运行组件；
- Dify Open Source License：以 Apache-2.0 为基础但有附加条件，需逐条审查。

### 优点

- 与 Academy 的 AI 毕业项目高度匹配：RAG、工作流、工具与部署可成为 Lab 任务；
- 可观测性和 API 化适合将“项目是否真实运行”保存为能力证据；
- 比从零写 Agent 平台更快。

### 缺点与风险

- 不是教学产品，不提供课程节奏、学习监督或可信能力认证；
- 自托管资源要求高于当前 Academy VPS；
- 许可证、模型密钥、多租户与数据隔离必须单独评审。

### 对 Academy 的正确用法

作为后期 AI Lab 的“可选项目环境”；Academy 保存任务书、测试结果和毕业证据，Dify 只运行工作流。

## 5. Flowise — 低代码 Agent Lab 候选

### 功能

- 通过可视化界面构建聊天流、RAG 和 Agent 工作流；
- 可自托管，支持 Docker；
- 提供服务器、React UI、第三方节点组件与 API 文档模块。

### 架构与技术栈

- TypeScript/JavaScript monorepo；
- `server` 为 Node API，`ui` 为 React，`components` 承载第三方节点；
- Node.js 20+、pnpm、Docker；
- Apache-2.0。

### 优点

- 比 Dify 轻量，适合第一批用户完成“搭出第一个 Agent 工作流”；
- Apache-2.0 对后续商业集成更友好；
- 图形化节点可把 Agent Lab 的学习结果变得可视、可截图、可审核。

### 缺点与风险

- 节点图容易让新手“连出流程”却不理解输入、失败处理与人工审核；
- 不是课程系统，也不能替 Academy 判定用户学会；
- 第三方节点、密钥和外部 HTTP 工具需要额外安全治理。

### 对 Academy 的正确用法

优先作为 1 个受限 Lab 试点：只提供一条固定模板、固定输入和测试案例，不开放“自由搭一切”。

## 推荐决策

| 决策 | 结论 | 原因 |
|---|---|---|
| 当前 Academy Core | 自建并继续迭代 | 它承载留存、监督、身份、证据和付费闭环 |
| 互动课堂 | 先评估 OpenMAIC | 体验差异最大，但成本与集成风险也最高 |
| 第一代 Agent Lab | 优先试 Flowise，Dify 作为企业方向备选 | Flowise 更适合受限的低代码学习任务；Dify 更像生产平台 |
| 内容后台 | 暂不引入 LearnHouse | 只借鉴，不增加第二套 LMS |
| 大规模 LMS | 不考虑 Open edX | 当前用户规模与服务器资源完全不匹配 |

## 下一步：两周技术验证，而非产品集成

1. **OpenMAIC 评估（2 天）**：独立部署；用同一份“RAG 基础”资料生成课堂；记录生成时间、模型成本、移动端可用性、三题正确率和完成时间。
2. **Flowise Lab 评估（1 天）**：制作一个固定“资料 → 检索 → 结构化回答 → 人工审核”的模板；用 20 个测试案例验证。
3. **不接入主产品**：先只保存评估表，不接 Telegram 身份、订阅和正式进度。
4. **通过门槛**：相较固定 Academy 课，互动或 Lab 至少在“完成率、正确率、真实任务表现”其中一项有明确提升，且单用户成本与部署复杂度在可接受范围内。

