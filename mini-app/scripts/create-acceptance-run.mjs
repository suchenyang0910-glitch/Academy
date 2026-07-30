import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const args = {
    operator: process.env.USERNAME ?? process.env.USER ?? "academy",
    device: "iOS / Android",
    environment: "production",
    out: "",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--operator") args.operator = String(argv[i + 1] ?? args.operator);
    if (token === "--device") args.device = String(argv[i + 1] ?? args.device);
    if (token === "--environment") args.environment = String(argv[i + 1] ?? args.environment);
    if (token === "--out") args.out = String(argv[i + 1] ?? "");
  }
  return args;
}

function currentGitRef() {
  const result = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: resolve(".."),
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function safeTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

const args = parseArgs(process.argv.slice(2));
const timestamp = safeTimestamp();
const defaultOut = resolve("..", "docs", "acceptance-runs", `${timestamp}.md`);
const outputPath = args.out ? resolve(args.out) : defaultOut;

const sections = [
  {
    title: "0. 发布前服务器门禁",
    items: [
      "`npm run deploy:check` 输出 `OK postgres production schema`",
      "`restart_safe=yes`，没有 `restart_safe=no`",
      "`academy.service` active/running",
      "`curl -I https://academy.linkx.club` 返回 200 或 30x",
    ],
  },
  {
    title: "1. 进入与身份",
    items: [
      "从 Telegram Bot 打开 Mini App，不出现连接错误",
      "个人中心显示 Telegram ID、昵称、用户名/兜底、语言、时区、课程数",
      "刷新或关闭重开后仍识别为同一用户",
    ],
  },
  {
    title: "2. 多语言",
    items: [
      "中文、越南语、高棉语、泰文可切换并刷新后保持",
      "底部 Tab、支付、邀请、提醒、个人中心文案跟随语言变化",
      "课程正文缺少翻译时显示中文审核版提示，不假装已翻译",
    ],
  },
  {
    title: "3. 选课与今日 Mission",
    items: [
      "未选课用户能看到课程选择入口",
      "至少选择 1 门后可进入今日学习，最多只能选择 3 门",
      "允许中途更换课程，过去学习证据不被删除",
      "每门课程独立显示 Day / 进度",
      "Today Mission 优先展示当前任务和完成证据",
    ],
  },
  {
    title: "4. 课程学习与选择题提交",
    items: [
      "课程正文先展示知识内容，再进入检查 / 作业",
      "选择题数量为 3–5 道，来自本课关键知识点",
      "未选完不能提交，答错显示解释",
      "通过规则后能提交学习证据",
      "提交成功后今日任务状态更新，修正后可重新提交",
    ],
  },
  {
    title: "5. 移动端输入体验",
    items: [
      "iOS 输入框聚焦后页面不整体放大",
      "键盘弹出后提交按钮不被遮挡",
      "长文本输入不卡死，关闭键盘后页面可继续滚动",
      "底部 Tab 不遮挡关键按钮",
    ],
  },
  {
    title: "6. 笔记、进度与证据",
    items: [
      "可保存一条学习笔记，刷新后仍存在",
      "笔记不要求绑定某一课也能保存",
      "进度页显示有效学习日、evidence 数量、能力节点状态",
      "能力证明导出 JSON / Markdown 可用",
      "Progress 不只按打开次数计算，而是基于 accepted evidence",
    ],
  },
  {
    title: "7. Telegram 提醒",
    items: [
      "显示提醒开关、提醒窗口、下一次提醒或诊断原因",
      "点击发送测试提醒后 Telegram 收到 Bot 消息",
      "提醒历史新增记录，delivered / failed 状态可见",
      "连续中断时页面显示阻断原因",
      "已完成今日任务后不会继续错误催促",
    ],
  },
  {
    title: "8. Telegram Stars",
    items: [
      "$9.9/月目标价展示正确",
      "Stars 未配置时显示待定/禁用原因，不能创建发票",
      "Stars 已配置时显示实际 Stars 数",
      "点击支付必须在 Telegram Mini App 内打开 invoice",
      "paid / pending / failed / cancelled 都有清晰提示",
      "前端 paid 不单独发放权限，必须等待 Telegram successful_payment 回调",
      "refunded_payment 后权益状态可追踪",
    ],
  },
  {
    title: "9. 邀请与裂变",
    items: [
      "显示邀请链接或分享入口，可复制邀请链接",
      "被邀请者打开后记录 start parameter",
      "仅注册不算有效邀请",
      "被邀请者认证、选课、付费并产生有效学习行为后才 qualified",
      "邀请奖励进入 credits_ledger",
      "前 3 个有效邀请奖励比例为 10% / 15% / 20%，第 4 个起固定 10%",
      "重复邀请 / 空账号不会发奖",
    ],
  },
  {
    title: "10. 后台只读检查",
    items: [
      "Validation Dashboard 带 Bearer Token 可访问，不带 Token 不可访问",
      "Dashboard 可看到 Seed Users、FWPR-7、Day21 DoD、Evidence 提交率",
      "Dashboard 可看到 Quiz Needs Review、Payment / Referral funnel、Reminder Conversion",
      "Ops Dashboard 可看到 Reminder Delivery Health 和最近提醒事件",
    ],
  },
];

const content = `# Academy Telegram Mini App 真机验收记录

- 时间：${new Date().toISOString()}
- 操作人：${args.operator}
- 设备：${args.device}
- 环境：${args.environment}
- Git：${currentGitRef()}
- 静态门禁：先运行 \`npm run acceptance:check\`
- 真机结论：TODO: pass / fail
- 机器判定：acceptance_result=TODO

> 规则：任何 P0 项失败，都不要邀请新的种子用户。支付、邀请、提醒、学习证据必须以服务端记录为准，不只看前端提示。

${sections
  .map(
    (section) => `## ${section.title}

${section.items.map((item) => `- [ ] ${item}`).join("\n")}

验收备注：
- 
`,
  )
  .join("\n")}

## P0 发布判定

- [ ] 服务器 \`deploy:check\` 通过
- [ ] Mini App 能从 Telegram 打开
- [ ] 身份、语言、选课、今日任务可用
- [ ] 选择题提交闭环可用
- [ ] 笔记和进度可用
- [ ] 测试提醒可收到
- [ ] Stars 状态不会误导用户
- [ ] 邀请规则不把空账号算有效
- [ ] 页面没有 iOS 放大和键盘挡按钮问题

最终备注：
- 

## Machine-readable result

acceptance_result: TODO
validator_hint: 全部 P0 勾选后，把本行上方改为 acceptance_result: pass，然后运行 \`npm run acceptance:validate -- --file <this-file>\`。
`;

if (existsSync(outputPath)) {
  console.error(`ERROR: acceptance run already exists: ${outputPath}`);
  process.exit(1);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, content, "utf8");
console.log(`Acceptance run created: ${outputPath}`);
