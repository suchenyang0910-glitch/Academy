import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const miniAppRoot = resolve(scriptDir, "..");

const SOURCES = {
  page: {
    path: resolve(miniAppRoot, "app", "page.tsx"),
    content: readFileSync(resolve(miniAppRoot, "app", "page.tsx"), "utf8"),
  },
  reminders: {
    path: resolve(miniAppRoot, "lib", "reminders.ts"),
    content: readFileSync(resolve(miniAppRoot, "lib", "reminders.ts"), "utf8"),
  },
  i18n: {
    path: resolve(miniAppRoot, "lib", "i18n.ts"),
    content: readFileSync(resolve(miniAppRoot, "lib", "i18n.ts"), "utf8"),
  },
  runtimeCopy: {
    path: resolve(miniAppRoot, "lib", "runtime-copy.ts"),
    content: readFileSync(resolve(miniAppRoot, "lib", "runtime-copy.ts"), "utf8"),
  },
};

const REQUIRED_UI_LOCALES = ['"zh-Hans"', "vi", "km", "th"];

function extractBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start < 0) {
    throw new Error(`Missing block start: ${startMarker}`);
  }
  const end = endMarker ? source.indexOf(endMarker, start + startMarker.length) : -1;
  return source.slice(start, end > start ? end : undefined);
}

function requirePattern(label, sourceName, source, pattern) {
  if (!pattern.test(source)) {
    throw new Error(`${label}: missing ${pattern} in ${SOURCES[sourceName].path}`);
  }
}

function requireLocales(label, sourceName, block) {
  for (const locale of REQUIRED_UI_LOCALES) {
    requirePattern(label, sourceName, block, new RegExp(`${locale}\\s*:`));
  }
}

const page = SOURCES.page.content;
const reminders = SOURCES.reminders.content;
const i18n = SOURCES.i18n.content;
const runtimeCopy = SOURCES.runtimeCopy.content;

const coreLocalizedCopy = extractBlock(i18n, "const COPY", "export const LOCALE_LABELS");
const runtimeLocalizedCopy = extractBlock(runtimeCopy, "export function profileRuntimeCopy");
const courseShellCopy = extractBlock(runtimeCopy, "export function courseRuntimeCopy", "export function lessonRuntimeCopy");
const lessonCopy = extractBlock(runtimeCopy, "export function lessonRuntimeCopy", "export function assessmentRuntimeCopy");
const assessmentCopy = extractBlock(runtimeCopy, "export function assessmentRuntimeCopy", "export function reviewRuntimeCopy");
const reviewCopy = extractBlock(runtimeCopy, "export function reviewRuntimeCopy", "export function profileRuntimeCopy");
const profileCopy = extractBlock(runtimeCopy, "export function profileRuntimeCopy", "export function testReminderCopy");
const testReminderCopy = extractBlock(runtimeCopy, "export function testReminderCopy", "export function starsStatusCopy");
const starsCopy = extractBlock(runtimeCopy, "export function starsStatusCopy", "export function reminderHistoryTitle");
const reminderHistoryCopy = extractBlock(
  runtimeCopy,
  "export function reminderHistoryTitle",
  "export function reminderDiagnosticCopy",
);
const reminderDiagnosticCopy = extractBlock(runtimeCopy, "export function reminderDiagnosticCopy");

const COPY_BLOCKS = [
  {
    label: "profile runtime copy",
    sourceName: "runtimeCopy",
    block: profileCopy,
    requiredTokens: [
      "paymentEnabledNote",
      "paymentDisabledNote",
      "inviteCodeCopied",
      "remindersTitle",
    ],
  },
  {
    label: "core payment/invite/credits copy",
    sourceName: "i18n",
    block: coreLocalizedCopy,
    requiredTokens: [
      "paymentRefundPolicy",
      "paymentOpenInTelegramRequired",
      "paymentStatusPending",
      "paymentStatusPaid",
      "paymentStatusFailed",
      "paymentStatusCancelled",
      "pricingPreviewFailed",
      "referralQualifiedDefinition",
      "referralValidBehavior",
      "creditsLedgerTitle",
    ],
  },
  {
    label: "test reminder runtime copy",
    sourceName: "runtimeCopy",
    block: testReminderCopy,
    requiredTokens: ["button", "sending", "sent", "failed", "skipped"],
  },
  {
    label: "Stars status runtime copy",
    sourceName: "runtimeCopy",
    block: starsCopy,
    requiredTokens: [
      "planDisabled",
      "ready",
      "missingBot",
      "missingWebhook",
      "missingStars",
      "unavailable",
    ],
  },
  {
    label: "reminder history runtime copy",
    sourceName: "runtimeCopy",
    block: reminderHistoryCopy,
    requiredTokens: [
      "reminderHistoryTitle",
      "reminderHistoryEmpty",
      "reminderHistorySummary",
      "reminderHistoryStatus",
      "completed",
      "opened",
      "delivered",
      "failed",
      "missing_telegram_id",
      "queued",
    ],
  },
  {
    label: "reminder diagnostic runtime copy",
    sourceName: "runtimeCopy",
    block: reminderDiagnosticCopy,
    requiredTokens: [
      "scheduled",
      "eligible_now",
      "paused",
      "missing_telegram_id",
      "access_expired",
      "no_active_courses",
      "completed_today",
      "do_not_disturb",
    ],
  },
  {
    label: "lesson runtime copy",
    sourceName: "runtimeCopy",
    block: lessonCopy,
    requiredTokens: [
      "learnFirstTitle",
      "lessonCheckTitle",
      "choiceProgress",
      "submitEvidence",
      "aiCoach",
      "revisionSaved",
    ],
  },
  {
    label: "assessment runtime copy",
    sourceName: "runtimeCopy",
    block: assessmentCopy,
    requiredTokens: [
      "whyNow",
      "stageTask",
      "rubricTitle",
      "submitAssessment",
      "currentScore",
      "savedForRevision",
    ],
  },
  {
    label: "review runtime copy",
    sourceName: "runtimeCopy",
    block: reviewCopy,
    requiredTokens: [
      "weeklyReview",
      "recoveryMission",
      "nextAction",
      "openAssessment",
      "openHistoricalLesson",
      "resolvedToast",
    ],
  },
];

for (const copyBlock of COPY_BLOCKS) {
  requireLocales(copyBlock.label, copyBlock.sourceName, copyBlock.block);
  for (const token of copyBlock.requiredTokens) {
    requirePattern(copyBlock.label, copyBlock.sourceName, copyBlock.block, new RegExp(token));
  }
}

for (const copyBlock of [
  {
    label: "course shell runtime copy",
    sourceName: "runtimeCopy",
    block: courseShellCopy,
    requiredTokens: [
      "coursePlanUpdated",
      "savedToast",
      "goalEvidenceRate",
      "effectiveLearningDays",
      "missionDoneTitle",
      "missionAssessmentTitle",
    ],
  },
]) {
  requireLocales(copyBlock.label, copyBlock.sourceName, copyBlock.block);
  for (const token of copyBlock.requiredTokens) {
    requirePattern(copyBlock.label, copyBlock.sourceName, copyBlock.block, new RegExp(token));
  }
}

for (const exportedName of [
  "testReminderCopy",
  "profileRuntimeCopy",
  "courseRuntimeCopy",
  "notesRuntimeCopy",
  "progressRuntimeCopy",
  "todayRuntimeCopy",
  "lessonRuntimeCopy",
  "assessmentRuntimeCopy",
  "reviewRuntimeCopy",
  "starsStatusCopy",
  "reminderHistoryTitle",
  "reminderHistoryEmpty",
  "reminderHistorySummary",
  "reminderHistoryStatus",
  "reminderDiagnosticCopy",
]) {
  requirePattern(
    "runtime copy module exports",
    "runtimeCopy",
    runtimeCopy,
    new RegExp(`export function ${exportedName}`),
  );
}

const reminderTemplateBlock = extractBlock(reminders, "const L1", "export function selectReminder");
for (const pattern of [
  /const L1 = \[/,
  /const L2 = \[/,
  /const L3 = \[/,
  /const L4 = \[/,
  /const LOCALIZED_COPY = \{/,
  /buttons: \[/,
  /messages: \[/,
  /locale: "zh-Hans"/,
  /locale as "vi" \| "km" \| "th"/,
]) {
  requirePattern("localized reminder template pool", "reminders", reminderTemplateBlock, pattern);
}
for (const locale of ["vi", "km", "th"]) {
  requirePattern("localized reminder template pool", "reminders", reminderTemplateBlock, new RegExp(`${locale}: \\{`));
}
requirePattern(
  "localized reminder template pool",
  "reminders",
  reminderTemplateBlock,
  /copy\.buttons\[levelIndex\]/,
);

console.log("Localized UI/reminder/payment/invite copy coverage verified.");
