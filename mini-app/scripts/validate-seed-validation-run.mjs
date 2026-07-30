import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseArgs(argv) {
  const args = {
    file: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--file") {
      args.file = String(argv[i + 1] ?? "");
      i += 1;
    }
  }

  return args;
}

function fail(message, details = []) {
  console.error("seed_validation=fail");
  console.error(`reason=${message}`);
  for (const detail of details) console.error(`missing=${detail}`);
  process.exit(1);
}

function readMetric(content, key) {
  const match = content.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? "";
}

function readNumberMetric(content, key) {
  const raw = readMetric(content, key);
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    fail(`metric ${key} must be a number`, [`${key}: ${raw || "empty"}`]);
  }
  return value;
}

const args = parseArgs(process.argv.slice(2));
if (!args.file) fail("missing --file <docs/seed-runs/...md>");

const filePath = resolve(args.file);
if (!existsSync(filePath)) fail(`file not found: ${filePath}`);

const content = readFileSync(filePath, "utf8");
const result = readMetric(content, "seed_result").toLowerCase();
const participantsTotal = readNumberMetric(content, "participants_total");
const qualifiedSeedUsers = readNumberMetric(content, "qualified_seed_users");
const completed21d = readNumberMetric(content, "completed_21d");
const completedUsersWith15ValidDays = readNumberMetric(
  content,
  "completed_users_with_15_valid_days",
);
const paid99 = readNumberMetric(content, "paid_9_9");
const fwpr7 = readNumberMetric(content, "fwpr_7");
const day21Dod = readNumberMetric(content, "day21_dod");
const day0Day21Comparison = readNumberMetric(content, "day0_day21_comparison");
const unpaidReasonsRecorded = readMetric(content, "unpaid_reasons_recorded").toLowerCase();
const completionSourcesRecorded = readMetric(content, "completion_sources_recorded").toLowerCase();
const blockingBugs = readMetric(content, "blocking_bugs").toLowerCase();

const missing = [];
if (result !== "pass") missing.push(`seed_result must be pass, got ${result || "empty"}`);
if (participantsTotal < 10) missing.push("participants_total must be >= 10");
if (qualifiedSeedUsers < 10) missing.push("qualified_seed_users must be >= 10");
if (completed21d < 3) missing.push("completed_21d must be >= 3");
if (completedUsersWith15ValidDays < completed21d) {
  missing.push("completed_users_with_15_valid_days must cover all completed users");
}
if (paid99 < 1) missing.push("paid_9_9 must be >= 1");
if (fwpr7 < 1) missing.push("fwpr_7 should be recorded and > 0");
if (day21Dod < 1) missing.push("day21_dod should be recorded and > 0");
if (day0Day21Comparison < 1) missing.push("day0_day21_comparison must be >= 1");
if (unpaidReasonsRecorded !== "yes") missing.push("unpaid_reasons_recorded must be yes");
if (completionSourcesRecorded !== "yes") missing.push("completion_sources_recorded must be yes");
if (blockingBugs !== "no") missing.push("blocking_bugs must be no");

if (missing.length > 0) {
  fail("seed validation thresholds not met", missing);
}

console.log("seed_validation=pass");
console.log(`participants_total=${participantsTotal}`);
console.log(`completed_21d=${completed21d}`);
console.log(`paid_9_9=${paid99}`);
console.log(`fwpr_7=${fwpr7}`);
console.log(`day21_dod=${day21Dod}`);
console.log("next_action=decide_second_seed_cohort_or_expand_course_scope");
