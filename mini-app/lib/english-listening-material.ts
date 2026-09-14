// Server-only reviewed material. Do not import this module from client components:
// question answers deliberately stay outside the browser bundle.
export type ListeningSupportType = "replay" | "slow_audio" | "line_audio" | "glossary_opened" | "transcript_opened" | "translation_opened" | "feedback_opened";

export type ListeningMaterial = {
  id: string; version: string; title: string; goal: string; mission: string;
  lines: { id: string; en: string; zh: string; note: string }[];
  questions: { id: string; prompt: string; options: { id: string; label: string }[]; answerId: string; explanation: string; lineId: string }[];
  transfer: { text: string; question: { id: string; prompt: string; options: { id: string; label: string }[]; answerId: string; explanation: string } };
};

export const listeningMaterials: ListeningMaterial[] = [
  {
    id: "coffee", version: "v1", title: "点咖啡：听懂店员的追问", goal: "听出冷热、大小、堂食或外带，以及价格。",
    mission: "下次点餐时听一次店员的追问；不确定就说 Could you say that again, please? 记录你听懂了什么。",
    lines: [
      { id: "l1", en: "Hi! What would you like?", zh: "你好，你想要什么？", note: "What would you like? 是礼貌询问需求，回答 I'd like …, please." },
      { id: "l2", en: "I'd like a coffee, please.", zh: "我想要一杯咖啡，谢谢。", note: "I'd like = I would like。听到缩读时，不需要逐字翻译。" },
      { id: "l3", en: "Hot or iced?", zh: "热的还是冰的？", note: "两个选项之间的 or 提示你做选择。iced 指加冰的。" },
      { id: "l4", en: "Iced, please. A small one.", zh: "冰的，谢谢。小杯。", note: "small 是大小信息；one 在这里代替一杯咖啡。" },
      { id: "l5", en: "For here or to go?", zh: "在这里喝还是带走？", note: "for here 是堂食；to go 是外带。" },
      { id: "l6", en: "To go, please.", zh: "带走，谢谢。", note: "直接使用店员给出的选项回应即可。" },
      { id: "l7", en: "That's three dollars.", zh: "一共三美元。", note: "That's … 在付款场景中常用于报总价。价格仅为练习示例。" },
    ],
    questions: [
      { id: "temperature", prompt: "顾客要热的还是冰的？", options: [{ id: "hot", label: "热的" }, { id: "iced", label: "冰的" }, { id: "unknown", label: "没有说明" }], answerId: "iced", lineId: "l4", explanation: "顾客回答 Iced, please." },
      { id: "size", prompt: "顾客选了什么大小？", options: [{ id: "small", label: "小杯" }, { id: "medium", label: "中杯" }, { id: "large", label: "大杯" }], answerId: "small", lineId: "l4", explanation: "A small one 表示小杯。" },
      { id: "place", prompt: "顾客在哪里喝？", options: [{ id: "here", label: "店内" }, { id: "undecided", label: "没有决定" }, { id: "go", label: "带走" }], answerId: "go", lineId: "l6", explanation: "To go 表示外带。" },
      { id: "price", prompt: "练习中的总价是多少？", options: [{ id: "two", label: "两美元" }, { id: "three", label: "三美元" }, { id: "thirteen", label: "十三美元" }], answerId: "three", lineId: "l7", explanation: "three dollars 是三美元。" },
    ],
    transfer: { text: "A large tea, please. Hot, and for here. Thank you.", question: { id: "transfer-place", prompt: "新例子里，顾客选择在哪里喝？", options: [{ id: "here", label: "店内" }, { id: "go", label: "带走" }, { id: "unknown", label: "没有说明" }], answerId: "here", explanation: "for here 表示店内喝。" } },
  },
  {
    id: "colleague", version: "v1", title: "同事沟通：确认任务与截止时间", goal: "抓住要做什么、发给谁、什么时候完成，并复述确认。",
    mission: "向一位同事确认一个真实事项：So, you need … by …, right? 记录对方是否更正了你的理解。",
    lines: [
      { id: "l1", en: "Could you send the updated design to me?", zh: "你能把更新后的设计发给我吗？", note: "Could you …? 是请求；send 是发送，updated 是更新后的。" },
      { id: "l2", en: "Sure. When do you need it?", zh: "可以。你什么时候需要？", note: "When do you need it? 用于追问截止时间。" },
      { id: "l3", en: "By three this afternoon, please.", zh: "请在今天下午三点前发给我。", note: "by three 表示不晚于三点。" },
      { id: "l4", en: "Sorry, could you say that again?", zh: "不好意思，你能再说一遍吗？", note: "听漏时可直接请求重复，不必假装听懂。" },
      { id: "l5", en: "Three this afternoon. Please send it by email.", zh: "今天下午三点。请通过电子邮件发。", note: "by email 是发送方式，与 by three 的时间含义不同。" },
      { id: "l6", en: "So, the updated design, by email, by three today. Is that right?", zh: "所以是更新后的设计，今天三点前通过邮件发送，对吗？", note: "把任务、方式、时间复述给对方，是检验理解的动作。" },
      { id: "l7", en: "Yes, that's right. Thanks!", zh: "对，没错。谢谢！", note: "对方确认后，才把这次沟通记为达成一致。" },
    ],
    questions: [
      { id: "task", prompt: "同事需要什么？", options: [{ id: "design", label: "更新后的设计" }, { id: "receipt", label: "付款收据" }, { id: "recording", label: "会议录音" }], answerId: "design", lineId: "l1", explanation: "updated design 是更新后的设计。" },
      { id: "deadline", prompt: "什么时候需要？", options: [{ id: "tomorrow", label: "明天下午三点" }, { id: "today3", label: "今天下午三点前" }, { id: "tonight", label: "今天晚上八点" }], answerId: "today3", lineId: "l3", explanation: "By three this afternoon 指今天下午三点前。" },
      { id: "channel", prompt: "通过什么方式发送？", options: [{ id: "sms", label: "短信" }, { id: "print", label: "打印交付" }, { id: "email", label: "电子邮件" }], answerId: "email", lineId: "l5", explanation: "send it by email 是通过邮件发送。" },
      { id: "repair", prompt: "听漏之后，说话者做了什么？", options: [{ id: "agree", label: "直接答应" }, { id: "repeat", label: "请求重复并复述确认" }, { id: "change", label: "改聊其他话题" }], answerId: "repeat", lineId: "l6", explanation: "先请求重复，再确认任务、方式和时间。" },
    ],
    transfer: { text: "Please send the report to me by ten tomorrow morning. A message is fine.", question: { id: "transfer-deadline", prompt: "新例子里的截止时间是什么？", options: [{ id: "today10", label: "今天十点" }, { id: "tomorrow10", label: "明天上午十点前" }, { id: "tomorrow3", label: "明天下午三点" }], answerId: "tomorrow10", explanation: "by ten tomorrow morning 指明天上午十点前。" } },
  },
];

export function findListeningMaterial(id: string, version: string) { return listeningMaterials.find((item) => item.id === id && item.version === version) ?? null; }
export function publicListeningMaterial(material: ListeningMaterial) {
  const publicQuestion = (question: ListeningMaterial["questions"][number]) => ({ id: question.id, prompt: question.prompt, options: question.options, lineId: question.lineId });
  return { id: material.id, version: material.version, title: material.title, goal: material.goal, mission: material.mission, lines: material.lines,
    questions: material.questions.map(publicQuestion),
    transfer: { text: material.transfer.text, question: { id: material.transfer.question.id, prompt: material.transfer.question.prompt, options: material.transfer.question.options } } };
}
