export type AssessmentStageKey = "day0" | "day7" | "day21";

export type AssessmentQuestion = {
  courseId: string;
  stageKey: AssessmentStageKey;
  version: string;
  title: string;
  prompt: string;
  rubric: string[];
  targetDay: number;
};

export const ASSESSMENT_STAGES: Array<{
  key: AssessmentStageKey;
  label: string;
  targetDay: number;
}> = [
  { key: "day0", label: "Day 0 基线", targetDay: 1 },
  { key: "day7", label: "Day 7 复测", targetDay: 7 },
  { key: "day21", label: "Day 21 阶段测试", targetDay: 21 },
];

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    courseId: "english",
    stageKey: "day0",
    version: "v1",
    title: "English Day 0 基线",
    prompt:
      "请用英文完成一段 80–120 词的自我介绍，至少包含：你是谁、你现在在哪个城市、你为什么想提升英语、你最近最想完成的一件真实沟通任务。",
    rubric: ["自我介绍", "所在城市", "学习英语原因", "真实沟通任务"],
    targetDay: 1,
  },
  {
    courseId: "english",
    stageKey: "day7",
    version: "v1",
    title: "English Day 7 复测",
    prompt:
      "请用英文写一段 100–140 词的真实沟通脚本：你需要向一位同事或客户说明一个安排变动，并补充下一步行动。必须包含原因、时间、请求或确认。",
    rubric: ["说明变动", "原因", "时间", "下一步行动"],
    targetDay: 7,
  },
  {
    courseId: "english",
    stageKey: "day21",
    version: "v1",
    title: "English Day 21 阶段测试",
    prompt:
      "请用英文完成一段 120–180 词的任务说明：介绍一个你最近在推进的项目或工作任务，说明目标、当前进展、遇到的问题，以及你希望对方如何协助。",
    rubric: ["项目目标", "当前进展", "遇到的问题", "协助请求"],
    targetDay: 21,
  },
  {
    courseId: "ai-command-skills",
    stageKey: "day0",
    version: "v1",
    title: "AI Day 0 基线",
    prompt:
      "请用中文回答：你现在认为 AI 最适合帮你做什么、不适合替你做什么？再举 1 个你准备亲自验证结果的真实工作任务。",
    rubric: ["适合做什么", "不适合做什么", "真实任务", "验证动作"],
    targetDay: 1,
  },
  {
    courseId: "ai-command-skills",
    stageKey: "day7",
    version: "v1",
    title: "AI Day 7 复测",
    prompt:
      "请写出一个你正在使用或准备使用的 AI 工作流：输入是什么、输出是什么、哪一步必须人工确认、你会用什么标准判断结果可用。",
    rubric: ["输入", "输出", "人工确认", "判断标准"],
    targetDay: 7,
  },
  {
    courseId: "ai-command-skills",
    stageKey: "day21",
    version: "v1",
    title: "AI Day 21 阶段测试",
    prompt:
      "请描述一个你亲自完成的 AI 原型或半成品：它解决什么问题、工作流怎么走、有哪些测试案例、目前最主要的失败点是什么。",
    rubric: ["解决问题", "工作流", "测试案例", "失败点"],
    targetDay: 21,
  },
  {
    courseId: "business",
    stageKey: "day0",
    version: "v1",
    title: "Business Day 0 基线",
    prompt:
      "请用中文写出一个你最近关注的商业机会，并区分：哪些是事实、哪些是假设、哪些只是你的观点。",
    rubric: ["商业机会", "事实", "假设", "观点"],
    targetDay: 1,
  },
  {
    courseId: "business",
    stageKey: "day7",
    version: "v1",
    title: "Business Day 7 复测",
    prompt:
      "请选择一个真实机会，写出 3 个最关键假设，并说明你准备如何在 7 天内验证其中 1 个。",
    rubric: ["真实机会", "3个关键假设", "验证方法", "7天内动作"],
    targetDay: 7,
  },
  {
    courseId: "business",
    stageKey: "day21",
    version: "v1",
    title: "Business Day 21 阶段测试",
    prompt:
      "请提交一次真实商业验证的阶段总结：你找了什么机会、和谁聊过、得到什么需求或购买意向信号、下一步怎么调整。",
    rubric: ["机会", "访谈对象", "需求或购买意向", "下一步调整"],
    targetDay: 21,
  },
];

export function assessmentQuestionFor(
  courseId: string,
  stageKey: AssessmentStageKey,
) {
  return ASSESSMENT_QUESTIONS.find(
    (item) => item.courseId === courseId && item.stageKey === stageKey,
  );
}
