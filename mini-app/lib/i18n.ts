export const SUPPORTED_LOCALES = ["zh-Hans", "vi", "km", "th"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

type Copy = {
  brandSubtitle: string;
  today: string;
  courses: string;
  notes: string;
  progress: string;
  profile: string;
  language: string;
  interfaceLanguage: string;
  languageHelp: string;
  saveLanguage: string;
  saving: string;
  saved: string;
  contentNotice: string;
  contentNoticeAction: string;
  telegramLanguage: string;
  timezone: string;
  activeCourses: string;
  todayLearning: string;
  todayComplete: string;
  minutes: (count: number) => string;
  hello: (name: string) => string;
  feedbackTitle: string;
  feedbackDescription: string;
  feedbackPlaceholder: string;
  sendFeedback: string;
  feedbackSent: string;
  feedbackCategory: (value: "bug" | "content" | "idea" | "other") => string;
};

const COPY: Record<AppLocale, Copy> = {
  "zh-Hans": {
    brandSubtitle: "学习监督系统",
    today: "今日",
    courses: "课程",
    notes: "笔记",
    progress: "进度",
    profile: "我的",
    language: "语言",
    interfaceLanguage: "界面语言",
    languageHelp: "界面可切换中文、越南语、高棉语或泰文。课程正文会按课程翻译状态单独标注。",
    saveLanguage: "保存语言",
    saving: "正在保存…",
    saved: "界面语言已更新",
    contentNotice: "本课程正文暂以中文提供；翻译版本会单独发布，不会用机器翻译覆盖审核内容。",
    contentNoticeAction: "我知道了",
    telegramLanguage: "Telegram 语言",
    timezone: "学习时区",
    activeCourses: "当前课程",
    todayLearning: "今日学习",
    todayComplete: "今日完成",
    minutes: (count) => `预计 ${count} 分钟`,
    hello: (name) => `你好，${name}`,
    feedbackTitle: "问题、建议或内容纠错",
    feedbackDescription: "直接告诉我们。反馈会关联你的当前页面，优先处理阻断学习的问题。",
    feedbackPlaceholder: "发生了什么？你期待什么结果？",
    sendFeedback: "发送反馈",
    feedbackSent: "反馈已收到",
    feedbackCategory: (value) => ({ bug: "Bug", content: "内容问题", idea: "产品建议", other: "其他" })[value],
  },
  vi: {
    brandSubtitle: "Hệ thống đồng hành học tập",
    today: "Hôm nay",
    courses: "Khóa học",
    notes: "Ghi chú",
    progress: "Tiến độ",
    profile: "Hồ sơ",
    language: "Ngôn ngữ",
    interfaceLanguage: "Ngôn ngữ giao diện",
    languageHelp: "Giao diện hỗ trợ tiếng Trung, tiếng Việt, tiếng Khmer và tiếng Thái. Nội dung bài học sẽ có nhãn ngôn ngữ riêng.",
    saveLanguage: "Lưu ngôn ngữ",
    saving: "Đang lưu…",
    saved: "Đã cập nhật ngôn ngữ giao diện",
    contentNotice: "Nội dung bài học hiện có bằng tiếng Trung; bản dịch được kiểm duyệt sẽ phát hành riêng.",
    contentNoticeAction: "Đã hiểu",
    telegramLanguage: "Ngôn ngữ Telegram",
    timezone: "Múi giờ học tập",
    activeCourses: "Khóa đang học",
    todayLearning: "Học hôm nay",
    todayComplete: "Hoàn thành hôm nay",
    minutes: (count) => `Khoảng ${count} phút`,
    hello: (name) => `Xin chào, ${name}`,
    feedbackTitle: "Sự cố, góp ý hoặc lỗi nội dung",
    feedbackDescription: "Hãy nói trực tiếp với chúng tôi. Phản hồi sẽ gắn với trang hiện tại để ưu tiên lỗi cản trở việc học.",
    feedbackPlaceholder: "Điều gì đã xảy ra? Bạn mong đợi điều gì?",
    sendFeedback: "Gửi phản hồi",
    feedbackSent: "Đã nhận phản hồi",
    feedbackCategory: (value) => ({ bug: "Lỗi", content: "Nội dung", idea: "Đề xuất", other: "Khác" })[value],
  },
  km: {
    brandSubtitle: "ប្រព័ន្ធជួយតាមដានការសិក្សា",
    today: "ថ្ងៃនេះ",
    courses: "វគ្គសិក្សា",
    notes: "កំណត់ត្រា",
    progress: "វឌ្ឍនភាព",
    profile: "គណនី",
    language: "ភាសា",
    interfaceLanguage: "ភាសាផ្ទាំងកម្មវិធី",
    languageHelp: "ផ្ទាំងកម្មវិធីគាំទ្រភាសាចិន វៀតណាម ខ្មែរ និងថៃ។ ខ្លឹមសារមេរៀនមានស្លាកភាសាដាច់ដោយឡែក។",
    saveLanguage: "រក្សាទុកភាសា",
    saving: "កំពុងរក្សាទុក…",
    saved: "បានប្ដូរភាសាផ្ទាំងកម្មវិធី",
    contentNotice: "ខ្លឹមសារមេរៀនបច្ចុប្បន្នជាភាសាចិន។ ការបកប្រែដែលបានពិនិត្យនឹងចេញផ្សាយដាច់ដោយឡែក។",
    contentNoticeAction: "ខ្ញុំយល់ហើយ",
    telegramLanguage: "ភាសា Telegram",
    timezone: "តំបន់ម៉ោងសិក្សា",
    activeCourses: "វគ្គកំពុងសិក្សា",
    todayLearning: "ការសិក្សាថ្ងៃនេះ",
    todayComplete: "សម្រេចថ្ងៃនេះ",
    minutes: (count) => `ប្រហែល ${count} នាទី`,
    hello: (name) => `សួស្តី ${name}`,
    feedbackTitle: "បញ្ហា យោបល់ ឬកំហុសខ្លឹមសារ",
    feedbackDescription: "ប្រាប់យើងដោយផ្ទាល់។ មតិកែលម្អនឹងភ្ជាប់នឹងទំព័របច្ចុប្បន្ន ដើម្បីដោះស្រាយបញ្ហាដែលរារាំងការសិក្សាជាមុន។",
    feedbackPlaceholder: "តើមានអ្វីកើតឡើង? តើអ្នករំពឹងអ្វី?",
    sendFeedback: "ផ្ញើមតិកែលម្អ",
    feedbackSent: "បានទទួលមតិកែលម្អ",
    feedbackCategory: (value) => ({ bug: "កំហុស", content: "ខ្លឹមសារ", idea: "យោបល់", other: "ផ្សេងទៀត" })[value],
  },
  th: {
    brandSubtitle: "ระบบติดตามการเรียนรู้",
    today: "วันนี้",
    courses: "คอร์ส",
    notes: "บันทึก",
    progress: "ความคืบหน้า",
    profile: "โปรไฟล์",
    language: "ภาษา",
    interfaceLanguage: "ภาษาของแอป",
    languageHelp: "แอปรองรับจีน เวียดนาม เขมร และไทย เนื้อหาบทเรียนจะแสดงสถานะภาษาของแต่ละคอร์สแยกต่างหาก",
    saveLanguage: "บันทึกภาษา",
    saving: "กำลังบันทึก…",
    saved: "อัปเดตภาษาของแอปแล้ว",
    contentNotice: "เนื้อหาบทเรียนปัจจุบันเป็นภาษาจีน เวอร์ชันแปลที่ผ่านการตรวจสอบจะเผยแพร่แยกต่างหาก",
    contentNoticeAction: "เข้าใจแล้ว",
    telegramLanguage: "ภาษา Telegram",
    timezone: "เขตเวลาการเรียน",
    activeCourses: "คอร์สที่กำลังเรียน",
    todayLearning: "การเรียนวันนี้",
    todayComplete: "เสร็จวันนี้",
    minutes: (count) => `ประมาณ ${count} นาที`,
    hello: (name) => `สวัสดี ${name}`,
    feedbackTitle: "ปัญหา ข้อเสนอแนะ หรือข้อผิดพลาดของเนื้อหา",
    feedbackDescription: "บอกเราได้โดยตรง ความเห็นจะผูกกับหน้าปัจจุบันเพื่อแก้ปัญหาที่ขัดขวางการเรียนก่อน",
    feedbackPlaceholder: "เกิดอะไรขึ้น และคุณคาดหวังอะไร?",
    sendFeedback: "ส่งข้อเสนอแนะ",
    feedbackSent: "ได้รับข้อเสนอแนะแล้ว",
    feedbackCategory: (value) => ({ bug: "ข้อผิดพลาด", content: "เนื้อหา", idea: "ข้อเสนอแนะ", other: "อื่น ๆ" })[value],
  },
};

export const LOCALE_LABELS: Record<AppLocale, string> = {
  "zh-Hans": "中文（简体）",
  vi: "Tiếng Việt",
  km: "ខ្មែរ",
  th: "ไทย",
};

export function resolveAppLocale(value?: string | null): AppLocale {
  const normalized = value?.trim().toLowerCase().replace(/_/g, "-");
  if (normalized === "vi" || normalized?.startsWith("vi-")) return "vi";
  if (normalized === "km" || normalized?.startsWith("km-")) return "km";
  if (normalized === "th" || normalized?.startsWith("th-")) return "th";
  return "zh-Hans";
}

export function copyFor(locale: AppLocale): Copy {
  return COPY[locale];
}

export function contentLocaleLabel(locale: AppLocale) {
  return LOCALE_LABELS[locale];
}
