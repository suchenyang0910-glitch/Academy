import { type AppLocale } from "./i18n";

type PaymentPlanDisabledReason =
  | "missing_bot_token"
  | "missing_webhook_secret"
  | "missing_stars_amount"
  | string
  | null
  | undefined;

type ReminderHistoryEvent = {
  completedAt?: string | null;
  clickedAt?: string | null;
  deliveryStatus: string;
};

type ReminderDiagnosticReason =
  | "scheduled"
  | "eligible_now"
  | "paused"
  | "missing_telegram_id"
  | "access_expired"
  | "no_active_courses"
  | "completed_today"
  | "do_not_disturb";

type ReminderDiagnostic = {
  reason: ReminderDiagnosticReason;
};

export type AcademyRequestErrorCode =
  | "telegram_auth_required"
  | "request_failed"
  | "load_failed";

export function requestRuntimeCopy(locale: AppLocale) {
  return {
    "zh-Hans": {
      telegramAuthRequired:
        "请从 Telegram 内的 Academy 菜单打开，浏览器链接无法完成身份校验。",
      requestFailed: "请求失败，请稍后重试",
      loadFailed: "加载失败",
    },
    vi: {
      telegramAuthRequired:
        "Hãy mở Academy từ menu trong Telegram. Link trình duyệt không thể xác minh danh tính.",
      requestFailed: "Yêu cầu thất bại, vui lòng thử lại sau",
      loadFailed: "Tải dữ liệu thất bại",
    },
    km: {
      telegramAuthRequired:
        "សូមបើក Academy ពីម៉ឺនុយក្នុង Telegram។ តំណ browser មិនអាចផ្ទៀងផ្ទាត់អត្តសញ្ញាណបានទេ។",
      requestFailed: "សំណើបរាជ័យ សូមព្យាយាមម្តងទៀតបន្តិចទៀត",
      loadFailed: "ផ្ទុកទិន្នន័យបរាជ័យ",
    },
    th: {
      telegramAuthRequired:
        "โปรดเปิด Academy จากเมนูใน Telegram ลิงก์บนเบราว์เซอร์ยืนยันตัวตนไม่ได้",
      requestFailed: "คำขอไม่สำเร็จ โปรดลองใหม่ภายหลัง",
      loadFailed: "โหลดข้อมูลไม่สำเร็จ",
    },
  }[locale];
}

export function courseRuntimeCopy(locale: AppLocale) {
  return {
    "zh-Hans": {
      coursePlanUpdated: "课程安排已更新",
      maxThreeCourses: "最多同时选择 3 门课程",
      minOneCourse: "至少选择 1 门课程",
      saveFailed: "保存失败",
      cancel: "取消",
      selectedCount: (count: number) => `已选 ${count}/3 门`,
      dailyMinutes: (minutes: number) => `每天约 ${minutes} 分钟`,
      savingPlan: "正在安排…",
      startTraining: "开始 60 天训练",
      lockedByInterruption: "已经连续中断，预习区先关闭。先把当前必修课补上。",
      lockedByBehind: "你已经落后 1 天。下一课暂不解锁，先完成当前主线。",
      extraOpen: "当前主线已完成，下面 3 节可以继续学习，但只记为额外证据。",
      extraLocked: "完成当前主线后才会解锁后续 3 节，不抢占明天的必修。",
      continueExtraTitle: "想多学一点？",
      continueExtraTime: "每门再加 15–20 分钟",
      preview: "预习 →",
      minutesPerDay: (minutes: number) => `${minutes} 分钟／天`,
      viewPath: "查看路径 →",
      notSelected: "未选择",
      backCourses: "‹ 返回课程",
      mainline60: "60 天主线",
      viewTodayEvidence: "查看今天的学习证据",
      continueMainline: "继续今天的主线 →",
      continueExtra: "继续加学",
      completed: "已完成",
      catchUpFirst: "先补当前",
      start: "开始 →",
      locked: "待解锁",
      nextStageReady: "已满足解锁条件 · 即将进入下一阶段",
      day60Unlock: "完成 Day 60 能力验证后解锁",
      extensionPaths: {
        english: {
          title: "English Level 2 · 真实场景沟通",
          description: "从固定表达进入追问、协作与 10 分钟以上的连续真实交流。",
        },
        "ai-command-skills": {
          title: "AI Level 2 · 工作流与可运行原型",
          description: "从单个指令进入多工具工作流、评估集与可运行的个人原型。",
        },
        business: {
          title: "Business Extension · 市场验证与成交",
          description: "把机会判断延展到连续访谈、报价测试和可复核的购买意向。",
        },
        "founder-note": {
          title: "Founder Note Level 2 · 决策系统",
          description: "从每日记录进入决策复盘、反例库与个人判断 SOP。",
        },
        quiz: {
          title: "Quiz Level 2 · 情景挑战",
          description: "从知识提取进入跨场景判断、限时作答与错误模式训练。",
        },
      },
    },
    vi: {
      coursePlanUpdated: "Đã cập nhật kế hoạch học",
      maxThreeCourses: "Chọn tối đa 3 khóa cùng lúc",
      minOneCourse: "Chọn ít nhất 1 khóa",
      saveFailed: "Lưu thất bại",
      cancel: "Hủy",
      selectedCount: (count: number) => `Đã chọn ${count}/3 khóa`,
      dailyMinutes: (minutes: number) => `Khoảng ${minutes} phút mỗi ngày`,
      savingPlan: "Đang sắp xếp…",
      startTraining: "Bắt đầu luyện 60 ngày",
      lockedByInterruption: "Bạn đã gián đoạn liên tiếp. Phần học trước tạm đóng; hãy bù bài chính trước.",
      lockedByBehind: "Bạn đang trễ 1 ngày. Bài sau chưa mở; hãy hoàn thành bài chính hiện tại.",
      extraOpen: "Bài chính đã xong. Bạn có thể học thêm 3 bài tiếp theo, nhưng chỉ tính là bằng chứng phụ.",
      extraLocked: "Hoàn thành bài chính hiện tại để mở 3 bài tiếp theo, không chiếm nhiệm vụ ngày mai.",
      continueExtraTitle: "Muốn học thêm?",
      continueExtraTime: "Thêm 15–20 phút mỗi khóa",
      preview: "Học trước →",
      minutesPerDay: (minutes: number) => `${minutes} phút/ngày`,
      viewPath: "Xem lộ trình →",
      notSelected: "Chưa chọn",
      backCourses: "‹ Về khóa học",
      mainline60: "Lộ trình chính 60 ngày",
      viewTodayEvidence: "Xem bằng chứng hôm nay",
      continueMainline: "Tiếp tục bài chính hôm nay →",
      continueExtra: "Học thêm",
      completed: "Đã xong",
      catchUpFirst: "Bù bài trước",
      start: "Bắt đầu →",
      locked: "Chưa mở",
      nextStageReady: "Đã đủ điều kiện · sắp vào giai đoạn tiếp theo",
      day60Unlock: "Mở sau khi hoàn thành xác minh năng lực Day 60",
      extensionPaths: {
        english: {
          title: "English Level 2 · Giao tiếp tình huống thật",
          description:
            "Từ mẫu câu cố định sang hỏi tiếp, phối hợp và hội thoại thật trên 10 phút.",
        },
        "ai-command-skills": {
          title: "AI Level 2 · Workflow và prototype chạy được",
          description:
            "Từ prompt đơn lẻ sang workflow nhiều công cụ, bộ đánh giá và prototype cá nhân.",
        },
        business: {
          title: "Business Extension · Kiểm chứng thị trường và chốt mua",
          description:
            "Mở rộng từ nhận định cơ hội sang phỏng vấn liên tục, thử giá và ý định mua có thể kiểm chứng.",
        },
        "founder-note": {
          title: "Founder Note Level 2 · Hệ thống ra quyết định",
          description:
            "Từ ghi chép hằng ngày sang review quyết định, thư viện phản ví dụ và SOP phán đoán cá nhân.",
        },
        quiz: {
          title: "Quiz Level 2 · Thử thách theo tình huống",
          description:
            "Từ trích xuất kiến thức sang phán đoán liên ngữ cảnh, trả lời giới hạn thời gian và nhận diện lỗi.",
        },
      },
    },
    km: {
      coursePlanUpdated: "បានកែប្រែកាលវិភាគវគ្គសិក្សា",
      maxThreeCourses: "ជ្រើសបានច្រើនបំផុត 3 វគ្គ",
      minOneCourse: "ត្រូវជ្រើសយ៉ាងហោចណាស់ 1 វគ្គ",
      saveFailed: "រក្សាទុកបរាជ័យ",
      cancel: "បោះបង់",
      selectedCount: (count: number) => `បានជ្រើស ${count}/3 វគ្គ`,
      dailyMinutes: (minutes: number) => `ប្រហែល ${minutes} នាទីក្នុងមួយថ្ងៃ`,
      savingPlan: "កំពុងរៀបចំ…",
      startTraining: "ចាប់ផ្តើមហ្វឹកហាត់ 60 ថ្ងៃ",
      lockedByInterruption: "អ្នកបានផ្អាកជាប់គ្នា។ ផ្នែករៀនមុនត្រូវបានបិទសិន សូមបំពេញមេរៀនសំខាន់ជាមុន។",
      lockedByBehind: "អ្នកយឺត 1 ថ្ងៃ។ មេរៀនបន្ទាប់មិនទាន់បើកទេ សូមបញ្ចប់មេរៀនសំខាន់បច្ចុប្បន្ន។",
      extraOpen: "មេរៀនសំខាន់បានបញ្ចប់។ អាចរៀនបន្ថែម 3 មេរៀនបន្ទាប់ ប៉ុន្តែគិតជាភស្តុតាងបន្ថែមប៉ុណ្ណោះ។",
      extraLocked: "បញ្ចប់មេរៀនសំខាន់បច្ចុប្បន្ន ដើម្បីបើក 3 មេរៀនបន្ទាប់ ដោយមិនជំនួសភារកិច្ចថ្ងៃស្អែក។",
      continueExtraTitle: "ចង់រៀនបន្ថែមទេ?",
      continueExtraTime: "បន្ថែម 15–20 នាទីក្នុងមួយវគ្គ",
      preview: "រៀនមុន →",
      minutesPerDay: (minutes: number) => `${minutes} នាទី/ថ្ងៃ`,
      viewPath: "មើលផ្លូវរៀន →",
      notSelected: "មិនបានជ្រើស",
      backCourses: "‹ ត្រឡប់ទៅវគ្គ",
      mainline60: "ផ្លូវសំខាន់ 60 ថ្ងៃ",
      viewTodayEvidence: "មើលភស្តុតាងថ្ងៃនេះ",
      continueMainline: "បន្តមេរៀនសំខាន់ថ្ងៃនេះ →",
      continueExtra: "រៀនបន្ថែម",
      completed: "បានបញ្ចប់",
      catchUpFirst: "បំពេញបច្ចុប្បន្នមុន",
      start: "ចាប់ផ្តើម →",
      locked: "មិនទាន់បើក",
      nextStageReady: "បានបំពេញលក្ខខណ្ឌ · ជិតចូលដំណាក់កាលបន្ទាប់",
      day60Unlock: "បើកបន្ទាប់ពីបញ្ចប់ការផ្ទៀងផ្ទាត់សមត្ថភាព Day 60",
      extensionPaths: {
        english: {
          title: "English Level 2 · ការទំនាក់ទំនងស្ថានការណ៍ពិត",
          description:
            "ពីប្រយោគថេរ ទៅការសួរបន្ត ការសហការ និងការសន្ទនាពិតលើស 10 នាទី។",
        },
        "ai-command-skills": {
          title: "AI Level 2 · Workflow និង prototype ដំណើរការ",
          description:
            "ពី prompt មួយជំហាន ទៅ workflow ពហុឧបករណ៍ សំណុំវាយតម្លៃ និង prototype ផ្ទាល់ខ្លួន។",
        },
        business: {
          title: "Business Extension · ផ្ទៀងផ្ទាត់ទីផ្សារ និងចេតនាទិញ",
          description:
            "ពង្រីកពីការវាយតម្លៃឱកាស ទៅសម្ភាសន៍បន្តបន្ទាប់ សាកល្បងតម្លៃ និងចេតនាទិញដែលអាចផ្ទៀងផ្ទាត់បាន។",
        },
        "founder-note": {
          title: "Founder Note Level 2 · ប្រព័ន្ធសម្រេចចិត្ត",
          description:
            "ពីកំណត់ត្រាប្រចាំថ្ងៃ ទៅការពិនិត្យសម្រេចចិត្ត បណ្ណាល័យឧទាហរណ៍ផ្ទុយ និង SOP វិនិច្ឆ័យផ្ទាល់ខ្លួន។",
        },
        quiz: {
          title: "Quiz Level 2 · បញ្ហាប្រឈមតាមស្ថានការណ៍",
          description:
            "ពីការដកចំណេះដឹង ទៅការវិនិច្ឆ័យឆ្លងស្ថានការណ៍ ការឆ្លើយកំណត់ពេល និងការហ្វឹកហាត់លំនាំកំហុស។",
        },
      },
    },
    th: {
      coursePlanUpdated: "อัปเดตแผนคอร์สแล้ว",
      maxThreeCourses: "เลือกได้สูงสุด 3 คอร์สพร้อมกัน",
      minOneCourse: "ต้องเลือกอย่างน้อย 1 คอร์ส",
      saveFailed: "บันทึกไม่สำเร็จ",
      cancel: "ยกเลิก",
      selectedCount: (count: number) => `เลือกแล้ว ${count}/3 คอร์ส`,
      dailyMinutes: (minutes: number) => `ประมาณ ${minutes} นาทีต่อวัน`,
      savingPlan: "กำลังจัดแผน…",
      startTraining: "เริ่มฝึก 60 วัน",
      lockedByInterruption: "คุณขาดต่อเนื่อง พื้นที่เรียนล่วงหน้าปิดชั่วคราว ทำบทหลักปัจจุบันก่อน",
      lockedByBehind: "คุณช้าไป 1 วัน บทถัดไปยังไม่เปิด ทำบทหลักปัจจุบันก่อน",
      extraOpen: "บทหลักเสร็จแล้ว เรียนต่อได้อีก 3 บท แต่จะนับเป็นหลักฐานเสริม",
      extraLocked: "ทำบทหลักปัจจุบันให้เสร็จก่อน ถึงจะเปิด 3 บทถัดไป และไม่แทนงานพรุ่งนี้",
      continueExtraTitle: "อยากเรียนเพิ่มไหม?",
      continueExtraTime: "เพิ่ม 15–20 นาทีต่อคอร์ส",
      preview: "เรียนล่วงหน้า →",
      minutesPerDay: (minutes: number) => `${minutes} นาที/วัน`,
      viewPath: "ดูเส้นทาง →",
      notSelected: "ยังไม่เลือก",
      backCourses: "‹ กลับคอร์ส",
      mainline60: "เส้นทางหลัก 60 วัน",
      viewTodayEvidence: "ดูหลักฐานวันนี้",
      continueMainline: "ทำบทหลักวันนี้ต่อ →",
      continueExtra: "เรียนเพิ่ม",
      completed: "เสร็จแล้ว",
      catchUpFirst: "ชดเชยก่อน",
      start: "เริ่ม →",
      locked: "ยังล็อก",
      nextStageReady: "ผ่านเงื่อนไขแล้ว · กำลังเข้าสู่ช่วงถัดไป",
      day60Unlock: "ปลดล็อกหลังผ่านการยืนยันความสามารถ Day 60",
      extensionPaths: {
        english: {
          title: "English Level 2 · สื่อสารในสถานการณ์จริง",
          description:
            "จากประโยคตายตัวไปสู่การถามต่อ การทำงานร่วมกัน และบทสนทนาจริงเกิน 10 นาที",
        },
        "ai-command-skills": {
          title: "AI Level 2 · Workflow และต้นแบบที่รันได้",
          description:
            "จาก prompt เดี่ยวไปสู่ workflow หลายเครื่องมือ ชุดประเมิน และต้นแบบส่วนตัวที่รันได้",
        },
        business: {
          title: "Business Extension · ตรวจตลาดและเจตนาซื้อ",
          description:
            "ขยายจากการตัดสินโอกาสไปสู่สัมภาษณ์ต่อเนื่อง ทดสอบราคา และเจตนาซื้อที่ตรวจสอบได้",
        },
        "founder-note": {
          title: "Founder Note Level 2 · ระบบการตัดสินใจ",
          description:
            "จากบันทึกรายวันไปสู่รีวิวการตัดสินใจ คลังตัวอย่างย้อนแย้ง และ SOP การตัดสินของตัวเอง",
        },
        quiz: {
          title: "Quiz Level 2 · ความท้าทายตามสถานการณ์",
          description:
            "จากการดึงความรู้ไปสู่การตัดสินข้ามบริบท ตอบแบบจำกัดเวลา และฝึกรูปแบบข้อผิดพลาด",
        },
      },
    },
  }[locale];
}

export function learningModeRuntimeCopy(locale: AppLocale) {
  return {
    "zh-Hans": {
      title: "学习模式",
      subtitle: "被动学习负责把你拉回主线；主动学习负责让你多走一步。",
      passiveLabel: "被动学习",
      passiveTitle: "系统今日必修",
      passiveDetail: (count: number) =>
        count > 0
          ? `还有 ${count} 门主线课需要留下证据。`
          : "今日主线已经完成。",
      passiveAction: "先完成主线",
      passiveDone: "主线已清空",
      activeLabel: "主动学习",
      activeTitle: "想多学就加学",
      activeDetail: (count: number) =>
        count > 0
          ? `已解锁 ${count} 节预习/加学内容，只记为额外证据。`
          : "完成主线后会开放后续 3 节，不抢明天任务。",
      activeAction: "进入加学",
      activeLocked: "先完成主线",
    },
    vi: {
      title: "Chế độ học",
      subtitle: "Bị động kéo bạn về bài chính; chủ động giúp bạn đi thêm một bước.",
      passiveLabel: "Học bị động",
      passiveTitle: "Nhiệm vụ bắt buộc hôm nay",
      passiveDetail: (count: number) =>
        count > 0 ? `Còn ${count} bài chính cần bằng chứng.` : "Bài chính hôm nay đã xong.",
      passiveAction: "Làm bài chính",
      passiveDone: "Đã xong",
      activeLabel: "Học chủ động",
      activeTitle: "Muốn học thêm thì tiếp tục",
      activeDetail: (count: number) =>
        count > 0
          ? `Đã mở ${count} bài học thêm; chỉ tính là bằng chứng phụ.`
          : "Hoàn thành bài chính để mở 3 bài tiếp theo.",
      activeAction: "Học thêm",
      activeLocked: "Làm bài chính trước",
    },
    km: {
      title: "របៀបសិក្សា",
      subtitle: "ការសិក្សាបែបរំលឹកនាំអ្នកត្រឡប់ទៅភារកិច្ចសំខាន់; ការសិក្សាសកម្មអោយអ្នកទៅបន្ត។",
      passiveLabel: "សិក្សាបែបរំលឹក",
      passiveTitle: "ភារកិច្ចចាំបាច់ថ្ងៃនេះ",
      passiveDetail: (count: number) =>
        count > 0 ? `នៅសល់ ${count} មេរៀនសំខាន់ត្រូវមានភស្តុតាង។` : "ភារកិច្ចសំខាន់ថ្ងៃនេះរួចរាល់។",
      passiveAction: "ធ្វើភារកិច្ចសំខាន់",
      passiveDone: "រួចរាល់",
      activeLabel: "សិក្សាសកម្ម",
      activeTitle: "ចង់រៀនបន្ថែម",
      activeDetail: (count: number) =>
        count > 0 ? `បានបើក ${count} មេរៀនបន្ថែម; គិតជាភស្តុតាងបន្ថែម។` : "បញ្ចប់ភារកិច្ចសំខាន់ដើម្បីបើក 3 មេរៀនបន្ទាប់។",
      activeAction: "រៀនបន្ថែម",
      activeLocked: "ធ្វើភារកិច្ចសំខាន់សិន",
    },
    th: {
      title: "โหมดการเรียน",
      subtitle: "แบบถูกเตือนพาคุณกลับสู่เส้นหลัก; แบบเชิงรุกช่วยให้ไปต่ออีกก้าว",
      passiveLabel: "เรียนแบบถูกเตือน",
      passiveTitle: "งานหลักวันนี้",
      passiveDetail: (count: number) =>
        count > 0 ? `ยังเหลือ ${count} บทหลักที่ต้องมีหลักฐาน` : "งานหลักวันนี้เสร็จแล้ว",
      passiveAction: "ทำบทหลักก่อน",
      passiveDone: "เสร็จแล้ว",
      activeLabel: "เรียนเชิงรุก",
      activeTitle: "อยากเรียนเพิ่ม",
      activeDetail: (count: number) =>
        count > 0 ? `เปิดแล้ว ${count} บทเสริม นับเป็นหลักฐานเสริม` : "ทำบทหลักให้เสร็จก่อน จะเปิด 3 บทถัดไป",
      activeAction: "เรียนเพิ่ม",
      activeLocked: "ทำบทหลักก่อน",
    },
  }[locale];
}

export function courseDomainRuntimeCopy(locale: AppLocale, courseId: string) {
  const copy = {
    "zh-Hans": {
      ai: {
        domain: "AI",
        evidence: "Quiz / Workflow / Demo",
        mode: "先理解概念，再做出可运行原型。",
      },
      english: {
        domain: "English",
        evidence: "听说 / 对话 / 邮件",
        mode: "先学表达，再完成真实沟通动作。",
      },
      business: {
        domain: "Business Case",
        evidence: "机会分析 / 访谈 / 购买意向",
        mode: "先判断案例，再做真实验证。",
      },
      founder: {
        domain: "Founder Note",
        evidence: "反思 / 决策 / SOP",
        mode: "把想法变成可回看的判断记录。",
      },
      quiz: {
        domain: "Quiz",
        evidence: "选择题 / 复习 / 错误模式",
        mode: "主动提取知识，而不是只看熟悉感。",
      },
    },
    vi: {
      ai: { domain: "AI", evidence: "Quiz / Workflow / Demo", mode: "Hiểu khái niệm rồi làm prototype chạy được." },
      english: { domain: "English", evidence: "Nghe nói / đối thoại / email", mode: "Học mẫu câu rồi làm hành động giao tiếp thật." },
      business: { domain: "Business Case", evidence: "Cơ hội / phỏng vấn / ý định mua", mode: "Đánh giá case rồi xác thực thật." },
      founder: { domain: "Founder Note", evidence: "Phản tư / quyết định / SOP", mode: "Biến suy nghĩ thành ghi chép có thể xem lại." },
      quiz: { domain: "Quiz", evidence: "Trắc nghiệm / ôn tập / lỗi", mode: "Chủ động nhớ lại, không chỉ thấy quen." },
    },
    km: {
      ai: { domain: "AI", evidence: "Quiz / Workflow / Demo", mode: "យល់គំនិតមុន រួចធ្វើ prototype ដែលដំណើរការ។" },
      english: { domain: "English", evidence: "ស្តាប់និយាយ / សន្ទនា / អ៊ីមែល", mode: "រៀនប្រយោគ រួចធ្វើសកម្មភាពទំនាក់ទំនងពិត។" },
      business: { domain: "Business Case", evidence: "ឱកាស / សម្ភាសន៍ / ចេតនាទិញ", mode: "វិនិច្ឆ័យករណី រួចធ្វើការផ្ទៀងផ្ទាត់ពិត។" },
      founder: { domain: "Founder Note", evidence: "ឆ្លុះបញ្ចាំង / សម្រេចចិត្ត / SOP", mode: "បម្លែងគំនិតទៅជាកំណត់ត្រាដែលពិនិត្យវិញបាន។" },
      quiz: { domain: "Quiz", evidence: "សំណួរ / រំលឹក / គំរូកំហុស", mode: "ទាញយកចំណេះដឹងសកម្ម មិនមែនត្រឹមស្គាល់។" },
    },
    th: {
      ai: { domain: "AI", evidence: "Quiz / Workflow / Demo", mode: "เข้าใจแนวคิดก่อน แล้วทำต้นแบบที่รันได้" },
      english: { domain: "English", evidence: "ฟังพูด / สนทนา / อีเมล", mode: "เรียนสำนวน แล้วใช้สื่อสารจริง" },
      business: { domain: "Business Case", evidence: "โอกาส / สัมภาษณ์ / ความตั้งใจซื้อ", mode: "ตัดสินเคส แล้วตรวจสอบกับของจริง" },
      founder: { domain: "Founder Note", evidence: "ทบทวน / ตัดสินใจ / SOP", mode: "เปลี่ยนความคิดเป็นบันทึกที่ตรวจย้อนหลังได้" },
      quiz: { domain: "Quiz", evidence: "ตัวเลือก / ทบทวน / รูปแบบความผิด", mode: "ดึงความรู้ด้วยตัวเอง ไม่ใช่แค่รู้สึกคุ้น" },
    },
  }[locale];
  if (courseId === "ai-command-skills") return copy.ai;
  if (courseId === "english") return copy.english;
  if (courseId === "business") return copy.business;
  if (courseId === "founder-note") return copy.founder;
  if (courseId === "quiz") return copy.quiz;
  return copy.business;
}

export function notesRuntimeCopy(locale: AppLocale) {
  return {
    "zh-Hans": {
      placeholder: "一个发现、一次判断，或明天必须继续的问题…",
      lockedComposer: "试用结束后仍可查看历史笔记，但不能继续新增学习记录。",
      emptyNote: "还没有笔记。大脑觉得记得住，通常只是它的个人意见。",
      saveFailed: "保存失败",
      savedToast: "笔记已经收好",
    },
    vi: {
      placeholder: "Một phát hiện, một phán đoán, hoặc câu hỏi cần tiếp tục ngày mai…",
      lockedComposer: "Hết dùng thử vẫn xem được ghi chú cũ, nhưng không thể thêm bản ghi học mới.",
      emptyNote: "Chưa có ghi chú. Não thường tự tin hơn thực tế một chút.",
      saveFailed: "Lưu thất bại",
      savedToast: "Đã lưu ghi chú",
    },
    km: {
      placeholder: "ការរកឃើញមួយ ការវិនិច្ឆ័យមួយ ឬសំណួរដែលត្រូវបន្តថ្ងៃស្អែក…",
      lockedComposer: "បន្ទាប់ពីសាកល្បងផុតកំណត់ អ្នកនៅតែមើលកំណត់ត្រាចាស់បាន ប៉ុន្តែមិនអាចបន្ថែមកំណត់ត្រាថ្មីបានទេ។",
      emptyNote: "មិនទាន់មានកំណត់ត្រា។ ខួរក្បាលតែងគិតថាចាំបាន លើសពីការពិតបន្តិច។",
      saveFailed: "រក្សាទុកបរាជ័យ",
      savedToast: "បានរក្សាទុកកំណត់ត្រា",
    },
    th: {
      placeholder: "หนึ่งข้อค้นพบ หนึ่งการตัดสินใจ หรือคำถามที่ต้องต่อพรุ่งนี้…",
      lockedComposer: "หลังหมดทดลองยังดูบันทึกเก่าได้ แต่เพิ่มบันทึกการเรียนใหม่ไม่ได้",
      emptyNote: "ยังไม่มีบันทึก สมองมักมั่นใจว่าจำได้มากกว่าความจริงนิดหน่อย",
      saveFailed: "บันทึกไม่สำเร็จ",
      savedToast: "เก็บบันทึกแล้ว",
    },
  }[locale];
}

export function progressRuntimeCopy(locale: AppLocale) {
  return {
    "zh-Hans": {
      currentLearningDay: "当前学习日",
      todayCompletion: "今日完成",
      completed: "已完成",
      totalCourses: (count: number) => `共 ${count} 门`,
      learningEvidence: "学习证据",
      todaySubmissions: "今日提交",
      acceptedEvidence: "已验收证据",
      ruleAverage: "规则均分",
      outOf100: "满分 100",
      effectiveLearningDays: "有效学习日",
      currentStreak: (days: number) => `当前连续 ${days} 天`,
      noSkipping: "课程没有跳过",
      lagWarning: (days: number) =>
        `当前比日历计划落后 ${days} 天。完成当前课程后，系统会在下一个学习日解锁下一课。`,
      independentCourseProgress: "独立课程进度",
      baselineVsCheckpointTitle: "Day 0 / Day 21 对比",
      stageAssessments: "阶段测试",
      viewOrResubmit: "查看 / 重提",
      assessmentPending: (label: string) => `${label} 待完成`,
      selfCompleted: "自主完成",
      selfCompletedHint: "未被提醒直接完成",
      promptedCompleted: "提醒完成",
      afterL1L2: "L1 / L2 后完成",
      supervisedCompleted: "强监督完成",
      afterL3L4: "L3 / L4 后完成",
      remindersDelivered: "提醒送达",
      deliveredHint: "已成功发到 Telegram",
      completedAfterReminder: "提醒后完成",
      averageMinutes: (minutes: number | null) => `平均 ${minutes ?? "—"} 分钟`,
      highIntensityCompleted: "高强度完成",
      l3L4Conversion: "L3 / L4 转化",
      fwpr7: "FWPR-7",
      fwpr7Hint: "Day 0 后跑通 Day 7 原型",
      day21Dod: "Day 21 DoD",
      day21DodHint: "完成演示与证据包",
      goalEvidenceRate: "目标证据率",
      goalEvidenceCount: (done: number, total: number) => `${done}/${total} 个检查点`,
      runtimeEvidence: "运行证据",
      runtimeEvidenceHint: "可运行原型证据",
      competencyTitle: "能力证明",
      competencySubtitle: "只有被 accepted evidence 支撑的节点才会增长；打开页面和阅读时长不算掌握。",
      exportJson: "导出 JSON",
      exportMarkdown: "导出 Markdown",
      exporting: "导出中…",
      createProofShare: "生成分享页",
      creatingProofShare: "生成中…",
      proofShareCreatedAndCopied: "能力证明分享页已生成，链接已复制",
      proofShareCreated: "能力证明分享页已生成",
      proofShareFailed: "生成能力证明分享页失败",
      publicProofPage: "公开证明页",
      evidenceCount: (count: number) => `${count} 条证据`,
      quizFirstPassRate: "首交通过率",
      quizFirstPassCount: (done: number, total: number) => `${done}/${total} 次首交通过`,
      quizRevisionPassRate: "修正后通过率",
      quizRevisionPassCount: (done: number, total: number) => `${done}/${total} 个首错课题已修正`,
      quizQuestionAccuracy: "题目正确率",
      quizAttemptCount: (count: number) => `${count} 次选择题提交`,
      quizNeedsReview: "需重讲",
      quizNeedsReviewHint: "首错且尚未修正通过",
      achieved: "已达成",
      pending: "待完成",
      notReady: "未就绪",
    },
    vi: {
      currentLearningDay: "Ngày học hiện tại",
      todayCompletion: "Hoàn thành hôm nay",
      completed: "Đã hoàn thành",
      totalCourses: (count: number) => `Tổng ${count} khóa`,
      learningEvidence: "Bằng chứng học",
      todaySubmissions: "Bài nộp hôm nay",
      acceptedEvidence: "Bằng chứng đã duyệt",
      ruleAverage: "Điểm luật TB",
      outOf100: "Tối đa 100",
      effectiveLearningDays: "Ngày học hiệu lực",
      currentStreak: (days: number) => `Chuỗi hiện tại ${days} ngày`,
      noSkipping: "Khóa học không bị bỏ qua",
      lagWarning: (days: number) =>
        `Bạn đang trễ ${days} ngày so với lịch. Hoàn thành bài hiện tại rồi hệ thống sẽ mở bài sau vào ngày học kế tiếp.`,
      independentCourseProgress: "Tiến độ từng khóa",
      baselineVsCheckpointTitle: "So sánh Day 0 / Day 21",
      stageAssessments: "Checkpoint",
      viewOrResubmit: "Xem / nộp lại",
      assessmentPending: (label: string) => `${label} cần làm`,
      selfCompleted: "Tự hoàn thành",
      selfCompletedHint: "Hoàn thành trước khi được nhắc",
      promptedCompleted: "Hoàn thành sau nhắc",
      afterL1L2: "Sau L1 / L2",
      supervisedCompleted: "Hoàn thành khi giám sát mạnh",
      afterL3L4: "Sau L3 / L4",
      remindersDelivered: "Nhắc đã gửi",
      deliveredHint: "Đã gửi tới Telegram",
      completedAfterReminder: "Hoàn thành sau nhắc",
      averageMinutes: (minutes: number | null) => `Trung bình ${minutes ?? "—"} phút`,
      highIntensityCompleted: "Hoàn thành cường độ cao",
      l3L4Conversion: "Chuyển đổi L3 / L4",
      fwpr7: "FWPR-7",
      fwpr7Hint: "Prototype Day 7 sau Day 0",
      day21Dod: "DoD Day 21",
      day21DodHint: "Demo và gói bằng chứng",
      goalEvidenceRate: "Tỷ lệ bằng chứng mục tiêu",
      goalEvidenceCount: (done: number, total: number) => `${done}/${total} checkpoint`,
      runtimeEvidence: "Bằng chứng chạy được",
      runtimeEvidenceHint: "Prototype có thể chạy",
      competencyTitle: "Bằng chứng năng lực",
      competencySubtitle:
        "Chỉ node có accepted evidence mới tăng; mở trang hoặc đọc lâu không tính là đã nắm vững.",
      exportJson: "Xuất JSON",
      exportMarkdown: "Xuất Markdown",
      exporting: "Đang xuất…",
      createProofShare: "Tạo trang chia sẻ",
      creatingProofShare: "Đang tạo…",
      proofShareCreatedAndCopied: "Đã tạo trang bằng chứng năng lực và sao chép liên kết",
      proofShareCreated: "Đã tạo trang bằng chứng năng lực",
      proofShareFailed: "Tạo trang bằng chứng năng lực thất bại",
      publicProofPage: "Trang bằng chứng công khai",
      evidenceCount: (count: number) => `${count} bằng chứng`,
      quizFirstPassRate: "Tỷ lệ qua lần đầu",
      quizFirstPassCount: (done: number, total: number) => `${done}/${total} lần đầu đạt`,
      quizRevisionPassRate: "Tỷ lệ qua sau sửa",
      quizRevisionPassCount: (done: number, total: number) => `${done}/${total} bài sai đầu đã sửa`,
      quizQuestionAccuracy: "Độ đúng câu hỏi",
      quizAttemptCount: (count: number) => `${count} lần nộp quiz`,
      quizNeedsReview: "Cần giảng lại",
      quizNeedsReviewHint: "Sai lần đầu và chưa sửa đạt",
      achieved: "Đạt",
      pending: "Đang chờ",
      notReady: "Chưa sẵn sàng",
    },
    km: {
      currentLearningDay: "ថ្ងៃសិក្សាបច្ចុប្បន្ន",
      todayCompletion: "បញ្ចប់ថ្ងៃនេះ",
      completed: "បានបញ្ចប់",
      totalCourses: (count: number) => `សរុប ${count} វគ្គ`,
      learningEvidence: "ភស្តុតាងសិក្សា",
      todaySubmissions: "ការដាក់ស្នើថ្ងៃនេះ",
      acceptedEvidence: "ភស្តុតាងបានទទួលយក",
      ruleAverage: "ពិន្ទុច្បាប់មធ្យម",
      outOf100: "ពេញ 100",
      effectiveLearningDays: "ថ្ងៃសិក្សាមានប្រសិទ្ធភាព",
      currentStreak: (days: number) => `បន្តបច្ចុប្បន្ន ${days} ថ្ងៃ`,
      noSkipping: "វគ្គសិក្សាមិនត្រូវបានរំលង",
      lagWarning: (days: number) =>
        `អ្នកយឺតពីកាលវិភាគ ${days} ថ្ងៃ។ បន្ទាប់ពីបញ្ចប់មេរៀនបច្ចុប្បន្ន ប្រព័ន្ធនឹងបើកមេរៀនបន្ទាប់នៅថ្ងៃសិក្សាបន្ទាប់។`,
      independentCourseProgress: "វឌ្ឍនភាពវគ្គនីមួយៗ",
      baselineVsCheckpointTitle: "ប្រៀបធៀប Day 0 / Day 21",
      stageAssessments: "Checkpoint ដំណាក់កាល",
      viewOrResubmit: "មើល / ដាក់ស្នើឡើងវិញ",
      assessmentPending: (label: string) => `${label} កំពុងរង់ចាំ`,
      selfCompleted: "បញ្ចប់ដោយខ្លួនឯង",
      selfCompletedHint: "បញ្ចប់ដោយមិនចាំការរំលឹក",
      promptedCompleted: "បញ្ចប់បន្ទាប់ពីរំលឹក",
      afterL1L2: "បន្ទាប់ពី L1 / L2",
      supervisedCompleted: "បញ្ចប់ក្រោមការតាមដានខ្លាំង",
      afterL3L4: "បន្ទាប់ពី L3 / L4",
      remindersDelivered: "ការរំលឹកបានផ្ញើ",
      deliveredHint: "បានផ្ញើទៅ Telegram",
      completedAfterReminder: "បញ្ចប់បន្ទាប់ពីរំលឹក",
      averageMinutes: (minutes: number | null) => `មធ្យម ${minutes ?? "—"} នាទី`,
      highIntensityCompleted: "បញ្ចប់កម្រិតខ្ពស់",
      l3L4Conversion: "បម្លែង L3 / L4",
      fwpr7: "FWPR-7",
      fwpr7Hint: "Prototype Day 7 បន្ទាប់ពី Day 0",
      day21Dod: "DoD Day 21",
      day21DodHint: "Demo និងកញ្ចប់ភស្តុតាង",
      goalEvidenceRate: "អត្រាភស្តុតាងគោលដៅ",
      goalEvidenceCount: (done: number, total: number) => `${done}/${total} checkpoint`,
      runtimeEvidence: "ភស្តុតាងដំណើរការ",
      runtimeEvidenceHint: "Prototype ដែលដំណើរការ",
      competencyTitle: "ភស្តុតាងសមត្ថភាព",
      competencySubtitle:
        "មានតែ node ដែលមាន accepted evidence ប៉ុណ្ណោះដែលកើនឡើង។ ការបើកទំព័រ ឬអានយូរ មិនរាប់ថាចេះទេ។",
      exportJson: "នាំចេញ JSON",
      exportMarkdown: "នាំចេញ Markdown",
      exporting: "កំពុងនាំចេញ…",
      createProofShare: "បង្កើតទំព័រចែករំលែក",
      creatingProofShare: "កំពុងបង្កើត…",
      proofShareCreatedAndCopied: "បានបង្កើតទំព័រភស្តុតាងសមត្ថភាព ហើយបានចម្លងតំណ",
      proofShareCreated: "បានបង្កើតទំព័រភស្តុតាងសមត្ថភាព",
      proofShareFailed: "បង្កើតទំព័រភស្តុតាងសមត្ថភាពបរាជ័យ",
      publicProofPage: "ទំព័រភស្តុតាងសាធារណៈ",
      evidenceCount: (count: number) => `${count} ភស្តុតាង`,
      quizFirstPassRate: "អត្រាជាប់លើកដំបូង",
      quizFirstPassCount: (done: number, total: number) => `${done}/${total} ជាប់លើកដំបូង`,
      quizRevisionPassRate: "អត្រាជាប់បន្ទាប់ពីកែ",
      quizRevisionPassCount: (done: number, total: number) => `${done}/${total} មេរៀនខុសដំបូងបានកែជាប់`,
      quizQuestionAccuracy: "អត្រាចម្លើយត្រឹមត្រូវ",
      quizAttemptCount: (count: number) => `ដាក់ស្នើ quiz ${count} ដង`,
      quizNeedsReview: "ត្រូវបង្រៀនឡើងវិញ",
      quizNeedsReviewHint: "ខុសលើកដំបូង ហើយមិនទាន់កែជាប់",
      achieved: "បានសម្រេច",
      pending: "កំពុងរង់ចាំ",
      notReady: "មិនទាន់រួច",
    },
    th: {
      currentLearningDay: "วันเรียนปัจจุบัน",
      todayCompletion: "เสร็จวันนี้",
      completed: "เสร็จแล้ว",
      totalCourses: (count: number) => `รวม ${count} คอร์ส`,
      learningEvidence: "หลักฐานการเรียน",
      todaySubmissions: "ส่งวันนี้",
      acceptedEvidence: "หลักฐานที่ผ่านแล้ว",
      ruleAverage: "คะแนนกฎเฉลี่ย",
      outOf100: "เต็ม 100",
      effectiveLearningDays: "วันเรียนที่มีผล",
      currentStreak: (days: number) => `ต่อเนื่อง ${days} วัน`,
      noSkipping: "คอร์สไม่ได้ข้าม",
      lagWarning: (days: number) =>
        `คุณช้ากว่าปฏิทิน ${days} วัน เมื่อทำบทปัจจุบันเสร็จ ระบบจะปลดล็อกบทถัดไปในวันเรียนถัดไป`,
      independentCourseProgress: "ความคืบหน้าแต่ละคอร์ส",
      baselineVsCheckpointTitle: "เปรียบเทียบ Day 0 / Day 21",
      stageAssessments: "Checkpoint",
      viewOrResubmit: "ดู / ส่งใหม่",
      assessmentPending: (label: string) => `${label} รอทำ`,
      selfCompleted: "ทำเอง",
      selfCompletedHint: "ทำเสร็จก่อนถูกเตือน",
      promptedCompleted: "เสร็จหลังเตือน",
      afterL1L2: "หลัง L1 / L2",
      supervisedCompleted: "เสร็จจากการกำกับเข้ม",
      afterL3L4: "หลัง L3 / L4",
      remindersDelivered: "ส่งเตือนแล้ว",
      deliveredHint: "ส่งถึง Telegram แล้ว",
      completedAfterReminder: "เสร็จหลังเตือน",
      averageMinutes: (minutes: number | null) => `เฉลี่ย ${minutes ?? "—"} นาที`,
      highIntensityCompleted: "เสร็จจากแรงเตือนสูง",
      l3L4Conversion: "Conversion L3 / L4",
      fwpr7: "FWPR-7",
      fwpr7Hint: "ต้นแบบ Day 7 หลัง Day 0",
      day21Dod: "DoD Day 21",
      day21DodHint: "Demo และชุดหลักฐาน",
      goalEvidenceRate: "อัตราหลักฐานเป้าหมาย",
      goalEvidenceCount: (done: number, total: number) => `${done}/${total} checkpoint`,
      runtimeEvidence: "หลักฐานรันได้",
      runtimeEvidenceHint: "ต้นแบบที่รันได้",
      competencyTitle: "หลักฐานความสามารถ",
      competencySubtitle:
        "เฉพาะ node ที่มี accepted evidence เท่านั้นจึงจะเพิ่มขึ้น การเปิดหน้าเว็บหรืออ่านนานไม่นับว่าทำได้จริง",
      exportJson: "ส่งออก JSON",
      exportMarkdown: "ส่งออก Markdown",
      exporting: "กำลังส่งออก…",
      createProofShare: "สร้างหน้าแชร์",
      creatingProofShare: "กำลังสร้าง…",
      proofShareCreatedAndCopied: "สร้างหน้าหลักฐานความสามารถแล้ว และคัดลอกลิงก์แล้ว",
      proofShareCreated: "สร้างหน้าหลักฐานความสามารถแล้ว",
      proofShareFailed: "สร้างหน้าหลักฐานความสามารถไม่สำเร็จ",
      publicProofPage: "หน้าหลักฐานสาธารณะ",
      evidenceCount: (count: number) => `${count} หลักฐาน`,
      quizFirstPassRate: "ผ่านครั้งแรก",
      quizFirstPassCount: (done: number, total: number) => `${done}/${total} ผ่านครั้งแรก`,
      quizRevisionPassRate: "ผ่านหลังแก้",
      quizRevisionPassCount: (done: number, total: number) => `${done}/${total} บทที่พลาดครั้งแรกแก้ผ่านแล้ว`,
      quizQuestionAccuracy: "ความถูกต้องคำถาม",
      quizAttemptCount: (count: number) => `ส่ง quiz ${count} ครั้ง`,
      quizNeedsReview: "ต้องสอนซ้ำ",
      quizNeedsReviewHint: "พลาดครั้งแรกและยังแก้ไม่ผ่าน",
      achieved: "สำเร็จ",
      pending: "รอดำเนินการ",
      notReady: "ยังไม่พร้อม",
    },
  }[locale];
}

export function todayRuntimeCopy(locale: AppLocale) {
  return {
    "zh-Hans": {
      evidenceLabel: "完成证据",
      progressLabel: (progress: number) => `今日学习进度 ${progress}%`,
      checkpointFirstTitle: "先处理阶段测试",
      reviewQueueTitle: "待复习内容",
      chooseCoursesTitle: "选择 1–3 门课程",
      chooseCoursesSubtitle: "每门每天 15–20 分钟",
      lessonPreparing: "课程内容正在准备，先别假装完成",
      evidenceQuote: "“完成不是点一下按钮，而是留下一个以后还能检查的结果。”",
      missionAssessmentTitle: "先处理阶段检查",
      missionAssessmentDetail: "先完成当前阶段测评。",
      missionAssessmentEvidence: "完成一份阶段测评并留下可回看结果。",
      missionReviewTitle: "先清理复习队列",
      missionReviewDetail: "先补掉上一轮没吃透的知识点。",
      missionReviewEvidence: "完成 1 条复习项并修正一次旧错误。",
      missionLessonTitle: (title: string) => `先完成 ${title}`,
      missionLessonDetail: "今天先交付一份最小可验证输出。",
      missionLessonEvidence: "留下今天的提交记录，并通过本课检查。",
      missionDoneTitle: "今天主线已完成",
      missionDoneDetail:
        "如果你还想继续，可以进入预习区，但它不会替代明天主线。",
      missionDoneEvidence: "额外学习会被记录为证据，但不会覆盖今日完成记录。",
    },
    vi: {
      evidenceLabel: "Bằng chứng hoàn thành",
      progressLabel: (progress: number) => `Tiến độ học hôm nay ${progress}%`,
      checkpointFirstTitle: "Làm checkpoint trước",
      reviewQueueTitle: "Nội dung cần ôn",
      chooseCoursesTitle: "Chọn 1–3 khóa",
      chooseCoursesSubtitle: "Mỗi khóa 15–20 phút/ngày",
      lessonPreparing: "Nội dung bài đang chuẩn bị, đừng giả vờ đã xong nhé",
      evidenceQuote:
        "“Hoàn thành không phải là bấm nút, mà là để lại kết quả có thể kiểm tra lại.”",
      missionAssessmentTitle: "Làm checkpoint trước",
      missionAssessmentDetail: "Hoàn thành đánh giá giai đoạn hiện tại trước.",
      missionAssessmentEvidence: "Nộp một đánh giá giai đoạn có thể xem lại.",
      missionReviewTitle: "Dọn hàng đợi ôn tập",
      missionReviewDetail: "Bù phần kiến thức vòng trước chưa chắc.",
      missionReviewEvidence: "Hoàn thành 1 mục ôn tập và sửa một lỗi cũ.",
      missionLessonTitle: (title: string) => `Hoàn thành ${title} trước`,
      missionLessonDetail: "Hôm nay cần có một đầu ra nhỏ nhưng kiểm chứng được.",
      missionLessonEvidence: "Lưu bài nộp hôm nay và vượt qua kiểm tra bài học.",
      missionDoneTitle: "Nhiệm vụ chính hôm nay đã xong",
      missionDoneDetail:
        "Bạn có thể học trước, nhưng phần đó không thay thế nhiệm vụ chính ngày mai.",
      missionDoneEvidence:
        "Học thêm sẽ được lưu làm bằng chứng phụ, không ghi đè kết quả hôm nay.",
    },
    km: {
      evidenceLabel: "ភស្តុតាងបញ្ចប់",
      progressLabel: (progress: number) => `វឌ្ឍនភាពសិក្សាថ្ងៃនេះ ${progress}%`,
      checkpointFirstTitle: "ធ្វើ checkpoint មុន",
      reviewQueueTitle: "មាតិកាត្រូវរំលឹកឡើងវិញ",
      chooseCoursesTitle: "ជ្រើស 1–3 វគ្គ",
      chooseCoursesSubtitle: "វគ្គនីមួយៗ 15–20 នាទី/ថ្ងៃ",
      lessonPreparing: "មាតិកាមេរៀនកំពុងរៀបចំ កុំធ្វើដូចជាបានបញ្ចប់អី",
      evidenceQuote:
        "“ការបញ្ចប់មិនមែនគ្រាន់តែចុចប៊ូតុងទេ ប៉ុន្តែជាលទ្ធផលដែលអាចពិនិត្យឡើងវិញបាន។”",
      missionAssessmentTitle: "ធ្វើ checkpoint មុន",
      missionAssessmentDetail: "សូមបញ្ចប់ការវាយតម្លៃដំណាក់កាលបច្ចុប្បន្នជាមុន។",
      missionAssessmentEvidence: "ដាក់ស្នើការវាយតម្លៃមួយដែលអាចមើលឡើងវិញបាន។",
      missionReviewTitle: "សម្អាតបញ្ជីរំលឹកឡើងវិញ",
      missionReviewDetail: "បំពេញចំណេះដឹងដែលមិនទាន់ច្បាស់ពីជុំមុន។",
      missionReviewEvidence: "បញ្ចប់ធាតុរំលឹក 1 និងកែខុសចាស់មួយ។",
      missionLessonTitle: (title: string) => `បញ្ចប់ ${title} ជាមុន`,
      missionLessonDetail: "ថ្ងៃនេះត្រូវមានលទ្ធផលតូចមួយដែលអាចផ្ទៀងផ្ទាត់បាន។",
      missionLessonEvidence: "រក្សាទុកការដាក់ស្នើថ្ងៃនេះ ហើយឆ្លងកាត់ការត្រួតពិនិត្យ។",
      missionDoneTitle: "ភារកិច្ចសំខាន់ថ្ងៃនេះបានបញ្ចប់",
      missionDoneDetail:
        "អ្នកអាចរៀនមុនបាន ប៉ុន្តែមិនជំនួសភារកិច្ចសំខាន់ថ្ងៃស្អែកទេ។",
      missionDoneEvidence:
        "ការរៀនបន្ថែមនឹងរក្សាទុកជាភស្តុតាងបន្ថែម មិនជំនួសកំណត់ត្រាថ្ងៃនេះទេ។",
    },
    th: {
      evidenceLabel: "หลักฐานการทำเสร็จ",
      progressLabel: (progress: number) => `ความคืบหน้าการเรียนวันนี้ ${progress}%`,
      checkpointFirstTitle: "ทำ checkpoint ก่อน",
      reviewQueueTitle: "เนื้อหาที่ต้องทบทวน",
      chooseCoursesTitle: "เลือก 1–3 คอร์ส",
      chooseCoursesSubtitle: "คอร์สละ 15–20 นาที/วัน",
      lessonPreparing: "เนื้อหาบทเรียนกำลังเตรียมอยู่ อย่าเพิ่งแกล้งว่าทำเสร็จ",
      evidenceQuote:
        "“การทำเสร็จไม่ใช่แค่กดปุ่ม แต่คือต้องเหลือผลงานที่ตรวจย้อนกลับได้.”",
      missionAssessmentTitle: "ทำ checkpoint ก่อน",
      missionAssessmentDetail: "ทำแบบประเมินช่วงปัจจุบันให้เสร็จก่อน",
      missionAssessmentEvidence: "ส่งแบบประเมินหนึ่งชุดที่ย้อนกลับมาดูได้",
      missionReviewTitle: "เคลียร์คิวทบทวน",
      missionReviewDetail: "เติมส่วนที่รอบก่อนยังไม่แม่น",
      missionReviewEvidence: "ทำรายการทบทวน 1 รายการและแก้ข้อผิดพลาดเก่า 1 จุด",
      missionLessonTitle: (title: string) => `ทำ ${title} ก่อน`,
      missionLessonDetail: "วันนี้ต้องมีผลงานเล็กๆ ที่ตรวจสอบได้",
      missionLessonEvidence: "บันทึกการส่งงานวันนี้และผ่านการตรวจบทเรียน",
      missionDoneTitle: "ภารกิจหลักวันนี้เสร็จแล้ว",
      missionDoneDetail:
        "คุณเรียนล่วงหน้าได้ แต่จะไม่แทนภารกิจหลักของวันพรุ่งนี้",
      missionDoneEvidence:
        "การเรียนเพิ่มจะถูกบันทึกเป็นหลักฐานเสริม แต่ไม่ทับผลของวันนี้",
    },
  }[locale];
}

export function lessonRuntimeCopy(locale: AppLocale) {
  return {
    "zh-Hans": {
      backToday: "‹ 返回今日",
      todayObjective: "今天的目标",
      flowTitle: "学习顺序",
      flowLearn: "知识",
      flowExample: "示例",
      flowCheck: "选择题",
      flowEvidence: "证据",
      learnFirstTitle: "先学，再做",
      startPractice: "我已看完，开始练习 →",
      lessonCheckTitle: "完成本课检查",
      evidenceStepTitle: "Evidence 保存规则",
      evidenceStepBody:
        "先完成本课 3–5 道选择题。通过后，系统会把本次结果记为学习证据；未通过则进入修正状态。",
      mustLeaveOutput: "必须留下输出",
      practiceLocked: "先完成上方的学习卡。看完句型和示例后，再开始写你的答案。",
      historyReadOnly:
        "这是一节历史课程，现在可以回看和复习，但不再接受提交。如果要继续留下新证据，请回到当前启用的课程。",
      answerPlaceholder: "写下你的原始答案。系统会保留它，不让 AI 替你假装学会。",
      choiceProgress: (done: number, total: number) => `已完成 ${done}/${total} 题`,
      wordCount: (count: number) => `${count} 字`,
      checking: "正在检查…",
      resubmit: "修正后重新提交",
      submitEvidence: "提交学习证据",
      ruleScore: "规则评分",
      aiCoach: "AI 教练点评",
      aiFallback: "AI 教练暂时没有回应。规则评分已保存，不影响今天的学习。",
      submitFailed: "提交失败",
      extraEvidenceSaved: "预习证据已保存；明天仍要完成主线",
      lessonEvidenceSaved: "这节课有证据了",
      revisionSaved: "已保存，按反馈修正后再提交",
    },
    vi: {
      backToday: "‹ Về hôm nay",
      todayObjective: "Mục tiêu hôm nay",
      flowTitle: "Thứ tự học",
      flowLearn: "Kiến thức",
      flowExample: "Ví dụ",
      flowCheck: "Quiz",
      flowEvidence: "Bằng chứng",
      learnFirstTitle: "Học trước, làm sau",
      startPractice: "Tôi đã đọc xong, bắt đầu luyện →",
      lessonCheckTitle: "Hoàn thành kiểm tra bài",
      evidenceStepTitle: "Quy tắc lưu Evidence",
      evidenceStepBody:
        "Làm 3–5 câu trắc nghiệm trước. Khi đạt, hệ thống lưu kết quả này làm bằng chứng học; nếu chưa đạt, bài sẽ ở trạng thái cần sửa.",
      mustLeaveOutput: "Cần để lại đầu ra",
      practiceLocked: "Hãy hoàn thành thẻ học phía trên trước, rồi mới trả lời.",
      historyReadOnly:
        "Đây là bài cũ để xem lại và ôn tập; không nhận nộp mới. Muốn lưu bằng chứng mới, hãy quay về khóa đang học.",
      answerPlaceholder:
        "Viết câu trả lời gốc của bạn. Hệ thống sẽ lưu lại, không để AI giả vờ học thay bạn.",
      choiceProgress: (done: number, total: number) => `Đã làm ${done}/${total} câu`,
      wordCount: (count: number) => `${count} ký tự`,
      checking: "Đang kiểm tra…",
      resubmit: "Sửa rồi nộp lại",
      submitEvidence: "Nộp bằng chứng học",
      ruleScore: "Điểm theo luật",
      aiCoach: "Nhận xét AI Coach",
      aiFallback: "AI Coach chưa phản hồi. Điểm theo luật đã lưu, không ảnh hưởng hôm nay.",
      submitFailed: "Nộp thất bại",
      extraEvidenceSaved: "Đã lưu bằng chứng học trước; ngày mai vẫn cần làm nhiệm vụ chính",
      lessonEvidenceSaved: "Bài này đã có bằng chứng",
      revisionSaved: "Đã lưu, hãy sửa theo phản hồi rồi nộp lại",
    },
    km: {
      backToday: "‹ ត្រឡប់ទៅថ្ងៃនេះ",
      todayObjective: "គោលដៅថ្ងៃនេះ",
      flowTitle: "លំដាប់សិក្សា",
      flowLearn: "ចំណេះដឹង",
      flowExample: "ឧទាហរណ៍",
      flowCheck: "Quiz",
      flowEvidence: "ភស្តុតាង",
      learnFirstTitle: "រៀនមុន បន្ទាប់មកអនុវត្ត",
      startPractice: "ខ្ញុំបានអានរួច ចាប់ផ្តើមហាត់ →",
      lessonCheckTitle: "បញ្ចប់ការត្រួតពិនិត្យមេរៀន",
      evidenceStepTitle: "ច្បាប់រក្សាទុក Evidence",
      evidenceStepBody:
        "ធ្វើសំណួរ 3–5 ជាមុន។ បើឆ្លងកាត់ ប្រព័ន្ធនឹងរក្សាទុកលទ្ធផលនេះជាភស្តុតាងសិក្សា; បើមិនទាន់ឆ្លងកាត់ នឹងចូលស្ថានភាពត្រូវកែ។",
      mustLeaveOutput: "ត្រូវមានលទ្ធផល",
      practiceLocked: "សូមបញ្ចប់កាតសិក្សាខាងលើជាមុន បន្ទាប់មកចាប់ផ្តើមឆ្លើយ។",
      historyReadOnly:
        "នេះជាមេរៀនចាស់សម្រាប់មើលឡើងវិញ និងរំលឹក។ មិនទទួលការដាក់ស្នើថ្មីទេ។ ប្រសិនបើចង់ទុកភស្តុតាងថ្មី សូមត្រឡប់ទៅវគ្គបច្ចុប្បន្ន។",
      answerPlaceholder:
        "សរសេរចម្លើយដើមរបស់អ្នក។ ប្រព័ន្ធនឹងរក្សាទុកវា មិនឱ្យ AI ធ្វើជំនួសអ្នកទេ។",
      choiceProgress: (done: number, total: number) => `បានធ្វើ ${done}/${total} សំណួរ`,
      wordCount: (count: number) => `${count} តួអក្សរ`,
      checking: "កំពុងពិនិត្យ…",
      resubmit: "កែហើយដាក់ស្នើម្តងទៀត",
      submitEvidence: "ដាក់ស្នើភស្តុតាងសិក្សា",
      ruleScore: "ពិន្ទុតាមច្បាប់",
      aiCoach: "មតិយោបល់ពី AI Coach",
      aiFallback: "AI Coach មិនទាន់ឆ្លើយតប។ ពិន្ទុតាមច្បាប់ត្រូវបានរក្សាទុក ហើយមិនប៉ះពាល់ថ្ងៃនេះទេ។",
      submitFailed: "ដាក់ស្នើបរាជ័យ",
      extraEvidenceSaved: "បានរក្សាទុកភស្តុតាងរៀនមុន។ ថ្ងៃស្អែកនៅតែត្រូវធ្វើភារកិច្ចសំខាន់",
      lessonEvidenceSaved: "មេរៀននេះមានភស្តុតាងហើយ",
      revisionSaved: "បានរក្សាទុក សូមកែតាមមតិយោបល់ ហើយដាក់ស្នើម្តងទៀត",
    },
    th: {
      backToday: "‹ กลับวันนี้",
      todayObjective: "เป้าหมายวันนี้",
      flowTitle: "ลำดับการเรียน",
      flowLearn: "ความรู้",
      flowExample: "ตัวอย่าง",
      flowCheck: "Quiz",
      flowEvidence: "หลักฐาน",
      learnFirstTitle: "เรียนก่อน แล้วค่อยทำ",
      startPractice: "อ่านจบแล้ว เริ่มฝึก →",
      lessonCheckTitle: "ทำแบบตรวจบทเรียน",
      evidenceStepTitle: "กติกาการบันทึก Evidence",
      evidenceStepBody:
        "ทำคำถามแบบเลือกตอบ 3–5 ข้อก่อน เมื่อผ่าน ระบบจะบันทึกผลนี้เป็นหลักฐานการเรียน; ถ้ายังไม่ผ่าน จะอยู่ในสถานะต้องแก้ไข",
      mustLeaveOutput: "ต้องมีผลงาน",
      practiceLocked: "ทำการ์ดเรียนด้านบนให้จบก่อน แล้วค่อยเริ่มตอบ",
      historyReadOnly:
        "นี่คือบทเรียนเก่าสำหรับทบทวน ไม่รับการส่งใหม่ หากต้องการเก็บหลักฐานใหม่ ให้กลับไปคอร์สที่กำลังเรียน",
      answerPlaceholder:
        "เขียนคำตอบต้นฉบับของคุณ ระบบจะเก็บไว้ ไม่ให้ AI แกล้งเรียนแทนคุณ",
      choiceProgress: (done: number, total: number) => `ทำแล้ว ${done}/${total} ข้อ`,
      wordCount: (count: number) => `${count} ตัวอักษร`,
      checking: "กำลังตรวจ…",
      resubmit: "แก้แล้วส่งใหม่",
      submitEvidence: "ส่งหลักฐานการเรียน",
      ruleScore: "คะแนนตามกฎ",
      aiCoach: "คำแนะนำจาก AI Coach",
      aiFallback: "AI Coach ยังไม่ตอบ คะแนนตามกฎถูกบันทึกแล้ว ไม่กระทบการเรียนวันนี้",
      submitFailed: "ส่งไม่สำเร็จ",
      extraEvidenceSaved: "บันทึกหลักฐานเรียนล่วงหน้าแล้ว พรุ่งนี้ยังต้องทำภารกิจหลัก",
      lessonEvidenceSaved: "บทนี้มีหลักฐานแล้ว",
      revisionSaved: "บันทึกแล้ว แก้ตาม feedback แล้วส่งใหม่",
    },
  }[locale];
}



export function assessmentRuntimeCopy(locale: AppLocale) {
  return {
    "zh-Hans": {
      backProgress: "‹ 返回进度",
      whyNow: "为什么现在做",
      whyNowBody: (label: string) =>
        `这是 ${label}。它会记录你在当前阶段是否真的掌握了关键能力，用来和后续阶段做对比。`,
      stageTask: "阶段任务",
      rubricTitle: "本次会看什么",
      answerPlaceholder:
        "写下你当前阶段的真实答案。系统会保留原始版本，用于后续对比。",
      wordCount: (count: number) => `${count} 字`,
      recording: "正在记录…",
      resubmit: "修正后重新提交",
      submitAssessment: "提交阶段测试",
      currentScore: "当前阶段分数",
      recordedFallback: "已记录。",
      submitFailed: "提交失败",
      recorded: (label: string) => `${label} 已记录`,
      savedForRevision: (label: string) => `${label} 已保存，可继续修正`,
    },
    vi: {
      backProgress: "‹ Về tiến độ",
      whyNow: "Vì sao làm lúc này",
      whyNowBody: (label: string) =>
        `Đây là ${label}. Nó ghi lại năng lực hiện tại để so sánh với giai đoạn sau.`,
      stageTask: "Nhiệm vụ giai đoạn",
      rubricTitle: "Lần này sẽ kiểm tra gì",
      answerPlaceholder:
        "Viết câu trả lời thật ở giai đoạn hiện tại. Hệ thống sẽ lưu bản gốc để so sánh sau.",
      wordCount: (count: number) => `${count} ký tự`,
      recording: "Đang ghi nhận…",
      resubmit: "Sửa rồi nộp lại",
      submitAssessment: "Nộp checkpoint",
      currentScore: "Điểm giai đoạn hiện tại",
      recordedFallback: "Đã ghi nhận.",
      submitFailed: "Nộp thất bại",
      recorded: (label: string) => `${label} đã ghi nhận`,
      savedForRevision: (label: string) => `${label} đã lưu, có thể sửa tiếp`,
    },
    km: {
      backProgress: "‹ ត្រឡប់ទៅវឌ្ឍនភាព",
      whyNow: "ហេតុអ្វីធ្វើពេលនេះ",
      whyNowBody: (label: string) =>
        `នេះគឺ ${label}។ វាកត់ត្រាសមត្ថភាពបច្ចុប្បន្ន ដើម្បីប្រៀបធៀបជាមួយដំណាក់កាលបន្ទាប់។`,
      stageTask: "ភារកិច្ចដំណាក់កាល",
      rubricTitle: "លើកនេះនឹងពិនិត្យអ្វី",
      answerPlaceholder:
        "សរសេរចម្លើយពិតរបស់អ្នកនៅដំណាក់កាលនេះ។ ប្រព័ន្ធនឹងរក្សាទុកច្បាប់ដើមសម្រាប់ប្រៀបធៀបពេលក្រោយ។",
      wordCount: (count: number) => `${count} តួអក្សរ`,
      recording: "កំពុងកត់ត្រា…",
      resubmit: "កែហើយដាក់ស្នើម្តងទៀត",
      submitAssessment: "ដាក់ស្នើ checkpoint",
      currentScore: "ពិន្ទុដំណាក់កាលបច្ចុប្បន្ន",
      recordedFallback: "បានកត់ត្រា។",
      submitFailed: "ដាក់ស្នើបរាជ័យ",
      recorded: (label: string) => `${label} បានកត់ត្រា`,
      savedForRevision: (label: string) => `${label} បានរក្សាទុក អាចកែបន្ថែមបាន`,
    },
    th: {
      backProgress: "‹ กลับความคืบหน้า",
      whyNow: "ทำไมต้องทำตอนนี้",
      whyNowBody: (label: string) =>
        `นี่คือ ${label} ระบบจะบันทึกว่าตอนนี้คุณมีทักษะสำคัญจริงหรือไม่ เพื่อเทียบกับช่วงถัดไป`,
      stageTask: "ภารกิจช่วงนี้",
      rubricTitle: "ครั้งนี้จะดูอะไร",
      answerPlaceholder:
        "เขียนคำตอบจริงของคุณในช่วงนี้ ระบบจะเก็บต้นฉบับไว้เทียบภายหลัง",
      wordCount: (count: number) => `${count} ตัวอักษร`,
      recording: "กำลังบันทึก…",
      resubmit: "แก้แล้วส่งใหม่",
      submitAssessment: "ส่ง checkpoint",
      currentScore: "คะแนนช่วงปัจจุบัน",
      recordedFallback: "บันทึกแล้ว",
      submitFailed: "ส่งไม่สำเร็จ",
      recorded: (label: string) => `บันทึก ${label} แล้ว`,
      savedForRevision: (label: string) => `บันทึก ${label} แล้ว ยังแก้ต่อได้`,
    },
  }[locale];
}



export function reviewRuntimeCopy(locale: AppLocale) {
  return {
    "zh-Hans": {
      backToday: "‹ 返回今日",
      weeklyReview: "7 天复习",
      recoveryMission: "补救任务",
      whyReturned: "为什么会回到这里",
      nextAction: "推荐下一步",
      assessmentAction: "先根据阶段测试提示补齐关键维度，再重新提交 checkpoint。",
      lessonAction: "先回看这节内容，再补一轮输出或确认你仍然记得关键点。",
      resolveTitle: "处理这条复习项",
      openAssessment: "去做对应阶段测试",
      openLesson: "打开对应课程",
      openHistoricalLesson: "打开历史课程",
      resolveHint: "完成复习后可手动关闭这条提醒",
      closing: "正在关闭…",
      markDone: "标记本次复习已完成",
      resolveFailed: "处理失败",
      resolvedToast: "这条复习项已处理",
    },
    vi: {
      backToday: "‹ Về hôm nay",
      weeklyReview: "Ôn 7 ngày",
      recoveryMission: "Nhiệm vụ phục hồi",
      whyReturned: "Vì sao quay lại đây",
      nextAction: "Bước tiếp theo",
      assessmentAction:
        "Bổ sung các điểm thiếu theo checkpoint rồi nộp lại.",
      lessonAction:
        "Xem lại bài này, rồi làm thêm một đầu ra hoặc xác nhận bạn vẫn nhớ điểm chính.",
      resolveTitle: "Xử lý mục ôn tập này",
      openAssessment: "Làm checkpoint liên quan",
      openLesson: "Mở bài liên quan",
      openHistoricalLesson: "Mở bài cũ",
      resolveHint: "Sau khi ôn xong, bạn có thể đóng nhắc này thủ công",
      closing: "Đang đóng…",
      markDone: "Đánh dấu đã ôn xong",
      resolveFailed: "Xử lý thất bại",
      resolvedToast: "Đã xử lý mục ôn tập này",
    },
    km: {
      backToday: "‹ ត្រឡប់ទៅថ្ងៃនេះ",
      weeklyReview: "រំលឹក 7 ថ្ងៃ",
      recoveryMission: "ភារកិច្ចស្ដារ",
      whyReturned: "ហេតុអ្វីត្រឡប់មកទីនេះ",
      nextAction: "ជំហានបន្ទាប់",
      assessmentAction:
        "បំពេញចំណុចខ្វះតាម checkpoint ហើយដាក់ស្នើម្តងទៀត។",
      lessonAction:
        "មើលមេរៀននេះឡើងវិញ រួចបន្ថែមលទ្ធផលមួយ ឬបញ្ជាក់ថាអ្នកនៅចាំចំណុចសំខាន់។",
      resolveTitle: "ដោះស្រាយធាតុរំលឹកនេះ",
      openAssessment: "ធ្វើ checkpoint ដែលពាក់ព័ន្ធ",
      openLesson: "បើកមេរៀនដែលពាក់ព័ន្ធ",
      openHistoricalLesson: "បើកមេរៀនចាស់",
      resolveHint: "បន្ទាប់ពីរំលឹករួច អ្នកអាចបិទការរំលឹកនេះដោយដៃ",
      closing: "កំពុងបិទ…",
      markDone: "សម្គាល់ថាបានរំលឹករួច",
      resolveFailed: "ដោះស្រាយបរាជ័យ",
      resolvedToast: "ធាតុរំលឹកនេះបានដោះស្រាយ",
    },
    th: {
      backToday: "‹ กลับวันนี้",
      weeklyReview: "ทบทวน 7 วัน",
      recoveryMission: "ภารกิจแก้จุดอ่อน",
      whyReturned: "ทำไมกลับมาที่นี่",
      nextAction: "ขั้นตอนถัดไป",
      assessmentAction: "เติมมิติที่ขาดตาม checkpoint แล้วส่งใหม่",
      lessonAction: "ย้อนดูบทนี้ แล้วทำผลงานเพิ่มหรือยืนยันว่าคุณยังจำจุดสำคัญได้",
      resolveTitle: "จัดการรายการทบทวนนี้",
      openAssessment: "ไปทำ checkpoint ที่เกี่ยวข้อง",
      openLesson: "เปิดบทเรียนที่เกี่ยวข้อง",
      openHistoricalLesson: "เปิดบทเรียนเก่า",
      resolveHint: "ทบทวนเสร็จแล้ว ปิดรายการนี้เองได้",
      closing: "กำลังปิด…",
      markDone: "ทำเครื่องหมายว่าทบทวนเสร็จแล้ว",
      resolveFailed: "จัดการไม่สำเร็จ",
      resolvedToast: "จัดการรายการทบทวนนี้แล้ว",
    },
  }[locale];
}



export function profileRuntimeCopy(locale: AppLocale) {
  return {
    "zh-Hans": {
      localFounderMode: "Founder 本地模式",
      notProvided: "未提供",
      telegramUsernameMissing: "未设置 Telegram 用户名",
      telegramProfileLabel: "Telegram 个人信息",
      courseCount: (count: number) => `${count} / 3 门`,
      reminderPreferences: "提醒偏好",
      remindersTitle: "学习提醒",
      remindersDescription:
        "关闭后不再催促；L1 会在你设定的学习时间后触发，免打扰时段内不会发送。",
      reminderStatus: "提醒状态",
      on: "开启",
      off: "暂停",
      learningHour: "学习时间",
      dndStart: "免打扰开始",
      dndEnd: "免打扰结束",
      notSet: "不设置",
      saveSettings: "保存设置",
      days: (count: number) => `${count} 天`,
      locked: "已锁定",
      accessActiveUntil: (date: string) => `当前使用权限至 ${date}。`,
      accessLockedDescription:
        "历史课程、笔记和证据仍可查看；新课程和提交已停止。",
      expiredTitle: "试用已结束",
      expiredDescription: (price: string, needed: number) =>
        `历史记录仍可查看。继续提交课程需要从 ${price}/月续费；有效邀请产生的积分可抵扣下一单，当前还差 ${needed} 个有效邀请达到首轮目标。`,
      viewPlans: "查看方案",
      continuationPrimary: "继续学习",
      continuationRulesLabel: "续用规则",
      continuationCredits: "可抵扣积分",
      continuationReferral: "有效邀请",
      monthlyPrice: (price: string) => `${price}/月`,
      starsAmount: (stars: number) => ` · ⭐ ${stars}`,
      maxRedeem: (percent: number) => `最多抵扣 ${percent}%`,
      needMore: (count: number) => `还差 ${count} 个`,
      referralTargetDone: "已达首轮目标",
      recurringSuffix: " · 自动续费",
      starsPending: "Stars 待定",
      targetPrice: (price: string) => `${price} 目标价`,
      pricingGridLabel: "订阅价格",
      creditsToggleLabel: "积分抵扣开关",
      creatingInvoiceSuffix: " · 正在创建发票",
      paymentEnabledNote:
        "数字课程通过 Telegram Stars 结算。付款成功回调后才会增加权限。",
      paymentDisabledNote:
        "Telegram Stars 接口已接好；填写 Bot Token、Webhook Secret 和四档 Stars 数量后启用。",
      shareText:
        "我在 Academy 做 60 天能力训练。不是收藏课程，是每天必须留下学习证据。",
      shareCopied: "邀请链接已复制",
      shareFailed: "分享没有成功，请复制邀请码",
      inviteCodeCopied: "邀请码已复制",
      inviteCodeFallback: (code: string) => `邀请码：${code}`,
      invitedUnit: "位",
      referralProgressLabel: (progress: number) => `有效邀请进度 ${progress}%`,
      entered: "已进入",
      learning: "学习中",
      review: "待审核",
      qualified: "已有效",
      rejected: "已驳回",
      myInviteCode: "我的邀请码",
      copy: "复制",
      shareMiniApp: "分享 Academy Mini App",
      rewardGranted: (date: string) => `奖励已发放 · ${date}`,
      qualifiedAt: (date: string) => `已达标 · ${date}`,
      joinedAt: (date: string) => `加入时间 · ${date}`,
      riskSignals: (signals: string) => `风险信号：${signals}`,
      },
    vi: {
      localFounderMode: "Chế độ founder cục bộ",
      notProvided: "Chưa cung cấp",
      telegramUsernameMissing: "Chưa đặt username Telegram",
      telegramProfileLabel: "Thông tin Telegram",
      courseCount: (count: number) => `${count} / 3 khóa`,
      reminderPreferences: "Tùy chọn nhắc học",
      remindersTitle: "Nhắc học",
      remindersDescription:
        "Tắt là không nhắc. L1 sẽ gửi sau giờ bạn đặt; khung yên tĩnh sẽ không gửi.",
      reminderStatus: "Trạng thái",
      on: "Bật",
      off: "Tạm dừng",
      learningHour: "Giờ học",
      dndStart: "Yên tĩnh từ",
      dndEnd: "Yên tĩnh đến",
      notSet: "Không đặt",
      saveSettings: "Lưu cài đặt",
      days: (count: number) => `${count} ngày`,
      locked: "Đã khóa",
      accessActiveUntil: (date: string) => `Quyền sử dụng còn đến ${date}.`,
      accessLockedDescription:
        "Vẫn xem được bài cũ, ghi chú và bằng chứng; bài mới và nộp bài đã dừng.",
      expiredTitle: "Dùng thử đã kết thúc",
      expiredDescription: (price: string, needed: number) =>
        `Bạn vẫn xem được lịch sử. Để tiếp tục nộp bài, cần gia hạn từ ${price}/tháng; tín dụng từ lời mời hợp lệ có thể trừ đơn sau. Hiện còn thiếu ${needed} lời mời hợp lệ để đạt mục tiêu đầu.`,
      viewPlans: "Xem gói",
      continuationPrimary: "Tiếp tục học",
      continuationRulesLabel: "Quy tắc tiếp tục",
      continuationCredits: "Điểm có thể trừ",
      continuationReferral: "Lời mời hợp lệ",
      monthlyPrice: (price: string) => `${price}/tháng`,
      starsAmount: (stars: number) => ` · ⭐ ${stars}`,
      maxRedeem: (percent: number) => `trừ tối đa ${percent}%`,
      needMore: (count: number) => `cần thêm ${count}`,
      referralTargetDone: "đạt mục tiêu đầu",
      recurringSuffix: " · tự gia hạn",
      starsPending: "Chưa đặt Stars",
      targetPrice: (price: string) => `Giá mục tiêu ${price}`,
      pricingGridLabel: "Giá gói đăng ký",
      creditsToggleLabel: "Công tắc trừ điểm",
      creatingInvoiceSuffix: " · đang tạo hóa đơn",
      paymentEnabledNote:
        "Khóa số thanh toán bằng Telegram Stars. Quyền sẽ tăng sau callback thanh toán thành công.",
      paymentDisabledNote:
        "Telegram Stars đã nối API; cần Bot Token, Webhook Secret và số Stars cho bốn gói.",
      shareText:
        "Tôi đang luyện năng lực 60 ngày trên Academy. Không phải lưu khóa học, mà là mỗi ngày phải để lại bằng chứng học.",
      shareCopied: "Đã sao chép link mời",
      shareFailed: "Chia sẻ chưa thành công, hãy sao chép mã mời",
      inviteCodeCopied: "Đã sao chép mã mời",
      inviteCodeFallback: (code: string) => `Mã mời: ${code}`,
      invitedUnit: "người",
      referralProgressLabel: (progress: number) => `Tiến độ lời mời hợp lệ ${progress}%`,
      entered: "Đã vào",
      learning: "Đang học",
      review: "Chờ duyệt",
      qualified: "Hợp lệ",
      rejected: "Bị từ chối",
      myInviteCode: "Mã mời của tôi",
      copy: "Sao chép",
      shareMiniApp: "Chia sẻ Academy Mini App",
      rewardGranted: (date: string) => `Đã phát thưởng · ${date}`,
      qualifiedAt: (date: string) => `Đã đạt · ${date}`,
      joinedAt: (date: string) => `Tham gia · ${date}`,
      riskSignals: (signals: string) => `Tín hiệu rủi ro: ${signals}`,
    },
    km: {
      localFounderMode: "របៀប Founder មូលដ្ឋាន",
      notProvided: "មិនបានផ្តល់",
      telegramUsernameMissing: "មិនទាន់កំណត់ username Telegram",
      telegramProfileLabel: "ព័ត៌មាន Telegram",
      courseCount: (count: number) => `${count} / 3 វគ្គ`,
      reminderPreferences: "ចំណូលចិត្តការរំលឹក",
      remindersTitle: "ការរំលឹកសិក្សា",
      remindersDescription:
        "បិទហើយគឺមិនផ្ញើ។ L1 នឹងផ្ញើបន្ទាប់ពីម៉ោងដែលអ្នកកំណត់ ហើយម៉ោងស្ងប់នឹងមិនរំខាន។",
      reminderStatus: "ស្ថានភាព",
      on: "បើក",
      off: "ផ្អាក",
      learningHour: "ម៉ោងសិក្សា",
      dndStart: "ស្ងប់ចាប់ពី",
      dndEnd: "ស្ងប់រហូតដល់",
      notSet: "មិនកំណត់",
      saveSettings: "រក្សាទុក",
      days: (count: number) => `${count} ថ្ងៃ`,
      locked: "បានចាក់សោ",
      accessActiveUntil: (date: string) => `សិទ្ធិប្រើប្រាស់ដល់ ${date}។`,
      accessLockedDescription:
        "នៅតែមើលវគ្គចាស់ កំណត់ត្រា និងភស្តុតាងបាន ប៉ុន្តែមិនអាចបន្តវគ្គថ្មី ឬដាក់ស្នើបានទេ។",
      expiredTitle: "ការសាកល្បងបានបញ្ចប់",
      expiredDescription: (price: string, needed: number) =>
        `នៅតែមើលប្រវត្តិបាន។ ដើម្បីបន្តដាក់ស្នើ ត្រូវបន្តពី ${price}/ខែ។ ពិន្ទុពីការអញ្ជើញមានសុពលភាពអាចបញ្ចុះលើការបង់បន្ទាប់។ នៅខ្វះ ${needed} ការអញ្ជើញមានសុពលភាព ដើម្បីសម្រេចគោលដៅដំបូង។`,
      viewPlans: "មើលគម្រោង",
      continuationPrimary: "បន្តសិក្សា",
      continuationRulesLabel: "ច្បាប់បន្តប្រើ",
      continuationCredits: "ពិន្ទុបញ្ចុះតម្លៃ",
      continuationReferral: "ការអញ្ជើញមានសុពលភាព",
      monthlyPrice: (price: string) => `${price}/ខែ`,
      starsAmount: (stars: number) => ` · ⭐ ${stars}`,
      maxRedeem: (percent: number) => `បញ្ចុះអតិបរមា ${percent}%`,
      needMore: (count: number) => `ខ្វះ ${count} នាក់`,
      referralTargetDone: "សម្រេចគោលដៅដំបូង",
      recurringSuffix: " · បន្តស្វ័យប្រវត្តិ",
      starsPending: "Stars មិនទាន់កំណត់",
      targetPrice: (price: string) => `តម្លៃគោលដៅ ${price}`,
      pricingGridLabel: "តម្លៃការជាវ",
      creditsToggleLabel: "ប៊ូតុងបញ្ចុះពិន្ទុ",
      creatingInvoiceSuffix: " · កំពុងបង្កើតវិក្កយបត្រ",
      paymentEnabledNote:
        "វគ្គឌីជីថលទូទាត់តាម Telegram Stars។ សិទ្ធិនឹងបន្ថែមបន្ទាប់ពី callback ទូទាត់ជោគជ័យ។",
      paymentDisabledNote:
        "Telegram Stars API បានភ្ជាប់ហើយ។ ត្រូវបំពេញ Bot Token, Webhook Secret និងចំនួន Stars សម្រាប់ 4 គម្រោង។",
      shareText:
        "ខ្ញុំកំពុងហ្វឹកហាត់សមត្ថភាព 60 ថ្ងៃលើ Academy។ មិនមែនរក្សាទុកវគ្គទេ គឺរាល់ថ្ងៃត្រូវទុកភស្តុតាងសិក្សា។",
      shareCopied: "បានចម្លងតំណអញ្ជើញ",
      shareFailed: "ចែករំលែកមិនជោគជ័យ សូមចម្លងកូដអញ្ជើញ",
      inviteCodeCopied: "បានចម្លងកូដអញ្ជើញ",
      inviteCodeFallback: (code: string) => `កូដអញ្ជើញ៖ ${code}`,
      invitedUnit: "នាក់",
      referralProgressLabel: (progress: number) => `វឌ្ឍនភាពអញ្ជើញមានសុពលភាព ${progress}%`,
      entered: "បានចូល",
      learning: "កំពុងសិក្សា",
      review: "រង់ចាំពិនិត្យ",
      qualified: "មានសុពលភាព",
      rejected: "ត្រូវបានបដិសេធ",
      myInviteCode: "កូដអញ្ជើញរបស់ខ្ញុំ",
      copy: "ចម្លង",
      shareMiniApp: "ចែករំលែក Academy Mini App",
      rewardGranted: (date: string) => `បានផ្តល់រង្វាន់ · ${date}`,
      qualifiedAt: (date: string) => `បានសម្រេច · ${date}`,
      joinedAt: (date: string) => `បានចូលរួម · ${date}`,
      riskSignals: (signals: string) => `សញ្ញាហានិភ័យ៖ ${signals}`,
    },
    th: {
      localFounderMode: "โหมด Founder ในเครื่อง",
      notProvided: "ยังไม่มี",
      telegramUsernameMissing: "ยังไม่ได้ตั้ง username Telegram",
      telegramProfileLabel: "ข้อมูล Telegram",
      courseCount: (count: number) => `${count} / 3 คอร์ส`,
      reminderPreferences: "การตั้งค่าเตือน",
      remindersTitle: "การเตือนเรียน",
      remindersDescription:
        "ปิดแล้วจะไม่เตือน L1 จะส่งหลังเวลาที่คุณตั้งไว้ และจะไม่ส่งในช่วงห้ามรบกวน",
      reminderStatus: "สถานะ",
      on: "เปิด",
      off: "พัก",
      learningHour: "เวลาเรียน",
      dndStart: "ห้ามรบกวนเริ่ม",
      dndEnd: "ห้ามรบกวนถึง",
      notSet: "ไม่ตั้ง",
      saveSettings: "บันทึก",
      days: (count: number) => `${count} วัน`,
      locked: "ล็อกแล้ว",
      accessActiveUntil: (date: string) => `ใช้งานได้ถึง ${date}`,
      accessLockedDescription:
        "ยังดูบทเรียนเก่า บันทึก และหลักฐานได้ แต่บทเรียนใหม่และการส่งงานหยุดแล้ว",
      expiredTitle: "หมดช่วงทดลองใช้ฟรี",
      expiredDescription: (price: string, needed: number) =>
        `ยังดูประวัติได้ หากต้องการส่งงานต่อ ต้องต่ออายุเริ่มที่ ${price}/เดือน เครดิตจากคำเชิญที่มีผลใช้ลดคำสั่งซื้อถัดไปได้ ตอนนี้ยังขาด ${needed} คำเชิญที่มีผลเพื่อถึงเป้าหมายแรก`,
      viewPlans: "ดูแพ็กเกจ",
      continuationPrimary: "เรียนต่อ",
      continuationRulesLabel: "กติกาการใช้งานต่อ",
      continuationCredits: "เครดิตที่ใช้ลดได้",
      continuationReferral: "คำเชิญที่มีผล",
      monthlyPrice: (price: string) => `${price}/เดือน`,
      starsAmount: (stars: number) => ` · ⭐ ${stars}`,
      maxRedeem: (percent: number) => `ลดได้สูงสุด ${percent}%`,
      needMore: (count: number) => `ขาดอีก ${count}`,
      referralTargetDone: "ถึงเป้าหมายแรกแล้ว",
      recurringSuffix: " · ต่ออายุอัตโนมัติ",
      starsPending: "ยังไม่ตั้ง Stars",
      targetPrice: (price: string) => `ราคาเป้าหมาย ${price}`,
      pricingGridLabel: "ราคาสมาชิก",
      creditsToggleLabel: "สวิตช์ใช้เครดิตลดราคา",
      creatingInvoiceSuffix: " · กำลังสร้างใบแจ้งหนี้",
      paymentEnabledNote:
        "คอร์สดิจิทัลชำระด้วย Telegram Stars สิทธิ์จะเพิ่มหลัง callback ชำระเงินสำเร็จ",
      paymentDisabledNote:
        "เชื่อม Telegram Stars API แล้ว ต้องตั้ง Bot Token, Webhook Secret และจำนวน Stars ทั้ง 4 แพ็กเกจ",
      shareText:
        "ฉันกำลังฝึกทักษะ 60 วันใน Academy ไม่ใช่แค่เก็บคอร์ส แต่ต้องทิ้งหลักฐานการเรียนทุกวัน",
      shareCopied: "คัดลอกลิงก์เชิญแล้ว",
      shareFailed: "แชร์ไม่สำเร็จ กรุณาคัดลอกรหัสเชิญ",
      inviteCodeCopied: "คัดลอกรหัสเชิญแล้ว",
      inviteCodeFallback: (code: string) => `รหัสเชิญ: ${code}`,
      invitedUnit: "คน",
      referralProgressLabel: (progress: number) => `ความคืบหน้าคำเชิญที่มีผล ${progress}%`,
      entered: "เข้ามาแล้ว",
      learning: "กำลังเรียน",
      review: "รอตรวจ",
      qualified: "มีผลแล้ว",
      rejected: "ถูกปฏิเสธ",
      myInviteCode: "รหัสเชิญของฉัน",
      copy: "คัดลอก",
      shareMiniApp: "แชร์ Academy Mini App",
      rewardGranted: (date: string) => `ให้รางวัลแล้ว · ${date}`,
      qualifiedAt: (date: string) => `ผ่านแล้ว · ${date}`,
      joinedAt: (date: string) => `เข้าร่วม · ${date}`,
      riskSignals: (signals: string) => `สัญญาณความเสี่ยง: ${signals}`,
    },
  }[locale];
}

export function testReminderCopy(locale: AppLocale) {
  return {
    "zh-Hans": {
      button: "发送测试提醒",
      sending: "正在发送测试提醒…",
      sent: "测试提醒已发送到 Telegram",
      failed: "测试提醒发送失败",
      skipped: (reason: string) => `测试提醒未发送：${reason}`,
    },
    vi: {
      button: "Gửi nhắc thử",
      sending: "Đang gửi nhắc thử…",
      sent: "Đã gửi nhắc thử vào Telegram",
      failed: "Gửi nhắc thử thất bại",
      skipped: (reason: string) => `Chưa gửi nhắc thử: ${reason}`,
    },
    km: {
      button: "ផ្ញើរំលឹកសាកល្បង",
      sending: "កំពុងផ្ញើរំលឹកសាកល្បង…",
      sent: "បានផ្ញើរំលឹកសាកល្បងទៅ Telegram",
      failed: "ផ្ញើរំលឹកសាកល្បងបរាជ័យ",
      skipped: (reason: string) => `មិនបានផ្ញើ៖ ${reason}`,
    },
    th: {
      button: "ส่งเตือนทดสอบ",
      sending: "กำลังส่งเตือนทดสอบ…",
      sent: "ส่งเตือนทดสอบไป Telegram แล้ว",
      failed: "ส่งเตือนทดสอบไม่สำเร็จ",
      skipped: (reason: string) => `ยังไม่ส่งเตือนทดสอบ: ${reason}`,
    },
  }[locale];
}

export function goalRuntimeCopy(locale: AppLocale) {
  return {
    "zh-Hans": {
      agentLabBody:
        "Academy Core 只保存项目身份、workflow 引用和运行证据；Flowise 只是可替换的 Builder。提交 Runtime 检查时，系统会校验 export 是否包含可识别的节点、连接和关键 Agent/RAG/LLM 组件。",
      workflowExportPlaceholder:
        "粘贴 Flowise workflow export JSON；需要包含 nodes、edges，以及 Agent/RAG/LLM/Tool 等关键节点。",
      saveAgentLab: "保存 Agent Lab 引用",
      savingAgentLab: "保存中…",
      recordRuntimeCheck: "记录结构化 Runtime 检查",
      noRuntimeChecks:
        "还没有独立 Runtime 检查记录；Day 7 / Day 21 的里程碑证据会先进入人工审核。",
      evidencePlaceholder:
        "写下运行结果、测试问题、失败修正或复盘。每行一条证据更容易通过。",
      runtimeEvidenceTitle: "运行测试证据",
      runtimeEvidenceHint:
        "至少 3 个测试问题；实际回答里请保留来源/引用线索，例如 source、引用、[1]、文档名或链接。",
      runtimeQuestionPlaceholder:
        "用户会问什么？例如：这份 PDF 的核心结论是什么？",
      runtimeExpectedPlaceholder: "你期望它回答什么？",
      runtimeActualPlaceholder: "粘贴实际回答，最好包含来源或引用。",
      runtimeCitationPlaceholder: "来源/引用：文档名、页码、链接或 [1]",
      uploadArtifact: "上传本地证据附件",
      uploading: "正在上传…",
      uploadHint: "截图、PDF、Markdown、JSON；仅本地保存，不公开发布。",
      submitMilestone: "提交里程碑证据",
      recording: "正在记录…",
      agentLabSaveFailed: "Agent Lab 保存失败",
      saveAgentLabFirst: "请先保存 Agent Lab 引用，再记录 Runtime 检查",
      runtimeCheckFailed: "Runtime 检查记录失败",
      uploadFailed: "上传失败",
      submitFailed: "提交失败",
      milestoneSaved: "里程碑证据已记录",
    },
    vi: {
      agentLabBody:
        "Academy Core chỉ lưu danh tính dự án, tham chiếu workflow và bằng chứng chạy được; Flowise chỉ là Builder có thể thay thế. Khi nộp kiểm tra Runtime, hệ thống sẽ kiểm tra export có node, kết nối và thành phần Agent/RAG/LLM chính hay không.",
      workflowExportPlaceholder:
        "Dán Flowise workflow export JSON; cần có nodes, edges và các node chính như Agent/RAG/LLM/Tool.",
      saveAgentLab: "Lưu tham chiếu Agent Lab",
      savingAgentLab: "Đang lưu…",
      recordRuntimeCheck: "Ghi kiểm tra Runtime có cấu trúc",
      noRuntimeChecks:
        "Chưa có kiểm tra Runtime độc lập; bằng chứng milestone Day 7 / Day 21 sẽ vào hàng chờ duyệt trước.",
      evidencePlaceholder:
        "Ghi kết quả chạy, câu hỏi thử nghiệm, lỗi đã sửa hoặc phần tự đánh giá. Mỗi dòng một bằng chứng sẽ dễ được duyệt hơn.",
      runtimeEvidenceTitle: "Bằng chứng kiểm tra chạy được",
      runtimeEvidenceHint:
        "Cần ít nhất 3 câu hỏi thử nghiệm; trong câu trả lời thực tế hãy giữ nguồn/trích dẫn như source, [1], tên tài liệu hoặc liên kết.",
      runtimeQuestionPlaceholder:
        "Người dùng sẽ hỏi gì? Ví dụ: kết luận chính của PDF này là gì?",
      runtimeExpectedPlaceholder: "Bạn mong nó trả lời gì?",
      runtimeActualPlaceholder: "Dán câu trả lời thực tế, tốt nhất có nguồn hoặc trích dẫn.",
      runtimeCitationPlaceholder: "Nguồn/trích dẫn: tên tài liệu, trang, liên kết hoặc [1]",
      uploadArtifact: "Tải lên bằng chứng cục bộ",
      uploading: "Đang tải lên…",
      uploadHint: "Ảnh chụp, PDF, Markdown, JSON; chỉ lưu cục bộ, không công khai.",
      submitMilestone: "Nộp bằng chứng milestone",
      recording: "Đang ghi…",
      agentLabSaveFailed: "Lưu Agent Lab thất bại",
      saveAgentLabFirst: "Hãy lưu tham chiếu Agent Lab trước, rồi ghi kiểm tra Runtime",
      runtimeCheckFailed: "Ghi kiểm tra Runtime thất bại",
      uploadFailed: "Tải lên thất bại",
      submitFailed: "Nộp thất bại",
      milestoneSaved: "Đã ghi bằng chứng milestone",
    },
    km: {
      agentLabBody:
        "Academy Core រក្សាទុកតែអត្តសញ្ញាណគម្រោង ឯកសារយោង workflow និងភស្តុតាងដំណើរការ។ Flowise គ្រាន់តែជា Builder ដែលអាចប្ដូរបាន។ ពេលដាក់ស្នើ Runtime check ប្រព័ន្ធនឹងពិនិត្យថា export មាន node ការតភ្ជាប់ និងសមាសភាគ Agent/RAG/LLM សំខាន់ៗឬអត់។",
      workflowExportPlaceholder:
        "បិទភ្ជាប់ Flowise workflow export JSON; ត្រូវមាន nodes, edges និង node សំខាន់ៗដូចជា Agent/RAG/LLM/Tool។",
      saveAgentLab: "រក្សាទុក Agent Lab reference",
      savingAgentLab: "កំពុងរក្សាទុក…",
      recordRuntimeCheck: "កត់ត្រា Runtime check ជារចនាសម្ព័ន្ធ",
      noRuntimeChecks:
        "មិនទាន់មាន Runtime check ដាច់ដោយឡែកទេ។ ភស្តុតាង milestone Day 7 / Day 21 នឹងចូលទៅកាន់ការត្រួតពិនិត្យដោយមនុស្សជាមុន។",
      evidencePlaceholder:
        "សរសេរលទ្ធផលដំណើរការ សំណួរតេស្ត ការកែកំហុស ឬការពិនិត្យឡើងវិញ។ មួយបន្ទាត់មួយភស្តុតាង នឹងងាយឆ្លងកាត់ជាង។",
      runtimeEvidenceTitle: "ភស្តុតាងតេស្តដំណើរការ",
      runtimeEvidenceHint:
        "យ៉ាងហោចណាស់ 3 សំណួរតេស្ត។ ក្នុងចម្លើយពិត សូមរក្សាទុកប្រភព/យោង ដូចជា source, [1], ឈ្មោះឯកសារ ឬតំណ។",
      runtimeQuestionPlaceholder:
        "អ្នកប្រើនឹងសួរអ្វី? ឧទាហរណ៍៖ សេចក្តីសន្និដ្ឋានសំខាន់របស់ PDF នេះគឺអ្វី?",
      runtimeExpectedPlaceholder: "អ្នករំពឹងឱ្យវាឆ្លើយអ្វី?",
      runtimeActualPlaceholder: "បិទភ្ជាប់ចម្លើយពិត ល្អបំផុតបើមានប្រភព ឬយោង។",
      runtimeCitationPlaceholder: "ប្រភព/យោង៖ ឈ្មោះឯកសារ ទំព័រ តំណ ឬ [1]",
      uploadArtifact: "ផ្ទុកឡើងភស្តុតាងក្នុងម៉ាស៊ីន",
      uploading: "កំពុងផ្ទុកឡើង…",
      uploadHint: "រូបថតអេក្រង់, PDF, Markdown, JSON; រក្សាទុកក្នុងម៉ាស៊ីនប៉ុណ្ណោះ មិនបោះផ្សាយសាធារណៈ។",
      submitMilestone: "ដាក់ស្នើភស្តុតាង milestone",
      recording: "កំពុងកត់ត្រា…",
      agentLabSaveFailed: "រក្សាទុក Agent Lab បរាជ័យ",
      saveAgentLabFirst: "សូមរក្សាទុក Agent Lab reference ជាមុន បន្ទាប់មកកត់ត្រា Runtime check",
      runtimeCheckFailed: "កត់ត្រា Runtime check បរាជ័យ",
      uploadFailed: "ផ្ទុកឡើងបរាជ័យ",
      submitFailed: "ដាក់ស្នើបរាជ័យ",
      milestoneSaved: "បានកត់ត្រាភស្តុតាង milestone",
    },
    th: {
      agentLabBody:
        "Academy Core เก็บเฉพาะตัวตนของโปรเจกต์ reference ของ workflow และหลักฐานการรัน ส่วน Flowise เป็น Builder ที่เปลี่ยนได้ เมื่อส่ง Runtime check ระบบจะตรวจว่า export มี node, connection และองค์ประกอบ Agent/RAG/LLM สำคัญหรือไม่",
      workflowExportPlaceholder:
        "วาง Flowise workflow export JSON; ต้องมี nodes, edges และ node สำคัญ เช่น Agent/RAG/LLM/Tool",
      saveAgentLab: "บันทึก Agent Lab reference",
      savingAgentLab: "กำลังบันทึก…",
      recordRuntimeCheck: "บันทึก Runtime check แบบมีโครงสร้าง",
      noRuntimeChecks:
        "ยังไม่มี Runtime check แยกต่างหาก; หลักฐาน milestone Day 7 / Day 21 จะเข้าสู่การตรวจโดยคนก่อน",
      evidencePlaceholder:
        "เขียนผลการรัน คำถามทดสอบ การแก้ข้อผิดพลาด หรือรีวิวย้อนหลัง หนึ่งบรรทัดต่อหนึ่งหลักฐานจะผ่านง่ายกว่า",
      runtimeEvidenceTitle: "หลักฐานทดสอบการรัน",
      runtimeEvidenceHint:
        "ต้องมีคำถามทดสอบอย่างน้อย 3 ข้อ; ในคำตอบจริงควรเก็บแหล่งที่มา/การอ้างอิง เช่น source, [1], ชื่อเอกสาร หรือลิงก์",
      runtimeQuestionPlaceholder:
        "ผู้ใช้จะถามอะไร? เช่น: ข้อสรุปหลักของ PDF นี้คืออะไร?",
      runtimeExpectedPlaceholder: "คุณคาดหวังให้มันตอบอะไร?",
      runtimeActualPlaceholder: "วางคำตอบจริง ควรมีแหล่งที่มาหรือการอ้างอิง",
      runtimeCitationPlaceholder: "แหล่งที่มา/อ้างอิง: ชื่อเอกสาร หน้า ลิงก์ หรือ [1]",
      uploadArtifact: "อัปโหลดหลักฐานในเครื่อง",
      uploading: "กำลังอัปโหลด…",
      uploadHint: "ภาพหน้าจอ, PDF, Markdown, JSON; เก็บในเครื่องเท่านั้น ไม่เผยแพร่สาธารณะ",
      submitMilestone: "ส่งหลักฐาน milestone",
      recording: "กำลังบันทึก…",
      agentLabSaveFailed: "บันทึก Agent Lab ไม่สำเร็จ",
      saveAgentLabFirst: "โปรดบันทึก Agent Lab reference ก่อน แล้วค่อยบันทึก Runtime check",
      runtimeCheckFailed: "บันทึก Runtime check ไม่สำเร็จ",
      uploadFailed: "อัปโหลดไม่สำเร็จ",
      submitFailed: "ส่งไม่สำเร็จ",
      milestoneSaved: "บันทึกหลักฐาน milestone แล้ว",
    },
  }[locale];
}

export function supervisionRuntimeCopy(
  supervision: { state: string; lagDays: number },
  locale: AppLocale,
) {
  const copy = {
    "zh-Hans": {
      completed: {
        label: "今日完成",
        message: "今天的任务已经留下证据。系统明天再来打扰你。",
      },
      interrupted: (days: number) => ({
        label: "连续中断",
        message: `已经落后 ${days} 天。下一课不会解锁，先把当前任务处理掉。`,
      }),
      behind: {
        label: "需要补课",
        message: "昨天的任务还在。它没有消失，只是开始积灰。",
      },
      onTrack: {
        label: "今日监督",
        message: "不要求突然自律，只要求今天的任务别被明天继承。",
      },
    },
    vi: {
      completed: {
        label: "Hoàn thành hôm nay",
        message:
          "Nhiệm vụ hôm nay đã có bằng chứng. Hệ thống sẽ quay lại làm phiền bạn vào ngày mai.",
      },
      interrupted: (days: number) => ({
        label: "Gián đoạn liên tiếp",
        message: `Bạn đã trễ ${days} ngày. Bài tiếp theo chưa mở; xử lý nhiệm vụ hiện tại trước đã.`,
      }),
      behind: {
        label: "Cần học bù",
        message: "Nhiệm vụ hôm qua vẫn ở đó. Nó không biến mất, chỉ bắt đầu phủ bụi.",
      },
      onTrack: {
        label: "Giám sát hôm nay",
        message:
          "Không cần tự kỷ luật đột ngột; chỉ cần đừng để việc hôm nay thừa kế sang ngày mai.",
      },
    },
    km: {
      completed: {
        label: "បានបញ្ចប់ថ្ងៃនេះ",
        message:
          "ភារកិច្ចថ្ងៃនេះមានភស្តុតាងហើយ។ ប្រព័ន្ធនឹងត្រលប់មករំខានអ្នកវិញថ្ងៃស្អែក។",
      },
      interrupted: (days: number) => ({
        label: "ផ្អាកជាប់គ្នា",
        message: `អ្នកយឺត ${days} ថ្ងៃហើយ។ មេរៀនបន្ទាប់មិនបើកទេ សូមបញ្ចប់ភារកិច្ចបច្ចុប្បន្នជាមុន។`,
      }),
      behind: {
        label: "ត្រូវបំពេញមេរៀន",
        message:
          "ភារកិច្ចម្សិលមិញនៅតែមាន។ វាមិនបាត់ទេ គ្រាន់តែចាប់ផ្តើមមានធូលី។",
      },
      onTrack: {
        label: "ការតាមដានថ្ងៃនេះ",
        message:
          "មិនចាំបាច់មានវិន័យភ្លាមៗទេ គ្រាន់តែកុំឱ្យភារកិច្ចថ្ងៃនេះទៅថ្ងៃស្អែក។",
      },
    },
    th: {
      completed: {
        label: "วันนี้เสร็จแล้ว",
        message: "งานวันนี้มีหลักฐานแล้ว ระบบจะกลับมากวนพรุ่งนี้",
      },
      interrupted: (days: number) => ({
        label: "ขาดต่อเนื่อง",
        message: `คุณช้าไป ${days} วัน บทถัดไปยังไม่ปลดล็อก จัดการงานปัจจุบันก่อน`,
      }),
      behind: {
        label: "ต้องเรียนชดเชย",
        message: "งานของเมื่อวานยังอยู่ มันไม่ได้หายไป แค่เริ่มมีฝุ่นจับ",
      },
      onTrack: {
        label: "การกำกับวันนี้",
        message: "ไม่ต้องมีวินัยแบบฉับพลัน แค่อย่าให้งานวันนี้ตกไปพรุ่งนี้",
      },
    },
  }[locale];

  if (supervision.state === "completed") {
    return copy.completed;
  }
  if (supervision.state === "interrupted") {
    return copy.interrupted(supervision.lagDays);
  }
  if (supervision.state === "behind") {
    return copy.behind;
  }
  return copy.onTrack;
}

export function creditsLedgerTypeCopy(locale: AppLocale, rewardType: string) {
  const labels: Record<AppLocale, Record<string, string>> = {
    "zh-Hans": {
      study_reward: "学习奖励",
      referral_reward: "邀请奖励",
      campaign_reward: "活动奖励",
      manual_adjustment: "人工调整",
    },
    vi: {
      study_reward: "Thưởng học tập",
      referral_reward: "Thưởng mời bạn",
      campaign_reward: "Thưởng chiến dịch",
      manual_adjustment: "Điều chỉnh thủ công",
    },
    km: {
      study_reward: "រង្វាន់សិក្សា",
      referral_reward: "រង្វាន់អញ្ជើញ",
      campaign_reward: "រង្វាន់យុទ្ធនាការ",
      manual_adjustment: "កែសម្រួលដោយដៃ",
    },
    th: {
      study_reward: "รางวัลการเรียน",
      referral_reward: "รางวัลชวนเพื่อน",
      campaign_reward: "รางวัลโปรโมชัน",
      manual_adjustment: "ปรับด้วยผู้ดูแล",
    },
  };
  return labels[locale][rewardType] ?? rewardType;
}

export function creditsLedgerStatusCopy(locale: AppLocale, status: string) {
  const labels: Record<AppLocale, Record<string, string>> = {
    "zh-Hans": { posted: "已入账", pending: "待入账", voided: "已作废" },
    vi: { posted: "Đã ghi nhận", pending: "Đang chờ", voided: "Đã hủy" },
    km: { posted: "បានបញ្ចូល", pending: "កំពុងរង់ចាំ", voided: "បានលុបចោល" },
    th: { posted: "เข้าบัญชีแล้ว", pending: "รอเข้าบัญชี", voided: "ยกเลิกแล้ว" },
  };
  return labels[locale][status] ?? status;
}

export function starsStatusCopy(locale: AppLocale) {
  const copy = {
    "zh-Hans": {
      planDisabled: "这档方案暂时不能购买，请检查 Stars 配置。",
      ready: (key: string | null) => key ? `已读取 ${key}` : "Stars 已配置",
      missingBot: "缺少 Bot Token",
      missingWebhook: "缺少 Webhook Secret",
      missingStars: "缺少 Stars 数量",
      unavailable: "暂不可购买",
    },
    vi: {
      planDisabled: "Gói này chưa mua được; hãy kiểm tra cấu hình Stars.",
      ready: (key: string | null) => key ? `Đã đọc ${key}` : "Stars đã cấu hình",
      missingBot: "Thiếu Bot Token",
      missingWebhook: "Thiếu Webhook Secret",
      missingStars: "Thiếu số Stars",
      unavailable: "Chưa thể mua",
    },
    km: {
      planDisabled: "គម្រោងនេះនៅមិនទាន់ទិញបានទេ សូមពិនិត្យ Stars។",
      ready: (key: string | null) => key ? `បានអាន ${key}` : "Stars បានកំណត់",
      missingBot: "ខ្វះ Bot Token",
      missingWebhook: "ខ្វះ Webhook Secret",
      missingStars: "ខ្វះចំនួន Stars",
      unavailable: "មិនទាន់ទិញបាន",
    },
    th: {
      planDisabled: "แพ็กเกจนี้ยังซื้อไม่ได้ กรุณาตรวจการตั้งค่า Stars",
      ready: (key: string | null) => key ? `อ่านค่า ${key} แล้ว` : "ตั้งค่า Stars แล้ว",
      missingBot: "ไม่มี Bot Token",
      missingWebhook: "ไม่มี Webhook Secret",
      missingStars: "ไม่มีจำนวน Stars",
      unavailable: "ยังซื้อไม่ได้",
    },
  }[locale];

  return {
    planDisabled: copy.planDisabled,
    ready: copy.ready,
    disabledReason: (reason: PaymentPlanDisabledReason) =>
      reason === "missing_bot_token"
        ? copy.missingBot
        : reason === "missing_webhook_secret"
          ? copy.missingWebhook
          : reason === "missing_stars_amount"
            ? copy.missingStars
            : copy.unavailable,
  };
}

export function reminderHistoryTitle(locale: AppLocale) {
  return {
    "zh-Hans": "提醒记录",
    vi: "Lịch sử nhắc học",
    km: "ប្រវត្តិការរំលឹក",
    th: "ประวัติการแจ้งเตือน",
  }[locale];
}

export function reminderHistoryEmpty(locale: AppLocale) {
  return {
    "zh-Hans": "暂时没有提醒记录。开启后，系统会在你的学习时间按完成状态发送提醒。",
    vi: "Chưa có lịch sử. Khi bật, hệ thống sẽ nhắc theo thời gian học và tiến độ của bạn.",
    km: "មិនទាន់មានប្រវត្តិទេ។ នៅពេលបើក ប្រព័ន្ធនឹងរំលឹកតាមពេលសិក្សា និងវឌ្ឍនភាពរបស់អ្នក។",
    th: "ยังไม่มีประวัติ เมื่อเปิดใช้ ระบบจะแจ้งเตือนตามเวลาการเรียนและความคืบหน้าของคุณ",
  }[locale];
}

export function reminderHistorySummary(
  locale: AppLocale,
  events: ReminderHistoryEvent[],
) {
  const delivered = events.filter((event) => event.deliveryStatus === "delivered").length;
  return {
    "zh-Hans": `最近 ${events.length} 条 · 已送达 ${delivered} 条`,
    vi: `${events.length} lần gần đây · đã gửi ${delivered}`,
    km: `${events.length} លើកថ្មីៗ · បានបញ្ជូន ${delivered}`,
    th: `${events.length} รายการล่าสุด · ส่งแล้ว ${delivered}`,
  }[locale];
}

export function reminderHistoryStatus(
  locale: AppLocale,
  event: ReminderHistoryEvent,
) {
  const state = event.completedAt
    ? "completed"
    : event.clickedAt
      ? "opened"
      : event.deliveryStatus;
  const copy = {
    "zh-Hans": {
      completed: "提醒后已完成",
      opened: "已打开 Academy",
      delivered: "已送达 Telegram",
      failed: "投递失败，请检查 Telegram 绑定",
      missing_telegram_id: "未绑定 Telegram，无法投递",
      queued: "等待投递",
    },
    vi: {
      completed: "Đã hoàn thành sau nhắc học",
      opened: "Đã mở Academy",
      delivered: "Đã gửi tới Telegram",
      failed: "Gửi thất bại, hãy kiểm tra liên kết Telegram",
      missing_telegram_id: "Chưa liên kết Telegram",
      queued: "Đang chờ gửi",
    },
    km: {
      completed: "បានបញ្ចប់បន្ទាប់ពីរំលឹក",
      opened: "បានបើក Academy",
      delivered: "បានបញ្ជូនទៅ Telegram",
      failed: "បញ្ជូនបរាជ័យ សូមពិនិត្យការភ្ជាប់ Telegram",
      missing_telegram_id: "មិនទាន់ភ្ជាប់ Telegram",
      queued: "កំពុងរង់ចាំបញ្ជូន",
    },
    th: {
      completed: "ทำเสร็จหลังได้รับการเตือน",
      opened: "เปิด Academy แล้ว",
      delivered: "ส่งถึง Telegram แล้ว",
      failed: "ส่งไม่สำเร็จ โปรดตรวจการเชื่อม Telegram",
      missing_telegram_id: "ยังไม่ได้เชื่อม Telegram",
      queued: "กำลังรอส่ง",
    },
  }[locale];
  return copy[state as keyof typeof copy] ?? copy.queued;
}

export function reminderDiagnosticCopy(
  locale: AppLocale,
  diagnostic: ReminderDiagnostic,
) {
  const copy = {
    "zh-Hans": {
      title: "提醒诊断",
      subtitle: "不是玄学，是消息链路。",
      nextLabel: "下一次提醒窗口",
      now: "当前已满足发送条件，等待调度器扫描",
      lastLabel: "最近一次",
      none: "还没有发送记录",
      reasons: {
        scheduled: "提醒已开启，系统会在学习时间后推送。",
        eligible_now: "已经到提醒时间；如果调度器正常运行，本轮会尝试发送。",
        paused: "提醒已关闭。系统尊重你的自由，虽然课程不一定同意。",
        missing_telegram_id: "没有绑定 Telegram ID，无法投递消息。",
        access_expired: "学习权限已到期，不再发送新课提醒。",
        no_active_courses: "当前没有启用课程，暂无可提醒内容。",
        completed_today: "今天已完成，暂不打扰。",
        do_not_disturb: "当前处于免打扰时段，系统先闭嘴。",
      },
    },
    vi: {
      title: "Chẩn đoán nhắc học",
      subtitle: "Không phải tâm linh, là đường gửi tin.",
      nextLabel: "Khung nhắc tiếp theo",
      now: "Đã đủ điều kiện gửi, chờ bộ điều phối quét.",
      lastLabel: "Lần gần nhất",
      none: "Chưa có lịch sử gửi",
      reasons: {
        scheduled: "Nhắc học đang bật và sẽ gửi sau giờ học đã đặt.",
        eligible_now: "Đã tới giờ nhắc; bộ điều phối sẽ thử gửi trong lượt quét.",
        paused: "Bạn đã tắt nhắc học.",
        missing_telegram_id: "Chưa có Telegram ID nên không thể gửi tin.",
        access_expired: "Quyền học đã hết hạn, không gửi nhắc bài mới.",
        no_active_courses: "Chưa có khóa học đang bật.",
        completed_today: "Hôm nay đã hoàn thành, không làm phiền nữa.",
        do_not_disturb: "Đang trong giờ yên tĩnh.",
      },
    },
    km: {
      title: "វិនិច្ឆ័យការរំលឹក",
      subtitle: "មិនមែនវេទមន្តទេ គឺផ្លូវផ្ញើសារ។",
      nextLabel: "ពេលរំលឹកបន្ទាប់",
      now: "មានលក្ខខណ្ឌផ្ញើហើយ កំពុងរង់ចាំ scheduler។",
      lastLabel: "ចុងក្រោយ",
      none: "មិនទាន់មានប្រវត្តិផ្ញើ",
      reasons: {
        scheduled: "ការរំលឹកបានបើក ហើយនឹងផ្ញើក្រោយម៉ោងសិក្សា។",
        eligible_now: "ដល់ពេលរំលឹកហើយ scheduler នឹងព្យាយាមផ្ញើ។",
        paused: "ការរំលឹកត្រូវបានបិទ។",
        missing_telegram_id: "មិនមាន Telegram ID ដូច្នេះមិនអាចផ្ញើបាន។",
        access_expired: "សិទ្ធិសិក្សាផុតកំណត់ហើយ។",
        no_active_courses: "មិនមានវគ្គកំពុងដំណើរការ។",
        completed_today: "ថ្ងៃនេះបានបញ្ចប់ហើយ មិនរំខានទេ។",
        do_not_disturb: "ឥឡូវស្ថិតក្នុងម៉ោងកុំរំខាន។",
      },
    },
    th: {
      title: "ตรวจสถานะเตือน",
      subtitle: "ไม่ใช่ไสยศาสตร์ เป็นเส้นทางส่งข้อความ",
      nextLabel: "รอบเตือนถัดไป",
      now: "ถึงเงื่อนไขส่งแล้ว รอตัวจัดส่งสแกน",
      lastLabel: "ครั้งล่าสุด",
      none: "ยังไม่มีประวัติการส่ง",
      reasons: {
        scheduled: "เปิดเตือนแล้ว ระบบจะส่งหลังเวลาที่ตั้งไว้",
        eligible_now: "ถึงเวลาเตือนแล้ว รอบสแกนจะลองส่ง",
        paused: "ปิดการเตือนอยู่",
        missing_telegram_id: "ยังไม่มี Telegram ID จึงส่งข้อความไม่ได้",
        access_expired: "สิทธิ์เรียนหมดอายุแล้ว",
        no_active_courses: "ยังไม่มีคอร์สที่เปิดใช้งาน",
        completed_today: "วันนี้ทำเสร็จแล้ว ไม่รบกวน",
        do_not_disturb: "อยู่ในช่วงห้ามรบกวน",
      },
    },
  }[locale];

  return {
    ...copy,
    reason: copy.reasons[diagnostic.reason],
  };
}
