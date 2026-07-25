export type ReminderTemplate = {
  id: string;
  level: 1 | 2 | 3 | 4;
  locale: "zh-Hans" | "vi" | "km" | "th";
  content: string;
  buttonText: string;
  weight: number;
};

const L1 = [
  "今天的知识不会自己长进脑子。遗憾的是，工资通常也不会替你学习。",
  "课程只要 15 分钟。你上次刷短视频，大概不是这个数字。",
  "未来的你发来消息：别再把今天的任务外包给明天。",
  "学习不一定立刻改变命运，不学习通常也很稳定。",
  "大脑申请继续摸鱼，Academy 已驳回。",
  "今天不要求逆袭，只要求别继续原地踏步。",
  "你的课程还活着，只是完成率看起来不太乐观。",
  "成年人的自由包括自由拖延，也包括承担拖延的后果。",
  "今日份能力升级已送达。是否安装，由你决定。",
  "世界不会因为你没学习而停止运转，它只会继续把差距算进去。",
  "先完成今天这 15 分钟，再去处理那些假装很紧急的事情。",
  "课程已经准备好。你的借口如果也准备好了，可以让它们先聊一会儿。",
];

const L2 = [
  "今日任务尚未完成。它没有消失，只是开始积灰。",
  "你成功躲过了课程，知识也成功躲过了你。",
  "进度条安静得像周一早晨的灵魂。",
  "学习计划还在等你，耐心比老板好一点，但也有限。",
  "今天再不开始，明天会获得双倍内疚，完全免费。",
  "没关系，拖延也是一种坚持，只是方向不太理想。",
  "课程只要 15 分钟，焦虑它通常更久。",
  "今日任务正在从“稍后完成”缓慢变成“又没完成”。",
  "你可以晚一点开始，但不能用“晚一点”学习一辈子。",
  "系统没有催你，它只是在替昨天信心满满的你收账。",
];

const L3 = [
  "今天快结束了，任务还没有。两者似乎只有一个比较着急。",
  "再拖一会儿，今天的课程就会正式成为明天的心理负担。",
  "连续记录正在悬崖边散步。现在还能把它叫回来。",
  "今日学习窗口即将关闭。借口可以保留，任务请先提交。",
  "最后一班学习列车准备关门。它不豪华，但至少往前开。",
  "如果今天选择放弃，系统会如实记录，不替任何人美化历史。",
];

const L4 = [
  "连续中断已发生。下一课暂时锁定，先把欠下的今天处理掉。",
  "学习计划已经失联两天。系统决定正式介入。",
  "两天没完成不是世界末日，但继续假装没发生通常是下一步。",
  "进度没有背叛你，它只是忠实展示了你没有出现。",
  "下一课在门后等你。钥匙是完成当前任务，不是再立一个新计划。",
  "系统已进入监督模式。放心，它不会讲大道理，只会继续追问。",
];

const BUTTONS = {
  1: "开始今天的课程",
  2: "现在补上",
  3: "保住今天",
  4: "恢复学习",
} as const;

export const REMINDER_TEMPLATES: ReminderTemplate[] = [
  ...L1.map((content, index) => ({
    id: `l1-${String(index + 1).padStart(2, "0")}`,
    level: 1 as const,
    locale: "zh-Hans" as const,
    content,
    buttonText: BUTTONS[1],
    weight: 100,
  })),
  ...L2.map((content, index) => ({
    id: `l2-${String(index + 1).padStart(2, "0")}`,
    level: 2 as const,
    locale: "zh-Hans" as const,
    content,
    buttonText: BUTTONS[2],
    weight: 100,
  })),
  ...L3.map((content, index) => ({
    id: `l3-${String(index + 1).padStart(2, "0")}`,
    level: 3 as const,
    locale: "zh-Hans" as const,
    content,
    buttonText: BUTTONS[3],
    weight: 100,
  })),
  ...L4.map((content, index) => ({
    id: `l4-${String(index + 1).padStart(2, "0")}`,
    level: 4 as const,
    locale: "zh-Hans" as const,
    content,
    buttonText: BUTTONS[4],
    weight: 100,
  })),
];

const LOCALIZED_COPY = {
  vi: {
    buttons: ["Bắt đầu bài học", "Hoàn thành ngay", "Giữ ngày hôm nay", "Quay lại học"],
    messages: [
      ["Kiến thức hôm nay không tự đi vào đầu bạn. Hãy dành 15 phút cho nó.", "Một nhiệm vụ nhỏ hôm nay tốt hơn một kế hoạch lớn ngày mai."],
      ["Nhiệm vụ hôm nay vẫn đang chờ. Hoàn thành một bước để tiếp tục.", "Đừng để việc nhỏ hôm nay trở thành gánh nặng ngày mai."],
      ["Ngày sắp kết thúc, nhưng bạn vẫn có thể giữ lại tiến độ hôm nay.", "Hoàn thành nhiệm vụ hiện tại trước khi ngày hôm nay khép lại."],
      ["Chuỗi học đã bị gián đoạn. Hãy hoàn thành nhiệm vụ hiện tại để quay lại.", "Bài tiếp theo đang chờ sau khi bạn xử lý phần còn lại."],
    ],
  },
  km: {
    buttons: ["ចាប់ផ្តើមមេរៀន", "បំពេញឥឡូវនេះ", "រក្សាថ្ងៃនេះ", "ត្រឡប់មកសិក្សា"],
    messages: [
      ["ចំណេះដឹងថ្ងៃនេះមិនចូលក្នុងក្បាលដោយខ្លួនឯងទេ។ សូមទុកពេល 15 នាទី។", "បំពេញជំហានតូចមួយថ្ងៃនេះ ប្រសើរជាងផែនការធំមួយថ្ងៃស្អែក។"],
      ["កិច្ចការថ្ងៃនេះនៅតែរង់ចាំ។ បំពេញមួយជំហានដើម្បីបន្ត។", "កុំឱ្យកិច្ចការតូចថ្ងៃនេះក្លាយជាបន្ទុកថ្ងៃស្អែក។"],
      ["ថ្ងៃជិតចប់ហើយ ប៉ុន្តែអ្នកនៅតែអាចរក្សាវឌ្ឍនភាពថ្ងៃនេះបាន។", "បំពេញកិច្ចការបច្ចុប្បន្នមុនថ្ងៃនេះបិទ។"],
      ["ការសិក្សាបានផ្អាក។ បំពេញកិច្ចការបច្ចុប្បន្នដើម្បីត្រឡប់មកវិញ។", "មេរៀនបន្ទាប់កំពុងរង់ចាំ បន្ទាប់ពីអ្នកដោះស្រាយកិច្ចការដែលនៅសល់។"],
    ],
  },
  th: {
    buttons: ["เริ่มบทเรียน", "ทำตอนนี้", "รักษาวันนี้ไว้", "กลับมาเรียนต่อ"],
    messages: [
      ["ความรู้วันนี้จะไม่เข้าหัวเอง ใช้เวลา 15 นาทีให้มันหน่อย", "ทำก้าวเล็ก ๆ วันนี้ ดีกว่าแผนใหญ่ในวันพรุ่งนี้"],
      ["ภารกิจวันนี้ยังรออยู่ ทำหนึ่งขั้นให้เสร็จแล้วไปต่อ", "อย่าปล่อยให้งานเล็กวันนี้กลายเป็นภาระของพรุ่งนี้"],
      ["วันกำลังจะจบ แต่คุณยังรักษาความคืบหน้าของวันนี้ได้", "ทำภารกิจปัจจุบันให้เสร็จก่อนวันนี้จะปิด"],
      ["การเรียนขาดช่วงแล้ว ทำภารกิจปัจจุบันเพื่อกลับมาเริ่มต่อ", "บทเรียนถัดไปรออยู่หลังจากจัดการงานที่ค้าง"],
    ],
  },
} as const;

for (const [locale, copy] of Object.entries(LOCALIZED_COPY)) {
  copy.messages.forEach((messages, levelIndex) => {
    messages.forEach((content, messageIndex) => {
      REMINDER_TEMPLATES.push({
        id: `${locale}-l${levelIndex + 1}-${String(messageIndex + 1).padStart(2, "0")}`,
        level: (levelIndex + 1) as 1 | 2 | 3 | 4,
        locale: locale as "vi" | "km" | "th",
        content,
        buttonText: copy.buttons[levelIndex],
        weight: 100,
      });
    });
  });
}

export function selectReminder(
  level: 1 | 2 | 3 | 4,
  recentTemplateIds: string[],
  locale: ReminderTemplate["locale"] = "zh-Hans",
  random = Math.random,
) {
  const recent = new Set(recentTemplateIds.slice(0, 5));
  const levelTemplates = REMINDER_TEMPLATES.filter(
    (template) => template.level === level && template.locale === locale,
  );
  const candidates = levelTemplates.filter((template) => !recent.has(template.id));
  const pool = candidates.length > 0 ? candidates : levelTemplates;
  const totalWeight = pool.reduce((sum, template) => sum + template.weight, 0);
  let cursor = random() * totalWeight;

  for (const template of pool) {
    cursor -= template.weight;
    if (cursor <= 0) return template;
  }

  return pool[pool.length - 1];
}
