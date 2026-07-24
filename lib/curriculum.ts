export type CourseDefinition = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  dailyMinutes: number;
  durationDays: number;
  accent: string;
  enabled: boolean;
};

export type AiLevel = {
  level: number;
  title: string;
  core: string;
  objective: string;
  practice: string;
  criteria: string[];
};

export const COURSE_CATALOG: CourseDefinition[] = [
  {
    id: "english",
    slug: "english",
    title: "English",
    subtitle: "真实沟通训练",
    summary: "从几乎无法交流，到完成 10 分钟真人英语任务。",
    dailyMinutes: 18,
    durationDays: 60,
    accent: "#bb6748",
    enabled: true,
  },
  {
    id: "ai-command-skills",
    slug: "ai",
    title: "AI Command Skills",
    subtitle: "AI 指挥术",
    summary: "不是教工具，而是训练你指挥 AI 完成真实工作的能力。",
    dailyMinutes: 20,
    durationDays: 60,
    accent: "#57705b",
    enabled: true,
  },
  {
    id: "business",
    slug: "business",
    title: "Business",
    subtitle: "商业视角训练",
    summary: "机会分析、用户访谈、案例判断，最终完成一次真实验证。",
    dailyMinutes: 20,
    durationDays: 60,
    accent: "#a48250",
    enabled: true,
  },
  {
    id: "founder-note",
    slug: "founder-note",
    title: "Founder Note",
    subtitle: "判断与反思",
    summary: "每天沉淀一个判断、一次决策或一个需要继续验证的问题。",
    dailyMinutes: 15,
    durationDays: 60,
    accent: "#68706c",
    enabled: true,
  },
  {
    id: "quiz",
    slug: "quiz",
    title: "Quiz",
    subtitle: "独立认知训练",
    summary: "用固定题目、规则评分与复习队列检验理解和记忆。",
    dailyMinutes: 15,
    durationDays: 60,
    accent: "#8f786e",
    enabled: true,
  },
];

export const AI_LEVELS: AiLevel[] = [
  {
    level: 1,
    title: "AI User",
    core: "AI 是执行者，你是决策者",
    objective: "把模糊需求改写成包含角色、任务、背景、约束与验收标准的指令。",
    practice: "选择一个今天真实需要完成的任务，先写原始指令，再改写成可验收的指挥官指令。",
    criteria: ["角色", "任务", "背景", "约束", "验收标准"],
  },
  {
    level: 2,
    title: "进阶 Prompt",
    core: "示例、格式、边界和上下文决定输出质量",
    objective: "使用 Few-shot、格式预设、任务拆分和否定约束控制输出。",
    practice: "用同一个真实需求分别制作无示例版和带示例版，并记录输出差异。",
    criteria: ["示例", "输出格式", "任务拆分", "边界"],
  },
  {
    level: 3,
    title: "角色与视角",
    core: "角色用于限定分析框架，不是装饰",
    objective: "为不同决策视角定义角色、背景、目标和判断边界。",
    practice: "让三个不同角色分析同一个工作问题，并比较它们关注的证据和风险。",
    criteria: ["角色差异", "背景", "目标", "比较"],
  },
  {
    level: 4,
    title: "结构化分析与验证",
    core: "要求可检查的依据，不索取隐藏思维过程",
    objective: "让 AI 区分事实、假设、不确定性、判断依据与验证方式。",
    practice: "选择一个复杂问题，要求 AI 输出事实、假设、选项、风险和验证清单。",
    criteria: ["事实", "假设", "依据", "不确定性", "验证"],
  },
  {
    level: 5,
    title: "AI 决策辅助",
    core: "AI 摊开选项，人承担决定",
    objective: "建立决策标准、权重、情景推演和风险矩阵。",
    practice: "对一个真实决策制作三方案矩阵，并亲自确定权重和最终选择。",
    criteria: ["决策标准", "权重", "方案", "风险", "最终选择"],
  },
  {
    level: 6,
    title: "知识库与 RAG",
    core: "先检索证据，再生成答案",
    objective: "建立带引用、可拒答、可测试的最小知识库。",
    practice: "选择一份自己的文档，设计 5 个可验证问题，并检查答案是否引用正确内容。",
    criteria: ["文档", "测试问题", "引用", "拒答", "检索"],
  },
  {
    level: 7,
    title: "工作流与 Agent",
    core: "可靠流程比角色数量更重要",
    objective: "设计输入、工具、状态、路由、重试和人工审核节点。",
    practice: "把一个重复任务拆成至少三个步骤，明确每一步输入、输出和失败处理。",
    criteria: ["输入", "输出", "路由", "失败处理", "人工审核"],
  },
  {
    level: 8,
    title: "数据分析",
    core: "让计算结果可复核",
    objective: "完成数据解释、清洗、计算、异常确认和洞察验证。",
    practice: "使用一份 CSV 找出三个信号，并写出每个结论的计算依据。",
    criteria: ["字段", "清洗", "计算", "异常", "依据"],
  },
  {
    level: 9,
    title: "内容创作",
    core: "AI 是编剧，你是导演和总编",
    objective: "控制结构、受众、语气、渠道适配与事实检查。",
    practice: "把一个真实主题改写成三个渠道版本，并说明每版为什么这样调整。",
    criteria: ["受众", "结构", "语气", "渠道", "事实检查"],
  },
  {
    level: 10,
    title: "编程辅助",
    core: "能运行、会测试、可解释",
    objective: "使用 AI 完成需求描述、实现、调试、测试和代码解释。",
    practice: "完成一个可运行的小功能，保留错误、修改和测试记录。",
    criteria: ["需求", "运行结果", "错误", "测试", "解释"],
  },
  {
    level: 11,
    title: "写作与翻译",
    core: "信息完整之后再做文化适配",
    objective: "区分直译、重写、语气和本地化要求。",
    practice: "选择一段真实业务文本，完成直译、重写和目标受众检查。",
    criteria: ["信息完整", "语气", "受众", "本地化"],
  },
  {
    level: 12,
    title: "学习助手",
    core: "让 AI 引导理解，而不是代替思考",
    objective: "使用苏格拉底提问、费曼解释、拆解与出题检验理解。",
    practice: "选择一个不熟悉概念，让 AI 通过提问教你，最后用自己的话解释。",
    criteria: ["提问", "解释", "自己的语言", "测试"],
  },
  {
    level: 13,
    title: "综合实战",
    core: "把多个能力连接成可交付成果",
    objective: "持续推进一个真实 AI 项目，而不是完成一次性练习。",
    practice: "更新毕业项目：说明本轮增加了什么、验证了什么、还失败在哪里。",
    criteria: ["真实问题", "可运行成果", "验证", "失败记录"],
  },
  {
    level: 14,
    title: "周期复盘",
    core: "总结、补漏、升级",
    objective: "根据证据判断已经掌握、仍需练习和下一轮升级的能力。",
    practice: "完成本轮复盘，并为下一轮写出一个具体升级目标。",
    criteria: ["掌握证据", "薄弱点", "升级目标", "下一步"],
  },
];

const ROUND_META = [
  {
    name: "理解与模仿",
    instruction: "跟随示例完成，重点是理解正确结构。",
  },
  {
    name: "独立应用",
    instruction: "不复制示例，使用自己的真实任务独立完成。",
  },
  {
    name: "组合交付",
    instruction: "至少连接两个 Level，产出可以交付的结果。",
  },
  {
    name: "自动化与可靠性",
    instruction: "增加测试、失败处理、人工审核和真实运行证据。",
  },
];

export type FixedLesson = {
  id: string;
  courseId: string;
  day: number;
  level: number;
  round: number;
  title: string;
  objective: string;
  content: string;
  practicePrompt: string;
  criteria: string[];
  estimatedMinutes: number;
};

export function buildAiLesson(day: number): FixedLesson {
  if (day < 1 || day > 60) {
    throw new Error("AI lesson day must be between 1 and 60");
  }

  if (day <= 56) {
    const level = ((day - 1) % 14) + 1;
    const round = Math.floor((day - 1) / 14) + 1;
    const definition = AI_LEVELS[level - 1];
    const roundMeta = ROUND_META[round - 1];

    return {
      id: `ai-day-${day}`,
      courseId: "ai-command-skills",
      day,
      level,
      round,
      title: `Level ${level} · ${definition.title}`,
      objective: definition.objective,
      content: `${definition.core}。本轮：${roundMeta.name}。${roundMeta.instruction}`,
      practicePrompt: `${definition.practice}\n\n本轮要求：${roundMeta.instruction}`,
      criteria: definition.criteria,
      estimatedMinutes: 20,
    };
  }

  const capstones: Record<number, Omit<FixedLesson, "id" | "courseId" | "day">> = {
    57: {
      level: 13,
      round: 5,
      title: "毕业项目 · 完善原型",
      objective: "完成一个解决真实工作问题的可运行 AI 原型。",
      content: "冻结需求范围，打通主流程，并保留人工审核节点。",
      practicePrompt: "提交原型入口、工作流说明，以及当前仍未解决的问题。",
      criteria: ["真实问题", "可运行原型", "工作流", "人工审核"],
      estimatedMinutes: 20,
    },
    58: {
      level: 13,
      round: 5,
      title: "毕业项目 · 20例测试",
      objective: "使用不少于 20 个案例验证原型。",
      content: "记录成功、失败、边界情况和修复结果，不只保留成功案例。",
      practicePrompt: "提交测试摘要：总数、成功率、三个失败案例和修复计划。",
      criteria: ["20个案例", "成功率", "失败案例", "修复计划"],
      estimatedMinutes: 20,
    },
    59: {
      level: 13,
      round: 5,
      title: "毕业项目 · 演示与答辩",
      objective: "证明用户能够亲自解释和操作自己的系统。",
      content: "完成五分钟演示，说明问题、设计、结果、风险和下一步。",
      practicePrompt: "提交演示提纲，并回答：为什么这样设计？最可能在哪里失败？",
      criteria: ["演示", "设计依据", "失败风险", "独立解释"],
      estimatedMinutes: 20,
    },
    60: {
      level: 14,
      round: 5,
      title: "Day 60 · 能力验证与复盘",
      objective: "对比 Day 0 基线，形成最终能力证据。",
      content: "根据原始提交、项目、测试和真实使用记录完成最终判断。",
      practicePrompt: "提交最终复盘：已经能独立完成什么、证据是什么、下一阶段训练什么。",
      criteria: ["能力变化", "证据", "真实使用", "下一阶段"],
      estimatedMinutes: 20,
    },
  };

  return {
    id: `ai-day-${day}`,
    courseId: "ai-command-skills",
    day,
    ...capstones[day],
  };
}

export const AI_LESSONS = Array.from({ length: 60 }, (_, index) =>
  buildAiLesson(index + 1),
);

export const FOUNDATION_LESSONS: FixedLesson[] = [
  {
    id: "english-day-1",
    courseId: "english",
    day: 1,
    level: 1,
    round: 1,
    title: "第一次开口：介绍自己",
    objective: "完成 30 秒基础英文自我介绍，并能够回答一个追问。",
    content:
      "使用最少但清楚的信息：名字、所在城市、从事的工作，以及今天为什么学习英语。",
    practicePrompt:
      "先写下你的英文自我介绍，再大声说三遍。提交最终文本，并记录哪一句最难说。",
    criteria: ["名字", "城市", "工作", "学习英语"],
    estimatedMinutes: 18,
  },
  {
    id: "business-day-1",
    courseId: "business",
    day: 1,
    level: 1,
    round: 1,
    title: "事实、假设与观点",
    objective: "把一个商业判断拆成事实、假设和观点。",
    content:
      "事实可以核验；假设需要验证；观点是你当前的判断。混在一起，商业分析就会看起来正确但无法行动。",
    practicePrompt:
      "选择一个你正在关注的商业机会，分别写出 2 条事实、2 条假设和 1 条观点。",
    criteria: ["事实", "假设", "观点", "验证"],
    estimatedMinutes: 20,
  },
  {
    id: "founder-note-day-1",
    courseId: "founder-note",
    day: 1,
    level: 1,
    round: 1,
    title: "今天最重要的判断",
    objective: "留下一个可以在未来回看的真实判断。",
    content:
      "记录当时掌握的信息、你做出的判断，以及什么新证据会让你改变想法。",
    practicePrompt:
      "写下今天最重要的一个判断：依据是什么？最大的未知是什么？下一步如何验证？",
    criteria: ["判断", "依据", "未知", "验证"],
    estimatedMinutes: 15,
  },
  {
    id: "quiz-day-1",
    courseId: "quiz",
    day: 1,
    level: 1,
    round: 1,
    title: "识别可验证的学习",
    objective: "区分内容消费与有效学习。",
    content:
      "有效学习必须产生主动输出，并保留可以检查的结果。完成打卡不等于获得能力。",
    practicePrompt:
      "列出你今天学习的一个内容，以及能够证明你真正学会它的具体行为。",
    criteria: ["学习内容", "主动输出", "证明"],
    estimatedMinutes: 15,
  },
];

export const FIXED_LESSONS = [...AI_LESSONS, ...FOUNDATION_LESSONS];
