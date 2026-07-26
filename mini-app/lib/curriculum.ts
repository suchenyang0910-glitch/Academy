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
  teaching?: string;
  objective: string;
  practice: string;
  criteria: string[];
  assessment: MultipleChoiceQuestion;
};

export type MultipleChoiceQuestion = {
  type?: "multiple_choice";
  question: string;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
  explanation: string;
};

export type MultipleChoiceAssessment = {
  type: "multiple_choice";
  questions: MultipleChoiceQuestion[];
};

function buildLessonTeachingBlock(teaching: string, roundName: string, roundInstruction: string) {
  return [
    "先学知识，再做检查。",
    "",
    "今天你会学到：",
    "1. 这节课最重要的一个核心概念",
    "2. 它在真实工作里为什么重要",
    "3. 你今天做题时应该抓住哪几个关键词",
    "",
    teaching,
    "",
    `本轮：${roundName}`,
    roundInstruction,
    "",
    "课后检查：",
    "完成下方 3 道选择题。它们只检查今天正文里已经讲过的关键点。",
    "答错后先回看正文，再重新提交。",
  ].join("\n");
}

function buildLessonPracticePrompt(criteria: string[]) {
  return [
    "课后检查：完成下方 3 道选择题。",
    `重点留意这些关键词：${criteria.join("、")}。`,
    "如果你发现某题不会，先回到上方正文，找到对应知识点，再回来作答。",
    "目标不是蒙对，而是知道这题为什么对。",
  ].join("\n");
}

function buildLessonPracticePromptV2(practice: string, criteria: string[]) {
  return [
    "课后动作：",
    practice,
    "",
    "课后检查：完成下方 3 道选择题。",
    `重点留意这些关键词：${criteria.join("、")}。`,
    "如果发现某题不会，先回到上方正文，找到对应知识点，再回来作答。",
    "目标不是蒙对，而是知道为什么对。",
  ].join("\n");
}

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
    title: "认识 AI：它是什么、不是什麽",
    core: "AI 根据语言和数据中的模式生成内容；流畅不等于正确",
    teaching: `先建立正确预期，再学习操作。

你看到的 ChatGPT、DeepSeek、Claude 是“应用”；里面负责生成文字、图片或代码的部分叫“模型”。模型不会像人一样理解世界，它会根据当前对话和学过的模式，预测下一段最可能出现的内容。

它擅长：改写、归纳、翻译、列清单、生成初稿、解释已有材料。它不适合：替你承担决定、保证事实最新、在没有证据时给医疗/法律/财务结论。

最重要的一句：AI 给出很像答案的文字，不代表它已经查证过。今天不写任何提示词，只先判断“它能帮什么、不能替我做什么”。`,
    objective: "能用自己的话解释 AI 的工作方式，并区分一个适合交给 AI 的任务和一个必须由人负责的判断。",
    practice: "选择你今天的一件真实工作：写下 AI 可以协助的部分、AI 不该替你决定的部分，以及你准备如何验证它的结果。",
    criteria: ["自己的解释", "可协助部分", "人负责部分", "验证动作"],
    assessment: {
      type: "multiple_choice",
      question: "下面哪种说法最符合本课的 AI 使用原则？",
      options: [
        { id: "a", label: "回答写得流畅，就可以直接当成事实使用。" },
        { id: "b", label: "AI 可以协助产出，但关键方向和事实验证仍由人负责。" },
        { id: "c", label: "只要给 AI 一个专家角色，它就会自动避免出错。" },
      ],
      correctOptionId: "b",
      explanation: "正确。AI 能放大产出效率，但不能替你承担方向判断或事实验证。",
    },
  },
  {
    level: 2,
    title: "AI 基本词汇与产品地图",
    core: "模型、应用、对话、提示词、上下文、输出是六个不同概念",
    teaching: `先把名词分开，后面才不会被营销词带着走。

模型：生成能力本身，例如 DeepSeek 的某个模型。应用：你打开来使用的聊天界面。提示词：你交给模型的输入。上下文：模型本次回答时能看到的对话、文件和说明。输出：模型生成的结果。

“联网”“上传文件”“语音”“工作流”是应用可能提供的能力，不等于模型天然知道实时事实。换一个应用、模型或是否打开联网，结果都可能不同。

今天的任务是看懂界面和术语，不是背定义。`,
    objective: "能解释六个基本术语，并说出自己正在使用的 AI 产品包含哪些能力。",
    practice: "打开你常用的一个 AI 产品，按“模型 / 应用 / 输入 / 上下文 / 输出”标注一次真实对话；再写出一个你不确定的功能，并说明准备怎样确认。",
    criteria: ["模型", "应用", "上下文", "输出", "待确认问题"],
    assessment: {
      type: "multiple_choice",
      question: "你在手机上打开 DeepSeek 聊天界面并输入问题，其中“聊天界面”最准确的名称是？",
      options: [
        { id: "a", label: "应用；它调用模型并提供输入、文件等交互功能。" },
        { id: "b", label: "提示词；因为它可以显示对话。" },
        { id: "c", label: "上下文；因为它能打开网页。" },
      ],
      correctOptionId: "a",
      explanation: "正确。聊天界面是应用；模型是背后生成内容的能力。",
    },
  },
  {
    level: 3,
    title: "能力、边界与幻觉",
    core: "AI 会在不知道时继续生成；不知道与说错常常看起来一样自然",
    teaching: `AI 最危险的错误不是“它说不知道”，而是“它用很自信的语气编出一个答案”。这通常被称为幻觉（hallucination）。

遇到事实问题时，先问：这个答案是否需要最新信息？是否会影响钱、健康、法律责任或客户关系？如果会，就必须回到原始来源、数据或真人确认。

让 AI 标出不确定处、提供来源、列出假设会有帮助；但这些动作不是验证本身。验证仍然由你完成。

今天练习的是识别风险，而不是让 AI 表演得更像专家。`,
    objective: "能识别 AI 回答中需要验证的主张，并为一个高风险结论设计最小验证动作。",
    practice: "向 AI 提出一个你已经知道部分答案的事实问题。找出两条需要核实的主张，写下你会去看的原始来源或数据，而不是只让 AI 再回答一次。",
    criteria: ["事实问题", "待核实主张", "原始来源", "风险判断"],
    assessment: {
      type: "multiple_choice",
      question: "AI 对一条会影响付款决策的法规给出明确答案，最合适的下一步是？",
      options: [
        { id: "a", label: "让 AI 再说一遍，若答案相同就执行。" },
        { id: "b", label: "先执行，出问题后再修改。" },
        { id: "c", label: "回到官方法规或专业人士处核实，再做决定。" },
      ],
      correctOptionId: "c",
      explanation: "正确。高风险、时效性或责任相关的事实必须回到原始来源验证。",
    },
  },
  {
    level: 4,
    title: "对话、上下文与迭代",
    core: "一次回答只是草稿；好的结果通常来自多轮澄清",
    teaching: `模型只能看到当前对话中的信息。你不说受众、材料、目标或限制，它就只能按一般情况猜测；你在后续补充信息，它才有机会修正方向。

正确的使用方式不是憋出一条“完美咒语”，而是像和实习生协作：先说目标，看到草稿后指出问题，再要求具体调整，最后由你验收。

每一轮只改一个关键变量：内容、受众、格式、语气或事实依据。这样你才知道结果为什么变好或变坏。`,
    objective: "能用三轮对话把一个粗糙结果改成可用草稿，并说明每一轮补充了什么信息。",
    practice: "选一个低风险任务（例如整理一段笔记）。完成三轮对话：先说明目标；再补充一个缺失背景；最后要求一种明确格式。提交三轮差异和你的判断。",
    criteria: ["初始目标", "补充背景", "明确格式", "三轮差异"],
    assessment: {
      type: "multiple_choice",
      question: "第一版输出太泛泛时，哪种做法最利于稳定改进？",
      options: [
        { id: "a", label: "补充一个缺失背景或明确格式，并观察这一个变化带来的差异。" },
        { id: "b", label: "一次加入二十条新规则，让 AI 自己理解重点。" },
        { id: "c", label: "立即换模型，不再看原来的任务说明。" },
      ],
      correctOptionId: "a",
      explanation: "正确。每轮只调整关键变量，才知道什么信息真正改善了输出。",
    },
  },
  {
    level: 5,
    title: "基础 Prompt：说清一件事",
    core: "清楚的目标、材料、要求和验收方式，比花哨角色更重要",
    teaching: `现在才开始学习提示词。它不是魔法词，而是一份给 AI 的工作说明。

一条基础说明包含四件事：要完成什么（目标）、基于什么材料（输入/背景）、结果长什么样（格式）、哪些要求不能违反（限制）。先把这四件事说清楚，绝大多数日常任务已经够用。

不要一开始就堆“你是世界顶级专家”这类装饰。若任务本身不清楚，再厉害的角色也救不了结果。`,
    objective: "能为一个简单、低风险任务写出包含目标、材料、格式和限制的基础提示词。",
    practice: "选择一段你自己的真实材料（笔记、邮件草稿或产品描述），写一条基础提示词，让 AI 把它整理成指定格式。提交原始材料、提示词和输出，并写一句你是否满意。",
    criteria: ["目标", "真实材料", "输出格式", "限制", "验收判断"],
    assessment: {
      type: "multiple_choice",
      question: "下面哪一项不是一条基础工作说明的必要部分？",
      options: [
        { id: "a", label: "要完成的目标与可用材料。" },
        { id: "b", label: "希望得到的格式和限制。" },
        { id: "c", label: "夸张的头衔，例如“宇宙最强专家”。" },
      ],
      correctOptionId: "c",
      explanation: "正确。先说清目标、材料、格式和限制；角色头衔不是必要条件。",
    },
  },
  {
    level: 6,
    title: "进阶 Prompt：示例、角色与拆分",
    core: "示例和任务拆分用于减少猜测；角色只在确实改变判断框架时使用",
    teaching: `当基础说明仍然不够稳定，再增加三个工具。

示例（few-shot）告诉 AI 你认为什么样的答案算好；任务拆分把复杂工作拆成可检查的小步骤；角色用于指定看问题的角度，例如“从客户成功经理视角找风险”，而不是让 AI 假装拥有不存在的经历。

先从一个工具开始，观察是否改善；不要一次堆十条规则，否则你无法知道哪条真的有效。`,
    objective: "能用示例、视角或任务拆分中的一种方式，提高一个基础提示词的稳定性。",
    practice: "沿用昨天的任务，只增加一种工具：给一个好答案示例、指定一个相关视角，或拆成两步。对比前后输出，并解释它为什么变好或没有变好。",
    criteria: ["基础版本", "新增工具", "前后对比", "自己的解释"],
    assessment: {
      type: "multiple_choice",
      question: "要判断“示例”是否改善了输出，最好的实验方式是？",
      options: [
        { id: "a", label: "保留原任务，只增加一个示例，再比较前后结果。" },
        { id: "b", label: "同时换模型、换任务、换格式，再看最终答案。" },
        { id: "c", label: "不做比较，直接相信带示例一定更好。" },
      ],
      correctOptionId: "a",
      explanation: "正确。一次只改变一个关键因素，才能知道示例是否真的带来改善。",
    },
  },
  {
    level: 7,
    title: "结构化分析与决策辅助",
    core: "AI 可以摊开选项与证据；最后的权重和决定必须由人承担",
    teaching: `复杂问题不要只问“你觉得我该怎么办”。先把问题拆成事实、假设、选项、风险和需要验证的地方。

AI 可以帮你生成方案矩阵、反例和检查清单；它不能替你决定优先级，也不能替你承担错误的后果。

请它展示可检查的依据和不确定性，而不是索取所谓“隐藏思维过程”。你要的是能核对的结论，不是看起来很长的推理。`,
    objective: "能把一个真实决策拆成选项、判断标准、风险和最小验证动作。",
    practice: "选择一个真实但不高风险的决定。让 AI 帮你列出三种方案、每种方案的好处/风险和待验证事实；由你写下判断标准与暂定选择。",
    criteria: ["三个方案", "判断标准", "风险", "待验证事实", "人的选择"],
    assessment: {
      type: "multiple_choice",
      question: "在 AI 协助做决策时，哪一项必须由人最终承担？",
      options: [
        { id: "a", label: "列出可能的选项。" },
        { id: "b", label: "设定判断权重并作出最终选择。" },
        { id: "c", label: "生成一份风险清单。" },
      ],
      correctOptionId: "b",
      explanation: "正确。AI 能协助展开信息，但价值取舍与最终责任必须留在人手中。",
    },
  },
  {
    level: 8,
    title: "知识库与 RAG",
    core: "先检索你的资料，再生成答案；引用必须能回到原文",
    teaching: `模型并不知道你的公司文档、客户记录或最新 SOP。把资料直接放进对话，只能解决一次问题；知识库（RAG）解决的是“先找到相关片段，再基于片段回答”。

一个可靠的知识库要有三件事：资料来源清楚、回答能标注引用位置、找不到依据时明确说不知道。RAG 不是让 AI 知道一切，而是限制它只在有证据时回答。

课后检查会验证：为什么需要检索、什么叫可追溯引用、什么时候应该拒答。`,
    objective: "理解为什么模型不知道你的业务，并设计一个带引用和拒答机制的最小知识库。",
    practice: "选择一份自己的文档，设计 5 个可验证问题，并检查答案是否引用正确内容或明确说不知道。",
    criteria: ["文档", "测试问题", "引用", "拒答", "检索"],
    assessment: {
      type: "multiple_choice",
      question: "一个可用的最小知识库回答，最应该具备什么？",
      options: [
        { id: "a", label: "答不出来时也必须编出完整答案。" },
        { id: "b", label: "能回到提供的原文引用；没有依据时能明确拒答。" },
        { id: "c", label: "只要回答足够长，就说明检索成功。" },
      ],
      correctOptionId: "b",
      explanation: "正确。RAG 的关键是证据可追溯，以及没有依据时不编造。",
    },
  },
  {
    level: 9,
    title: "工作流与 Agent",
    core: "可靠流程比角色数量更重要；自动化前先做清楚人工流程",
    teaching: `Agent 不是“更聪明的聊天机器人”，而是让模型按步骤调用工具、保存状态并完成任务的流程。一个流程最少要说清：输入从哪里来、每一步做什么、输出交给谁、失败时怎么办。

自动化会放大效率，也会放大错误。因此金额、对外发送、删除数据等关键节点必须保留人工审核。先跑通人工版本，再自动化最稳定的重复部分。

课后检查会验证：自动化前的准备、人工审核的位置，以及为什么不能让 Agent 自由发挥。`,
    objective: "设计输入、步骤、工具、状态、失败处理和人工审核节点。",
    practice: "把一个重复任务拆成至少三个步骤，明确每一步输入、输出、失败处理和必须由人确认的地方。",
    criteria: ["输入", "输出", "步骤", "失败处理", "人工审核"],
    assessment: {
      type: "multiple_choice",
      question: "准备自动化一个重复任务前，正确的第一步是？",
      options: [
        { id: "a", label: "先把人工流程的输入、步骤、输出和失败情况说清楚。" },
        { id: "b", label: "先给流程取一个 Agent 名字。" },
        { id: "c", label: "直接让 AI 自由决定每一步怎么做。" },
      ],
      correctOptionId: "a",
      explanation: "正确。人工流程都不清楚时，自动化只会放大混乱。",
    },
  },
  {
    level: 10,
    title: "数据分析",
    core: "让计算、字段和异常可复核，AI 不能替你编造数据依据",
    teaching: `AI 可以帮助你读表、写分析思路和生成代码，但“洞察”必须建立在真实字段与可复核计算上。先确认数据来自哪里、每列代表什么、时间范围是否一致，再讨论增长或下降。

异常值、缺失值和重复数据会让漂亮结论失去意义。任何百分比都应能回答：分子是什么、分母是什么、比较的是哪段时间。

课后检查会验证：什么算可复核结论、为什么必须处理异常，以及 AI 在数据分析中不能替代的部分。`,
    objective: "完成数据解释、清洗、计算、异常确认和洞察验证。",
    practice: "使用一份 CSV 找出三个信号，并写出每个结论的字段、计算依据和异常检查。",
    criteria: ["字段", "清洗", "计算", "异常", "依据"],
    assessment: {
      type: "multiple_choice",
      question: "AI 说“销售额增长 30%”时，哪一项最能让这个结论可复核？",
      options: [
        { id: "a", label: "确认使用的数据字段、计算方式、时间范围和异常值。" },
        { id: "b", label: "要求 AI 把结论写得更有说服力。" },
        { id: "c", label: "只保留增长结论，删除原始数据。" },
      ],
      correctOptionId: "a",
      explanation: "正确。数据结论必须能回到字段、计算和异常检查。",
    },
  },
  {
    level: 11,
    title: "内容、写作与翻译",
    core: "AI 是初稿作者，你是事实负责人、总编和本地化判断者",
    teaching: `内容生产可拆成三层：事实是否正确、表达是否适合受众、渠道格式是否合适。AI 擅长帮助起草和改写；人必须确认产品承诺、案例、价格、法律风险和文化语境。

直译追求信息完整；重写追求让目标读者自然理解。两者不是同一件事。对外内容发布前，永远把“是否真实、是否误导”放在“是否好看”之前。

课后检查会验证：谁负责事实、直译和重写的区别，以及发布前的检查重点。`,
    objective: "控制受众、结构、语气、渠道适配与事实检查；区分直译和重写。",
    practice: "选择一段真实业务文本，完成一个初稿和一个面向指定受众的改写，并标出必须人工核实的事实。",
    criteria: ["受众", "结构", "语气", "事实检查", "本地化"],
    assessment: {
      type: "multiple_choice",
      question: "AI 生成了一篇面向客户的产品文案，发布前最重要的人类职责是？",
      options: [
        { id: "a", label: "检查事实、承诺、受众与语气是否合适。" },
        { id: "b", label: "只检查字数有没有超过 500 字。" },
        { id: "c", label: "因为是 AI 生成，所以不需要审核。" },
      ],
      correctOptionId: "a",
      explanation: "正确。内容可以由 AI 起草，真实性、承诺与语境仍需人负责。",
    },
  },
  {
    level: 12,
    title: "编程辅助与原型",
    core: "代码能运行、测试能通过、你能解释，才算完成",
    teaching: `AI 能显著加快写代码、定位错误和生成测试的速度，但它不会自动理解你的真实业务规则。先把需求写成可验证行为，再让 AI 帮你拆分实现；遇到报错时保留错误信息和修改原因。

“能跑一次”不是完成。至少要验证关键输入、错误输入和边界情况；并且你要能解释这段代码处理什么、依赖什么、在哪里可能失败。

课后检查会验证：原型完成的标准、测试的作用，以及为什么不能直接把 AI 代码投入生产。`,
    objective: "使用 AI 完成需求描述、实现、调试、测试和代码解释。",
    practice: "完成一个可运行的小功能，保留需求、错误、修改、测试结果和你自己的解释。",
    criteria: ["需求", "运行结果", "错误", "测试", "解释"],
    assessment: {
      type: "multiple_choice",
      question: "AI 帮你写出一段代码后，什么才算真正完成？",
      options: [
        { id: "a", label: "代码看起来很专业。" },
        { id: "b", label: "代码能运行、关键场景测试通过，而且你能解释它做什么。" },
        { id: "c", label: "把代码直接复制到生产环境。" },
      ],
      correctOptionId: "b",
      explanation: "正确。可运行、可测试、可解释，缺一项都不是可靠完成。",
    },
  },
  {
    level: 13,
    title: "学习助手与项目设计",
    core: "让 AI 用问题帮助你理解，同时为毕业原型定义真实问题",
    teaching: `把 AI 当学习助手的正确方式，是让它帮助你暴露不知道的部分，而不是替你写答案。先用自己的话解释，再让 AI 追问、举反例、出小测；这比反复阅读更能检验理解。

毕业原型不需要大而全。它应有一个真实用户、一个明确问题、一种可控输入和一个可检查成功标准。范围越小，越容易完成、测试和复盘。

课后检查会验证：主动回忆为何重要，以及一个好毕业原型的最小组成。`,
    objective: "使用苏格拉底提问、费曼解释和小测检验理解；明确一个可在 60 天内完成的原型范围。",
    practice: "选择一个不熟悉概念，让 AI 只用提问引导你；再写下毕业原型要解决的真实问题、用户、输入和成功标准。",
    criteria: ["提问", "自己的解释", "真实问题", "成功标准"],
    assessment: {
      type: "multiple_choice",
      question: "使用 AI 作为学习助手时，哪种方式更能检验你是否真正理解？",
      options: [
        { id: "a", label: "让 AI 直接给结论，然后复制到笔记。" },
        { id: "b", label: "先用自己的话解释，再让 AI 用追问和小测找漏洞。" },
        { id: "c", label: "连续阅读 AI 的长回答，不进行任何输出。" },
      ],
      correctOptionId: "b",
      explanation: "正确。主动解释和被追问，才能暴露“以为懂了”的漏洞。",
    },
  },
  {
    level: 14,
    title: "周期复盘",
    core: "总结、补漏、升级；熟悉感不等于能力",
    teaching: `复盘不是写“我学了很多”，而是用证据回答四个问题：我能独立做什么？证据在哪里？我在哪些地方失败？下一轮只改哪一个点？

连续学习能证明习惯，不能单独证明能力。真正的能力证据来自真实任务、可检查的结果、失败记录和修复后的再次尝试。

课后检查会验证：什么算能力证据、失败记录的价值，以及如何把复盘转成下一轮行动。`,
    objective: "根据作品、验证记录和错误判断已经掌握、仍需练习和下一轮升级的能力。",
    practice: "完成本轮复盘：列出一个可证明的能力、一处失败、一个需要回看的概念，以及下一轮一个具体升级目标。",
    criteria: ["掌握证据", "失败记录", "薄弱概念", "升级目标"],
    assessment: {
      type: "multiple_choice",
      question: "下面哪一项最能证明你真的掌握了一个 AI 能力？",
      options: [
        { id: "a", label: "连续打卡很多天。" },
        { id: "b", label: "看过很多 AI 课程视频。" },
        { id: "c", label: "在真实任务中完成可检查的结果，并记录失败和修复。" },
      ],
      correctOptionId: "c",
      explanation: "正确。能力证据来自真实任务、结果和复盘，不来自熟悉感或打卡数。",
    },
  },
];

const AI_LEVEL_REFINEMENTS: Partial<Record<number, Partial<AiLevel>>> = {
  1: {
    teaching: `今天先不讲复杂提示词，只做一件事：建立对 AI 的正确预期。

你现在用到的 ChatGPT、DeepSeek、Claude，本质上都是“根据已有模式生成内容”的系统。它们擅长：
- 整理你给的材料
- 改写、归纳、翻译
- 生成初稿和备选方案

它们不擅长：
- 替你承担方向判断
- 自动保证事实一定正确
- 在没有证据时给你高风险结论

所以今天的关键不是“怎么把 AI 用得更炫”，而是先分清：
1. 什么任务可以先交给 AI 协助
2. 什么判断必须由人拍板
3. 结果出来后，怎么验证它不是在胡说

你只要记住一句话：AI 可以放大效率，但不能替你负责结果。`,
    practice:
      "请先想一件你今天真实做过的工作：写代码、整理需求、收集资料、写文案都可以。做题前先在脑中分清：AI 能协助哪一部分、人必须负责哪一部分、你会如何验证结果。",
    criteria: ["AI 的基本工作方式", "AI 可协助部分", "人负责判断", "结果验证"],
  },
  2: {
    teaching: `今天解决一个很常见的混乱：很多人把模型、应用、上下文、提示词混成一件事。

先分开：
- 模型：真正负责生成内容的能力本体
- 应用：你看到的聊天界面或产品
- 提示词：你给它的输入
- 上下文：这次回答时它能看到的对话、文件和说明
- 输出：它最终生成的结果

为什么这很重要？
因为你换一个应用、换一个模型、换一种是否联网的状态，结果都可能变。
如果连自己在用什么层的能力都分不清，后面就会把“产品宣传语”误当成“模型真实能力”。

今天的目标不是背定义，而是看懂你手上的 AI 产品到底由哪几层组成。`,
    practice:
      "先想一个你常用的 AI 产品。做题前，先在脑中把它拆成：应用、模型、你的输入、它看到的上下文、最后输出。",
    criteria: ["模型", "应用", "输入", "上下文", "输出"],
  },
  3: {
    teaching: `今天学一个非常关键的词：幻觉。

所谓幻觉，不是 AI 故意撒谎，而是它在“不知道”的时候，依然继续生成一段看起来很像答案的话。
最危险的地方就在这里：它经常说得很流畅、很自信，甚至格式很漂亮，但不代表内容已经核实过。

所以判断一个回答能不能直接用，要先问三件事：
1. 这是不是事实问题？
2. 这件事是不是有时效性？
3. 这件事出错后会不会带来高成本或高风险？

如果答案是“会”，就不能只看 AI 这一轮输出，必须回到原始来源、真实数据或真人确认。

今天学的不是“让 AI 少出错的技巧”，而是“你怎么识别什么时候不能直接信它”。`,
    practice:
      "做题前，先想一个高风险事实场景，例如付款、法务、政策、客户承诺。你要能分清：什么时候必须去找原始来源，而不是继续追问 AI。",
    criteria: ["事实问题", "高风险判断", "原始来源", "验证动作"],
  },
  4: {
    teaching: `今天开始理解：为什么同一个问题，第一轮回答往往只是草稿。

AI 不会自动知道你的背景、受众、格式要求和限制条件。你没有说明，它就只能按“普通情况”猜。
所以更好的使用方式不是一把梭哈写一条完美咒语，而是像带一个实习生：

第一轮：先说明目标
第二轮：补背景和限制
第三轮：要求明确格式或改法

每一轮都只改变一个关键变量，你才知道结果为什么变好或变坏。

今天你要理解的是：高质量结果通常不是“一次问出来”，而是“多轮澄清出来”。`,
    practice:
      "做题前，先记住一个原则：一轮只补一个关键变量，例如背景、受众、格式、限制，不要一次把所有东西都搅在一起。",
    criteria: ["目标", "补背景", "加限制", "多轮澄清"],
  },
  5: {
    teaching: `今天才正式进入最基础的 prompt。

不要把 prompt 想成玄学。它本质上是一份给 AI 的工作说明。
一条最基础、最实用的工作说明，至少要有四件事：

1. 目标：你要它完成什么
2. 材料：它基于什么内容工作
3. 格式：你希望输出长什么样
4. 限制：哪些要求不能违背

如果这四件事说不清，就算加再多“你是顶级专家”之类的角色包装，也很难稳定出结果。

今天先练“把一件事说明白”，而不是追求复杂技巧。`,
    practice:
      "做题前，先想一个低风险真实任务，比如整理一段笔记、改写一封消息、归纳需求。你要能分清它的目标、材料、格式和限制。",
    criteria: ["目标", "材料", "格式", "限制"],
  },
  6: {
    teaching: `当基础说明仍然不够稳定时，才轮到三个进阶工具：
- 示例
- 视角 / 角色
- 拆步骤

示例的作用：告诉 AI 什么样的答案算“对味”。
角色的作用：让它从某个判断框架出发，例如客户成功、产品经理、运营，而不是空泛地“像专家一样回答”。
拆步骤的作用：把复杂任务拆成可检查的小步，减少它乱跳结论。

今天最重要的不是把三种都堆上去，而是学会一次只加一个，观察它有没有真的改善结果。`,
    practice:
      "做题前，先记住：如果想验证一个技巧是否有效，就保持任务不变，只增加一个变量，例如只加一个示例，或者只要求拆步骤。",
    criteria: ["示例", "角色/视角", "拆步骤", "单变量比较"],
  },
  7: {
    teaching: `今天进入工作流思维。

很多新手一上来就问“怎么做 Agent”，其实先要理解：为什么单次问答不够。
当一个任务包含多步动作时，例如：
- 收集信息
- 清洗和筛选
- 归纳判断
- 生成输出

这时你需要的不是更长的一句话，而是把任务拆成一个流程。

所谓 workflow，不是为了炫技，而是为了：
1. 让每一步更容易检查
2. 减少一次输出里混入太多错误
3. 知道出了问题是卡在收集、判断还是输出

今天先理解“多步任务为什么要拆流程”，还不用你立刻搭复杂 Agent。`,
    practice:
      "做题前，先想一个你做过的真实任务，例如调研、需求整理、做周报。把它在脑中拆成至少三步：输入、处理中间层、最终输出。",
    criteria: ["多步任务", "流程拆分", "输入", "处理中间层", "输出"],
  },
};

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
  assessment?: MultipleChoiceAssessment;
  estimatedMinutes: number;
};

function buildKnowledgeCheck(definition: AiLevel): MultipleChoiceAssessment {
  return {
    type: "multiple_choice",
    questions: [
      definition.assessment,
      {
        question: "根据本课，以下哪一项是核心原则？",
        options: [
          { id: "a", label: definition.core },
          { id: "b", label: "让 AI 自己决定关键标准，减少人的干预。" },
          { id: "c", label: "只要输出足够长，就代表理解已经足够。" },
        ],
        correctOptionId: "a",
        explanation: `本课的核心原则是：${definition.core}。`,
      },
      {
        question: "完成本课后，你应当具备哪项能力？",
        options: [
          { id: "a", label: "记住更多 AI 营销术语，不需要实际判断。" },
          { id: "b", label: definition.objective },
          { id: "c", label: "让 AI 替你承担最终结果和责任。" },
        ],
        correctOptionId: "b",
        explanation: `本课的能力目标是：${definition.objective}`,
      },
    ],
  };
}

export function buildAiLesson(day: number): FixedLesson {
  if (day < 1 || day > 60) {
    throw new Error("AI lesson day must be between 1 and 60");
  }

  if (day <= 56) {
    const level = ((day - 1) % 14) + 1;
    const round = Math.floor((day - 1) / 14) + 1;
    const baseDefinition = AI_LEVELS[level - 1];
    const definition = {
      ...baseDefinition,
      ...(AI_LEVEL_REFINEMENTS[level] ?? {}),
    };
    const roundMeta = ROUND_META[round - 1];

    return {
      id: `ai-day-${day}`,
      courseId: "ai-command-skills",
      day,
      level,
      round,
      title: `Level ${level} · ${definition.title}`,
      objective: definition.objective,
      content:
        definition.teaching
          ? `${definition.teaching}\n\n本轮：${roundMeta.name}。${roundMeta.instruction}\n\n课后检查：读完本课后，完成下方 1 道选择题。答错可以回看正文后重新提交。`
          : `${definition.core}。\n\n本轮：${roundMeta.name}。${roundMeta.instruction}\n\n课后检查：读完本课后，完成下方 1 道选择题。答错可以回看正文后重新提交。`,
      practicePrompt: "课后检查：完成下方 3 道选择题。每题对应正文中的一个关键知识点；答对至少 2 题即可通过。",
      criteria: definition.criteria,
      assessment: buildKnowledgeCheck(definition),
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

function buildAiLessonAligned(day: number): FixedLesson {
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
      title: `Level ${level} 路 ${definition.title}`,
      objective: definition.objective,
      content: buildLessonTeachingBlock(
        definition.teaching ?? definition.core,
        roundMeta.name,
        roundMeta.instruction,
      ),
      practicePrompt: buildLessonPracticePromptV2(
        definition.practice,
        definition.criteria,
      ),
      criteria: definition.criteria,
      assessment: buildKnowledgeCheck(definition),
      estimatedMinutes: 20,
    };
  }

  return buildAiLesson(day);
}

export const AI_LESSONS = Array.from({ length: 60 }, (_, index) =>
  buildAiLessonAligned(index + 1),
);

type SpiralLevel = {
  title: string;
  core: string;
  teaching?: string;
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
      content:
        definition.teaching ??
        `先理解这一点：${definition.core}。\n\n本轮学习方式：${roundMeta.name}。${roundMeta.instruction}`,
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
    teaching: `先学这 4 个可直接使用的句型：
1. My name is [名字].
2. I'm from [城市/国家]. 或 I live in [城市/国家].
3. I work as a [职业].
4. I'm learning English because [原因].

把信息拆成短句会比写一条很长的句子更清楚。

示例：My name is Faxon. I live in Phnom Penh, Cambodia. I work as a product manager. I'm learning English for work and daily communication.

注意：城市可以用 “I'm from …” 或 “I live in …” 表达，不需要硬写单词 city。`,
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
