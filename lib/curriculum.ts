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

type SpiralLevel = {
  title: string;
  core: string;
  objective: string;
  practice: string;
  criteria: string[];
};

function buildSpiralCourse(
  courseId: string,
  levels: SpiralLevel[],
  capstones: Array<Omit<FixedLesson, "id" | "courseId" | "day">>,
  estimatedMinutes: number,
) {
  const spiralDays = 56;
  const lessons = Array.from({ length: spiralDays }, (_, index) => {
    const day = index + 1;
    const level = ((day - 1) % levels.length) + 1;
    const round = Math.floor((day - 1) / levels.length) + 1;
    const definition = levels[level - 1];
    const roundMeta = ROUND_META[Math.min(round - 1, ROUND_META.length - 1)];

    return {
      id: `${courseId}-day-${day}`,
      courseId,
      day,
      level,
      round,
      title: `Level ${level} · ${definition.title}`,
      objective: definition.objective,
      content: `${definition.core}。本轮：${roundMeta.name}。${roundMeta.instruction}`,
      practicePrompt: `${definition.practice}\n\n本轮要求：${roundMeta.instruction}`,
      criteria: definition.criteria,
      estimatedMinutes,
    } satisfies FixedLesson;
  });

  return [
    ...lessons,
    ...capstones.map((lesson, index) => ({
      id: `${courseId}-day-${57 + index}`,
      courseId,
      day: 57 + index,
      ...lesson,
    })),
  ];
}

const ENGLISH_LEVELS: SpiralLevel[] = [
  {
    title: "介绍自己",
    core: "先让对方听懂你是谁、在哪里、做什么",
    objective: "完成 30 秒基础英文自我介绍，并回答一个追问。",
    practice: "写下并朗读自我介绍：名字、城市、工作、学习英语的原因。",
    criteria: ["name", "city", "work", "English"],
  },
  {
    title: "问候与寒暄",
    core: "寒暄不是考试，是建立继续交流的入口",
    objective: "完成问候、回应和一个开放式追问。",
    practice: "写一段四轮对话，包含问候、近况、追问和自然结束。",
    criteria: ["hello", "how", "question", "goodbye"],
  },
  {
    title: "时间与安排",
    core: "准确确认日期、时间和地点能避免大部分沟通事故",
    objective: "提出时间、确认安排并处理一次时间冲突。",
    practice: "用英语安排一次 30 分钟会面，并给出一个替代时间。",
    criteria: ["date", "time", "place", "alternative"],
  },
  {
    title: "方向与交通",
    core: "生活英语先解决到达问题",
    objective: "询问方向、确认路线并复述关键步骤。",
    practice: "模拟从当前位置到目的地的问路对话，至少包含两个方向词。",
    criteria: ["where", "direction", "turn", "confirm"],
  },
  {
    title: "购物与付款",
    core: "先确认价格、数量和付款方式，再处理细节",
    objective: "询价、比较、确认数量并完成付款沟通。",
    practice: "写一段购买商品的对话：询价、数量、折扣、付款方式。",
    criteria: ["price", "quantity", "discount", "payment"],
  },
  {
    title: "餐饮与服务",
    core: "用短句明确需求比追求复杂语法更重要",
    objective: "完成点单、修改需求和结账。",
    practice: "模拟点餐，包含一个饮食要求、一次修改和结账。",
    criteria: ["order", "please", "change", "bill"],
  },
  {
    title: "求助与处理问题",
    core: "说明发生了什么、需要什么、什么时候解决",
    objective: "描述一个问题并提出明确请求。",
    practice: "选择一个真实生活问题，用过去情况、当前影响、需要帮助三部分表达。",
    criteria: ["problem", "impact", "help", "when"],
  },
  {
    title: "电话与消息",
    core: "电话沟通需要更短、更慢、更多确认",
    objective: "完成身份确认、留言和信息复述。",
    practice: "写一段电话留言，包含来电人、原因、联系方式和回电要求。",
    criteria: ["calling", "reason", "number", "call back"],
  },
  {
    title: "介绍工作",
    core: "用问题、对象、动作和结果解释工作",
    objective: "用 60 秒介绍自己的工作或项目。",
    practice: "按照 problem、people、work、result 四部分写工作介绍。",
    criteria: ["problem", "people", "work", "result"],
  },
  {
    title: "听不懂时继续交流",
    core: "不会某个词不等于对话必须结束",
    objective: "请求重复、放慢、解释并确认理解。",
    practice: "写出四种修复沟通的表达，并放进一段真实对话。",
    criteria: ["repeat", "slowly", "mean", "understand"],
  },
  {
    title: "会议与协作",
    core: "会议表达只需要观点、原因、行动和负责人",
    objective: "表达一个观点、提出一个问题并确认下一步。",
    practice: "模拟会议发言：观点、理由、问题、下一步和截止时间。",
    criteria: ["opinion", "reason", "question", "next step", "deadline"],
  },
  {
    title: "意见与决定",
    core: "不同意时先确认理解，再表达理由和替代方案",
    objective: "礼貌表达同意、不同意和建议。",
    practice: "对一个工作决定写出同意或不同意的回应，并提出替代方案。",
    criteria: ["agree", "understand", "because", "suggest"],
  },
  {
    title: "综合情景",
    core: "把多个生活和工作能力连接成完整任务",
    objective: "完成一段不少于 8 轮的真实情景对话。",
    practice: "选择机场、购物、会议或客户沟通场景，完成 8 轮对话。",
    criteria: ["question", "answer", "clarify", "complete"],
  },
  {
    title: "周期复盘",
    core: "流利来自反复使用，不来自收藏更多句型",
    objective: "根据录音和文本证据确定下一轮薄弱点。",
    practice: "列出本轮能完成的 3 个任务、仍会卡住的 2 个情景和下一轮目标。",
    criteria: ["evidence", "task", "weakness", "goal"],
  },
];

const BUSINESS_LEVELS: SpiralLevel[] = [
  {
    title: "事实、假设与观点",
    core: "事实可以核验，假设需要验证，观点是当前判断",
    objective: "把一个商业判断拆成事实、假设和观点。",
    practice: "选择一个机会，分别写出 2 条事实、2 条假设和 1 条观点。",
    criteria: ["事实", "假设", "观点", "验证"],
  },
  {
    title: "问题观察",
    core: "机会从高频、昂贵、紧急或令人挫败的问题开始",
    objective: "描述问题发生的场景、频率、代价和当前替代方案。",
    practice: "记录一个真实问题：谁、何时发生、多久一次、造成什么代价。",
    criteria: ["用户", "场景", "频率", "代价"],
  },
  {
    title: "用户与任务",
    core: "用户购买的不是产品，而是完成某项任务的进步",
    objective: "定义具体用户以及他们试图完成的任务。",
    practice: "写出目标用户、触发事件、想完成的任务和期待结果。",
    criteria: ["用户", "触发", "任务", "结果"],
  },
  {
    title: "用户访谈",
    core: "问过去真实行为，不问未来是否愿意",
    objective: "设计不诱导、能够获取行为证据的访谈问题。",
    practice: "写 8 个访谈问题，至少 5 个询问过去行为、成本或替代方案。",
    criteria: ["过去行为", "成本", "替代方案", "追问"],
  },
  {
    title: "需求证据",
    core: "抱怨、使用、承诺和付费代表不同强度的证据",
    objective: "为当前机会建立需求证据等级。",
    practice: "列出现有证据，并标记为表达、使用、承诺或付费。",
    criteria: ["表达", "使用", "承诺", "付费"],
  },
  {
    title: "机会评分",
    core: "机会判断需要统一标准，而不是凭兴奋程度",
    objective: "按痛点、频率、付费、触达和能力匹配评分。",
    practice: "给一个机会按五项标准各打 1–5 分，并写出证据。",
    criteria: ["痛点", "频率", "付费", "触达", "能力"],
  },
  {
    title: "竞争与替代",
    core: "最大的竞争者通常是用户现在的做法",
    objective: "识别直接产品、人工方案、拼凑工具和不行动。",
    practice: "列出四类替代方案，并说明用户为什么仍在使用它们。",
    criteria: ["直接竞争", "人工", "工具", "不行动"],
  },
  {
    title: "价值主张",
    core: "价值主张说明为谁解决什么问题以及为什么更好",
    objective: "写出可被用户理解和反驳的价值主张。",
    practice: "用一句话写：为谁、在什么场景、解决什么问题、带来什么结果。",
    criteria: ["为谁", "场景", "问题", "结果"],
  },
  {
    title: "MVP",
    core: "MVP 是验证关键假设的最小实验，不是缩水版完整产品",
    objective: "确定一个关键假设和最小验证动作。",
    practice: "写出最危险假设、验证动作、成功阈值和停止条件。",
    criteria: ["危险假设", "验证动作", "成功阈值", "停止条件"],
  },
  {
    title: "价格与付费意愿",
    core: "真实支付比口头喜欢更接近需求",
    objective: "设计一个能够获得付款或明确拒绝的价格测试。",
    practice: "确定测试产品、价格、付款动作和最少成交人数。",
    criteria: ["产品", "价格", "付款动作", "人数"],
  },
  {
    title: "渠道与获取",
    core: "第一批用户来自具体关系和场景，不来自抽象流量",
    objective: "列出可以在 7 天内执行的用户触达名单。",
    practice: "写出渠道、可联系人数、邀请话术和预约动作。",
    criteria: ["渠道", "人数", "话术", "行动"],
  },
  {
    title: "单位经济与风险",
    core: "收入必须覆盖交付、获客和持续维护成本",
    objective: "估算单用户收入、可变成本和最大风险。",
    practice: "计算一个用户的收入、模型成本、服务时间和毛利。",
    criteria: ["收入", "成本", "时间", "毛利", "风险"],
  },
  {
    title: "验证冲刺",
    core: "商业能力最终由真实市场反馈验证",
    objective: "执行访谈、报价或 MVP 测试并记录原始证据。",
    practice: "提交本轮真实验证进展：做了什么、得到什么、下一步改什么。",
    criteria: ["真实用户", "行动", "原始反馈", "调整"],
  },
  {
    title: "周期复盘",
    core: "总结证据，淘汰幻想，决定继续、调整或停止",
    objective: "根据证据更新机会判断。",
    practice: "列出已证实、被否定、仍未知的假设，并做出下一轮决定。",
    criteria: ["证实", "否定", "未知", "决定"],
  },
];

const ENGLISH_CAPSTONES: Array<
  Omit<FixedLesson, "id" | "courseId" | "day">
> = [
  {
    level: 13,
    round: 5,
    title: "毕业准备 · 真实对话脚本",
    objective: "为 10 分钟真人对话准备任务，而不是背诵全文。",
    content: "只准备关键词、问题和修复表达，禁止写逐字稿。",
    practicePrompt: "提交对话目标、关键词、5 个问题和 4 个听不懂时的修复表达。",
    criteria: ["goal", "keywords", "questions", "repeat"],
    estimatedMinutes: 20,
  },
  {
    level: 13,
    round: 5,
    title: "毕业准备 · 模拟追问",
    objective: "在无法预测问题的情况下继续交流。",
    content: "请真人或 AI 随机追问，记录三处停顿并重新表达。",
    practicePrompt: "提交三组随机追问、你的回答和改进后的表达。",
    criteria: ["question", "answer", "pause", "improve"],
    estimatedMinutes: 20,
  },
  {
    level: 13,
    round: 5,
    title: "毕业任务 · 10 分钟真人交流",
    objective: "与真人连续交流至少 10 分钟并完成指定任务。",
    content: "保留时间、场景、任务结果和对方理解情况。",
    practicePrompt: "提交交流记录：对象、时长、完成的任务、最困难部分和对方反馈。",
    criteria: ["person", "10 minutes", "task", "feedback"],
    estimatedMinutes: 20,
  },
  {
    level: 14,
    round: 5,
    title: "Day 60 · 英语能力复盘",
    objective: "对比 Day 0，确认已经能独立完成的沟通任务。",
    content: "能力证据来自真实交流，不来自连续打卡。",
    practicePrompt: "列出能力变化、真实证据、仍会中断的场景和下一阶段计划。",
    criteria: ["change", "evidence", "weakness", "next"],
    estimatedMinutes: 20,
  },
];

const BUSINESS_CAPSTONES: Array<
  Omit<FixedLesson, "id" | "courseId" | "day">
> = [
  {
    level: 13,
    round: 5,
    title: "毕业验证 · 机会与假设",
    objective: "锁定一个真实机会和最危险假设。",
    content: "停止继续扩写计划，只保留决定成败的假设。",
    practicePrompt: "提交目标用户、问题、价值主张和最危险假设。",
    criteria: ["用户", "问题", "价值主张", "危险假设"],
    estimatedMinutes: 20,
  },
  {
    level: 13,
    round: 5,
    title: "毕业验证 · 用户访谈",
    objective: "完成真实访谈并保存原始证据。",
    content: "记录事实、原话和过去行为，不把自己的解释写成用户结论。",
    practicePrompt: "提交访谈人数、关键原话、过去行为和被否定的假设。",
    criteria: ["访谈", "原话", "过去行为", "否定"],
    estimatedMinutes: 20,
  },
  {
    level: 13,
    round: 5,
    title: "毕业验证 · 购买意向",
    objective: "获得明确购买意向或同样明确的拒绝。",
    content: "向真实用户说明产品、价格和下一步动作。",
    practicePrompt: "提交报价、用户回应、购买意向证据和下一步决定。",
    criteria: ["报价", "回应", "购买意向", "决定"],
    estimatedMinutes: 20,
  },
  {
    level: 14,
    round: 5,
    title: "Day 60 · 商业验证复盘",
    objective: "根据市场证据决定继续、调整或停止。",
    content: "毕业不是证明想法正确，而是获得足以做决定的证据。",
    practicePrompt: "提交验证结论、证据等级、最大未知和下一轮行动。",
    criteria: ["结论", "证据", "未知", "行动"],
    estimatedMinutes: 20,
  },
];

const FOUNDER_PROMPTS = [
  ["今天最重要的判断", "判断、依据、未知、验证", ["判断", "依据", "未知", "验证"]],
  ["一个被忽略的事实", "事实、影响、原假设、调整", ["事实", "影响", "假设", "调整"]],
  ["今天拒绝了什么", "选择、代价、原因、结果", ["选择", "代价", "原因", "结果"]],
  ["一个正在逃避的问题", "问题、逃避原因、最小行动、时间", ["问题", "原因", "行动", "时间"]],
  ["本周最有价值的证据", "证据、来源、改变、下一步", ["证据", "来源", "改变", "下一步"]],
  ["需要停止的事情", "行为、成本、停止条件、替代", ["行为", "成本", "停止", "替代"]],
  ["周期复盘", "进展、失误、学习、下周行动", ["进展", "失误", "学习", "行动"]],
] as const;

const QUIZ_LEVELS: SpiralLevel[] = [
  {
    title: "事实识别",
    core: "先判断信息能否核验",
    objective: "区分事实、推断和意见。",
    practice: "从今天接触的信息中各写一条事实、推断和意见，并说明区别。",
    criteria: ["事实", "推断", "意见", "依据"],
  },
  {
    title: "反例测试",
    core: "一个反例可能推翻看似完整的结论",
    objective: "为当前判断寻找反例。",
    practice: "写出一个结论、两个支持证据和一个可能推翻它的反例。",
    criteria: ["结论", "证据", "反例", "影响"],
  },
  {
    title: "因果与相关",
    core: "同时发生不等于互为原因",
    objective: "识别相关关系中的其他解释。",
    practice: "选择一个相关性判断，写出至少两种替代解释。",
    criteria: ["相关", "因果", "替代解释", "验证"],
  },
  {
    title: "估算",
    core: "先拆变量，再寻找数量级",
    objective: "用可解释假设完成费米估算。",
    practice: "选择一个数量问题，拆出变量、假设、计算和误差来源。",
    criteria: ["变量", "假设", "计算", "误差"],
  },
  {
    title: "决策题",
    core: "决策质量取决于标准和证据",
    objective: "比较方案并说明权衡。",
    practice: "比较两个真实方案，列出标准、权重、证据和选择。",
    criteria: ["方案", "标准", "权重", "选择"],
  },
  {
    title: "记忆提取",
    core: "不看答案回忆比重新阅读更能检验记忆",
    objective: "从记忆中提取本周重点。",
    practice: "不查看笔记，写出本周 5 个关键点，再对照并修正。",
    criteria: ["回忆", "关键点", "对照", "修正"],
  },
  {
    title: "综合复盘",
    core: "把错误变成下一轮练习",
    objective: "识别本轮最常见的错误模式。",
    practice: "列出三类错误、原因和下一次遇到时的检查动作。",
    criteria: ["错误", "原因", "检查", "下一次"],
  },
];

export const ENGLISH_LESSONS = buildSpiralCourse(
  "english",
  ENGLISH_LEVELS,
  ENGLISH_CAPSTONES,
  18,
);

export const BUSINESS_LESSONS = buildSpiralCourse(
  "business",
  BUSINESS_LEVELS,
  BUSINESS_CAPSTONES,
  20,
);

export const FOUNDER_NOTE_LESSONS: FixedLesson[] = Array.from(
  { length: 60 },
  (_, index) => {
    const day = index + 1;
    const prompt = FOUNDER_PROMPTS[index % FOUNDER_PROMPTS.length];
    const round = Math.floor(index / 14) + 1;
    return {
      id: `founder-note-day-${day}`,
      courseId: "founder-note",
      day,
      level: (index % FOUNDER_PROMPTS.length) + 1,
      round,
      title: prompt[0],
      objective: `留下可以在未来复查的${prompt[0]}记录。`,
      content: "保存当时掌握的证据和真实判断，不让未来的自己重写历史。",
      practicePrompt: `按照“${prompt[1]}”完成今天的 Founder Note。`,
      criteria: [...prompt[2]],
      estimatedMinutes: 15,
    };
  },
);

export const QUIZ_LESSONS = buildSpiralCourse(
  "quiz",
  QUIZ_LEVELS,
  [
    {
      level: 6,
      round: 9,
      title: "毕业测验 · 综合分析",
      objective: "完成一题包含事实、估算和决策的综合题。",
      content: "先独立作答，再检查假设和反例。",
      practicePrompt: "选择一个真实问题，完成事实、假设、估算、反例和决定。",
      criteria: ["事实", "假设", "估算", "反例", "决定"],
      estimatedMinutes: 15,
    },
    {
      level: 6,
      round: 9,
      title: "毕业测验 · 盲测",
      objective: "不查看历史笔记完成核心知识提取。",
      content: "检验可以主动提取的知识，而不是熟悉感。",
      practicePrompt: "从记忆中写出本课程最重要的 10 个检查问题。",
      criteria: ["记忆", "检查问题", "应用"],
      estimatedMinutes: 15,
    },
    {
      level: 7,
      round: 9,
      title: "毕业测验 · 错误分析",
      objective: "识别自己的稳定错误模式。",
      content: "错误模式比单次分数更能决定下一阶段训练。",
      practicePrompt: "提交三类错误模式、真实案例和预防检查表。",
      criteria: ["错误模式", "案例", "检查表"],
      estimatedMinutes: 15,
    },
    {
      level: 7,
      round: 9,
      title: "Day 60 · 认知训练复盘",
      objective: "形成下一阶段可重复使用的思考检查表。",
      content: "把课程压缩成行动前可以快速使用的检查问题。",
      practicePrompt: "提交最终检查表，以及三个已经改变判断的真实例子。",
      criteria: ["检查表", "真实例子", "改变"],
      estimatedMinutes: 15,
    },
  ],
  15,
);

export const FIXED_LESSONS = [
  ...AI_LESSONS,
  ...ENGLISH_LESSONS,
  ...BUSINESS_LESSONS,
  ...FOUNDER_NOTE_LESSONS,
  ...QUIZ_LESSONS,
];
