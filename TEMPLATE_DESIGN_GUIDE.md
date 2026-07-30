# Academy 目标模板设计规范

更新时间：2026-07-28

本规范用于决定一个新目标是否允许进入 Academy 正式学习路径。目标模板不是“AI 随便生成一套课程”，而是一个可验证、可审计、可复盘的学习交付合同。

核心原则：

> Nothing counts unless it is evidenced.
> 没有证据，就不算完成。

---

## 1. 模板准入条件

任何新目标模板必须同时满足：

1. 有明确最终交付物，例如 Demo、代码、报告、对话录音、商业验证记录。
2. 能拆成有限、可验证的能力节点。
3. 每个能力节点至少对应一种可采集证据。
4. 周期控制在 2–4 周；超过 4 周必须拆成多个模板。
5. 有 Day 0 基线、阶段检查点和最终 Definition of Done。
6. 进度只能由 accepted evidence、人工审核通过的里程碑或可复核运行结果计算。
7. 不允许模型自由修改课程顺序、难度结构、毕业标准或直接发放认证。
8. 试跑前不得进入正式课程目录或付费承诺。

---

## 2. Template Card 必填字段

每个模板必须先写 Template Card：

| 字段 | 要求 |
| --- | --- |
| `template_id` | 稳定 ID，不能随版本改名 |
| `version` | 模板版本，例如 `v1` |
| `target_user` | 目标用户画像与基础要求 |
| `final_artifact` | 最终可交付物 |
| `duration_days` | 建议 14 / 21 / 28 天 |
| `daily_time_budget` | 面向付费用户默认 45–60 分钟 |
| `prerequisites` | 用户开始前必须具备或准备的东西 |
| `checkpoints` | Day 0 / Day 7 / Day 21 等检查点 |
| `definition_of_done` | 可复核完成标准 |
| `evidence_model` | 证据类型、权重、采集方式 |
| `failure_modes` | 预期失败原因和恢复任务 |
| `review_policy` | 规则评分、AI 点评、人工审核的边界 |

---

## 3. Definition of Done

DoD 必须描述“完成后外部人能验证什么”，不能写成“看完课程 / 打卡 21 天 / 感觉理解”。

合格 DoD 示例：

- 可以上传一份文档；
- 可以围绕文档提问；
- 回答包含来源或引用线索；
- 无依据问题能拒答；
- 有 README 或说明；
- 有 2 分钟 Demo；
- 有至少 5 个测试问题和测试结果；
- 用户能解释核心设计和失败边界。

不合格 DoD 示例：

- 学完 RAG；
- 了解 Agent；
- 连续打卡；
- AI 评分达到 90；
- 输出一篇看起来完整的总结。

---

## 4. Evidence Model

模板必须提前定义证据模型。不同证据的可信度不同，不能混成一个完成率。

| 证据类型 | 可信度 | 可用于 |
| --- | --- | --- |
| Quiz | 低到中 | 检查基础知识点 |
| Reflection | 低到中 | 记录用户理解和阻断点 |
| Project Artifact | 中 | 证明用户产出 |
| Runtime Success | 高 | 证明原型可运行 |
| Git Commit / Export | 中到高 | 证明过程和结构 |
| Demo Video | 中到高 | 证明可演示 |
| Mentor Review | 高 | 证明人工审核通过 |

规则：

- 进度百分比必须能追溯到证据；
- AI 点评不能单独作为 accepted evidence；
- 打开页面、停留时长、播放音频不能单独计入完成；
- 项目型目标必须至少包含 Project Artifact 和 Runtime Success；
- 认证必须来自多个证据组合，而不是单次测验。

---

## 5. Checkpoint 设计

推荐结构：

### Day 0：Baseline / Environment Ready

- 用户目标；
- 当前能力基线；
- 准备材料；
- 测试问题；
- 初始证据。

### Day 7：First Working Prototype

- 第一个可运行原型；
- 至少 3 个测试问题；
- expected answer / actual answer；
- 至少 2 条来源或引用线索；
- 规则预检；
- 必要时人工审核。

### Day 21：Demo Day / DoD

- 第三方可按说明运行；
- README；
- 2 分钟 Demo；
- 测试结果；
- 失败边界；
- Day 0 / Day 21 对比；
- 人工审核结论。

---

## 6. Progress Mapping

模板必须定义进度如何计算。禁止：

- 根据 AI 估计进度；
- 根据阅读时长计算进度；
- 根据打开次数计算进度；
- 根据未审核的用户自述直接计算能力。

允许：

- accepted lesson evidence；
- accepted project milestone；
- runtime check passed；
- mentor review passed；
- 版本化课程测验结果。

示例：

| 来源 | 最高进度 |
| --- | ---: |
| Day 0 accepted | 10% |
| Day 7 prototype accepted | 35% |
| 21 个核心 lesson evidence accepted | 70% |
| Day 21 DoD accepted | 100% |

---

## 7. Recovery Loop

如果用户在检查点失败，默认进入 Recovery Loop，而不是简单锁死或跳过：

```text
Evidence Fail
↓
Skill Gap Analysis
↓
Recovery Mission
↓
重新提交证据
↓
继续主线
```

恢复任务必须小于 30 分钟，并指向具体缺口，例如 JSON、引用来源、测试问题、README、Demo 链接。

---

## 8. 模板发布流程

新模板进入正式路径前必须完成：

1. Template Card；
2. DoD；
3. Evidence Model；
4. Progress Mapping；
5. Day 0 / Day 7 / Day 21 检查点；
6. 至少 1 次创始人试跑；
7. 至少 1 次外部用户试跑或明确暂不开放外部用户；
8. 已知失败模式记录；
9. Review Policy；
10. 版本号。

没有完成这些，不得进入正式课程目录、付费承诺或认证体系。

---

## 9. 首个允许模板

当前唯一允许的目标模板：

```text
template_id: personal-knowledge-assistant-21d
title: Build a Personal Knowledge Assistant
duration: 21 days
final_artifact: 可上传文档、可提问、可回答并引用来源的 AI 助手原型
```

其他模板，例如 Digital Asset Agent、Trading Bot、Compliance Agent、RAG Builder、English Speaking Sprint，必须在首个模板跑出种子验证数据后再进入设计评审。

---

## 10. 拒绝清单

出现以下任一情况，模板不得进入开发：

- 最终交付物不可验证；
- 没有 Day 0 基线；
- 没有项目证据；
- 只有 AI 自动评分；
- 依赖第三方 Provider 保存唯一学习记录；
- 目标超过 4 周但没有拆分；
- 进度来自打开次数、阅读时长或模型猜测；
- 没有失败恢复机制；
- 没有人工审核边界；
- 不能解释为什么当前模板比普通课程列表更适合该目标。
