import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(".");

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function requireFile(path) {
  const fullPath = resolve(root, path);
  if (!existsSync(fullPath)) {
    throw new Error(`Missing required file or route: ${path}`);
  }
}

function requirePattern(label, path, pattern) {
  const content = read(path);
  if (!pattern.test(content)) {
    throw new Error(`${label}: ${path} missing ${pattern}`);
  }
}

function forbidPattern(label, path, pattern) {
  const content = read(path);
  if (pattern.test(content)) {
    throw new Error(`${label}: ${path} unexpectedly matched ${pattern}`);
  }
}

const requiredRoutes = [
  "app/api/academy/bootstrap/route.ts",
  "app/api/academy/enrollments/route.ts",
  "app/api/academy/submissions/route.ts",
  "app/api/academy/notes/route.ts",
  "app/api/academy/reminders/test/route.ts",
  "app/api/academy/reminders/open/route.ts",
  "app/api/academy/payments/invoice/route.ts",
  "app/api/academy/pricing/preview/route.ts",
  "app/api/academy/pricing/lock/route.ts",
  "app/api/academy/competency-proof/route.ts",
  "app/api/academy/admin/bot/validation-dashboard/route.ts",
  "app/api/academy/admin/ops-dashboard/route.ts",
  "app/api/telegram/webhook/route.ts",
];

for (const route of requiredRoutes) requireFile(route);
requireFile("scripts/check-reminder-health.mjs");
requireFile("scripts/check-access-gates.mjs");
requireFile("scripts/create-seed-validation-run.mjs");
requireFile("scripts/validate-seed-validation-run.mjs");

forbidPattern(
  "visible UI copy must live in runtime/i18n copy modules",
  "app/page.tsx",
  /[\u4e00-\u9fff\u0e00-\u0e7f\u1780-\u17ff]/,
);

const pageChecks = [
  ["Telegram identity header", /x-telegram-init-data/],
  ["saved UI locale", /api\/academy\/preferences/],
  ["course picker", /CoursePicker/],
  ["choice-based lesson checks", /correctOptionId/],
  ["all choices required before submit", /selectedOptions/],
  ["lesson evidence submission", /api\/academy\/submissions/],
  ["sticky lesson submit bar", /lesson-submit-bar/],
  ["test reminder action", /api\/academy\/reminders\/test/],
  ["reminder open tracking", /api\/academy\/reminders\/open/],
  ["Telegram Stars invoice", /openInvoice/],
  ["payment lock before invoice", /api\/academy\/pricing\/lock/],
  ["Stars payment states", /paid.*pending.*failed.*cancelled/s],
  ["invite sharing", /shareMiniApp/],
  ["credits ledger display", /creditsLedgerTypeCopy/],
  ["competency proof share", /createProofShare/],
  ["runtime copy usage", /todayRuntimeCopy/],
  ["request error localization", /requestRuntimeCopy/],
];

for (const [label, pattern] of pageChecks) {
  requirePattern(label, "app/page.tsx", pattern);
}

const cssChecks = [
  ["iOS safe area", /env\(safe-area-inset-bottom\)/],
  ["sticky lesson submit bar CSS", /\.lesson-submit-bar/],
  ["mobile input zoom guard", /font-size:\s*16px/],
];

for (const [label, pattern] of cssChecks) {
  requirePattern(label, "app/globals.css", pattern);
}

const paymentChecks = [
  ["Telegram Stars currency", /currency:\s*"XTR"/],
  ["pre-checkout callback", /answerPreCheckoutQuery/],
  ["server successful payment callback", /successful_payment/],
  ["server refund callback", /refunded_payment/],
  ["server-side subscription grant", /INSERT INTO subscriptions/],
  ["payment transaction ledger", /INSERT INTO payment_transactions/],
  ["payment env aliases", /ACADEMY_STARS_MONTHLY/],
];

for (const [label, pattern] of paymentChecks) {
  requirePattern(label, "lib/telegram-payments.ts", pattern);
}

const storeChecks = [
  ["qualified referral requires paid user", /paid\.paidAt.*invitation\.createdAt/s],
  ["qualified referral requires learning behavior", /Number\(validDays\?\.count.*\) >= 3/s],
  ["referral credit ledger idempotency", /businessKey: `referral_reward:/],
  ["accepted evidence drives progress", /ev\.status = 'accepted'/],
  ["server validates selected answers", /selectedAnswers/],
  ["reminder delivery events", /deliverDueReminders/],
  ["reminder diagnostic data", /buildReminderDiagnostic/],
  ["course quality review events", /quiz_low_first_pass/],
  ["goal runtime checks", /evaluateStructuredAgentRuntimeCheck/],
];

for (const [label, pattern] of storeChecks) {
  requirePattern(label, "lib/academy-store.ts", pattern);
}

const runtimeCopyChecks = [
  ["four-language request errors", /export function requestRuntimeCopy/],
  ["four-language course shell", /export function courseRuntimeCopy/],
  ["four-language lesson shell", /export function lessonRuntimeCopy/],
  ["four-language profile/payment shell", /export function profileRuntimeCopy/],
  ["four-language reminder diagnostics", /export function reminderDiagnosticCopy/],
  ["extension course cards", /extensionPaths/],
];

for (const [label, pattern] of runtimeCopyChecks) {
  requirePattern(label, "lib/runtime-copy.ts", pattern);
}

const curriculumChecks = [
  ["explicit AI core principle before quiz", /核心原则：\$\{core\}/],
  ["explicit AI capability objective before quiz", /能力目标：\$\{objective\}/],
];

for (const [label, pattern] of curriculumChecks) {
  requirePattern(label, "lib/curriculum.ts", pattern);
}

requirePattern(
  "curriculum quality gate",
  "package.json",
  /content:quality:check[\s\S]*check-curriculum-quality\.mjs/,
);

const scriptChecks = [
  ["PostgreSQL production gate", /OK postgres production schema/],
  ["safe restart signal", /restart_safe=yes/],
  ["unsafe restart signal", /restart_safe=no/],
  ["migration checksum gate", /Checksum mismatch/],
];

for (const [label, pattern] of scriptChecks) {
  requirePattern(label, "scripts/check-postgres.mjs", pattern);
}

const reminderHealthChecks = [
  ["reminder timer systemd check", /academy-reminders\.timer/],
  ["reminder ops dashboard check", /\/api\/academy\/admin\/ops-dashboard/],
  ["reminder next action", /send_test_reminder_from_mini_app_and_confirm_telegram_delivery/],
];

for (const [label, pattern] of reminderHealthChecks) {
  requirePattern(label, "scripts/check-reminder-health.mjs", pattern);
}

const seedValidationChecks = [
  ["seed run creator", /participants_total: 0/],
  ["seed validator threshold participants", /participantsTotal < 10/],
  ["seed validator threshold completed", /completed21d < 3/],
  ["seed validator threshold paid", /paid99 < 1/],
  ["seed validator unpaid reason requirement", /unpaidReasonsRecorded !== "yes"/],
];

for (const [label, pattern] of seedValidationChecks) {
  requirePattern(
    label,
    label === "seed run creator"
      ? "scripts/create-seed-validation-run.mjs"
      : "scripts/validate-seed-validation-run.mjs",
    pattern,
  );
}

const accessGateChecks = [
  ["learning access gate command", /access:check/],
  ["review queue protected write", /resolveReviewQueueEntry/],
  ["learning access assertion", /await assertLearningAccess\(identity\)/],
  ["protected learning writes list", /protectedLearningWrites/],
];

for (const [label, pattern] of accessGateChecks) {
  requirePattern(
    label,
    label === "learning access gate command" ? "package.json" : "scripts/check-access-gates.mjs",
    pattern,
  );
}

const docs = read("../docs/TELEGRAM_MINI_APP_ACCEPTANCE_CHECKLIST.md");
for (const token of [
  "npm run acceptance:new",
  "npm run acceptance:validate",
  "docs/acceptance-runs/",
  "P0 发布判定",
  "Telegram Stars 支付状态",
  "邀请与裂变",
  "移动端输入体验",
  "Telegram 提醒",
  "选择题检查与提交",
]) {
  if (!docs.includes(token)) {
    throw new Error(`Acceptance checklist missing section: ${token}`);
  }
}

console.log("OK static P0 acceptance surface");
console.log("manual_required=yes");
console.log("next_action=run Telegram Mini App real-device checklist");
