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
  accessTrial: string;
  accessPaid: string;
  accessReward: string;
  accessExpired: string;
  accessExpiredAction: string;
  creditsTitle: string;
  creditsAvailable: string;
  creditsPending: string;
  creditsAnchor: string;
  creditsMaxRedeem: string;
  creditsRule: string;
  creditsLedgerTitle: string;
  creditsLedgerEmpty: string;
  campaignValidUntil: (date: string) => string;
  campaignTitle: string;
  campaignNone: string;
  billingUseCredits: string;
  billingUseCreditsOn: string;
  billingUseCreditsOff: string;
  billingToggle: string;
  pricingPreviewTitle: string;
  pricingPreviewLine: (input: {
    original: number;
    mainDiscount: number;
    creditsDiscount: number;
    payable: number;
  }) => string;
  pricingCancel: string;
  pricingConfirmPay: string;
  pricingLocking: string;
  paymentStatusPending: string;
  paymentStatusPaid: string;
  paymentStatusFailed: string;
  paymentStatusCancelled: string;
  paymentStatusPendingDetail: string;
  paymentStatusPaidDetail: string;
  paymentStatusFailedDetail: string;
  paymentStatusCancelledDetail: string;
  paymentRefundTitle: string;
  paymentRefundPolicy: string;
  paymentOpenInTelegramRequired: string;
  paymentInvoiceFailed: string;
  pricingPreviewFailed: string;
  referralTitle: string;
  referralRule: string;
  referralQualifiedDefinition: string;
  referralValidBehavior: string;
  referralNextRate: (rate: number) => string;
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
  ui: {
    loadingTitle: string;
    loadingDescription: string;
    errorLabel: string;
    errorTitle: string;
    retry: string;
    mustLeaveOutput: string;
    selectCourse: string;
    adjustCourses: string;
    coursePickerTitle: string;
    coursePickerDescription: string;
    courseCatalogDescription: string;
    changeMyCourses: string;
    notesTitle: string;
    notesDescription: string;
    saveNote: string;
    progressTitle: string;
    progressDescription: string;
  };
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
    accessTrial: "21 天免费试用",
    accessPaid: "付费订阅",
    accessReward: "奖励权益",
    accessExpired: "已到期",
    accessExpiredAction: "试用已结束，先处理使用权限",
    creditsTitle: "积分与优惠",
    creditsAvailable: "可用积分",
    creditsPending: "待入账",
    creditsAnchor: "锚定比例",
    creditsMaxRedeem: "单次抵扣",
    creditsRule: "积分仅用于抵扣下一单，单次最多抵扣 50%。",
    creditsLedgerTitle: "最近积分流水",
    creditsLedgerEmpty: "暂无积分流水。学习奖励、邀请奖励或活动奖励入账后，这里会留下记录。",
    campaignValidUntil: (date) => `截止 ${date}`,
    campaignTitle: "当前活动",
    campaignNone: "无",
    billingUseCredits: "使用积分抵扣",
    billingUseCreditsOn: "已开启",
    billingUseCreditsOff: "未开启",
    billingToggle: "切换",
    pricingPreviewTitle: "结算预览",
    pricingPreviewLine: ({ original, mainDiscount, creditsDiscount, payable }) =>
      `原价 ⭐ ${original} · 主优惠 -⭐ ${mainDiscount} · 积分 -⭐ ${creditsDiscount} · 应付 ⭐ ${payable}`,
    pricingCancel: "取消",
    pricingConfirmPay: "确认并支付",
    pricingLocking: "正在锁定…",
    paymentStatusPending: "支付正在确认…",
    paymentStatusPaid: "支付成功，正在刷新权限…",
    paymentStatusFailed: "支付失败",
    paymentStatusCancelled: "已取消",
    paymentStatusPendingDetail:
      "Telegram 已打开支付流程，但服务端还在等待 successful_payment 回调。请稍等，不要重复创建多张发票。",
    paymentStatusPaidDetail:
      "前端已收到 paid 状态，权限仍以 Telegram successful_payment 服务端回调为准。系统会自动刷新。",
    paymentStatusFailedDetail:
      "支付没有完成，订单不会发放权限。你可以重新创建发票；若 Stars 已扣但权限未变，请联系支持核对交易。",
    paymentStatusCancelledDetail:
      "你已取消支付，没有产生新权限，也不会消耗积分抵扣。",
    paymentRefundTitle: "退款与权益说明",
    paymentRefundPolicy:
      "收到 Telegram refunded_payment 后，系统会把支付流水和对应订阅权限标记为已退款；前端显示 paid 不能单独作为发放依据。",
    paymentOpenInTelegramRequired: "请从 Telegram Mini App 内发起 Stars 支付",
    paymentInvoiceFailed: "Stars 发票创建失败",
    pricingPreviewFailed: "结算预览失败",
    referralTitle: "邀请朋友一起训练",
    referralRule:
      "邀请奖励统一返积分：前 3 个有效邀请分别返首单实付金额的 10% / 15% / 20% 积分，第 4 个起固定 10%。",
    referralQualifiedDefinition:
      "有效邀请 = Telegram 认证、完成选课、首单付费成功，并在首单后 7 天内产生至少 3 个有效学习日。",
    referralValidBehavior:
      "仅注册、打开链接或空账号不算有效邀请；被邀请者必须认证并产生有效学习行为，奖励才会进入积分账本。",
    referralNextRate: (rate) =>
      `当前下一位有效邀请预计返 ${rate}% 积分；积分仅用于抵扣下一单，单次最多抵扣 50%。`,
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
    ui: {
      loadingTitle: "正在整理今天的学习",
      loadingDescription: "课程不会自己完成，但页面可以先自己加载。",
      errorLabel: "连接暂时走神了",
      errorTitle: "今天的课程还在，数据没跟上。",
      retry: "再试一次",
      mustLeaveOutput: "必须留下输出",
      selectCourse: "先选择课程",
      adjustCourses: "调整课程",
      coursePickerTitle: "选择训练方向",
      coursePickerDescription: "必选 1 门，最多 3 门，可以中途更换。",
      courseCatalogDescription: "每门课程独立计算 Day，换课不会删除过去的证据。",
      changeMyCourses: "调整我的课程",
      notesTitle: "学习笔记",
      notesDescription: "不是收藏内容，而是保存你自己的判断。",
      saveNote: "保存笔记",
      progressTitle: "学习进度",
      progressDescription: "这里记录你完成了什么，以及系统为什么相信你完成了。",
    },
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
    accessTrial: "Dùng thử 21 ngày",
    accessPaid: "Đã đăng ký",
    accessReward: "Quyền lợi thưởng",
    accessExpired: "Hết hạn",
    accessExpiredAction: "Dùng thử đã kết thúc, hãy xử lý quyền sử dụng trước",
    creditsTitle: "Tín dụng & ưu đãi",
    creditsAvailable: "Tín dụng khả dụng",
    creditsPending: "Chờ ghi nhận",
    creditsAnchor: "Tỷ lệ quy đổi",
    creditsMaxRedeem: "Giảm tối đa",
    creditsRule: "Tín dụng chỉ dùng cho đơn tiếp theo, tối đa giảm 50% mỗi đơn.",
    creditsLedgerTitle: "Lịch sử tín dụng gần đây",
    creditsLedgerEmpty: "Chưa có lịch sử tín dụng. Thưởng học, thưởng mời bạn hoặc ưu đãi sẽ được ghi lại ở đây.",
    campaignValidUntil: (date) => `Hết hạn ${date}`,
    campaignTitle: "Ưu đãi hiện tại",
    campaignNone: "Không có",
    billingUseCredits: "Dùng tín dụng",
    billingUseCreditsOn: "Bật",
    billingUseCreditsOff: "Tắt",
    billingToggle: "Chuyển",
    pricingPreviewTitle: "Xem trước giá",
    pricingPreviewLine: ({ original, mainDiscount, creditsDiscount, payable }) =>
      `Giá gốc ⭐ ${original} · Ưu đãi -⭐ ${mainDiscount} · Tín dụng -⭐ ${creditsDiscount} · Cần trả ⭐ ${payable}`,
    pricingCancel: "Hủy",
    pricingConfirmPay: "Xác nhận & trả",
    pricingLocking: "Đang khóa…",
    paymentStatusPending: "Đang xác nhận thanh toán…",
    paymentStatusPaid: "Thanh toán thành công, đang cập nhật…",
    paymentStatusFailed: "Thanh toán thất bại",
    paymentStatusCancelled: "Đã hủy",
    paymentStatusPendingDetail:
      "Telegram đã mở thanh toán, nhưng máy chủ còn chờ callback successful_payment. Vui lòng đợi, đừng tạo nhiều hóa đơn cùng lúc.",
    paymentStatusPaidDetail:
      "Ứng dụng đã nhận paid; quyền sử dụng vẫn chỉ tăng sau callback successful_payment từ Telegram.",
    paymentStatusFailedDetail:
      "Thanh toán chưa hoàn tất nên quyền chưa được cấp. Bạn có thể tạo lại hóa đơn; nếu Stars đã bị trừ, hãy liên hệ hỗ trợ để kiểm tra.",
    paymentStatusCancelledDetail:
      "Bạn đã hủy thanh toán. Không có quyền mới và điểm giảm giá không bị dùng.",
    paymentRefundTitle: "Hoàn tiền và quyền sử dụng",
    paymentRefundPolicy:
      "Khi nhận refunded_payment từ Telegram, hệ thống sẽ đánh dấu giao dịch và quyền tương ứng là đã hoàn tiền; paid trên giao diện không tự cấp quyền.",
    paymentOpenInTelegramRequired: "Hãy thanh toán Stars trong Telegram Mini App",
    paymentInvoiceFailed: "Tạo hóa đơn Stars thất bại",
    pricingPreviewFailed: "Xem trước giá thất bại",
    referralTitle: "Mời bạn cùng học",
    referralRule:
      "Thưởng mời bạn bằng tín dụng: 3 lời mời hiệu lực đầu tiên nhận 10% / 15% / 20%, từ lời mời thứ 4 cố định 10%.",
    referralQualifiedDefinition:
      "Lời mời hiệu lực = xác thực Telegram, chọn khóa, thanh toán đơn đầu và trong 7 ngày sau đó có ít nhất 3 ngày học hiệu lực.",
    referralValidBehavior:
      "Chỉ đăng ký, mở link hoặc tài khoản trống không được tính. Người được mời phải xác thực và có hành vi học hợp lệ thì thưởng mới vào sổ tín dụng.",
    referralNextRate: (rate) =>
      `Lời mời hiệu lực tiếp theo dự kiến nhận ${rate}% tín dụng; tín dụng chỉ dùng cho đơn sau, tối đa giảm 50%.`,
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
    ui: {
      loadingTitle: "Đang chuẩn bị việc học hôm nay",
      loadingDescription: "Khóa học không tự hoàn thành, nhưng trang có thể tải trước.",
      errorLabel: "Kết nối đang mất tập trung",
      errorTitle: "Bài học hôm nay vẫn ở đây, nhưng dữ liệu chưa theo kịp.",
      retry: "Thử lại",
      mustLeaveOutput: "Cần có kết quả đầu ra",
      selectCourse: "Chọn khóa học trước",
      adjustCourses: "Điều chỉnh khóa học",
      coursePickerTitle: "Chọn hướng luyện tập",
      coursePickerDescription: "Chọn ít nhất 1, tối đa 3 khóa; có thể đổi giữa chừng.",
      courseCatalogDescription: "Mỗi khóa có số ngày riêng; đổi khóa không xóa bằng chứng đã có.",
      changeMyCourses: "Điều chỉnh khóa học của tôi",
      notesTitle: "Ghi chú học tập",
      notesDescription: "Không phải lưu nội dung — đây là nơi lưu nhận định của bạn.",
      saveNote: "Lưu ghi chú",
      progressTitle: "Tiến độ học tập",
      progressDescription: "Nơi lưu những gì bạn đã làm và lý do hệ thống xác nhận điều đó.",
    },
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
    accessTrial: "សាកល្បង 21 ថ្ងៃ",
    accessPaid: "បានជាវ",
    accessReward: "អត្ថប្រយោជន៍រង្វាន់",
    accessExpired: "ផុតកំណត់",
    accessExpiredAction: "ការសាកល្បងបានបញ្ចប់ សូមដោះស្រាយសិទ្ធិប្រើប្រាស់ជាមុន",
    creditsTitle: "ពិន្ទុ និងអត្ថប្រយោជន៍",
    creditsAvailable: "ពិន្ទុអាចប្រើបាន",
    creditsPending: "កំពុងរង់ចាំបញ្ចូល",
    creditsAnchor: "អត្រាបម្លែង",
    creditsMaxRedeem: "បញ្ចុះអតិបរមា",
    creditsRule: "ពិន្ទុប្រើសម្រាប់បញ្ចុះតម្លៃការបង់លើកក្រោយ បញ្ចុះបានអតិបរមា 50% ក្នុងមួយការបង់។",
    creditsLedgerTitle: "កំណត់ត្រាពិន្ទុថ្មីៗ",
    creditsLedgerEmpty: "មិនទាន់មានកំណត់ត្រាពិន្ទុទេ។ រង្វាន់សិក្សា រង្វាន់អញ្ជើញ ឬរង្វាន់យុទ្ធនាការ នឹងបង្ហាញនៅទីនេះ។",
    campaignValidUntil: (date) => `ផុតកំណត់ ${date}`,
    campaignTitle: "ព្រឹត្តិការណ៍បច្ចុប្បន្ន",
    campaignNone: "គ្មាន",
    billingUseCredits: "ប្រើពិន្ទុបញ្ចុះតម្លៃ",
    billingUseCreditsOn: "បើក",
    billingUseCreditsOff: "បិទ",
    billingToggle: "ប្ដូរ",
    pricingPreviewTitle: "មើលតម្លៃជាមុន",
    pricingPreviewLine: ({ original, mainDiscount, creditsDiscount, payable }) =>
      `តម្លៃដើម ⭐ ${original} · បញ្ចុះ -⭐ ${mainDiscount} · ពិន្ទុ -⭐ ${creditsDiscount} · ត្រូវបង់ ⭐ ${payable}`,
    pricingCancel: "បោះបង់",
    pricingConfirmPay: "បញ្ជាក់ និងបង់",
    pricingLocking: "កំពុងចាក់សោ…",
    paymentStatusPending: "កំពុងបញ្ជាក់ការបង់ប្រាក់…",
    paymentStatusPaid: "បានបង់ប្រាក់ ហើយកំពុងធ្វើបច្ចុប្បន្នភាព…",
    paymentStatusFailed: "បង់ប្រាក់បរាជ័យ",
    paymentStatusCancelled: "បានបោះបង់",
    paymentStatusPendingDetail:
      "Telegram បានបើកដំណើរការបង់ប្រាក់ ប៉ុន្តែម៉ាស៊ីនមេនៅរង់ចាំ callback successful_payment។ សូមរង់ចាំ កុំបង្កើតវិក្កយបត្រច្រើន។",
    paymentStatusPaidDetail:
      "ផ្នែកមុខបានទទួល paid ប៉ុន្តែសិទ្ធិប្រើប្រាស់បន្ថែមតាម callback successful_payment ពី Telegram ប៉ុណ្ណោះ។",
    paymentStatusFailedDetail:
      "ការបង់ប្រាក់មិនបានបញ្ចប់ ដូច្នេះមិនផ្តល់សិទ្ធិថ្មីទេ។ ប្រសិនបើ Stars ត្រូវបានដក សូមទាក់ទងជំនួយ។",
    paymentStatusCancelledDetail:
      "អ្នកបានបោះបង់ការបង់ប្រាក់។ មិនមានសិទ្ធិថ្មី ហើយពិន្ទុបញ្ចុះតម្លៃមិនត្រូវបានប្រើទេ។",
    paymentRefundTitle: "ការសងប្រាក់ និងសិទ្ធិ",
    paymentRefundPolicy:
      "ពេលទទួល refunded_payment ពី Telegram ប្រព័ន្ធនឹងសម្គាល់ប្រតិបត្តិការ និងសិទ្ធិពាក់ព័ន្ធថាបានសងប្រាក់។ paid នៅផ្នែកមុខមិនអាចផ្តល់សិទ្ធិដោយខ្លួនឯងបានទេ។",
    paymentOpenInTelegramRequired: "សូមបង់ Stars ក្នុង Telegram Mini App",
    paymentInvoiceFailed: "បង្កើតវិក្កយបត្រ Stars បរាជ័យ",
    pricingPreviewFailed: "មើលតម្លៃជាមុនបរាជ័យ",
    referralTitle: "អញ្ជើញមិត្តរួមហ្វឹកហាត់",
    referralRule:
      "រង្វាន់អញ្ជើញជាពិន្ទុ៖ អញ្ជើញមានសុពលភាព 3 ដំបូង 10% / 15% / 20% និងចាប់ពីលើកទី 4 ថេរ 10%។",
    referralQualifiedDefinition:
      "អញ្ជើញមានសុពលភាព = បញ្ជាក់ Telegram, ជ្រើសវគ្គ, បង់ប្រាក់លើកដំបូង និងក្នុង 7 ថ្ងៃបន្ទាប់មានយ៉ាងហោចណាស់ 3 ថ្ងៃសិក្សាមានសុពលភាព។",
    referralValidBehavior:
      "គ្រាន់តែចុះឈ្មោះ បើកតំណ ឬគណនីទទេ មិនគិតទេ។ អ្នកត្រូវផ្ទៀងផ្ទាត់ និងមានសកម្មភាពសិក្សាមានសុពលភាព មុនពេលរង្វាន់ចូលកំណត់ត្រាពិន្ទុ។",
    referralNextRate: (rate) =>
      `អញ្ជើញមានសុពលភាពបន្ទាប់ រំពឹងបាន ${rate}% ពិន្ទុ; ពិន្ទុប្រើបានលើការបង់លើកក្រោយ បញ្ចុះអតិបរមា 50%។`,
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
    ui: {
      loadingTitle: "កំពុងរៀបចំការសិក្សាថ្ងៃនេះ",
      loadingDescription: "វគ្គសិក្សាមិនអាចបញ្ចប់ដោយខ្លួនឯងទេ ប៉ុន្តែទំព័រអាចផ្ទុកជាមុន។",
      errorLabel: "ការតភ្ជាប់កំពុងរវល់",
      errorTitle: "មេរៀនថ្ងៃនេះនៅទីនេះ ប៉ុន្តែទិន្នន័យមិនទាន់មកដល់។",
      retry: "សាកល្បងម្ដងទៀត",
      mustLeaveOutput: "ត្រូវមានលទ្ធផល",
      selectCourse: "ជ្រើសរើសវគ្គជាមុន",
      adjustCourses: "កែសម្រួលវគ្គ",
      coursePickerTitle: "ជ្រើសទិសដៅហ្វឹកហាត់",
      coursePickerDescription: "ត្រូវជ្រើស 1 វគ្គ អតិបរមា 3 វគ្គ ហើយអាចប្ដូរបានពេលក្រោយ។",
      courseCatalogDescription: "វគ្គនីមួយៗមាន Day ដាច់ដោយឡែក; ការប្ដូរវគ្គមិនលុបភស្តុតាងចាស់ទេ។",
      changeMyCourses: "កែសម្រួលវគ្គរបស់ខ្ញុំ",
      notesTitle: "កំណត់ត្រាសិក្សា",
      notesDescription: "មិនមែនសម្រាប់រក្សាទុកខ្លឹមសារ ប៉ុន្តែសម្រាប់រក្សាទុកការវិនិច្ឆ័យរបស់អ្នក។",
      saveNote: "រក្សាទុកកំណត់ត្រា",
      progressTitle: "វឌ្ឍនភាពការសិក្សា",
      progressDescription: "នៅទីនេះកត់ត្រាអ្វីដែលអ្នកបានធ្វើ និងមូលហេតុដែលប្រព័ន្ធទទួលស្គាល់វា។",
    },
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
    accessTrial: "ทดลองใช้ฟรี 21 วัน",
    accessPaid: "สมาชิกแบบชำระเงิน",
    accessReward: "สิทธิประโยชน์รางวัล",
    accessExpired: "หมดอายุ",
    accessExpiredAction: "หมดช่วงทดลองใช้ฟรี กรุณาจัดการสิทธิ์ใช้งานก่อน",
    creditsTitle: "เครดิตและโปรโมชัน",
    creditsAvailable: "เครดิตที่ใช้ได้",
    creditsPending: "รอเข้าบัญชี",
    creditsAnchor: "อัตราแลกเปลี่ยน",
    creditsMaxRedeem: "ลดสูงสุด",
    creditsRule: "เครดิตใช้ลดค่าใช้จ่ายครั้งถัดไป ลดได้สูงสุด 50% ต่อคำสั่งซื้อ",
    creditsLedgerTitle: "ประวัติเครดิตล่าสุด",
    creditsLedgerEmpty: "ยังไม่มีประวัติเครดิต รางวัลจากการเรียน การชวนเพื่อน หรือโปรโมชันจะแสดงที่นี่",
    campaignValidUntil: (date) => `หมดเขต ${date}`,
    campaignTitle: "โปรโมชันปัจจุบัน",
    campaignNone: "ไม่มี",
    billingUseCredits: "ใช้เครดิต",
    billingUseCreditsOn: "เปิด",
    billingUseCreditsOff: "ปิด",
    billingToggle: "สลับ",
    pricingPreviewTitle: "พรีวิวราคา",
    pricingPreviewLine: ({ original, mainDiscount, creditsDiscount, payable }) =>
      `ราคาเดิม ⭐ ${original} · โปรโมชัน -⭐ ${mainDiscount} · เครดิต -⭐ ${creditsDiscount} · ต้องจ่าย ⭐ ${payable}`,
    pricingCancel: "ยกเลิก",
    pricingConfirmPay: "ยืนยันและจ่าย",
    pricingLocking: "กำลังล็อก…",
    paymentStatusPending: "กำลังยืนยันการชำระเงิน…",
    paymentStatusPaid: "ชำระเงินสำเร็จ กำลังอัปเดต…",
    paymentStatusFailed: "ชำระเงินล้มเหลว",
    paymentStatusCancelled: "ยกเลิกแล้ว",
    paymentStatusPendingDetail:
      "Telegram เปิดขั้นตอนชำระเงินแล้ว แต่เซิร์ฟเวอร์ยังรอ callback successful_payment กรุณารอสักครู่และอย่าสร้างใบแจ้งหนี้ซ้ำหลายใบ",
    paymentStatusPaidDetail:
      "หน้าจอได้รับ paid แล้ว แต่สิทธิ์จะเพิ่มจริงตาม callback successful_payment จาก Telegram เท่านั้น ระบบจะรีเฟรชให้อัตโนมัติ",
    paymentStatusFailedDetail:
      "การชำระเงินไม่สำเร็จ จึงยังไม่เพิ่มสิทธิ์ หาก Stars ถูกหักแต่สิทธิ์ไม่เปลี่ยน โปรดติดต่อฝ่ายช่วยเหลือ",
    paymentStatusCancelledDetail:
      "คุณยกเลิกการชำระเงิน ไม่มีสิทธิ์ใหม่ และเครดิตส่วนลดจะไม่ถูกใช้",
    paymentRefundTitle: "การคืนเงินและสิทธิ์ใช้งาน",
    paymentRefundPolicy:
      "เมื่อได้รับ refunded_payment จาก Telegram ระบบจะทำเครื่องหมายธุรกรรมและสิทธิ์ที่เกี่ยวข้องว่าได้รับคืนเงินแล้ว paid บนหน้าจอไม่ใช่หลักฐานการให้สิทธิ์โดยลำพัง",
    paymentOpenInTelegramRequired: "กรุณาชำระ Stars ใน Telegram Mini App",
    paymentInvoiceFailed: "สร้างใบแจ้งหนี้ Stars ไม่สำเร็จ",
    pricingPreviewFailed: "ดูตัวอย่างราคาไม่สำเร็จ",
    referralTitle: "ชวนเพื่อนมาฝึกด้วยกัน",
    referralRule:
      "รางวัลชวนเพื่อนเป็นเครดิต: 3 คำเชิญที่มีผลแรกได้ 10% / 15% / 20% หลังจากนั้นคงที่ 10%",
    referralQualifiedDefinition:
      "คำเชิญที่มีผล = ยืนยัน Telegram, เลือกคอร์ส, ชำระเงินครั้งแรก และภายใน 7 วันหลังชำระมีอย่างน้อย 3 วันเรียนที่มีผล",
    referralValidBehavior:
      "แค่สมัคร เปิดลิงก์ หรือบัญชีว่างยังไม่นับ ผู้ถูกชวนต้องยืนยันตัวตนและมีพฤติกรรมเรียนที่มีผลก่อน รางวัลจึงจะเข้าบัญชีเครดิต",
    referralNextRate: (rate) =>
      `คำเชิญที่มีผลถัดไปคาดว่าจะได้ ${rate}% เครดิต; เครดิตใช้ได้กับคำสั่งซื้อถัดไป ลดได้สูงสุด 50%`,
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
    ui: {
      loadingTitle: "กำลังเตรียมการเรียนของวันนี้",
      loadingDescription: "คอร์สเรียนทำเองไม่ได้ แต่หน้าแอปโหลดให้ก่อนได้",
      errorLabel: "การเชื่อมต่อกำลังหลุดโฟกัส",
      errorTitle: "บทเรียนวันนี้ยังอยู่ แต่ข้อมูลตามมาไม่ทัน",
      retry: "ลองอีกครั้ง",
      mustLeaveOutput: "ต้องมีผลงานที่ตรวจสอบได้",
      selectCourse: "เลือกคอร์สก่อน",
      adjustCourses: "ปรับคอร์ส",
      coursePickerTitle: "เลือกทิศทางการฝึก",
      coursePickerDescription: "ต้องเลือกอย่างน้อย 1 คอร์ส สูงสุด 3 คอร์ส และเปลี่ยนได้ระหว่างทาง",
      courseCatalogDescription: "แต่ละคอร์สนับ Day แยกกัน การเปลี่ยนคอร์สไม่ลบหลักฐานที่ผ่านมา",
      changeMyCourses: "ปรับคอร์สของฉัน",
      notesTitle: "บันทึกการเรียน",
      notesDescription: "ไม่ใช่ที่เก็บเนื้อหา แต่เป็นที่เก็บข้อสรุปของคุณเอง",
      saveNote: "บันทึกโน้ต",
      progressTitle: "ความคืบหน้าการเรียน",
      progressDescription: "บันทึกสิ่งที่คุณทำ และเหตุผลที่ระบบยืนยันว่าคุณทำสำเร็จ",
    },
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
