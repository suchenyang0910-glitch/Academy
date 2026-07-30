import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const args = {
    operator: process.env.USERNAME ?? process.env.USER ?? "academy",
    cohort: "seed-cohort-01",
    startDate: "",
    out: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--operator") {
      args.operator = String(argv[i + 1] ?? args.operator);
      i += 1;
    } else if (token === "--cohort") {
      args.cohort = String(argv[i + 1] ?? args.cohort);
      i += 1;
    } else if (token === "--start-date") {
      args.startDate = String(argv[i + 1] ?? args.startDate);
      i += 1;
    } else if (token === "--out") {
      args.out = String(argv[i + 1] ?? "");
      i += 1;
    }
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
const defaultOut = resolve("..", "docs", "seed-runs", `${args.cohort}-${timestamp}.md`);
const outputPath = args.out ? resolve(args.out) : defaultOut;

const users = Array.from({ length: 10 }, (_, index) => {
  const id = `U${String(index + 1).padStart(2, "0")}`;
  return `| ${id} |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | |`;
}).join("\n");

const content = `# Academy 21 天种子验证记录

- Cohort：${args.cohort}
- 操作人：${args.operator}
- 计划开始日期：${args.startDate || "TODO"}
- 创建时间：${new Date().toISOString()}
- Git：${currentGitRef()}
- 目标：招募 10 人，至少 3 人完成 21 天，至少 1 人真实支付 $9.9。
- 验证结论：TODO: pass / partial / fail

> 规则：注册不算有效用户；打开 Mini App 不算有效学习；只有 accepted evidence 才算有效学习行为。被提醒或强监督后完成可以计入留存，但必须标记完成来源。

## 1. 用户结果表

| 编号 | 昵称 | 渠道 | 画像匹配 | 主要目标 | 每日可投入 | 已同意 21 天 | Telegram 认证 | 有效学习日 | 每周至少 5 天 | 完成 21 天 | FWPR-7 | Day21 DoD | 支付 $9.9 | 不付费原因 | 完成来源分布 | 备注 |
|---|---|---|---|---|---:|---|---|---:|---|---|---|---|---|---|---|---|
${users}

## 2. 每周复盘摘要

### Week 1
- 参与人数：
- 有效学习人数：
- FWPR-7：
- 最大阻断点：
- 下周只改三件事：

### Week 2
- 参与人数：
- 有效学习人数：
- 课程/提醒调整：
- 最大阻断点：
- 下周只改三件事：

### Week 3
- 完成 21 天人数：
- Day21 DoD：
- 真实支付：
- 不付费原因 Top 3：
- 是否进入下一轮：

## 3. Machine-readable metrics

seed_result: TODO
participants_total: 0
qualified_seed_users: 0
completed_21d: 0
completed_users_with_15_valid_days: 0
paid_9_9: 0
fwpr_7: 0
day21_dod: 0
day0_day21_comparison: 0
unpaid_reasons_recorded: no
completion_sources_recorded: no
blocking_bugs: TODO

validator_hint: 21 天结束后填好上面的数字，然后运行 \`npm run seed:validate -- --file <this-file>\`。
`;

if (existsSync(outputPath)) {
  console.error(`ERROR: seed validation run already exists: ${outputPath}`);
  process.exit(1);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, content, "utf8");
console.log(`Seed validation run created: ${outputPath}`);
