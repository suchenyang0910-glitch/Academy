import { randomBytes } from "node:crypto";
import { getD1 } from "../db";
import { getRuntimeEnv } from "./runtime-env";
import {
  COURSE_CATALOG,
  FIXED_LESSONS,
  type FixedLesson,
  type MultipleChoiceAssessment,
} from "./curriculum";
import {
  ASSESSMENT_STAGES,
  assessmentQuestionFor,
  type AssessmentStageKey,
} from "./ability-assessments";
import { REMINDER_TEMPLATES, selectReminder } from "./reminders";
import {
  getPaymentCatalog,
  sendTelegramBotMessage,
} from "./telegram-payments";
import { getAiRuntimeStatus, requestAiFeedback } from "./ai-feedback";
import { resolveAppLocale, SUPPORTED_LOCALES, type AppLocale } from "./i18n";
import { isMissingDatabaseRelationError } from "./db-errors";
import {
  ensureCreditsLedgerEntry,
  getCreditsBalance,
  listCreditsLedger,
  POINTS_PER_USD,
} from "./credits-ledger";

export type AcademyIdentity = {
  id: string;
  telegramId: string | null;
  displayName: string;
  telegramUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  languageCode: string | null;
  photoUrl: string | null;
  isPremium: boolean;
  startParam: string | null;
};

type AbilityAssessmentRecord = {
  id: number;
  courseId: string;
  stageKey: AssessmentStageKey;
  version: string;
  prompt: string;
  rubricJson: string;
  originalAnswer: string;
  revisedAnswer: string | null;
  score: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type ReviewQueueItem = {
  id: number;
  sourceType: string;
  sourceRef: string;
  courseId: string | null;
  lessonId: string | null;
  assessmentStageKey: string | null;
  reason: string;
  title: string;
  recommendation: string;
  dueOn: string;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ReminderPreferences = {
  enabled: boolean;
  reminderHour: number;
  dndStartHour: number | null;
  dndEndHour: number | null;
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

type RuntimeEnv = {
  TELEGRAM_BOT_TOKEN?: string;
  ACADEMY_ALLOW_FOUNDER_PREVIEW?: string;
  ACADEMY_CRON_SECRET?: string;
  ACADEMY_MINI_APP_URL?: string;
  TELEGRAM_BOT_USERNAME?: string;
  ACADEMY_UPLOAD_DIR?: string;
  ACADEMY_UPLOAD_MAX_BYTES?: string;
};

function runtimeEnv(): RuntimeEnv {
  return getRuntimeEnv<RuntimeEnv>();
}

type LessonMetadata = {
  criteria: string[];
  assessment?: MultipleChoiceAssessment;
};

type EvidenceType =
  | "quiz"
  | "project"
  | "runtime_success"
  | "reflection"
  | "checkpoint"
  | "review";

type EvidenceStatus = "accepted" | "needs_revision";

type GoalTemplateDefinition = {
  id: string;
  version: string;
  title: string;
  slogan: string;
  artifact: string;
  definitionOfDone: string[];
  checkpoints: Array<{
    id: string;
    day: number;
    label: string;
    title: string;
    outcome: string;
    evidence: string[];
    definitionOfDone: string[];
  }>;
};

type ProjectMilestoneRecord = {
  id: number;
  templateId: string;
  checkpointId: string;
  checkpointDay: number;
  artifactUrl: string | null;
  evidenceText: string;
  evidenceItems: string[];
  status: string;
  score: number;
  notes: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  submittedAt: string;
  updatedAt: string;
};

type UploadedArtifactRecord = {
  id: number;
  reference: string;
  purpose: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  status: string;
  createdAt: string;
};

type AgentRuntimeCheckRecord = {
  id: number;
  checkType: string;
  testCases: RuntimeTestCase[];
  result: Record<string, unknown>;
  status: string;
  score: number;
  notes: string | null;
  createdAt: string;
};

type AgentLabProjectRecord = {
  id: number;
  templateId: string;
  builderProvider: "flowise";
  builderProjectRef: string | null;
  workflowRef: string | null;
  workflowExport: Record<string, unknown>;
  status: string;
  runtimeStatus: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  runtimeChecks: AgentRuntimeCheckRecord[];
};

type KnowledgeSourceRecord = {
  id: number;
  sourceType: string;
  title: string;
  sourceUrl: string | null;
  canonicalRef: string;
  license: string | null;
  relevance: string;
  status: string;
  reviewNotes: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type CourseContentVersionRecord = {
  id: number;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  version: string;
  sourceRef: string;
  status: string;
  changeSummary: string;
  createdBy: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  lessonCount: number;
  approvedLocaleCount: number;
  draftLocaleCount: number;
  missingLocaleCount: number;
  updatedAt: string;
};

type LessonLocalizationReviewRecord = {
  lessonId: string;
  courseId: string;
  courseTitle: string;
  day: number;
  sourceTitle: string;
  locale: AppLocale;
  localizedTitle: string | null;
  reviewStatus: string;
  sourceVersion: string;
  reviewedAt: string | null;
  updatedAt: string | null;
};

type CourseQualityEventRecord = {
  id: number;
  courseId: string;
  courseTitle: string;
  lessonId: string | null;
  lessonDay: number | null;
  lessonTitle: string | null;
  contentVersionId: number | null;
  eventType: string;
  severity: string;
  status: string;
  sourceType: string;
  sourceRef: string;
  metrics: Record<string, unknown>;
  recommendation: string;
  createdBy: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  updatedAt: string;
};

type LocalizationImportResult = {
  locale: AppLocale;
  sourceVersion: string;
  courseUpserts: number;
  lessonUpserts: number;
  skippedApproved: number;
  errors: string[];
};

type RuntimeTestCase = {
  question: string;
  expected: string;
  actual: string;
  citation: string;
};

type StructuredRuntimeEvidenceCheck = {
  required: boolean;
  ok: boolean;
  validCaseCount: number;
  citationCaseCount: number;
  workflowExportProvided: boolean;
  errors: string[];
};

type RemoteRuntimeExecutionCheck = {
  mode: "flowise_prediction_v1" | "not_available";
  available: boolean;
  endpoint: string | null;
  attemptedCaseCount: number;
  successfulCaseCount: number;
  executions: Array<{
    question: string;
    ok: boolean;
    status: number | null;
    error: string | null;
    answerPreview: string;
  }>;
};

type CompetencyGraphNode = {
  id: string;
  title: string;
  description: string;
  level: number;
  category: string;
  weight: number;
  evidenceCount: number;
  score: number;
  status: "not_started" | "in_progress" | "evidenced";
  evidenceRefs: Array<{
    evidenceType: string;
    sourceType: string;
    sourceRef: string;
    score: number;
  }>;
};

const PRIMARY_GOAL_TEMPLATE_ID = "personal-knowledge-assistant-21d";

const GOAL_TEMPLATE_SEED = {
  id: PRIMARY_GOAL_TEMPLATE_ID,
  version: "v1",
  title: "Build a Personal Knowledge Assistant",
  slogan: "21 天做出一个可运行、可演示的个人知识助手。",
  artifact: "可上传文档、可提问、可回答并引用来源的 AI 助手原型。",
  definitionOfDone: [
    "可以上传或接入至少 1 份个人文档",
    "可以回答至少 5 个围绕文档的问题",
    "回答中能标注引用来源或明确说不知道",
    "保留 2 分钟演示、README 和测试记录",
  ],
  checkpoints: [
    {
      id: `${PRIMARY_GOAL_TEMPLATE_ID}:day0`,
      day: 0,
      label: "Day 0",
      title: "Environment Ready",
      outcome: "Flowise 模板、模型入口、测试文档与 3 个问题就绪。",
      evidence: ["环境检查截图或状态", "测试文档", "3 个固定测试问题"],
      definitionOfDone: [
        "能够打开指定 Flowise 模板或等价无代码入口",
        "模型入口已配置并能返回一次测试响应",
        "准备好一份可公开验证的测试文档和 3 个问题",
      ],
      sortOrder: 0,
    },
    {
      id: `${PRIMARY_GOAL_TEMPLATE_ID}:day7`,
      day: 7,
      label: "Day 7",
      title: "First Working Prototype",
      outcome: "对 3 个预设问题返回答案与来源引用。",
      evidence: ["运行日志", "3 个问题的答案", "来源引用字段或不知道边界"],
      definitionOfDone: [
        "至少 3 个预设问题可以得到回答",
        "回答能显示来源引用，或在资料不足时明确说不知道",
        "保留一次失败样例和修正记录",
      ],
      sortOrder: 7,
    },
    {
      id: `${PRIMARY_GOAL_TEMPLATE_ID}:day21`,
      day: 21,
      label: "Day 21",
      title: "Demo Day",
      outcome: "他人可上传文档、提问、查看答案和来源。",
      evidence: ["Flowise 导出或可访问链接", "2 分钟 Demo", "测试报告", "复盘"],
      definitionOfDone: [
        "原型可由第三方按说明运行",
        "至少 5 个围绕文档的问题通过测试",
        "提交 README、演示视频、测试结果和失败边界说明",
      ],
      sortOrder: 21,
    },
  ],
};

const COMPETENCY_NODE_SEED = [
  {
    id: "ai-foundation",
    title: "AI 基础理解",
    description: "能解释模型、上下文、幻觉和人机分工，不把 AI 当自动答案机。",
    level: 1,
    category: "ai",
    weight: 15,
    evidencePolicy: { acceptedAiQuizDays: [1, 2, 3] },
  },
  {
    id: "prompt-command",
    title: "Prompt 指挥能力",
    description: "能用角色、任务、约束、示例和反馈循环指挥 AI 完成具体工作。",
    level: 1,
    category: "ai",
    weight: 20,
    evidencePolicy: { acceptedAiQuizDays: [4, 5, 6, 7] },
  },
  {
    id: "knowledge-check",
    title: "知识检查能力",
    description: "能通过选择题和修正记录证明关键概念不是只看过，而是真的理解。",
    level: 1,
    category: "ai",
    weight: 15,
    evidencePolicy: { evidenceTypes: ["quiz"] },
  },
  {
    id: "prototype-build",
    title: "原型构建能力",
    description: "能完成 Personal Knowledge Assistant 的环境、Demo 和 DoD 里程碑。",
    level: 1,
    category: "ai",
    weight: 25,
    evidencePolicy: { projectMilestones: [0, 7, 21] },
  },
  {
    id: "runtime-validation",
    title: "运行验证能力",
    description: "能用测试问题、实际回答、引用来源和 workflow/export 证据验证原型可用。",
    level: 1,
    category: "ai",
    weight: 25,
    evidencePolicy: { evidenceTypes: ["runtime_success"] },
  },
];

const COURSE_COMPETENCY_MAPPINGS = [
  {
    courseId: "ai-command-skills",
    evidenceType: "quiz",
    nodeId: "knowledge-check",
  },
  {
    courseId: "ai-command-skills",
    evidenceType: "quiz",
    lessonDayMin: 1,
    lessonDayMax: 3,
    nodeId: "ai-foundation",
  },
  {
    courseId: "ai-command-skills",
    evidenceType: "quiz",
    lessonDayMin: 4,
    lessonDayMax: 7,
    nodeId: "prompt-command",
  },
  {
    sourceType: "project_milestone",
    checkpointDays: [0, 7, 21],
    nodeId: "prototype-build",
  },
  {
    sourceType: "project_milestone",
    evidenceType: "runtime_success",
    checkpointDayMin: 7,
    nodeId: "runtime-validation",
  },
  {
    courseId: "ai-command-skills",
    evidenceType: "checkpoint",
    nodeId: "ai-foundation",
  },
] as const;

const GOAL_PROGRESS_MAPPINGS = {
  [PRIMARY_GOAL_TEMPLATE_ID]: {
    requiredCourseId: "ai-command-skills",
    lessonEvidence: {
      evidenceType: "quiz",
      lessonIdPattern: /^ai-day-\d+$/,
      totalRequired: 21,
      maxProgress: 100,
    },
    milestoneProgress: [
      { checkpointDay: 0, progress: 10 },
      { checkpointDay: 7, progress: 35 },
      { checkpointDay: 21, progress: 100 },
    ],
  },
} as const;

function fallbackGoalTemplateDefinition(): GoalTemplateDefinition {
  return {
    id: GOAL_TEMPLATE_SEED.id,
    version: GOAL_TEMPLATE_SEED.version,
    title: GOAL_TEMPLATE_SEED.title,
    slogan: GOAL_TEMPLATE_SEED.slogan,
    artifact: GOAL_TEMPLATE_SEED.artifact,
    definitionOfDone: GOAL_TEMPLATE_SEED.definitionOfDone,
    checkpoints: GOAL_TEMPLATE_SEED.checkpoints.map((checkpoint) => ({
      id: checkpoint.id,
      day: checkpoint.day,
      label: checkpoint.label,
      title: checkpoint.title,
      outcome: checkpoint.outcome,
      evidence: checkpoint.evidence,
      definitionOfDone: checkpoint.definitionOfDone,
    })),
  };
}

async function upsertEvidenceItem(input: {
  userId: string;
  evidenceType: EvidenceType;
  sourceType: string;
  sourceRef: string | number;
  courseId?: string | null;
  lessonId?: string | null;
  assessmentStageKey?: string | null;
  sourceVersion?: string | null;
  status: EvidenceStatus;
  score: number;
  metadata?: Record<string, unknown>;
  occurredOn: string;
}) {
  await getD1()
    .prepare(
      `INSERT INTO evidence_items
         (user_id, evidence_type, source_type, source_ref, course_id, lesson_id,
          assessment_stage_key, source_version, status, score, metadata_json, occurred_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(source_type, source_ref) DO UPDATE SET
         evidence_type = excluded.evidence_type,
         course_id = excluded.course_id,
         lesson_id = excluded.lesson_id,
         assessment_stage_key = excluded.assessment_stage_key,
         source_version = excluded.source_version,
         status = excluded.status,
         score = excluded.score,
         metadata_json = excluded.metadata_json,
         occurred_on = excluded.occurred_on,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      input.userId,
      input.evidenceType,
      input.sourceType,
      String(input.sourceRef),
      input.courseId ?? null,
      input.lessonId ?? null,
      input.assessmentStageKey ?? null,
      input.sourceVersion ?? "v1",
      input.status,
      input.score,
      JSON.stringify(input.metadata ?? {}),
      input.occurredOn,
    )
    .run();
}

function lessonMetadataFromJson(raw: unknown): LessonMetadata {
  const parsed = JSON.parse(String(raw ?? "[]")) as unknown;
  if (Array.isArray(parsed)) {
    return { criteria: parsed.filter((item): item is string => typeof item === "string") };
  }
  if (!parsed || typeof parsed !== "object") return { criteria: [] };

  const record = parsed as { criteria?: unknown; assessment?: unknown };
  const criteria = Array.isArray(record.criteria)
    ? record.criteria.filter((item): item is string => typeof item === "string")
    : [];
  const assessment = record.assessment as MultipleChoiceAssessment | undefined;
  return assessment?.type === "multiple_choice" ? { criteria, assessment } : { criteria };
}

function lessonMetadataForStorage(lesson: FixedLesson) {
  return JSON.stringify({
    criteria: lesson.criteria,
    ...(lesson.assessment ? { assessment: lesson.assessment } : {}),
  });
}

async function localizedLesson(
  lesson: Record<string, unknown>,
  locale: AppLocale,
) {
  if (locale === "zh-Hans") {
    return { ...lesson, contentLocale: "zh-Hans", isContentFallback: false };
  }
  const translation = await getD1()
    .prepare(
      `SELECT title, objective, content, practice_prompt AS practicePrompt,
              criteria_json AS criteriaJson
       FROM lesson_localizations
       WHERE lesson_id = ? AND locale = ? AND review_status = 'approved'`,
    )
    .bind(String(lesson.id), locale)
    .first<Record<string, unknown>>();
  return translation
    ? { ...lesson, ...translation, contentLocale: locale, isContentFallback: false }
    : { ...lesson, contentLocale: "zh-Hans", isContentFallback: true };
}

function localDateKey(timezone = "Asia/Bangkok", date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function dateDistance(from: string, to: string) {
  const fromTime = Date.parse(`${from}T00:00:00Z`);
  const toTime = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(fromTime) || !Number.isFinite(toTime)) return 0;
  return Math.max(0, Math.floor((toTime - fromTime) / 86_400_000));
}

function parseDatabaseDate(value: string) {
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function databaseTimestamp(date: Date) {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

function datePart(value: string | null | undefined) {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  return normalized.slice(0, 10);
}

function localHour(timezone = "Asia/Bangkok", date = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      hour12: false,
    }).format(date),
  );
}

function hourInQuietWindow(
  hour: number,
  startHour: number | null,
  endHour: number | null,
) {
  if (
    !Number.isInteger(startHour) ||
    !Number.isInteger(endHour) ||
    startHour === endHour
  ) {
    return false;
  }
  if (startHour < endHour) {
    return hour >= startHour && hour < endHour;
  }
  return hour >= startHour || hour < endHour;
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function secureEqualHex(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function hmac(key: ArrayBuffer | string, value: string) {
  const keyBytes =
    typeof key === "string" ? new TextEncoder().encode(key) : new Uint8Array(key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value));
}

async function validateTelegramInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;

  params.delete("hash");
  const authDate = Number(params.get("auth_date") ?? "0");
  const nowSeconds = Date.now() / 1000;
  if (
    !Number.isFinite(authDate) ||
    nowSeconds - authDate > 86400 ||
    authDate - nowSeconds > 300
  ) {
    return null;
  }

  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secret = await hmac("WebAppData", botToken);
  const calculated = bytesToHex(await hmac(secret, dataCheckString));
  if (!secureEqualHex(calculated, hash.toLowerCase())) return null;

  const rawUser = params.get("user");
  if (!rawUser) return null;

  let user: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
    is_premium?: boolean;
  };
  try {
    user = JSON.parse(rawUser) as typeof user;
  } catch {
    return null;
  }
  if (!Number.isSafeInteger(user.id) || user.id <= 0) return null;
  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.username ||
    "Academy 学员";

  return {
    id: `tg:${user.id}`,
    telegramId: String(user.id),
    displayName,
    telegramUsername: user.username ?? null,
    firstName: user.first_name ?? null,
    lastName: user.last_name ?? null,
    languageCode: user.language_code ?? null,
    photoUrl: user.photo_url ?? null,
    isPremium: Boolean(user.is_premium),
    startParam: params.get("start_param"),
  } satisfies AcademyIdentity;
}

export async function getIdentity(request: Request): Promise<AcademyIdentity> {
  const env = runtimeEnv();
  const initData = request.headers.get("x-telegram-init-data") ?? "";

  if (env.TELEGRAM_BOT_TOKEN) {
    const identity = await validateTelegramInitData(
      initData,
      env.TELEGRAM_BOT_TOKEN,
    );
    if (!identity) {
      throw new Response("Telegram authentication required", { status: 401 });
    }
    return identity;
  }

  // Founder-only self-test mode is opt-in. A missing Bot Token must never
  // silently turn any deployment into an unsigned shared account.
  if (env.ACADEMY_ALLOW_FOUNDER_PREVIEW !== "true") {
    throw new Response("Telegram authentication is not configured", {
      status: 503,
    });
  }

  return {
    id: "founder",
    telegramId: null,
    displayName: "路飞",
    telegramUsername: "founder_preview",
    firstName: "路飞",
    lastName: null,
    languageCode: "zh-hans",
    photoUrl: null,
    isPremium: false,
    startParam: request.headers.get("x-academy-ref"),
  };
}

async function referralCodeFor(userId: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`academy:${userId}`),
  );
  return `A${bytesToHex(digest).slice(0, 8).toUpperCase()}`;
}

export async function ensureSeedData(identity: AcademyIdentity) {
  const d1 = getD1();
  const referralCode = await referralCodeFor(identity.id);
  await d1
    .prepare(
      `INSERT INTO users
         (id, telegram_id, display_name, telegram_username, first_name,
          last_name, language_code, ui_locale, photo_url, is_premium, referral_code, timezone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Asia/Bangkok')
       ON CONFLICT(id) DO UPDATE SET
         telegram_id = excluded.telegram_id,
         display_name = excluded.display_name,
         telegram_username = excluded.telegram_username,
         first_name = excluded.first_name,
         last_name = excluded.last_name,
         language_code = excluded.language_code,
         photo_url = excluded.photo_url,
         is_premium = excluded.is_premium,
         referral_code = COALESCE(users.referral_code, excluded.referral_code),
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      identity.id,
      identity.telegramId,
      identity.displayName,
      identity.telegramUsername,
      identity.firstName,
      identity.lastName,
      identity.languageCode,
      resolveAppLocale(identity.languageCode),
      identity.photoUrl,
      identity.isPremium ? 1 : 0,
      referralCode,
    )
    .run();

  const invitationCode = identity.startParam
    ?.replace(/^ref_/i, "")
    .trim()
    .toUpperCase();
  if (invitationCode && /^[A-Z0-9]{9}$/.test(invitationCode)) {
    const inviter = await d1
      .prepare("SELECT id FROM users WHERE referral_code = ?")
      .bind(invitationCode)
      .first<{ id: string }>();
    if (inviter && inviter.id !== identity.id) {
      await d1
        .prepare(
          `INSERT INTO invitations
             (inviter_user_id, invited_user_id, invite_code, status)
           VALUES (?, ?, ?, 'pending')
           ON CONFLICT(invited_user_id) DO NOTHING`,
        )
        .bind(inviter.id, identity.id, invitationCode)
        .run();
    }
  }

  const seeded = await d1
    .prepare("SELECT value FROM schema_version WHERE key = 'academy_seed'")
    .first<{ value: string }>();
  if (seeded?.value === "v10") return;

  const statements = [
    ...COURSE_CATALOG.map((course) =>
      d1
        .prepare(
          `INSERT INTO courses
             (id, slug, title, subtitle, summary, daily_minutes, duration_days, accent, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             title = excluded.title,
             subtitle = excluded.subtitle,
             summary = excluded.summary,
             daily_minutes = excluded.daily_minutes,
             duration_days = excluded.duration_days,
             accent = excluded.accent,
             status = excluded.status`,
        )
        .bind(
          course.id,
          course.slug,
          course.title,
          course.subtitle,
          course.summary,
          course.dailyMinutes,
          course.durationDays,
          course.accent,
          course.enabled ? "active" : "coming_soon",
        ),
    ),
    ...COURSE_CATALOG.map((course) =>
      d1
        .prepare(
          `INSERT INTO course_content_versions
             (course_id, version, source_ref, status, change_summary, created_by,
              reviewed_by, reviewed_at, published_at)
           VALUES (?, 'v1', 'academy_seed', 'published',
             'Initial fixed 60-day curriculum imported from code seed.',
             'academy-seed', 'academy-seed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT(course_id, version) DO UPDATE SET
             source_ref = excluded.source_ref,
             status = CASE
               WHEN course_content_versions.status = 'published' THEN course_content_versions.status
               ELSE excluded.status
             END,
             change_summary = excluded.change_summary,
             updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(course.id),
    ),
    ...FIXED_LESSONS.map((lesson) =>
      d1
        .prepare(
          `INSERT INTO lessons
             (id, course_id, day, level, round, title, objective, content,
              practice_prompt, criteria_json, estimated_minutes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             title = excluded.title,
             objective = excluded.objective,
             content = excluded.content,
             practice_prompt = excluded.practice_prompt,
             criteria_json = excluded.criteria_json,
             estimated_minutes = excluded.estimated_minutes`,
        )
        .bind(
          lesson.id,
          lesson.courseId,
          lesson.day,
          lesson.level,
          lesson.round,
          lesson.title,
          lesson.objective,
          lesson.content,
          lesson.practicePrompt,
          lessonMetadataForStorage(lesson),
          lesson.estimatedMinutes,
        ),
    ),
    d1
      .prepare(
        `INSERT INTO goal_templates
           (id, version, title, slogan, artifact, definition_of_done_json, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')
         ON CONFLICT(id) DO UPDATE SET
           version = excluded.version,
           title = excluded.title,
           slogan = excluded.slogan,
           artifact = excluded.artifact,
           definition_of_done_json = excluded.definition_of_done_json,
           status = excluded.status,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        GOAL_TEMPLATE_SEED.id,
        GOAL_TEMPLATE_SEED.version,
        GOAL_TEMPLATE_SEED.title,
        GOAL_TEMPLATE_SEED.slogan,
        GOAL_TEMPLATE_SEED.artifact,
        JSON.stringify(GOAL_TEMPLATE_SEED.definitionOfDone),
      ),
    ...GOAL_TEMPLATE_SEED.checkpoints.map((checkpoint) =>
      d1
        .prepare(
          `INSERT INTO goal_template_checkpoints
             (id, template_id, day, label, title, outcome, evidence_json,
              definition_of_done_json, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             day = excluded.day,
             label = excluded.label,
             title = excluded.title,
             outcome = excluded.outcome,
             evidence_json = excluded.evidence_json,
             definition_of_done_json = excluded.definition_of_done_json,
             sort_order = excluded.sort_order,
             updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(
          checkpoint.id,
          GOAL_TEMPLATE_SEED.id,
          checkpoint.day,
          checkpoint.label,
          checkpoint.title,
          checkpoint.outcome,
          JSON.stringify(checkpoint.evidence),
          JSON.stringify(checkpoint.definitionOfDone),
          checkpoint.sortOrder,
        ),
    ),
    ...REMINDER_TEMPLATES.map((template) =>
      d1
        .prepare(
          `INSERT INTO reminder_templates (id, level, content, button_text, weight, active)
           VALUES (?, ?, ?, ?, ?, 1)
           ON CONFLICT(id) DO UPDATE SET
             level = excluded.level,
             content = excluded.content,
             button_text = excluded.button_text,
             weight = excluded.weight`,
        )
        .bind(
          template.id,
          template.level,
          template.content,
          template.buttonText,
          template.weight,
        ),
    ),
    ...COMPETENCY_NODE_SEED.map((node) =>
      d1
        .prepare(
          `INSERT INTO competency_nodes
             (id, title, description, level, category, weight, evidence_policy_json, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
           ON CONFLICT(id) DO UPDATE SET
             title = excluded.title,
             description = excluded.description,
             level = excluded.level,
             category = excluded.category,
             weight = excluded.weight,
             evidence_policy_json = excluded.evidence_policy_json,
             status = excluded.status,
             updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(
          node.id,
          node.title,
          node.description,
          node.level,
          node.category,
          node.weight,
          JSON.stringify(node.evidencePolicy),
        ),
    ),
    d1
      .prepare(
        `INSERT INTO schema_version (key, value) VALUES ('academy_seed', 'v10')
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ),
  ];

  for (let offset = 0; offset < statements.length; offset += 40) {
    await d1.batch(statements.slice(offset, offset + 40));
  }
}

export async function getBootstrap(identity: AcademyIdentity) {
  const d1 = getD1();
  const user = await d1
    .prepare(
      `SELECT id, telegram_id AS telegramId, display_name AS displayName,
              telegram_username AS telegramUsername, first_name AS firstName,
              last_name AS lastName, language_code AS languageCode, ui_locale AS uiLocale,
              photo_url AS photoUrl, is_premium AS isPremium,
              reminder_enabled AS reminderEnabled,
              reminder_hour AS reminderHour,
              dnd_start_hour AS dndStartHour,
              dnd_end_hour AS dndEndHour,
              referral_code AS referralCode, timezone, trial_started_at AS trialStartedAt
       FROM users WHERE id = ?`,
    )
    .bind(identity.id)
    .first<{
      id: string;
      telegramId: string | null;
      displayName: string;
      telegramUsername: string | null;
      firstName: string | null;
      lastName: string | null;
      languageCode: string | null;
      uiLocale: string | null;
      photoUrl: string | null;
      isPremium: number;
      reminderEnabled: number;
      reminderHour: number;
      dndStartHour: number | null;
      dndEndHour: number | null;
      referralCode: string;
      timezone: string;
      trialStartedAt: string;
    }>();
  const timezone = user?.timezone || "Asia/Bangkok";
  const uiLocale = resolveAppLocale(user?.uiLocale ?? identity.languageCode);
  const todayKey = localDateKey(timezone);
  await syncEnrollmentDays(identity.id, todayKey);

  const [catalogResult, enrollmentResult, submissionResult, noteResult] =
    await Promise.all([
      d1
        .prepare(
          `SELECT id, slug, title, subtitle, summary, daily_minutes AS dailyMinutes,
                  duration_days AS durationDays, accent, status
           FROM courses ORDER BY created_at, id`,
        )
        .all(),
      d1
        .prepare(
          `SELECT e.id, e.course_id AS courseId, e.current_day AS currentDay,
                  e.active, e.started_on AS startedOn, c.title, c.slug, c.accent,
                  c.daily_minutes AS dailyMinutes
           FROM enrollments e
           JOIN courses c ON c.id = e.course_id
           WHERE e.user_id = ? AND e.active = 1
           ORDER BY e.enrolled_at`,
        )
        .bind(identity.id)
        .all(),
      d1
        .prepare(
          `SELECT lesson_id AS lessonId, status, rule_score AS ruleScore,
                  completion_source AS completionSource
           FROM submissions WHERE user_id = ?`,
        )
        .bind(identity.id)
        .all(),
      d1
        .prepare(
          `SELECT id, lesson_id AS lessonId, content, created_at AS createdAt
           FROM notes WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
        )
        .bind(identity.id)
        .all(),
    ]);

  const courseTranslations =
    uiLocale === "zh-Hans"
      ? []
      : (
          await d1
            .prepare(
              `SELECT course_id AS courseId, title, subtitle, summary
               FROM course_localizations
               WHERE locale = ? AND review_status = 'approved'`,
            )
            .bind(uiLocale)
            .all<{
              courseId: string;
              title: string;
              subtitle: string;
              summary: string;
            }>()
        ).results;
  const localizedCourses = new Map(
    courseTranslations.map((translation) => [translation.courseId, translation]),
  );
  const catalog = catalogResult.results.map((course) => ({
    ...course,
    ...(localizedCourses.get(String(course.id)) ?? {}),
    contentLocale: localizedCourses.has(String(course.id)) ? uiLocale : "zh-Hans",
    isContentFallback: uiLocale !== "zh-Hans" && !localizedCourses.has(String(course.id)),
  }));

  const enrollments = enrollmentResult.results as Array<{
    id: number;
    courseId: string;
    currentDay: number;
    active: number;
    startedOn: string;
    title: string;
    slug: string;
    accent: string;
    dailyMinutes: number;
  }>;
  const submissions = submissionResult.results as Array<{
    lessonId: string;
    status: string;
    ruleScore: number;
    completionSource: string;
  }>;
  let lessonEvidence: Array<{
    lessonId: string | null;
    status: string;
  }> = [];
  try {
    lessonEvidence = (
      await d1
        .prepare(
          `SELECT lesson_id AS lessonId,
                  status
           FROM evidence_items
           WHERE user_id = ?
             AND source_type = 'lesson_submission'`,
        )
        .bind(identity.id)
        .all<{
          lessonId: string | null;
          status: string;
        }>()
    ).results;
  } catch (error) {
    if (!isMissingDatabaseRelationError(error, ["evidence_items"])) {
      throw error;
    }
  }
  const evidenceStatusByLesson = new Map(
    lessonEvidence
      .filter((item) => item.lessonId)
      .map((item) => [String(item.lessonId), item.status]),
  );
  const submittedByLesson = new Map(
    submissions.map((submission) => [
      submission.lessonId,
      {
        ...submission,
        evidenceStatus: evidenceStatusByLesson.get(submission.lessonId) ?? null,
      },
    ]),
  );

  const today = await Promise.all(
    enrollments.map(async (enrollment) => {
      const lesson = await d1
        .prepare(
          `SELECT id, course_id AS courseId, day, level, round, title, objective,
                  content, practice_prompt AS practicePrompt,
                  criteria_json AS criteriaJson, estimated_minutes AS estimatedMinutes
           FROM lessons WHERE course_id = ? AND day = ?`,
        )
        .bind(enrollment.courseId, enrollment.currentDay)
        .first();

      const localized = lesson ? await localizedLesson(lesson, uiLocale) : null;
      return {
        enrollment,
        lesson: localized
          ? {
              ...localized,
              ...lessonMetadataFromJson(localized.criteriaJson),
              criteriaJson: undefined,
            }
          : null,
        submission: lesson
          ? submittedByLesson.get(String(lesson.id)) ?? null
          : null,
      };
    }),
  );

  const canStudyAheadByEnrollment = new Map(
    today.map((item) => {
      const calendarDay = Math.min(
        60,
        dateDistance(item.enrollment.startedOn, todayKey) + 1,
      );
      const lagDays = Math.max(0, calendarDay - item.enrollment.currentDay);
      const currentCompleted =
        item.submission?.status === "completed" &&
        item.submission.evidenceStatus === "accepted" &&
        item.submission.completionSource !== "extra";
      return [item.enrollment.id, lagDays === 0 && currentCompleted];
    }),
  );

  // Required work stays on the daily calendar. Study-ahead only opens after
  // today's required lesson is completed, and it closes again when the learner
  // has fallen behind.
  const learningAhead = (
    await Promise.all(
      enrollments.map(async (enrollment) => {
        if (!canStudyAheadByEnrollment.get(enrollment.id)) {
          return [];
        }
        const result = await d1
          .prepare(
            `SELECT id, course_id AS courseId, day, level, round, title, objective,
                    content, practice_prompt AS practicePrompt,
                    criteria_json AS criteriaJson, estimated_minutes AS estimatedMinutes
             FROM lessons
             WHERE course_id = ? AND day > ? AND day <= ?
             ORDER BY day
             LIMIT 3`,
          )
          .bind(
            enrollment.courseId,
            enrollment.currentDay,
            Math.min(60, enrollment.currentDay + 3),
          )
          .all();

        return Promise.all(result.results.map(async (lesson) => {
          const localized = await localizedLesson(lesson, uiLocale);
          return {
          enrollment,
          lesson: {
            ...localized,
            ...lessonMetadataFromJson(localized.criteriaJson),
            criteriaJson: undefined,
          },
          submission: submittedByLesson.get(String(lesson.id)) ?? null,
          isExtra: true,
          };
        }));
      }),
    )
  ).flat();

  const allCompleted =
    today.length > 0 &&
    today.every(
      (item) =>
        item.submission?.status === "completed" &&
        item.submission.evidenceStatus === "accepted" &&
        item.submission.completionSource !== "extra",
    );
  const lagDays = enrollments.reduce((maximum, enrollment) => {
    const calendarDay = Math.min(
      60,
      dateDistance(enrollment.startedOn, todayKey) + 1,
    );
    return Math.max(maximum, Math.max(0, calendarDay - enrollment.currentDay));
  }, 0);

  const referral = await getReferralSummary(identity.id, user?.referralCode);
  const access = await getLearningAccess(identity.id);
  const credits = await getCreditsBalance(identity.id);
  const creditsLedger = await listCreditsLedger(identity.id, { limit: 5 });
  const payment = getPaymentCatalog();
  const accessContinuation = buildAccessContinuation({
    access,
    referral,
    credits,
    payment,
  });
  const metrics = await getLearningMetrics(identity.id);
  const reminderHistory = (
    await d1
      .prepare(
        `SELECT id, level, delivery_status AS deliveryStatus,
                sent_at AS sentAt, delivered_at AS deliveredAt,
                clicked_at AS clickedAt, completed_at AS completedAt
         FROM reminder_events
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 5`,
      )
      .bind(identity.id)
      .all<{
        id: number;
        level: number;
        deliveryStatus: string;
        sentAt: string;
        deliveredAt: string | null;
        clickedAt: string | null;
        completedAt: string | null;
      }>()
  ).results;
  const reminderPreferences = reminderPreferencesFromUser(user ?? {});
  const reminderDiagnostic = buildReminderDiagnostic({
    user,
    preferences: reminderPreferences,
    accessActive: access.active,
    activeCourseCount: enrollments.length,
    allCompleted,
    lastEvent: reminderHistory[0] ?? null,
  });
  const abilityAssessments = await getAbilityAssessments(identity.id);
  const dueAssessments = await getDueAbilityAssessments(identity.id, enrollments);
  await reconcileReviewQueue(identity.id, timezone);
  const reviewQueue = await listReviewQueue(identity.id);
  const assessmentRecommendations = buildAssessmentRecommendations(
    catalog.map((item) => ({ id: String(item.id), title: String(item.title) })),
    dueAssessments,
    abilityAssessments,
  );
  let goalEvidence: Array<{
    lessonId: string | null;
    evidenceType: string;
    status: string;
  }> = [];
  try {
    goalEvidence = (
      await d1
        .prepare(
          `SELECT lesson_id AS lessonId,
                  evidence_type AS evidenceType,
                  status
           FROM evidence_items
           WHERE user_id = ?
             AND course_id = 'ai-command-skills'
             AND source_type = 'lesson_submission'`,
        )
        .bind(identity.id)
        .all<{
          lessonId: string | null;
          evidenceType: string;
          status: string;
        }>()
    ).results;
  } catch (error) {
    if (!isMissingDatabaseRelationError(error, ["evidence_items"])) {
      throw error;
    }
  }
  const goalTemplateDefinition = await getGoalTemplateDefinition(PRIMARY_GOAL_TEMPLATE_ID);
  const goalMilestones = await listProjectMilestones(
    identity.id,
    goalTemplateDefinition.id,
  );
  const goalTemplate = buildGoalTemplate({
    enrollments,
    evidenceItems: goalEvidence,
    template: goalTemplateDefinition,
    milestoneSubmissions: goalMilestones,
  });
  const agentLab = await getOrCreateAgentLabProject(
    identity.id,
    goalTemplateDefinition.id,
  );
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  let campaign: {
    id: string;
    name: string;
    rewardMode: string;
    stackableWithCredits: number;
    endAt: string;
  } | null = null;
  try {
    campaign = await d1
      .prepare(
        `SELECT id, name, reward_mode AS rewardMode,
                stackable_with_credits AS stackableWithCredits,
                end_at AS endAt
         FROM campaign_rewards
         WHERE status = 'active'
           AND start_at <= ? AND end_at > ?
         ORDER BY start_at DESC
         LIMIT 1`,
      )
      .bind(now, now)
      .first<{
        id: string;
        name: string;
        rewardMode: string;
        stackableWithCredits: number;
        endAt: string;
      }>();
  } catch (error) {
    if (!isMissingDatabaseRelationError(error, ["campaign_rewards"])) {
      throw error;
    }
  }

  return {
    user: user
      ? {
          ...user,
          uiLocale: resolveAppLocale(user.uiLocale ?? identity.languageCode),
          isPremium: Boolean(user.isPremium),
        }
      : identity,
    reminderPreferences,
    reminderDiagnostic,
    referral,
    access: {
      ...access,
      continuation: accessContinuation,
    },
    credits: {
      ...credits,
      ledger: creditsLedger.items,
    },
    pricing: {
      pointsPerUsd: POINTS_PER_USD,
      maxCreditsRedeemablePercent: 50,
    },
    campaign: campaign
      ? {
          mainOffer: {
            type: "campaign" as const,
            id: campaign.id,
            name: campaign.name,
            rewardMode: campaign.rewardMode,
            stackableWithCredits: Boolean(campaign.stackableWithCredits),
            validUntil: campaign.endAt,
          },
        }
      : { mainOffer: null },
    ai: getAiRuntimeStatus(),
    payment,
    catalog,
    enrollments,
    today,
    learningAhead,
    notes: noteResult.results,
    metrics,
    reminderHistory,
    abilityAssessments,
    dueAssessments,
    reviewQueue,
    assessmentRecommendations,
    goalTemplate,
    agentLab,
    supervision: {
      todayKey,
      timezone,
      allCompleted,
      lagDays,
      state: allCompleted
        ? "completed"
        : lagDays >= 2
          ? "interrupted"
          : lagDays === 1
            ? "behind"
            : "on_track",
    },
  };
}

export async function getLessonItem(
  identity: AcademyIdentity,
  lessonId: string,
) {
  const d1 = getD1();
  const user = await d1
    .prepare(
      `SELECT ui_locale AS uiLocale, language_code AS languageCode
       FROM users
       WHERE id = ?`,
    )
    .bind(identity.id)
    .first<{ uiLocale: string | null; languageCode: string | null }>();
  const uiLocale = resolveAppLocale(user?.uiLocale ?? user?.languageCode ?? identity.languageCode);

  const lesson = await d1
    .prepare(
      `SELECT l.id,
              l.course_id AS courseId,
              l.day,
              l.level,
              l.round,
              l.title,
              l.objective,
              l.content,
              l.practice_prompt AS practicePrompt,
              l.criteria_json AS criteriaJson,
              l.estimated_minutes AS estimatedMinutes,
              e.id AS enrollmentId,
              e.current_day AS currentDay,
              e.active,
              e.started_on AS startedOn,
              c.title AS courseTitle,
              c.slug,
              c.accent,
              c.daily_minutes AS dailyMinutes
       FROM lessons l
       JOIN courses c ON c.id = l.course_id
       JOIN enrollments e ON e.course_id = l.course_id
       WHERE l.id = ? AND e.user_id = ?
       ORDER BY e.active DESC, e.enrolled_at DESC
       LIMIT 1`,
    )
    .bind(lessonId, identity.id)
    .first<Record<string, unknown>>();

  if (!lesson) {
    throw new Response("历史课程不存在或不属于当前用户", { status: 404 });
  }

  const localized = await localizedLesson(lesson, uiLocale);
  const submission = await d1
    .prepare(
      `SELECT lesson_id AS lessonId,
              status,
              rule_score AS ruleScore,
              rule_feedback AS ruleFeedback,
              ai_feedback AS aiFeedback,
              completion_source AS completionSource
       FROM submissions
       WHERE user_id = ? AND lesson_id = ?`,
    )
    .bind(identity.id, lessonId)
    .first<{
      lessonId: string;
      status: string;
      ruleScore: number;
      ruleFeedback?: string;
      aiFeedback?: string | null;
      completionSource?: string;
    }>();
  let evidenceStatus: string | null = null;
  try {
    evidenceStatus =
      (
        await d1
          .prepare(
            `SELECT status
             FROM evidence_items
             WHERE user_id = ?
               AND lesson_id = ?
               AND source_type = 'lesson_submission'
             ORDER BY id DESC
             LIMIT 1`,
          )
          .bind(identity.id, lessonId)
          .first<{ status: string }>()
      )?.status ?? null;
  } catch (error) {
    if (!isMissingDatabaseRelationError(error, ["evidence_items"])) {
      throw error;
    }
  }

  return {
    enrollment: {
      id: Number(lesson.enrollmentId),
      courseId: String(lesson.courseId),
      currentDay: Number(lesson.currentDay),
      active: Number(lesson.active),
      startedOn: String(lesson.startedOn),
      title: String(lesson.courseTitle),
      slug: String(lesson.slug),
      accent: String(lesson.accent),
      dailyMinutes: Number(lesson.dailyMinutes),
    },
    lesson: {
      ...localized,
      ...lessonMetadataFromJson(localized.criteriaJson),
      criteriaJson: undefined,
    },
    submission: submission ? { ...submission, evidenceStatus } : null,
  };
}

export async function updateUserLocale(
  identity: AcademyIdentity,
  localeInput?: string,
): Promise<AppLocale> {
  const uiLocale = resolveAppLocale(localeInput ?? "");
  await getD1()
    .prepare(
      `UPDATE users
       SET ui_locale = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .bind(uiLocale, identity.id)
    .run();
  return uiLocale;
}

export async function updateUserPreferences(
  identity: AcademyIdentity,
  payload: {
    uiLocale?: string;
    reminderEnabled?: boolean;
    reminderHour?: number;
    dndStartHour?: number | null;
    dndEndHour?: number | null;
  },
): Promise<AppLocale> {
  const uiLocale = await updateUserLocale(identity, payload.uiLocale);
  const reminderHour = normalizeHour(
    payload.reminderHour ?? 20,
    "提醒时间",
  );
  const dndStartHour = normalizeHour(
    payload.dndStartHour ?? null,
    "免打扰开始时间",
  );
  const dndEndHour = normalizeHour(
    payload.dndEndHour ?? null,
    "免打扰结束时间",
  );

  await getD1()
    .prepare(
      `UPDATE users
       SET reminder_enabled = ?,
           reminder_hour = ?,
           dnd_start_hour = ?,
           dnd_end_hour = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .bind(
      payload.reminderEnabled === false ? 0 : 1,
      reminderHour ?? 20,
      dndStartHour,
      dndEndHour,
      identity.id,
    )
    .run();
  return uiLocale;
}

function parseUsdCents(value: string) {
  const normalized = value.trim().replace(/^\$/, "");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid usdPrice: ${value}`);
  }
  return Math.round(parsed * 100);
}

function normalizeHour(value: number | null | undefined, label: string) {
  if (value == null) return null;
  if (!Number.isInteger(value) || value < 0 || value > 23) {
    throw new Response(`${label} 必须是 0–23 的整数`, { status: 400 });
  }
  return value;
}

function reminderPreferencesFromUser(user: {
  reminderEnabled?: number | boolean | null;
  reminderHour?: number | null;
  dndStartHour?: number | null;
  dndEndHour?: number | null;
}): ReminderPreferences {
  return {
    enabled: user.reminderEnabled == null ? true : Boolean(user.reminderEnabled),
    reminderHour:
      Number.isInteger(user.reminderHour) && Number(user.reminderHour) >= 0
        ? Number(user.reminderHour)
        : 20,
    dndStartHour:
      user.dndStartHour == null ? null : Number(user.dndStartHour),
    dndEndHour: user.dndEndHour == null ? null : Number(user.dndEndHour),
  };
}

function reminderUrlWithEvent(
  miniAppUrl: string | null,
  reminderEventId: number,
) {
  if (!miniAppUrl) return null;
  const url = new URL(miniAppUrl);
  url.searchParams.set("reminder_event", String(reminderEventId));
  return url.toString();
}

function buildReminderDiagnostic(input: {
  user: {
    telegramId?: string | null;
    timezone?: string | null;
  } | null;
  preferences: ReminderPreferences;
  accessActive: boolean;
  activeCourseCount: number;
  allCompleted: boolean;
  lastEvent?: {
    level: number;
    deliveryStatus: string;
    sentAt: string;
    deliveredAt: string | null;
  } | null;
}) {
  const timezone = input.user?.timezone || "Asia/Bangkok";
  const now = new Date();
  const todayKey = localDateKey(timezone, now);
  const hour = localHour(timezone, now);
  const nextDateKey =
    Number.isFinite(hour) && hour < input.preferences.reminderHour
      ? todayKey
      : localDateKey(timezone, addDays(now, 1));
  const nextReminderLocal = `${nextDateKey} ${String(input.preferences.reminderHour).padStart(2, "0")}:00`;
  const quietNow = hourInQuietWindow(
    hour,
    input.preferences.dndStartHour,
    input.preferences.dndEndHour,
  );

  let reason: ReminderDiagnosticReason = "scheduled";
  if (!input.preferences.enabled) {
    reason = "paused";
  } else if (!input.user?.telegramId) {
    reason = "missing_telegram_id";
  } else if (!input.accessActive) {
    reason = "access_expired";
  } else if (input.activeCourseCount === 0) {
    reason = "no_active_courses";
  } else if (input.allCompleted) {
    reason = "completed_today";
  } else if (quietNow) {
    reason = "do_not_disturb";
  } else if (Number.isFinite(hour) && hour >= input.preferences.reminderHour) {
    reason = "eligible_now";
  }

  return {
    enabled: input.preferences.enabled,
    telegramBound: Boolean(input.user?.telegramId),
    timezone,
    nextReminderLocal:
      reason === "scheduled" || reason === "do_not_disturb" ? nextReminderLocal : null,
    reason,
    lastEvent: input.lastEvent ?? null,
  };
}

async function getGoalTemplateDefinition(
  templateId: string,
): Promise<GoalTemplateDefinition> {
  const d1 = getD1();
  try {
    const template = await d1
      .prepare(
        `SELECT id, version, title, slogan, artifact,
                definition_of_done_json AS definitionOfDoneJson
         FROM goal_templates
         WHERE id = ? AND status = 'active'`,
      )
      .bind(templateId)
      .first<{
        id: string;
        version: string;
        title: string;
        slogan: string;
        artifact: string;
        definitionOfDoneJson: string;
      }>();
    if (!template) return fallbackGoalTemplateDefinition();

    const checkpoints = (
      await d1
        .prepare(
          `SELECT id, day, label, title, outcome,
                  evidence_json AS evidenceJson,
                  definition_of_done_json AS definitionOfDoneJson
           FROM goal_template_checkpoints
           WHERE template_id = ?
           ORDER BY sort_order, day`,
        )
        .bind(template.id)
        .all<{
          id: string;
          day: number;
          label: string;
          title: string;
          outcome: string;
          evidenceJson: string;
          definitionOfDoneJson: string;
        }>()
    ).results;

    return {
      id: template.id,
      version: template.version,
      title: template.title,
      slogan: template.slogan,
      artifact: template.artifact,
      definitionOfDone: parseJsonArray(template.definitionOfDoneJson),
      checkpoints: checkpoints.map((checkpoint) => ({
        id: checkpoint.id,
        day: Number(checkpoint.day),
        label: checkpoint.label,
        title: checkpoint.title,
        outcome: checkpoint.outcome,
        evidence: parseJsonArray(checkpoint.evidenceJson),
        definitionOfDone: parseJsonArray(checkpoint.definitionOfDoneJson),
      })),
    };
  } catch (error) {
    if (
      isMissingDatabaseRelationError(error, [
        "goal_templates",
        "goal_template_checkpoints",
      ])
    ) {
      return fallbackGoalTemplateDefinition();
    }
    throw error;
  }
}

async function listProjectMilestones(
  userId: string,
  templateId: string,
): Promise<ProjectMilestoneRecord[]> {
  try {
    const rows = await getD1()
      .prepare(
        `SELECT id,
                template_id AS templateId,
                checkpoint_id AS checkpointId,
                checkpoint_day AS checkpointDay,
                artifact_url AS artifactUrl,
                evidence_text AS evidenceText,
                evidence_json AS evidenceJson,
                status,
                score,
                notes,
                reviewed_at AS reviewedAt,
                reviewed_by AS reviewedBy,
                submitted_at AS submittedAt,
                updated_at AS updatedAt
         FROM project_milestones
         WHERE user_id = ? AND template_id = ?
         ORDER BY checkpoint_day ASC`,
      )
      .bind(userId, templateId)
      .all<{
        id: number;
        templateId: string;
        checkpointId: string;
        checkpointDay: number;
        artifactUrl: string | null;
        evidenceText: string;
        evidenceJson: string;
        status: string;
        score: number;
        notes: string | null;
        reviewedAt: string | null;
        reviewedBy: string | null;
        submittedAt: string;
        updatedAt: string;
      }>();

    return rows.results.map((row) => ({
      id: Number(row.id),
      templateId: row.templateId,
      checkpointId: row.checkpointId,
      checkpointDay: Number(row.checkpointDay),
      artifactUrl: row.artifactUrl,
      evidenceText: row.evidenceText,
      evidenceItems: parseJsonArray(row.evidenceJson),
      status: row.status,
      score: Number(row.score),
      notes: row.notes,
      reviewedAt: row.reviewedAt,
      reviewedBy: row.reviewedBy,
      submittedAt: row.submittedAt,
      updatedAt: row.updatedAt,
    }));
  } catch (error) {
    if (isMissingDatabaseRelationError(error, ["project_milestones"])) {
      return [];
    }
    throw error;
  }
}

function parseRuntimeChecks(value: string | null | undefined) {
  try {
    return normalizeRuntimeTestCases(JSON.parse(String(value ?? "[]")));
  } catch {
    return [];
  }
}

function normalizeWorkflowExport(value: unknown) {
  if (!value) return {};
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      return parseJsonObject(trimmed);
    } catch {
      return { raw: trimmed.slice(0, 10_000) };
    }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeAgentRuntimeStatus(value: string | null | undefined) {
  const status = String(value ?? "").trim().toLowerCase();
  return new Set(["not_tested", "recorded", "passed", "failed"]).has(status)
    ? status
    : "recorded";
}

function urlFromReference(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function isBlockedIpv4(hostname: string) {
  const parts = hostname.split(".");
  if (parts.length !== 4) return false;
  const octets = parts.map((part) => Number(part));
  if (octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first === 169 && second === 254 ||
    first === 172 && second >= 16 && second <= 31 ||
    first === 192 && second === 168 ||
    first === 100 && second >= 64 && second <= 127 ||
    first === 198 && [18, 19].includes(second)
  );
}

function isBlockedIpv6(hostname: string) {
  const normalized = hostname.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    normalized.startsWith("::ffff:169.254.")
  );
}

function validatePublicRuntimeUrl(value: string | null | undefined) {
  const normalized = urlFromReference(value);
  if (!normalized) {
    return { ok: false, url: null, error: "runtime_url_invalid" };
  }
  const parsed = new URL(normalized);
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "metadata.google.internal" ||
    hostname === "host.docker.internal"
  ) {
    return { ok: false, url: null, error: "runtime_url_private_host" };
  }
  if (isBlockedIpv4(hostname) || isBlockedIpv6(hostname)) {
    return { ok: false, url: null, error: "runtime_url_private_ip" };
  }
  return { ok: true, url: normalized, error: null };
}

function flowisePredictionEndpoint(reference: string | null | undefined) {
  const safeUrl = validatePublicRuntimeUrl(reference);
  if (!safeUrl.ok || !safeUrl.url) return null;
  let parsed: URL;
  try {
    parsed = new URL(safeUrl.url);
  } catch {
    return null;
  }
  const segments = parsed.pathname.split("/").filter(Boolean);
  const predictionIndex = segments.findIndex((segment) => segment === "prediction");
  if (
    predictionIndex >= 1 &&
    segments[predictionIndex - 1] === "v1" &&
    segments[predictionIndex + 1]
  ) {
    return `${parsed.origin}/api/v1/prediction/${segments[predictionIndex + 1]}`;
  }
  for (const marker of ["chatflows", "chatflow", "chatbot"]) {
    const markerIndex = segments.findIndex((segment) => segment === marker);
    if (markerIndex >= 0 && segments[markerIndex + 1]) {
      return `${parsed.origin}/api/v1/prediction/${segments[markerIndex + 1]}`;
    }
  }
  const queryChatflowId =
    parsed.searchParams.get("chatflowId") ??
    parsed.searchParams.get("chatflowid");
  return queryChatflowId
    ? `${parsed.origin}/api/v1/prediction/${queryChatflowId}`
    : null;
}

function extractRuntimeAnswer(payload: unknown): string {
  if (typeof payload === "string") return payload.trim();
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  for (const key of ["text", "answer", "message", "response", "output"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  for (const key of ["data", "messages", "result"]) {
    const value = record[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = extractRuntimeAnswer(item);
        if (nested) return nested;
      }
    } else {
      const nested = extractRuntimeAnswer(value);
      if (nested) return nested;
    }
  }
  return "";
}

async function executeRemoteRuntimeCheck(
  reference: string | null,
  runtimeTests: RuntimeTestCase[],
): Promise<RemoteRuntimeExecutionCheck> {
  const endpoint = flowisePredictionEndpoint(reference);
  if (!endpoint) {
    return {
      mode: "not_available",
      available: false,
      endpoint: null,
      attemptedCaseCount: 0,
      successfulCaseCount: 0,
      executions: [],
    };
  }
  const testCases = runtimeTests
    .filter((item) => item.question.trim().length >= 5)
    .slice(0, 3);
  const executions: RemoteRuntimeExecutionCheck["executions"] = [];
  for (const testCase of testCases) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          question: testCase.question.trim(),
          streaming: false,
          overrideConfig: {
            sessionId: "academy-runtime-check",
          },
        }),
        signal: controller.signal,
        redirect: "manual",
        cache: "no-store",
      });
      const contentType = response.headers.get("content-type") ?? "";
      const body = /json/i.test(contentType)
        ? await response.json().catch(() => null)
        : await response.text().catch(() => "");
      const answer = extractRuntimeAnswer(body);
      executions.push({
        question: testCase.question,
        ok: response.ok && answer.length >= 10,
        status: response.status,
        error:
          !response.ok
            ? `http_${response.status}`
            : answer.length >= 10
              ? null
              : "answer_too_short",
        answerPreview: answer.slice(0, 280),
      });
    } catch (error) {
      executions.push({
        question: testCase.question,
        ok: false,
        status: null,
        error: error instanceof Error ? error.name || error.message : "fetch_failed",
        answerPreview: "",
      });
    } finally {
      clearTimeout(timer);
    }
  }
  return {
    mode: "flowise_prediction_v1",
    available: true,
    endpoint,
    attemptedCaseCount: executions.length,
    successfulCaseCount: executions.filter((item) => item.ok).length,
    executions,
  };
}

function parseJsonMaybe(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || !/^[\[{]/.test(trimmed)) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  const parsed = parseJsonMaybe(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : null;
}

function arrayValue(value: unknown): unknown[] {
  const parsed = parseJsonMaybe(value);
  return Array.isArray(parsed) ? parsed : [];
}

function nestedObject(root: Record<string, unknown>, path: string[]) {
  let current: unknown = root;
  for (const key of path) {
    const record = objectRecord(current);
    if (!record) return null;
    current = record[key];
  }
  return objectRecord(current);
}

function nestedArray(root: Record<string, unknown>, path: string[]) {
  let current: unknown = root;
  for (const key of path) {
    const record = objectRecord(current);
    if (!record) return [];
    current = record[key];
  }
  return arrayValue(current);
}

function flowiseNodeName(node: unknown) {
  const record = objectRecord(node);
  if (!record) return "";
  const data = objectRecord(record.data);
  const inputs = objectRecord(data?.inputs);
  return [
    record.id,
    record.type,
    record.label,
    record.name,
    data?.id,
    data?.type,
    data?.label,
    data?.name,
    data?.category,
    inputs?.modelName,
    inputs?.toolName,
  ]
    .filter(Boolean)
    .join(" ");
}

function isUsefulFlowiseNode(node: unknown) {
  return /\b(agent|chat|llm|model|openai|anthropic|deepseek|ollama|retriever|vector|embedding|tool|chain|memory|prompt|document|loader)\b/i.test(
    flowiseNodeName(node),
  );
}

function validateFlowiseWorkflowExport(workflowExport: Record<string, unknown>) {
  const provided = Object.keys(workflowExport).length > 0;
  const rawOnly =
    provided &&
    Object.keys(workflowExport).length === 1 &&
    typeof workflowExport.raw === "string";
  const candidateRoots = [
    workflowExport,
    objectRecord(workflowExport.flowData),
    objectRecord(workflowExport.chatflow),
    objectRecord(workflowExport.data),
    nestedObject(workflowExport, ["chatflow", "flowData"]),
    nestedObject(workflowExport, ["data", "flowData"]),
  ].filter(Boolean) as Record<string, unknown>[];

  const nodes =
    candidateRoots.flatMap((root) => [
      ...nestedArray(root, ["nodes"]),
      ...nestedArray(root, ["graph", "nodes"]),
      ...nestedArray(root, ["flowData", "nodes"]),
      ...nestedArray(root, ["data", "nodes"]),
    ]) ?? [];
  const edges =
    candidateRoots.flatMap((root) => [
      ...nestedArray(root, ["edges"]),
      ...nestedArray(root, ["graph", "edges"]),
      ...nestedArray(root, ["flowData", "edges"]),
      ...nestedArray(root, ["data", "edges"]),
    ]) ?? [];
  const uniqueNodeNames = new Set(nodes.map(flowiseNodeName).filter(Boolean));
  const usefulNodeCount = nodes.filter(isUsefulFlowiseNode).length;
  const hasFlowiseHint = candidateRoots.some((root) =>
    ["chatflowid", "chatflowId", "flowData", "nodes", "edges", "category", "deployed"].some(
      (key) => key in root,
    ),
  );
  const errors: string[] = [];
  if (!provided) errors.push("workflow_export_required");
  if (rawOnly) errors.push("workflow_export_invalid_json");
  if (provided && !hasFlowiseHint) errors.push("flowise_export_unrecognized");
  if (provided && nodes.length < 2) errors.push("flowise_nodes_min_2");
  if (provided && edges.length < 1) errors.push("flowise_edges_min_1");
  if (provided && usefulNodeCount < 1) errors.push("flowise_useful_node_required");
  const score = Math.min(
    20,
    (hasFlowiseHint ? 4 : 0) +
      Math.min(6, uniqueNodeNames.size * 2) +
      Math.min(5, edges.length * 2) +
      Math.min(5, usefulNodeCount * 5),
  );
  return {
    provided,
    ok: errors.length === 0,
    recognizedFormat: hasFlowiseHint,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    usefulNodeCount,
    score,
    errors,
  };
}

async function evaluateStructuredAgentRuntimeCheck(input: {
  runtimeTests: RuntimeTestCase[];
  workflowExport: Record<string, unknown>;
  workflowRef: string | null;
  builderProjectRef: string | null;
}) {
  const validCases = input.runtimeTests.filter(
    (testCase) =>
      testCase.question.length >= 5 &&
      testCase.expected.length >= 3 &&
      testCase.actual.length >= 10,
  );
  const citationCases = validCases.filter((testCase) =>
    hasCitationSignal(`${testCase.actual}\n${testCase.citation}`),
  );
  const workflowValidation = validateFlowiseWorkflowExport(input.workflowExport);
  const workflowExportProvided = workflowValidation.provided;
  const runtimeUrl =
    urlFromReference(input.workflowRef) ?? urlFromReference(input.builderProjectRef);
  const referenceCheck = await checkArtifactRuntime(runtimeUrl, 7);
  const remoteExecution = referenceCheck.ok
    ? await executeRemoteRuntimeCheck(runtimeUrl, input.runtimeTests)
    : ({
        mode: "not_available",
        available: false,
        endpoint: null,
        attemptedCaseCount: 0,
        successfulCaseCount: 0,
        executions: [],
      } satisfies RemoteRuntimeExecutionCheck);
  const errors: string[] = [];
  if (validCases.length < 3) errors.push("runtime_tests_min_3");
  if (citationCases.length < 2) errors.push("runtime_tests_citations_min_2");
  errors.push(...workflowValidation.errors);
  if (!referenceCheck.ok) errors.push(referenceCheck.error ?? "runtime_reference_unreachable");
  if (remoteExecution.available && remoteExecution.successfulCaseCount < 1) {
    errors.push("remote_runtime_execution_failed");
  }
  const score = Math.min(
    100,
    validCases.length * 18 +
      citationCases.length * 10 +
      workflowValidation.score +
      (referenceCheck.ok ? 20 : 0) +
      Math.min(12, remoteExecution.successfulCaseCount * 4),
  );
  return {
    status: errors.length === 0 && score >= 80 ? "passed" : "failed",
    score,
    audit: {
      mode: "structured_runtime_v2",
      validCaseCount: validCases.length,
      citationCaseCount: citationCases.length,
      workflowExportProvided,
      flowiseWorkflow: workflowValidation,
      referenceCheck,
      remoteExecution,
      errors,
    },
  };
}

async function listAgentRuntimeChecks(
  userId: string,
  agentProjectId: number,
): Promise<AgentRuntimeCheckRecord[]> {
  const rows = await getD1()
    .prepare(
      `SELECT id,
              check_type AS checkType,
              test_cases_json AS testCasesJson,
              result_json AS resultJson,
              status,
              score,
              notes,
              created_at AS createdAt
       FROM agent_runtime_checks
       WHERE user_id = ? AND agent_project_id = ?
       ORDER BY id DESC
       LIMIT 5`,
    )
    .bind(userId, agentProjectId)
    .all<{
      id: number;
      checkType: string;
      testCasesJson: string;
      resultJson: string;
      status: string;
      score: number;
      notes: string | null;
      createdAt: string;
    }>();

  return rows.results.map((row) => ({
    id: Number(row.id),
    checkType: row.checkType,
    testCases: parseRuntimeChecks(row.testCasesJson),
    result: parseJsonObject(row.resultJson),
    status: row.status,
    score: Number(row.score ?? 0),
    notes: row.notes,
    createdAt: row.createdAt,
  }));
}

function adapterMetadataFor(provider: "flowise") {
  return {
    adapter: `${provider}-adapter`,
    mode: "reference-only",
    coreBoundary:
      "Academy Core stores project identity, workflow references and runtime evidence; the external builder is replaceable.",
  };
}

async function getOrCreateAgentLabProject(
  userId: string,
  templateId: string,
): Promise<AgentLabProjectRecord | null> {
  try {
    const d1 = getD1();
    await d1
      .prepare(
        `INSERT INTO agent_lab_projects
           (user_id, template_id, builder_provider, status, runtime_status, metadata_json)
         VALUES (?, ?, 'flowise', 'draft', 'not_tested', ?)
         ON CONFLICT(user_id, template_id, builder_provider) DO NOTHING`,
      )
      .bind(userId, templateId, JSON.stringify(adapterMetadataFor("flowise")))
      .run();

    const project = await d1
      .prepare(
        `SELECT id,
                template_id AS templateId,
                builder_provider AS builderProvider,
                builder_project_ref AS builderProjectRef,
                workflow_ref AS workflowRef,
                workflow_export_json AS workflowExportJson,
                status,
                runtime_status AS runtimeStatus,
                metadata_json AS metadataJson,
                created_at AS createdAt,
                updated_at AS updatedAt
         FROM agent_lab_projects
         WHERE user_id = ? AND template_id = ? AND builder_provider = 'flowise'
         LIMIT 1`,
      )
      .bind(userId, templateId)
      .first<{
        id: number;
        templateId: string;
        builderProvider: "flowise";
        builderProjectRef: string | null;
        workflowRef: string | null;
        workflowExportJson: string;
        status: string;
        runtimeStatus: string;
        metadataJson: string;
        createdAt: string;
        updatedAt: string;
      }>();
    if (!project) return null;
    return {
      id: Number(project.id),
      templateId: project.templateId,
      builderProvider: "flowise",
      builderProjectRef: project.builderProjectRef,
      workflowRef: project.workflowRef,
      workflowExport: parseJsonObject(project.workflowExportJson),
      status: project.status,
      runtimeStatus: project.runtimeStatus,
      metadata: parseJsonObject(project.metadataJson),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      runtimeChecks: await listAgentRuntimeChecks(userId, Number(project.id)),
    };
  } catch (error) {
    if (isMissingDatabaseRelationError(error, ["agent_lab_projects", "agent_runtime_checks"])) {
      return null;
    }
    throw error;
  }
}

export async function saveAgentLabProject(
  identity: AcademyIdentity,
  payload: {
    templateId: string;
    builderProjectRef?: string | null;
    workflowRef?: string | null;
    workflowExport?: unknown;
  },
) {
  await assertLearningAccess(identity);
  const templateId = payload.templateId.trim();
  const template = await getGoalTemplateDefinition(templateId);
  if (template.id !== templateId) {
    throw new Response("Goal template is not available", { status: 404 });
  }
  const builderProjectRef = payload.builderProjectRef?.trim().slice(0, 500) || null;
  const workflowRef = payload.workflowRef?.trim().slice(0, 500) || null;
  const workflowExport = normalizeWorkflowExport(payload.workflowExport);
  const status = builderProjectRef || workflowRef || Object.keys(workflowExport).length
    ? "connected"
    : "draft";
  const saved = await getD1()
    .prepare(
      `INSERT INTO agent_lab_projects
         (user_id, template_id, builder_provider, builder_project_ref, workflow_ref,
          workflow_export_json, status, runtime_status, metadata_json)
       VALUES (?, ?, 'flowise', ?, ?, ?, ?, 'not_tested', ?)
       ON CONFLICT(user_id, template_id, builder_provider) DO UPDATE SET
         builder_project_ref = excluded.builder_project_ref,
         workflow_ref = excluded.workflow_ref,
         workflow_export_json = excluded.workflow_export_json,
         status = excluded.status,
         metadata_json = excluded.metadata_json,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
    )
    .bind(
      identity.id,
      template.id,
      builderProjectRef,
      workflowRef,
      JSON.stringify(workflowExport),
      status,
      JSON.stringify(adapterMetadataFor("flowise")),
    )
    .first<{ id: number }>();
  if (!saved) throw new Error("agent lab project was not saved");
  return getOrCreateAgentLabProject(identity.id, template.id);
}

export async function recordAgentRuntimeCheck(
  identity: AcademyIdentity,
  payload: {
    agentProjectId: number;
    status: string;
    score?: number;
    notes?: string | null;
    runtimeTests?: unknown;
    result?: Record<string, unknown> | null;
  },
) {
  await assertLearningAccess(identity);
  if (!Number.isInteger(payload.agentProjectId) || payload.agentProjectId <= 0) {
    throw new Response("agentProjectId is required", { status: 400 });
  }
  const project = await getD1()
    .prepare(
      `SELECT id,
              template_id AS templateId,
              builder_project_ref AS builderProjectRef,
              workflow_ref AS workflowRef,
              workflow_export_json AS workflowExportJson
       FROM agent_lab_projects
       WHERE id = ? AND user_id = ?`,
    )
    .bind(payload.agentProjectId, identity.id)
    .first<{
      id: number;
      templateId: string;
      builderProjectRef: string | null;
      workflowRef: string | null;
      workflowExportJson: string;
    }>();
  if (!project) throw new Response("Agent Lab project not found", { status: 404 });

  const runtimeTests = normalizeRuntimeTestCases(payload.runtimeTests);
  if (runtimeTests.length < 1) {
    throw new Response("at least one runtime test is required", { status: 400 });
  }
  const structuredCheck = await evaluateStructuredAgentRuntimeCheck({
    runtimeTests,
    workflowExport: parseJsonObject(project.workflowExportJson),
    workflowRef: project.workflowRef,
    builderProjectRef: project.builderProjectRef,
  });
  const status = structuredCheck.status;
  const score = Math.max(0, Math.min(100, structuredCheck.score));
  const notes = payload.notes?.trim().slice(0, 1_000) || null;
  const result = payload.result && typeof payload.result === "object" ? payload.result : {};
  const saved = await getD1()
    .prepare(
      `INSERT INTO agent_runtime_checks
         (user_id, agent_project_id, check_type, test_cases_json, result_json, status, score, notes)
       VALUES (?, ?, 'structured_runtime', ?, ?, ?, ?, ?)
       RETURNING id, created_at AS createdAt`,
    )
    .bind(
      identity.id,
      project.id,
      JSON.stringify(runtimeTests),
      JSON.stringify({
        ...result,
        structuredRuntime: structuredCheck.audit,
      }),
      status,
      score,
      notes,
    )
    .first<{ id: number; createdAt: string }>();
  if (!saved) throw new Error("runtime check was not saved");

  await getD1()
    .prepare(
      `UPDATE agent_lab_projects
       SET runtime_status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
    )
    .bind(status, project.id, identity.id)
    .run();

  await upsertEvidenceItem({
    userId: identity.id,
    evidenceType: "runtime_success",
    sourceType: "agent_runtime_check",
    sourceRef: saved.id,
    courseId: "ai-command-skills",
    sourceVersion: "agent-lab-v1",
    status: status === "passed" ? "accepted" : "needs_revision",
    score,
    metadata: {
      agentProjectId: project.id,
      templateId: project.templateId,
      builderProvider: "flowise",
      runtimeTests,
      result: {
        ...result,
        structuredRuntime: structuredCheck.audit,
      },
      notes,
    },
    occurredOn: localDateKey("Asia/Bangkok"),
  });

  return {
    id: Number(saved.id),
    checkType: "structured_runtime",
    testCases: runtimeTests,
    result: {
      ...result,
      structuredRuntime: structuredCheck.audit,
    },
    status,
    score,
    notes,
    createdAt: saved.createdAt,
  } satisfies AgentRuntimeCheckRecord;
}

function buildGoalTemplate(input: {
  enrollments: Array<{ courseId: string; currentDay: number }>;
  evidenceItems: Array<{ lessonId: string | null; status: string; evidenceType: string }>;
  template: GoalTemplateDefinition;
  milestoneSubmissions: ProjectMilestoneRecord[];
}) {
  const mapping = GOAL_PROGRESS_MAPPINGS[input.template.id];
  if (!mapping) return null;
  const aiEnrollment = input.enrollments.find(
    (enrollment) => enrollment.courseId === mapping.requiredCourseId,
  );
  if (!aiEnrollment) return null;

  const acceptedAiLessons = new Set(
    input.evidenceItems
      .filter(
        (item) =>
          item.status === "accepted" &&
          item.evidenceType === mapping.lessonEvidence.evidenceType &&
          item.lessonId != null &&
          mapping.lessonEvidence.lessonIdPattern.test(item.lessonId),
      )
      .map((item) => String(item.lessonId)),
  );
  const completedLessons = acceptedAiLessons.size;
  const currentDay = Math.min(Math.max(Number(aiEnrollment.currentDay ?? 1), 1), 60);
  const totalDays = mapping.lessonEvidence.totalRequired;
  const prototypeProgress = Math.min(
    mapping.lessonEvidence.maxProgress,
    Math.round((Math.min(completedLessons, totalDays) / totalDays) * 100),
  );
  const milestoneProgress = input.milestoneSubmissions
    .filter((milestone) => milestone.status === "accepted")
    .reduce((progress, milestone) => {
      const matched = mapping.milestoneProgress
        .filter((item) => milestone.checkpointDay >= item.checkpointDay)
        .sort((left, right) => right.checkpointDay - left.checkpointDay)[0];
      return Math.max(progress, matched?.progress ?? 0);
    }, 0);
  const nextCheckpoint =
    input.template.checkpoints.find((checkpoint) => checkpoint.day >= currentDay) ??
    input.template.checkpoints.at(-1) ??
    null;
  const milestone = nextCheckpoint
    ? `${nextCheckpoint.label} · ${nextCheckpoint.title}`
    : "Day 21 · 完成 2 分钟演示与 DoD 证据包";
  const nextEvidence =
    nextCheckpoint?.evidence.length
      ? nextCheckpoint.evidence.join(" / ")
      : "提交 Demo、README、测试问题和复盘，证明原型可运行。";

  return {
    id: input.template.id,
    version: input.template.version,
    title: input.template.title,
    slogan: input.template.slogan,
    artifact: input.template.artifact,
    definitionOfDone: input.template.definitionOfDone,
    checkpoints: input.template.checkpoints,
    nextCheckpoint,
    currentDay,
    completedLessons,
    totalDays,
    prototypeProgress: Math.max(prototypeProgress, milestoneProgress),
    nextMilestone: milestone,
    nextEvidence,
    milestoneSubmissions: input.milestoneSubmissions,
  };
}

function minutesBetween(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return null;
  const startTime = parseDatabaseDate(start).getTime();
  const endTime = parseDatabaseDate(end).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
    return null;
  }
  return Math.round((endTime - startTime) / 60_000);
}

function parseJsonArray(value: string | null | undefined) {
  try {
    const parsed = JSON.parse(String(value ?? "[]")) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function parseJsonObject(value: string | null | undefined): Record<string, unknown> {
  try {
    const parsed = JSON.parse(String(value ?? "{}")) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function normalizeKnowledgeSourceType(value: string | null | undefined) {
  const type = String(value ?? "").trim().toLowerCase();
  return new Set(["github", "pdf", "docs", "video", "blog", "manual"]).has(type)
    ? type
    : "manual";
}

function normalizeKnowledgeSourceStatus(value: string | null | undefined) {
  const status = String(value ?? "").trim().toLowerCase();
  return new Set(["pending_review", "approved", "rejected", "archived"]).has(status)
    ? status
    : "pending_review";
}

function canonicalRefForKnowledgeSource(input: {
  sourceType: string;
  sourceUrl?: string | null;
  canonicalRef?: string | null;
  title: string;
}) {
  const explicit = input.canonicalRef?.trim();
  if (explicit) return explicit.slice(0, 500);
  const url = input.sourceUrl?.trim();
  if (url) return `${input.sourceType}:${url.toLowerCase()}`.slice(0, 500);
  return `${input.sourceType}:${input.title.trim().toLowerCase()}`.slice(0, 500);
}

function knowledgeSourceFromRow(row: {
  id: number;
  sourceType: string;
  title: string;
  sourceUrl: string | null;
  canonicalRef: string;
  license: string | null;
  relevance: string;
  status: string;
  reviewNotes: string | null;
  metadataJson: string;
  createdBy: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}): KnowledgeSourceRecord {
  return {
    id: Number(row.id),
    sourceType: row.sourceType,
    title: row.title,
    sourceUrl: row.sourceUrl,
    canonicalRef: row.canonicalRef,
    license: row.license,
    relevance: row.relevance,
    status: row.status,
    reviewNotes: row.reviewNotes,
    metadata: parseJsonObject(row.metadataJson),
    createdBy: row.createdBy,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createKnowledgeSource(payload: {
  sourceType?: string | null;
  title?: string | null;
  sourceUrl?: string | null;
  canonicalRef?: string | null;
  license?: string | null;
  relevance?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
}) {
  const sourceType = normalizeKnowledgeSourceType(payload.sourceType);
  const title = payload.title?.trim().slice(0, 240);
  if (!title) throw new Response("title is required", { status: 400 });
  const sourceUrl = payload.sourceUrl?.trim().slice(0, 1_000) || null;
  const canonicalRef = canonicalRefForKnowledgeSource({
    sourceType,
    sourceUrl,
    canonicalRef: payload.canonicalRef,
    title,
  });
  const saved = await getD1()
    .prepare(
      `INSERT INTO knowledge_sources
         (source_type, title, source_url, canonical_ref, license, relevance,
          status, metadata_json, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'pending_review', ?, ?)
       ON CONFLICT(canonical_ref) DO UPDATE SET
         title = excluded.title,
         source_url = excluded.source_url,
         license = excluded.license,
         relevance = excluded.relevance,
         metadata_json = excluded.metadata_json,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id,
                 source_type AS sourceType,
                 title,
                 source_url AS sourceUrl,
                 canonical_ref AS canonicalRef,
                 license,
                 relevance,
                 status,
                 review_notes AS reviewNotes,
                 metadata_json AS metadataJson,
                 created_by AS createdBy,
                 reviewed_by AS reviewedBy,
                 reviewed_at AS reviewedAt,
                 created_at AS createdAt,
                 updated_at AS updatedAt`,
    )
    .bind(
      sourceType,
      title,
      sourceUrl,
      canonicalRef,
      payload.license?.trim().slice(0, 120) || null,
      payload.relevance?.trim().slice(0, 120) || "unclassified",
      JSON.stringify({
        ...(payload.metadata ?? {}),
        courseGeneration: "disabled_until_human_review",
      }),
      payload.createdBy?.trim().slice(0, 120) || "academy-admin",
    )
    .first<Parameters<typeof knowledgeSourceFromRow>[0]>();
  if (!saved) throw new Error("knowledge source was not saved");
  return knowledgeSourceFromRow(saved);
}

export async function reviewKnowledgeSource(payload: {
  sourceId: number;
  status: string;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
}) {
  if (!Number.isInteger(payload.sourceId) || payload.sourceId <= 0) {
    throw new Response("sourceId is required", { status: 400 });
  }
  const status = normalizeKnowledgeSourceStatus(payload.status);
  if (status === "pending_review") {
    throw new Response("review status must be approved, rejected or archived", {
      status: 400,
    });
  }
  const updated = await getD1()
    .prepare(
      `UPDATE knowledge_sources
       SET status = ?,
           review_notes = ?,
           reviewed_by = ?,
           reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?
       RETURNING id,
                 source_type AS sourceType,
                 title,
                 source_url AS sourceUrl,
                 canonical_ref AS canonicalRef,
                 license,
                 relevance,
                 status,
                 review_notes AS reviewNotes,
                 metadata_json AS metadataJson,
                 created_by AS createdBy,
                 reviewed_by AS reviewedBy,
                 reviewed_at AS reviewedAt,
                 created_at AS createdAt,
                 updated_at AS updatedAt`,
    )
    .bind(
      status,
      payload.reviewNotes?.trim().slice(0, 1_000) || null,
      payload.reviewedBy?.trim().slice(0, 120) || "academy-admin",
      payload.sourceId,
    )
    .first<Parameters<typeof knowledgeSourceFromRow>[0]>();
  if (!updated) throw new Response("Knowledge source not found", { status: 404 });
  return knowledgeSourceFromRow(updated);
}

export async function listKnowledgeSources(input: {
  status?: string | null;
  limit?: number | null;
} = {}) {
  const status = input.status ? normalizeKnowledgeSourceStatus(input.status) : null;
  const limit = Math.min(Math.max(Math.floor(Number(input.limit ?? 30)), 1), 100);
  const statement = status
    ? getD1()
        .prepare(
          `SELECT id,
                  source_type AS sourceType,
                  title,
                  source_url AS sourceUrl,
                  canonical_ref AS canonicalRef,
                  license,
                  relevance,
                  status,
                  review_notes AS reviewNotes,
                  metadata_json AS metadataJson,
                  created_by AS createdBy,
                  reviewed_by AS reviewedBy,
                  reviewed_at AS reviewedAt,
                  created_at AS createdAt,
                  updated_at AS updatedAt
           FROM knowledge_sources
           WHERE status = ?
           ORDER BY created_at DESC
           LIMIT ?`,
        )
        .bind(status, limit)
    : getD1()
        .prepare(
          `SELECT id,
                  source_type AS sourceType,
                  title,
                  source_url AS sourceUrl,
                  canonical_ref AS canonicalRef,
                  license,
                  relevance,
                  status,
                  review_notes AS reviewNotes,
                  metadata_json AS metadataJson,
                  created_by AS createdBy,
                  reviewed_by AS reviewedBy,
                  reviewed_at AS reviewedAt,
                  created_at AS createdAt,
                  updated_at AS updatedAt
           FROM knowledge_sources
           ORDER BY created_at DESC
           LIMIT ?`,
        )
        .bind(limit);
  try {
    const rows = await statement.all<Parameters<typeof knowledgeSourceFromRow>[0]>();
    return rows.results.map(knowledgeSourceFromRow);
  } catch (error) {
    if (isMissingDatabaseRelationError(error, ["knowledge_sources"])) return [];
    throw error;
  }
}

function normalizeContentReviewStatus(value: string | null | undefined) {
  const status = String(value ?? "").trim().toLowerCase();
  return new Set([
    "draft",
    "pending_review",
    "approved",
    "published",
    "rejected",
    "archived",
  ]).has(status)
    ? status
    : "draft";
}

function normalizeAdminLocale(value: string | null | undefined): AppLocale {
  return resolveAppLocale(value);
}

function courseContentVersionFromRow(row: {
  id: number;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  version: string;
  sourceRef: string;
  status: string;
  changeSummary: string;
  createdBy: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  lessonCount: number;
  approvedLocaleCount: number;
  draftLocaleCount: number;
  missingLocaleCount: number;
  updatedAt: string;
}): CourseContentVersionRecord {
  return {
    ...row,
    id: Number(row.id),
    lessonCount: Number(row.lessonCount ?? 0),
    approvedLocaleCount: Number(row.approvedLocaleCount ?? 0),
    draftLocaleCount: Number(row.draftLocaleCount ?? 0),
    missingLocaleCount: Number(row.missingLocaleCount ?? 0),
  };
}

function lessonLocalizationReviewFromRow(row: {
  lessonId: string;
  courseId: string;
  courseTitle: string;
  day: number;
  sourceTitle: string;
  locale: string;
  localizedTitle: string | null;
  reviewStatus: string | null;
  sourceVersion: string | null;
  reviewedAt: string | null;
  updatedAt: string | null;
}): LessonLocalizationReviewRecord {
  return {
    lessonId: row.lessonId,
    courseId: row.courseId,
    courseTitle: row.courseTitle,
    day: Number(row.day),
    sourceTitle: row.sourceTitle,
    locale: normalizeAdminLocale(row.locale),
    localizedTitle: row.localizedTitle,
    reviewStatus: row.reviewStatus ?? "missing",
    sourceVersion: row.sourceVersion ?? "missing",
    reviewedAt: row.reviewedAt,
    updatedAt: row.updatedAt,
  };
}

function courseQualityEventFromRow(row: {
  id: number;
  courseId: string;
  courseTitle: string;
  lessonId: string | null;
  lessonDay: number | null;
  lessonTitle: string | null;
  contentVersionId: number | null;
  eventType: string;
  severity: string;
  status: string;
  sourceType: string;
  sourceRef: string;
  metricsJson: string;
  recommendation: string;
  createdBy: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  updatedAt: string;
}): CourseQualityEventRecord {
  return {
    id: Number(row.id),
    courseId: row.courseId,
    courseTitle: row.courseTitle,
    lessonId: row.lessonId,
    lessonDay: row.lessonDay === null ? null : Number(row.lessonDay),
    lessonTitle: row.lessonTitle,
    contentVersionId:
      row.contentVersionId === null ? null : Number(row.contentVersionId),
    eventType: row.eventType,
    severity: row.severity,
    status: row.status,
    sourceType: row.sourceType,
    sourceRef: row.sourceRef,
    metrics: parseJsonObject(row.metricsJson),
    recommendation: row.recommendation,
    createdBy: row.createdBy,
    resolvedBy: row.resolvedBy,
    resolvedAt: row.resolvedAt,
    updatedAt: row.updatedAt,
  };
}

async function listOpenCourseQualityEvents(limit = 40) {
  try {
    const rows = await getD1()
      .prepare(
        `SELECT cqe.id,
                cqe.course_id AS courseId,
                c.title AS courseTitle,
                cqe.lesson_id AS lessonId,
                l.day AS lessonDay,
                l.title AS lessonTitle,
                cqe.content_version_id AS contentVersionId,
                cqe.event_type AS eventType,
                cqe.severity,
                cqe.status,
                cqe.source_type AS sourceType,
                cqe.source_ref AS sourceRef,
                cqe.metrics_json AS metricsJson,
                cqe.recommendation,
                cqe.created_by AS createdBy,
                cqe.resolved_by AS resolvedBy,
                cqe.resolved_at AS resolvedAt,
                cqe.updated_at AS updatedAt
           FROM course_quality_events cqe
           JOIN courses c ON c.id = cqe.course_id
      LEFT JOIN lessons l ON l.id = cqe.lesson_id
          WHERE cqe.status IN ('open', 'needs_rewrite')
          ORDER BY CASE cqe.severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
                   cqe.updated_at DESC
          LIMIT ?`,
      )
      .bind(Math.min(Math.max(Math.floor(limit), 1), 100))
      .all<Parameters<typeof courseQualityEventFromRow>[0]>();
    return rows.results.map(courseQualityEventFromRow);
  } catch (error) {
    if (isMissingDatabaseRelationError(error, ["course_quality_events"])) return [];
    throw error;
  }
}

async function upsertQuizQualityEvents(
  items: Array<{
    courseId: string;
    lessonId: string;
    day: number;
    title: string;
    contentVersionId: number | null;
    firstAttemptCount: number;
    firstPassRate: number;
    revisionPassAfterFailRate: number;
    questionAccuracyRate: number;
    averageScore: number;
    severity: string;
  }>,
) {
  if (!items.length) return;
  const d1 = getD1();
  for (const item of items) {
    const sourceRef = `quiz_low_first_pass:${item.lessonId}:${item.contentVersionId ?? "unversioned"}`;
    const recommendation =
      item.severity === "high"
        ? "优先重讲本课核心知识点，并检查 Quiz 是否覆盖了教学正文。"
        : "检查教学正文、示例和 Quiz 选项，必要时增加前置解释。";
    try {
      await d1
        .prepare(
          `INSERT INTO course_quality_events
             (course_id, lesson_id, event_type, severity, status, source_type,
              source_ref, metrics_json, recommendation, created_by)
           VALUES (?, ?, 'quiz_low_first_pass', ?, 'open', 'quiz_metrics', ?, ?, ?, 'academy-system')
           ON CONFLICT(source_type, source_ref) DO UPDATE SET
             severity = excluded.severity,
             status = CASE
               WHEN course_quality_events.status = 'resolved' THEN 'open'
               ELSE course_quality_events.status
             END,
             metrics_json = excluded.metrics_json,
             recommendation = excluded.recommendation,
             updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(
          item.courseId,
          item.lessonId,
          item.severity,
          sourceRef,
          JSON.stringify({
            day: item.day,
            title: item.title,
            contentVersionId: item.contentVersionId,
            firstAttemptCount: item.firstAttemptCount,
            firstPassRate: item.firstPassRate,
            revisionPassAfterFailRate: item.revisionPassAfterFailRate,
            questionAccuracyRate: item.questionAccuracyRate,
            averageScore: item.averageScore,
          }),
          recommendation,
        )
        .run();
    } catch (error) {
      if (!isMissingDatabaseRelationError(error, ["course_quality_events"])) {
        throw error;
      }
    }
  }
}

async function upsertQuizQualityEventForLesson(input: {
  courseId: string;
  lessonId: string;
  day: number;
  title: string;
  contentVersionId: number | null;
}) {
  try {
    const rowsQuery =
      input.contentVersionId == null
        ? getD1()
            .prepare(
              `SELECT user_id AS userId,
                      content_version_id AS contentVersionId,
                      attempt_number AS attemptNumber,
                      question_count AS questionCount,
                      correct_count AS correctCount,
                      score,
                      passed
               FROM quiz_attempts
               WHERE lesson_id = ?
                 AND content_version_id IS NULL`,
            )
            .bind(input.lessonId)
        : getD1()
            .prepare(
              `SELECT user_id AS userId,
                      content_version_id AS contentVersionId,
                      attempt_number AS attemptNumber,
                      question_count AS questionCount,
                      correct_count AS correctCount,
                      score,
                      passed
               FROM quiz_attempts
               WHERE lesson_id = ?
                 AND content_version_id = ?`,
            )
            .bind(input.lessonId, input.contentVersionId);
    const rows = (
      await rowsQuery.all<{
        userId: string;
        contentVersionId: number | null;
        attemptNumber: number;
        questionCount: number;
        correctCount: number;
        score: number;
        passed: number;
      }>()
    ).results;
    if (!rows.length) return;

    const firstAttempts = rows.filter(
      (row) => Number(row.attemptNumber) === 1,
    );
    if (firstAttempts.length < 3) return;

    const firstPassCount = firstAttempts.filter(
      (row) => Number(row.passed) === 1,
    ).length;
    const firstPassRate = percentage(firstPassCount, firstAttempts.length);
    if (firstPassRate >= 60) return;

    const firstFailedUsers = new Set(
      firstAttempts
        .filter((row) => Number(row.passed) !== 1)
        .map((row) => row.userId),
    );
    const revisionPassedAfterFailUsers = new Set(
      rows
        .filter(
          (row) =>
            firstFailedUsers.has(row.userId) &&
            Number(row.attemptNumber) > 1 &&
            Number(row.passed) === 1,
        )
        .map((row) => row.userId),
    );
    const correctTotal = rows.reduce(
      (sum, row) => sum + Number(row.correctCount ?? 0),
      0,
    );
    const questionTotal = rows.reduce(
      (sum, row) => sum + Number(row.questionCount ?? 0),
      0,
    );
    const averageScore = Math.round(
      rows.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / rows.length,
    );

    await upsertQuizQualityEvents([
      {
        courseId: input.courseId,
        lessonId: input.lessonId,
        day: input.day,
        title: input.title,
        contentVersionId: input.contentVersionId,
        firstAttemptCount: firstAttempts.length,
        firstPassRate,
        revisionPassAfterFailRate: percentage(
          revisionPassedAfterFailUsers.size,
          firstFailedUsers.size,
        ),
        questionAccuracyRate: percentage(correctTotal, questionTotal),
        averageScore,
        severity: firstPassRate < 40 ? "high" : "medium",
      },
    ]);
  } catch (error) {
    if (
      !isMissingDatabaseRelationError(error, [
        "quiz_attempts",
        "course_quality_events",
      ])
    ) {
      throw error;
    }
  }
}

export async function listCourseContentReviewCenter(input: {
  locale?: string | null;
  status?: string | null;
  limit?: number | null;
} = {}) {
  const locale = normalizeAdminLocale(input.locale ?? "vi");
  const status = input.status ? normalizeContentReviewStatus(input.status) : null;
  const limit = Math.min(Math.max(Math.floor(Number(input.limit ?? 80)), 1), 240);
  const d1 = getD1();

  try {
    const versions = await d1
      .prepare(
        `SELECT ccv.id,
                ccv.course_id AS courseId,
                c.title AS courseTitle,
                c.slug AS courseSlug,
                ccv.version,
                ccv.source_ref AS sourceRef,
                ccv.status,
                ccv.change_summary AS changeSummary,
                ccv.created_by AS createdBy,
                ccv.reviewed_by AS reviewedBy,
                ccv.reviewed_at AS reviewedAt,
                ccv.published_at AS publishedAt,
                ccv.updated_at AS updatedAt,
                (SELECT COUNT(*) FROM lessons l WHERE l.course_id = ccv.course_id) AS lessonCount,
                (SELECT COUNT(*)
                   FROM lesson_localizations ll
                   JOIN lessons l ON l.id = ll.lesson_id
                  WHERE l.course_id = ccv.course_id
                    AND ll.review_status = 'approved') AS approvedLocaleCount,
                (SELECT COUNT(*)
                   FROM lesson_localizations ll
                   JOIN lessons l ON l.id = ll.lesson_id
                  WHERE l.course_id = ccv.course_id
                    AND ll.review_status <> 'approved') AS draftLocaleCount,
                ((SELECT COUNT(*) FROM lessons l WHERE l.course_id = ccv.course_id) * ?
                  - (SELECT COUNT(*)
                       FROM lesson_localizations ll
                       JOIN lessons l ON l.id = ll.lesson_id
                      WHERE l.course_id = ccv.course_id)) AS missingLocaleCount
           FROM course_content_versions ccv
           JOIN courses c ON c.id = ccv.course_id
          WHERE (? IS NULL OR ccv.status = ?)
          ORDER BY ccv.updated_at DESC, ccv.course_id, ccv.version DESC
          LIMIT ?`,
      )
      .bind(SUPPORTED_LOCALES.length, status, status, limit)
      .all<Parameters<typeof courseContentVersionFromRow>[0]>();

    const lessonReviews = await d1
      .prepare(
        `SELECT l.id AS lessonId,
                l.course_id AS courseId,
                c.title AS courseTitle,
                l.day,
                l.title AS sourceTitle,
                ? AS locale,
                ll.title AS localizedTitle,
                ll.review_status AS reviewStatus,
                ll.source_version AS sourceVersion,
                ll.reviewed_at AS reviewedAt,
                ll.updated_at AS updatedAt
           FROM lessons l
           JOIN courses c ON c.id = l.course_id
      LEFT JOIN lesson_localizations ll
             ON ll.lesson_id = l.id AND ll.locale = ?
          WHERE (? IS NULL OR COALESCE(ll.review_status, 'missing') = ?)
          ORDER BY c.id, l.day
          LIMIT ?`,
      )
      .bind(locale, locale, status, status, limit)
      .all<Parameters<typeof lessonLocalizationReviewFromRow>[0]>();

    const qualityEvents = await listOpenCourseQualityEvents(40);

    return {
      locale,
      supportedLocales: [...SUPPORTED_LOCALES],
      versions: versions.results.map(courseContentVersionFromRow),
      lessonReviews: lessonReviews.results.map(lessonLocalizationReviewFromRow),
      qualityEvents,
    };
  } catch (error) {
    if (
      isMissingDatabaseRelationError(error, [
        "course_content_versions",
        "lesson_localizations",
      ])
    ) {
      return {
        locale,
        supportedLocales: [...SUPPORTED_LOCALES],
        versions: [] as CourseContentVersionRecord[],
        lessonReviews: [] as LessonLocalizationReviewRecord[],
        qualityEvents: [] as CourseQualityEventRecord[],
      };
    }
    throw error;
  }
}

export async function reviewCourseContentVersion(payload: {
  versionId: number;
  status: string;
  reviewedBy?: string | null;
  changeSummary?: string | null;
}) {
  if (!Number.isFinite(payload.versionId) || payload.versionId < 1) {
    throw new Response("versionId is required", { status: 400 });
  }
  const status = normalizeContentReviewStatus(payload.status);
  if (!new Set(["approved", "published", "rejected", "archived", "draft"]).has(status)) {
    throw new Response("unsupported course version status", { status: 400 });
  }
  const updated = await getD1()
    .prepare(
      `UPDATE course_content_versions
          SET status = ?,
              change_summary = COALESCE(NULLIF(?, ''), change_summary),
              reviewed_by = ?,
              reviewed_at = CURRENT_TIMESTAMP,
              published_at = CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE published_at END,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        RETURNING id,
                  course_id AS courseId,
                  (SELECT title FROM courses WHERE id = course_content_versions.course_id) AS courseTitle,
                  (SELECT slug FROM courses WHERE id = course_content_versions.course_id) AS courseSlug,
                  version,
                  source_ref AS sourceRef,
                  status,
                  change_summary AS changeSummary,
                  created_by AS createdBy,
                  reviewed_by AS reviewedBy,
                  reviewed_at AS reviewedAt,
                  published_at AS publishedAt,
                  0 AS lessonCount,
                  0 AS approvedLocaleCount,
                  0 AS draftLocaleCount,
                  0 AS missingLocaleCount,
                  updated_at AS updatedAt`,
    )
    .bind(
      status,
      payload.changeSummary?.trim().slice(0, 1_000) ?? "",
      payload.reviewedBy?.trim().slice(0, 120) || "academy-admin",
      status,
      payload.versionId,
    )
    .first<Parameters<typeof courseContentVersionFromRow>[0]>();
  if (!updated) throw new Response("Course content version not found", { status: 404 });
  return courseContentVersionFromRow(updated);
}

export async function reviewLessonLocalization(payload: {
  lessonId: string;
  locale: string;
  status: string;
}) {
  const lessonId = payload.lessonId?.trim();
  if (!lessonId) throw new Response("lessonId is required", { status: 400 });
  const locale = normalizeAdminLocale(payload.locale);
  const status = normalizeContentReviewStatus(payload.status);
  if (!new Set(["draft", "pending_review", "approved", "rejected", "archived"]).has(status)) {
    throw new Response("unsupported lesson localization status", { status: 400 });
  }
  const updated = await getD1()
    .prepare(
      `UPDATE lesson_localizations
          SET review_status = ?,
              reviewed_at = CASE WHEN ? = 'approved' THEN CURRENT_TIMESTAMP ELSE reviewed_at END,
              updated_at = CURRENT_TIMESTAMP
        WHERE lesson_id = ? AND locale = ?
        RETURNING lesson_id AS lessonId,
                  (SELECT course_id FROM lessons WHERE id = lesson_localizations.lesson_id) AS courseId,
                  (SELECT c.title
                     FROM lessons l JOIN courses c ON c.id = l.course_id
                    WHERE l.id = lesson_localizations.lesson_id) AS courseTitle,
                  (SELECT day FROM lessons WHERE id = lesson_localizations.lesson_id) AS day,
                  (SELECT title FROM lessons WHERE id = lesson_localizations.lesson_id) AS sourceTitle,
                  locale,
                  title AS localizedTitle,
                  review_status AS reviewStatus,
                  source_version AS sourceVersion,
                  reviewed_at AS reviewedAt,
                  updated_at AS updatedAt`,
    )
    .bind(status, status, lessonId, locale)
    .first<Parameters<typeof lessonLocalizationReviewFromRow>[0]>();
  if (!updated) {
    throw new Response("Lesson localization not found; create translation before review", {
      status: 404,
    });
  }
  return lessonLocalizationReviewFromRow(updated);
}

function safeText(value: unknown, max = 12_000) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeLocalizationReviewStatus(value: string | null | undefined) {
  const status = normalizeContentReviewStatus(value);
  return new Set(["draft", "pending_review"]).has(status) ? status : "draft";
}

export async function importLocalizationDrafts(payload: {
  locale?: string | null;
  sourceVersion?: string | null;
  importedBy?: string | null;
  allowOverwriteApproved?: boolean;
  courses?: Array<{
    courseId?: string;
    title?: string;
    subtitle?: string;
    summary?: string;
  }>;
  lessons?: Array<{
    lessonId?: string;
    title?: string;
    objective?: string;
    content?: string;
    practicePrompt?: string;
    criteriaJson?: string | unknown[];
  }>;
  reviewStatus?: string | null;
}): Promise<LocalizationImportResult> {
  const locale = normalizeAdminLocale(payload.locale ?? "vi");
  if (locale === "zh-Hans") {
    throw new Response("zh-Hans is the source locale; import target locale only", {
      status: 400,
    });
  }
  const sourceVersion = safeText(payload.sourceVersion || "v1", 80) || "v1";
  const reviewStatus = normalizeLocalizationReviewStatus(payload.reviewStatus);
  const importedBy = safeText(payload.importedBy || "academy-admin", 120);
  const allowOverwriteApproved = Boolean(payload.allowOverwriteApproved);
  const d1 = getD1();
  const result: LocalizationImportResult = {
    locale,
    sourceVersion,
    courseUpserts: 0,
    lessonUpserts: 0,
    skippedApproved: 0,
    errors: [],
  };

  for (const item of payload.courses ?? []) {
    const courseId = safeText(item.courseId, 120);
    const title = safeText(item.title, 240);
    const subtitle = safeText(item.subtitle, 500);
    const summary = safeText(item.summary, 2_000);
    if (!courseId || !title || !subtitle || !summary) {
      result.errors.push(`course:${courseId || "missing"} missing required fields`);
      continue;
    }
    const existing = await d1
      .prepare(
        `SELECT review_status AS reviewStatus
           FROM course_localizations
          WHERE course_id = ? AND locale = ?`,
      )
      .bind(courseId, locale)
      .first<{ reviewStatus: string }>();
    if (existing?.reviewStatus === "approved" && !allowOverwriteApproved) {
      result.skippedApproved += 1;
      continue;
    }
    await d1
      .prepare(
        `INSERT INTO course_localizations
           (course_id, locale, title, subtitle, summary, source_version, review_status)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(course_id, locale) DO UPDATE SET
           title = excluded.title,
           subtitle = excluded.subtitle,
           summary = excluded.summary,
           source_version = excluded.source_version,
           review_status = CASE
             WHEN course_localizations.review_status = 'approved' AND ? = 0
               THEN course_localizations.review_status
             ELSE excluded.review_status
           END,
           reviewed_at = CASE
             WHEN course_localizations.review_status = 'approved' AND ? = 0
               THEN course_localizations.reviewed_at
             ELSE NULL
           END,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        courseId,
        locale,
        title,
        subtitle,
        summary,
        sourceVersion,
        reviewStatus,
        allowOverwriteApproved ? 1 : 0,
        allowOverwriteApproved ? 1 : 0,
      )
      .run();
    result.courseUpserts += 1;
  }

  for (const item of payload.lessons ?? []) {
    const lessonId = safeText(item.lessonId, 120);
    const title = safeText(item.title, 240);
    const objective = safeText(item.objective, 1_000);
    const content = safeText(item.content, 40_000);
    const practicePrompt = safeText(item.practicePrompt, 6_000);
    const criteriaJson =
      typeof item.criteriaJson === "string"
        ? safeText(item.criteriaJson, 20_000)
        : JSON.stringify(item.criteriaJson ?? []);
    if (!lessonId || !title || !objective || !content || !practicePrompt) {
      result.errors.push(`lesson:${lessonId || "missing"} missing required fields`);
      continue;
    }
    try {
      JSON.parse(criteriaJson);
    } catch {
      result.errors.push(`lesson:${lessonId} criteriaJson is invalid JSON`);
      continue;
    }
    const existing = await d1
      .prepare(
        `SELECT review_status AS reviewStatus
           FROM lesson_localizations
          WHERE lesson_id = ? AND locale = ?`,
      )
      .bind(lessonId, locale)
      .first<{ reviewStatus: string }>();
    if (existing?.reviewStatus === "approved" && !allowOverwriteApproved) {
      result.skippedApproved += 1;
      continue;
    }
    await d1
      .prepare(
        `INSERT INTO lesson_localizations
           (lesson_id, locale, title, objective, content, practice_prompt,
            criteria_json, source_version, review_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(lesson_id, locale) DO UPDATE SET
           title = excluded.title,
           objective = excluded.objective,
           content = excluded.content,
           practice_prompt = excluded.practice_prompt,
           criteria_json = excluded.criteria_json,
           source_version = excluded.source_version,
           review_status = CASE
             WHEN lesson_localizations.review_status = 'approved' AND ? = 0
               THEN lesson_localizations.review_status
             ELSE excluded.review_status
           END,
           reviewed_at = CASE
             WHEN lesson_localizations.review_status = 'approved' AND ? = 0
               THEN lesson_localizations.reviewed_at
             ELSE NULL
           END,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        lessonId,
        locale,
        title,
        objective,
        content,
        practicePrompt,
        criteriaJson,
        sourceVersion,
        reviewStatus,
        allowOverwriteApproved ? 1 : 0,
        allowOverwriteApproved ? 1 : 0,
      )
      .run();
    result.lessonUpserts += 1;
  }

  if (result.courseUpserts === 0 && result.lessonUpserts === 0 && result.errors.length) {
    throw new Response(result.errors.join("; "), { status: 400 });
  }

  void importedBy;
  return result;
}

export async function handleCourseQualityEvent(payload: {
  eventId: number;
  action: "resolved" | "needs_rewrite" | "create_new_version";
  handledBy?: string | null;
  note?: string | null;
}) {
  if (!Number.isFinite(payload.eventId) || payload.eventId < 1) {
    throw new Response("eventId is required", { status: 400 });
  }
  const action = payload.action;
  if (!new Set(["resolved", "needs_rewrite", "create_new_version"]).has(action)) {
    throw new Response("unsupported quality event action", { status: 400 });
  }
  const d1 = getD1();
  const event = await d1
    .prepare(
      `SELECT cqe.id,
              cqe.course_id AS courseId,
              c.title AS courseTitle,
              cqe.lesson_id AS lessonId,
              l.day AS lessonDay,
              l.title AS lessonTitle,
              cqe.content_version_id AS contentVersionId,
              cqe.event_type AS eventType,
              cqe.severity,
              cqe.status,
              cqe.source_type AS sourceType,
              cqe.source_ref AS sourceRef,
              cqe.metrics_json AS metricsJson,
              cqe.recommendation,
              cqe.created_by AS createdBy,
              cqe.resolved_by AS resolvedBy,
              cqe.resolved_at AS resolvedAt,
              cqe.updated_at AS updatedAt
         FROM course_quality_events cqe
         JOIN courses c ON c.id = cqe.course_id
    LEFT JOIN lessons l ON l.id = cqe.lesson_id
        WHERE cqe.id = ?`,
    )
    .bind(payload.eventId)
    .first<Parameters<typeof courseQualityEventFromRow>[0]>();
  if (!event) throw new Response("Course quality event not found", { status: 404 });

  const currentMetrics = parseJsonObject(event.metricsJson);
  const handledBy = payload.handledBy?.trim().slice(0, 120) || "academy-admin";
  const note = payload.note?.trim().slice(0, 1_000) || "";
  let contentVersionId = event.contentVersionId;
  let nextStatus = action === "resolved" ? "resolved" : "needs_rewrite";
  const resolution = {
    action,
    handledBy,
    note,
    handledAt: new Date().toISOString(),
  };

  if (action === "create_new_version") {
    const existingVersion = await d1
      .prepare(
        `SELECT id
           FROM course_content_versions
          WHERE course_id = ?
            AND source_ref = ?
          ORDER BY id DESC
          LIMIT 1`,
      )
      .bind(event.courseId, `quality_event:${event.id}`)
      .first<{ id: number }>();
    if (existingVersion?.id) {
      contentVersionId = Number(existingVersion.id);
    } else {
      const versionCount = await d1
        .prepare(
          `SELECT COUNT(*) AS count
             FROM course_content_versions
            WHERE course_id = ?`,
        )
        .bind(event.courseId)
        .first<{ count: number }>();
      const nextVersion = `v${Number(versionCount?.count ?? 0) + 1}`;
      const changeSummary =
        note ||
        `Created from quality event #${event.id}: ${event.eventType} on ${event.lessonTitle ?? event.lessonId ?? event.courseTitle}.`;
      const created = await d1
        .prepare(
          `INSERT INTO course_content_versions
             (course_id, version, source_ref, status, change_summary, created_by)
           VALUES (?, ?, ?, 'draft', ?, ?)
           ON CONFLICT(course_id, version) DO UPDATE SET
             change_summary = excluded.change_summary,
             updated_at = CURRENT_TIMESTAMP
           RETURNING id`,
        )
        .bind(
          event.courseId,
          nextVersion,
          `quality_event:${event.id}`,
          changeSummary,
          handledBy,
        )
        .first<{ id: number }>();
      contentVersionId = created ? Number(created.id) : contentVersionId;
    }
  }

  const updated = await d1
    .prepare(
      `UPDATE course_quality_events
          SET status = ?,
              content_version_id = COALESCE(?, content_version_id),
              metrics_json = ?,
              recommendation = CASE
                WHEN ? = '' THEN recommendation
                ELSE ?
              END,
              resolved_by = CASE WHEN ? = 'resolved' THEN ? ELSE resolved_by END,
              resolved_at = CASE WHEN ? = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        RETURNING id,
                  course_id AS courseId,
                  (SELECT title FROM courses WHERE id = course_quality_events.course_id) AS courseTitle,
                  lesson_id AS lessonId,
                  (SELECT day FROM lessons WHERE id = course_quality_events.lesson_id) AS lessonDay,
                  (SELECT title FROM lessons WHERE id = course_quality_events.lesson_id) AS lessonTitle,
                  content_version_id AS contentVersionId,
                  event_type AS eventType,
                  severity,
                  status,
                  source_type AS sourceType,
                  source_ref AS sourceRef,
                  metrics_json AS metricsJson,
                  recommendation,
                  created_by AS createdBy,
                  resolved_by AS resolvedBy,
                  resolved_at AS resolvedAt,
                  updated_at AS updatedAt`,
    )
    .bind(
      nextStatus,
      contentVersionId,
      JSON.stringify({
        ...currentMetrics,
        lastResolution: resolution,
        rewriteTarget:
          action === "create_new_version"
            ? {
                courseId: event.courseId,
                lessonId: event.lessonId,
                lessonDay: event.lessonDay,
                lessonTitle: event.lessonTitle,
                contentVersionId,
              }
            : currentMetrics.rewriteTarget,
        resolutionHistory: [
          ...((Array.isArray(currentMetrics.resolutionHistory)
            ? currentMetrics.resolutionHistory
            : []) as unknown[]),
          resolution,
        ].slice(-10),
      }),
      note,
      note,
      nextStatus,
      handledBy,
      nextStatus,
      event.id,
    )
    .first<Parameters<typeof courseQualityEventFromRow>[0]>();
  if (!updated) throw new Response("Course quality event update failed", { status: 500 });
  return courseQualityEventFromRow(updated);
}

function fallbackCompetencyNodes() {
  return COMPETENCY_NODE_SEED.map((node) => ({
    id: node.id,
    title: node.title,
    description: node.description,
    level: node.level,
    category: node.category,
    weight: node.weight,
  }));
}

async function listCompetencyNodes() {
  try {
    const rows = await getD1()
      .prepare(
        `SELECT id, title, description, level, category, weight
         FROM competency_nodes
         WHERE status = 'active'
         ORDER BY level, weight DESC, id`,
      )
      .all<{
        id: string;
        title: string;
        description: string;
        level: number;
        category: string;
        weight: number;
      }>();
    return rows.results.length ? rows.results : fallbackCompetencyNodes();
  } catch (error) {
    if (!isMissingDatabaseRelationError(error, ["competency_nodes"])) {
      throw error;
    }
    return fallbackCompetencyNodes();
  }
}

function competencyNodeIdsForEvidence(row: {
  evidenceType: string;
  sourceType: string;
  sourceRef: string | number;
  courseId: string | null;
  lessonDay?: number | null;
  metadataJson: string | null;
}) {
  const ids = new Set<string>();
  const lessonDay = Number(row.lessonDay ?? 0);
  const metadata = parseJsonObject(row.metadataJson);
  const checkpointDay = Number(metadata.checkpointDay ?? 0);

  for (const mapping of COURSE_COMPETENCY_MAPPINGS) {
    if ("courseId" in mapping && mapping.courseId !== row.courseId) continue;
    if ("sourceType" in mapping && mapping.sourceType !== row.sourceType) continue;
    if ("evidenceType" in mapping && mapping.evidenceType !== row.evidenceType) continue;
    if ("lessonDayMin" in mapping && lessonDay < mapping.lessonDayMin) continue;
    if ("lessonDayMax" in mapping && lessonDay > mapping.lessonDayMax) continue;
    if (
      "checkpointDays" in mapping &&
      !mapping.checkpointDays.includes(checkpointDay as 0 | 7 | 21)
    ) {
      continue;
    }
    if ("checkpointDayMin" in mapping && checkpointDay < mapping.checkpointDayMin) {
      continue;
    }
    ids.add(mapping.nodeId);
  }
  return [...ids];
}

async function buildCompetencyGraph(
  evidenceRows: Array<{
    evidenceType: string;
    sourceType: string;
    sourceRef: string | number;
    courseId: string | null;
    lessonDay?: number | null;
    score: number;
    metadataJson: string | null;
  }>,
) {
  const nodes = await listCompetencyNodes();
  const evidenceByNode = new Map<
    string,
    Array<{
      evidenceType: string;
      sourceType: string;
      sourceRef: string;
      score: number;
    }>
  >();

  for (const row of evidenceRows) {
    for (const nodeId of competencyNodeIdsForEvidence(row)) {
      const items = evidenceByNode.get(nodeId) ?? [];
      items.push({
        evidenceType: row.evidenceType,
        sourceType: row.sourceType,
        sourceRef: String(row.sourceRef),
        score: Number(row.score ?? 0),
      });
      evidenceByNode.set(nodeId, items);
    }
  }

  const nodeSummaries: CompetencyGraphNode[] = nodes.map((node) => {
    const evidenceRefs = (evidenceByNode.get(node.id) ?? []).slice(0, 8);
    const scored = evidenceRefs
      .map((item) => Number(item.score))
      .filter((score) => Number.isFinite(score));
    const averageScore = scored.length
      ? scored.reduce((sum, score) => sum + score, 0) / scored.length
      : 0;
    const coverage = Math.min(1, evidenceRefs.length / 3);
    const score = Math.round(averageScore * coverage);
    return {
      id: node.id,
      title: node.title,
      description: node.description,
      level: Number(node.level),
      category: node.category,
      weight: Number(node.weight),
      evidenceCount: evidenceRefs.length,
      score,
      status:
        score >= 80
          ? "evidenced"
          : evidenceRefs.length > 0
            ? "in_progress"
            : "not_started",
      evidenceRefs,
    };
  });

  const totalWeight = nodeSummaries.reduce((sum, node) => sum + node.weight, 0);
  const weightedScore = totalWeight
    ? Math.round(
        nodeSummaries.reduce((sum, node) => sum + node.score * node.weight, 0) /
          totalWeight,
      )
    : 0;

  return {
    overallScore: weightedScore,
    evidencedNodeCount: nodeSummaries.filter((node) => node.status === "evidenced").length,
    totalNodeCount: nodeSummaries.length,
    nodes: nodeSummaries,
  };
}

function competencyProofMarkdown(input: {
  user: {
    displayName: string;
    telegramId: string | null;
    telegramUsername: string | null;
  };
  generatedAt: string;
  competencyGraph: Awaited<ReturnType<typeof buildCompetencyGraph>>;
}) {
  const lines = [
    "# Academy Competency Proof",
    "",
    `- Learner: ${input.user.displayName}`,
    `- Telegram ID: ${input.user.telegramId ?? "unknown"}`,
    `- Telegram Username: ${input.user.telegramUsername ? `@${input.user.telegramUsername}` : "unknown"}`,
    `- Generated At: ${input.generatedAt}`,
    `- Overall Score: ${input.competencyGraph.overallScore}%`,
    `- Evidenced Nodes: ${input.competencyGraph.evidencedNodeCount}/${input.competencyGraph.totalNodeCount}`,
    "",
    "## Competency Nodes",
    "",
  ];
  for (const node of input.competencyGraph.nodes) {
    lines.push(
      `### ${node.title}`,
      "",
      `- ID: ${node.id}`,
      `- Status: ${node.status}`,
      `- Score: ${node.score}`,
      `- Evidence Count: ${node.evidenceCount}`,
      `- Description: ${node.description}`,
      "",
      "Evidence refs:",
      ...(
        node.evidenceRefs.length
          ? node.evidenceRefs.map(
              (ref) =>
                `- ${ref.evidenceType} / ${ref.sourceType}#${ref.sourceRef} / score ${ref.score}`,
            )
          : ["- none"]
      ),
      "",
    );
  }
  lines.push(
    "## Rule",
    "",
    "Nothing counts unless it is evidenced. This proof only uses accepted evidence recorded by Academy Core.",
    "",
  );
  return lines.join("\n");
}

export async function getCompetencyProofPackage(
  identity: AcademyIdentity,
  format: "json" | "markdown" = "json",
) {
  const user = await getD1()
    .prepare(
      `SELECT display_name AS displayName,
              telegram_id AS telegramId,
              telegram_username AS telegramUsername
       FROM users
       WHERE id = ?`,
    )
    .bind(identity.id)
    .first<{
      displayName: string;
      telegramId: string | null;
      telegramUsername: string | null;
    }>();
  const metrics = await getLearningMetrics(identity.id);
  const generatedAt = new Date().toISOString();
  const proof = {
    version: "competency-proof.v1",
    generatedAt,
    learner: {
      id: identity.id,
      displayName: user?.displayName ?? identity.displayName,
      telegramId: user?.telegramId ?? identity.telegramId,
      telegramUsername: user?.telegramUsername ?? identity.telegramUsername,
    },
    principle: "Nothing counts unless it is evidenced.",
    competencyGraph: metrics.competencyGraph,
  };
  if (format === "markdown") {
    return {
      format,
      filename: "academy-competency-proof.md",
      contentType: "text/markdown; charset=utf-8",
      body: competencyProofMarkdown({
        user: proof.learner,
        generatedAt,
        competencyGraph: metrics.competencyGraph,
      }),
    };
  }
  return {
    format,
    filename: "academy-competency-proof.json",
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(proof, null, 2),
  };
}

function competencyProofShareToken() {
  return randomBytes(18).toString("base64url");
}

function safePublicLearnerName(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed || "Academy Learner";
}

export async function createCompetencyProofShare(identity: AcademyIdentity) {
  const proofPackage = await getCompetencyProofPackage(identity, "json");
  const proof = JSON.parse(proofPackage.body) as {
    version: string;
    generatedAt: string;
    learner: {
      displayName: string;
      telegramUsername: string | null;
    };
    principle: string;
    competencyGraph: Awaited<ReturnType<typeof buildCompetencyGraph>>;
  };
  const snapshot = {
    version: "competency-proof-share.v1",
    generatedAt: proof.generatedAt,
    learner: {
      displayName: safePublicLearnerName(proof.learner.displayName),
      telegramUsername: proof.learner.telegramUsername,
    },
    principle: proof.principle,
    competencyGraph: proof.competencyGraph,
  };
  const token = competencyProofShareToken();
  await getD1()
    .prepare(
      `INSERT INTO competency_proof_shares
         (token, user_id, status, snapshot_json)
       VALUES (?, ?, 'active', ?)`,
    )
    .bind(token, identity.id, JSON.stringify(snapshot))
    .run();
  return {
    token,
    snapshot,
  };
}

export async function getPublicCompetencyProofShare(tokenInput: string) {
  const token = tokenInput.trim();
  if (!/^[A-Za-z0-9_-]{16,96}$/.test(token)) return null;
  try {
    const row = await getD1()
      .prepare(
        `SELECT id,
                token,
                status,
                snapshot_json AS snapshotJson,
                created_at AS createdAt,
                expires_at AS expiresAt,
                revoked_at AS revokedAt,
                view_count AS viewCount
         FROM competency_proof_shares
         WHERE token = ?
         LIMIT 1`,
      )
      .bind(token)
      .first<{
        id: number;
        token: string;
        status: string;
        snapshotJson: string;
        createdAt: string;
        expiresAt: string | null;
        revokedAt: string | null;
        viewCount: number;
      }>();
    if (!row || row.status !== "active" || row.revokedAt) return null;
    if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) {
      return null;
    }
    await getD1()
      .prepare(
        `UPDATE competency_proof_shares
         SET last_viewed_at = CURRENT_TIMESTAMP,
             view_count = view_count + 1
         WHERE id = ?`,
      )
      .bind(row.id)
      .run();
    return {
      id: row.id,
      token: row.token,
      createdAt: row.createdAt,
      viewCount: Number(row.viewCount ?? 0) + 1,
      snapshot: parseJsonObject(row.snapshotJson) as {
        version: string;
        generatedAt: string;
        learner: {
          displayName: string;
          telegramUsername: string | null;
        };
        principle: string;
        competencyGraph: Awaited<ReturnType<typeof buildCompetencyGraph>>;
      },
    };
  } catch (error) {
    if (isMissingDatabaseRelationError(error, ["competency_proof_shares"])) {
      return null;
    }
    throw error;
  }
}

async function grantReferralRewards(userId: string, qualified: number) {
  const d1 = getD1();
  const qualifiedInvitations = await d1
    .prepare(
      `SELECT id,
              invited_user_id AS invitedUserId,
              qualified_at AS qualifiedAt,
              reward_granted_at AS rewardGrantedAt
       FROM invitations
       WHERE inviter_user_id = ? AND status = 'qualified' AND qualified_at IS NOT NULL
       ORDER BY CAST(qualified_at AS TIMESTAMP) ASC, id ASC`,
    )
    .bind(userId)
    .all<{
      id: number;
      invitedUserId: string;
      qualifiedAt: string;
      rewardGrantedAt: string | null;
    }>();

  const catalog = getPaymentCatalog();
  const plansByKey = new Map(catalog.plans.map((plan) => [plan.key, plan]));

  for (let index = 0; index < qualifiedInvitations.results.length; index += 1) {
    const invitation = qualifiedInvitations.results[index];
    const sequence = index + 1;
    const rate =
      sequence === 1 ? 10 : sequence === 2 ? 15 : sequence === 3 ? 20 : 10;

    const paid = await d1
      .prepare(
        `SELECT pt.order_id AS orderId,
                pt.amount_stars AS amountStars,
                pt.paid_at AS paidAt,
                o.plan_key AS planKey
         FROM payment_transactions pt
         JOIN payment_orders o ON o.id = pt.order_id
         WHERE pt.user_id = ? AND pt.status = 'paid'
         ORDER BY CAST(pt.paid_at AS TIMESTAMP) ASC
         LIMIT 1`,
      )
      .bind(invitation.invitedUserId)
      .first<{
        orderId: number;
        amountStars: number;
        paidAt: string;
        planKey: string;
      }>();
    if (!paid) continue;

    const plan = plansByKey.get(paid.planKey);
    if (!plan) continue;
    const usdCents = parseUsdCents(plan.usdPrice);
    const baseStars = plan.stars ?? paid.amountStars;
    const effectiveUsdCents =
      baseStars > 0
        ? Math.round((usdCents * paid.amountStars) / baseStars)
        : usdCents;
    const amountPoints = Math.max(
      0,
      Math.round((effectiveUsdCents * rate * POINTS_PER_USD) / 100 / 100),
    );
    if (amountPoints <= 0) continue;

    await ensureCreditsLedgerEntry({
      userId,
      entryType: "earn",
      rewardType: "referral_reward",
      amountPoints,
      status: "posted",
      businessKey: `referral_reward:${userId}:${invitation.id}`,
      relatedOrderId: paid.orderId,
      relatedInvitationId: invitation.id,
      expiresAt: null,
    });
    await d1
      .prepare(
        `UPDATE invitations
         SET reward_granted_at = COALESCE(reward_granted_at, CURRENT_TIMESTAMP)
         WHERE id = ?`,
      )
      .bind(invitation.id)
      .run();
  }

  const rewards = await listCreditsLedger(userId, { limit: 200 });
  return rewards.items.filter((item) => item.rewardType === "referral_reward").length;
}

async function getLearningAccess(userId: string) {
  const d1 = getD1();
  const user = await d1
    .prepare("SELECT trial_started_at AS trialStartedAt FROM users WHERE id = ?")
    .bind(userId)
    .first<{ trialStartedAt: string }>();
  if (!user) throw new Response("User not found", { status: 404 });

  const trialStartedAt = parseDatabaseDate(user.trialStartedAt);
  const trialEndsAt = addDays(trialStartedAt, 21);
  const latest = await d1
    .prepare(
      `SELECT plan_key AS planKey, source, starts_at AS startsAt, ends_at AS endsAt
       FROM subscriptions
       WHERE user_id = ? AND status = 'active'
       ORDER BY CAST(ends_at AS TIMESTAMP) DESC LIMIT 1`,
    )
    .bind(userId)
    .first<{
      planKey: string;
      source: string;
      startsAt: string;
      endsAt: string;
    }>();
  const latestEnd = latest?.endsAt
    ? parseDatabaseDate(latest.endsAt)
    : new Date(0);
  const accessEndsAt =
    latestEnd.getTime() > trialEndsAt.getTime() ? latestEnd : trialEndsAt;
  const now = new Date();
  const active = accessEndsAt.getTime() > now.getTime();
  const subscriptionWins = latestEnd.getTime() > trialEndsAt.getTime();

  return {
    active,
    state: !active
      ? ("expired" as const)
      : now.getTime() < trialEndsAt.getTime()
        ? ("trial" as const)
        : subscriptionWins
        ? latest?.source === "payment"
          ? ("paid" as const)
          : ("reward" as const)
        : ("trial" as const),
    trialStartedAt: trialStartedAt.toISOString(),
    trialEndsAt: trialEndsAt.toISOString(),
    accessEndsAt: accessEndsAt.toISOString(),
    daysRemaining: active
      ? Math.max(
          1,
          Math.ceil((accessEndsAt.getTime() - now.getTime()) / 86_400_000),
        )
      : 0,
    planKey: subscriptionWins ? latest?.planKey ?? null : null,
  };
}

function buildAccessContinuation(input: {
  access: Awaited<ReturnType<typeof getLearningAccess>>;
  referral: Awaited<ReturnType<typeof getReferralSummary>>;
  credits: Awaited<ReturnType<typeof getCreditsBalance>>;
  payment: ReturnType<typeof getPaymentCatalog>;
}) {
  const monthlyPlan =
    input.payment.plans.find((plan) => plan.key === "monthly") ??
    input.payment.plans[0] ??
    null;
  const qualifiedNeeded = Math.max(
    0,
    Number(input.referral.rewardTarget ?? 3) - Number(input.referral.qualified ?? 0),
  );
  const maxRedeemablePercent = 50;
  const estimatedCreditsUsd = Math.floor(
    Number(input.credits.availablePoints ?? 0) / POINTS_PER_USD,
  );

  return {
    primaryPlanKey: monthlyPlan?.key ?? "monthly",
    primaryUsdPrice: monthlyPlan?.usdPrice ?? "$9.9",
    primaryStars: monthlyPlan?.stars ?? null,
    primaryPlanEnabled: Boolean(monthlyPlan?.enabled),
    primaryDisabledReason: monthlyPlan?.disabledReason ?? null,
    qualifiedInvites: Number(input.referral.qualified ?? 0),
    qualifiedInvitesNeeded: qualifiedNeeded,
    referralRewardTarget: Number(input.referral.rewardTarget ?? 3),
    creditsAvailablePoints: Number(input.credits.availablePoints ?? 0),
    estimatedCreditsUsd,
    maxRedeemablePercent,
    canReduceNextPaymentWithCredits: Number(input.credits.availablePoints ?? 0) > 0,
    requiredAction: input.access.active
      ? ("none" as const)
      : monthlyPlan?.enabled
        ? ("pay_or_redeem_credits" as const)
        : ("configure_stars" as const),
  };
}

export async function assertLearningAccess(identity: AcademyIdentity) {
  const access = await getLearningAccess(identity.id);
  if (!access.active) {
    throw new Response(
      "21 天试用已结束。请选择订阅或使用有效邀请奖励后继续学习。",
      { status: 402 },
    );
  }
  return access;
}

async function getReferralSummary(
  userId: string,
  referralCode?: string | null,
) {
  const d1 = getD1();
  const pending = await d1
    .prepare(
      `SELECT id, invited_user_id AS invitedUserId, created_at AS createdAt
       FROM invitations
       WHERE inviter_user_id = ? AND status IN ('pending', 'review')`,
    )
    .bind(userId)
    .all<{ id: number; invitedUserId: string; createdAt: string }>();

  for (const invitation of pending.results) {
    const activeCourses = await d1
      .prepare(
        `SELECT COUNT(*) AS count
         FROM enrollments WHERE user_id = ? AND active = 1`,
      )
      .bind(invitation.invitedUserId)
      .first<{ count: number }>();
    const activeCount = Number(activeCourses?.count ?? 0);
    if (activeCount < 1) continue;

    const paid = await d1
      .prepare(
        `SELECT pt.order_id AS orderId,
                pt.amount_stars AS amountStars,
                pt.paid_at AS paidAt,
                o.plan_key AS planKey
         FROM payment_transactions pt
         JOIN payment_orders o ON o.id = pt.order_id
         WHERE pt.user_id = ? AND pt.status = 'paid'
         ORDER BY CAST(pt.paid_at AS TIMESTAMP) ASC
         LIMIT 1`,
      )
      .bind(invitation.invitedUserId)
      .first<{
        orderId: number;
        amountStars: number;
        paidAt: string;
        planKey: string;
      }>();
    if (!paid) continue;
    if (String(paid.paidAt) < String(invitation.createdAt)) continue;

    const invitedUser = await d1
      .prepare(
        `SELECT telegram_username AS telegramUsername,
                created_at AS createdAt
         FROM users
         WHERE id = ?`,
      )
      .bind(invitation.invitedUserId)
      .first<{
        telegramUsername: string | null;
        createdAt: string;
      }>();

    const riskSignals: string[] = [];
    if (invitedUser?.telegramUsername) {
      const duplicateUsername = await d1
        .prepare(
          `SELECT COUNT(*) AS count
           FROM users
           WHERE telegram_username = ?
             AND id <> ?`,
        )
        .bind(invitedUser.telegramUsername, invitation.invitedUserId)
        .first<{ count: number }>();
      if (Number(duplicateUsername?.count ?? 0) > 0) {
        riskSignals.push("duplicate_telegram_username");
      }
    }
    if (invitedUser?.createdAt) {
      const accountAgeAtPaymentMinutes = minutesBetween(
        invitedUser.createdAt,
        paid.paidAt,
      );
      if (
        accountAgeAtPaymentMinutes != null &&
        accountAgeAtPaymentMinutes >= 0 &&
        accountAgeAtPaymentMinutes <= 10
      ) {
        riskSignals.push("payment_too_fast_after_signup");
      }
    }

    const validDays = await d1
      .prepare(
        `SELECT COUNT(*) AS count
         FROM (
           SELECT CAST(s.completed_on AS DATE) AS completedDay
           FROM submissions s
           JOIN lessons l ON l.id = s.lesson_id
           JOIN enrollments e
             ON e.user_id = s.user_id AND e.course_id = l.course_id
           WHERE s.user_id = ?
             AND s.status = 'completed'
             AND s.completed_on IS NOT NULL
             AND CAST(s.completed_on AS DATE) >= CAST(? AS DATE)
             AND CAST(s.completed_on AS DATE) <= CAST(? AS DATE) + INTERVAL '7 days'
             AND e.active = 1
           GROUP BY CAST(s.completed_on AS DATE)
           HAVING COUNT(DISTINCT l.course_id) >= ?
         ) valid_days`,
      )
      .bind(invitation.invitedUserId, paid.paidAt, paid.paidAt, activeCount)
      .first<{ count: number }>();

    if (Number(validDays?.count ?? 0) >= 3) {
      const needsReview = riskSignals.length > 0;
      await d1
        .prepare(
          `UPDATE invitations
           SET status = ?,
               status_reason = ?,
               risk_level = ?,
               risk_signals_json = ?,
               qualified_at = CASE WHEN ? = 'qualified' THEN CURRENT_TIMESTAMP ELSE qualified_at END
           WHERE id = ? AND status IN ('pending', 'review')`,
        )
        .bind(
          needsReview ? "review" : "qualified",
          needsReview ? "risk_signals_detected" : "validated",
          needsReview ? "medium" : "low",
          JSON.stringify(riskSignals),
          needsReview ? "review" : "qualified",
          invitation.id,
        )
        .run();
    }
  }

  const stats = await d1
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
              SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) AS review,
              SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) AS qualified,
              SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
       FROM invitations WHERE inviter_user_id = ?`,
    )
    .bind(userId)
    .first<{
      total: number;
      pending: number | null;
      review: number | null;
      qualified: number | null;
      rejected: number | null;
    }>();

  const qualified = Number(stats?.qualified ?? 0);
  const earnedRewards = await grantReferralRewards(userId, qualified);
  const code = referralCode || (await referralCodeFor(userId));
  const botUsername = runtimeEnv().TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
  const invitationDetails = await d1
    .prepare(
      `SELECT i.id,
              i.invited_user_id AS invitedUserId,
              i.status,
              i.status_reason AS statusReason,
              i.risk_level AS riskLevel,
              i.risk_signals_json AS riskSignalsJson,
              i.qualified_at AS qualifiedAt,
              i.reward_granted_at AS rewardGrantedAt,
              i.created_at AS createdAt,
              u.display_name AS displayName,
              u.telegram_username AS telegramUsername
       FROM invitations i
       JOIN users u ON u.id = i.invited_user_id
       WHERE i.inviter_user_id = ?
       ORDER BY i.id DESC
       LIMIT 10`,
    )
    .bind(userId)
    .all<{
      id: number;
      invitedUserId: string;
      status: string;
      statusReason: string | null;
      riskLevel: string;
      riskSignalsJson: string | null;
      qualifiedAt: string | null;
      rewardGrantedAt: string | null;
      createdAt: string;
      displayName: string;
      telegramUsername: string | null;
    }>();
  return {
    code,
    total: Number(stats?.total ?? 0),
    pending: Number(stats?.pending ?? 0),
    review: Number(stats?.review ?? 0),
    qualified,
    rejected: Number(stats?.rejected ?? 0),
    rewardTarget: 3,
    rewardDays: 0,
    earnedRewards,
    nextRewardRemaining: (3 - (qualified % 3)) % 3,
    shareUrl: botUsername
      ? `https://t.me/${botUsername}?startapp=ref_${code}`
      : null,
    items: invitationDetails.results.map((item) => ({
      id: item.id,
      invitedUserId: item.invitedUserId,
      displayName: item.displayName,
      telegramUsername: item.telegramUsername,
      status: item.status,
      statusReason: item.statusReason,
      riskLevel: item.riskLevel,
      riskSignals: parseJsonArray(item.riskSignalsJson),
      qualifiedAt: item.qualifiedAt,
      rewardGrantedAt: item.rewardGrantedAt,
      createdAt: item.createdAt,
    })),
  };
}

async function getLearningMetrics(userId: string) {
  const d1 = getD1();
  const [enrollmentResult, reminderResult] = await Promise.all([
    d1
      .prepare(
        `SELECT course_id AS courseId, started_on AS startedOn,
                active, paused_at AS pausedAt
         FROM enrollments
         WHERE user_id = ?`,
      )
      .bind(userId)
      .all<{
        courseId: string;
        startedOn: string;
        active: number;
        pausedAt: string | null;
      }>(),
    d1
      .prepare(
        `SELECT level,
                delivery_status AS deliveryStatus,
                sent_at AS sentAt,
                delivered_at AS deliveredAt,
                clicked_at AS clickedAt,
                completed_at AS completedAt
         FROM reminder_events
         WHERE user_id = ?`,
      )
      .bind(userId)
      .all<{
        level: number;
        deliveryStatus: string;
        sentAt: string;
        deliveredAt: string | null;
        clickedAt: string | null;
        completedAt: string | null;
      }>(),
  ]);
  let evidenceRows: Array<{
    evidenceType: string;
    sourceType: string;
    sourceRef: string | number;
    courseId: string | null;
    lessonId: string | null;
    lessonDay: number | null;
    status: string;
    score: number;
    metadataJson: string | null;
    occurredOn: string | null;
  }> = [];
  let quizAttemptRows: Array<{
    lessonId: string;
    courseId: string;
    attemptNumber: number;
    isRevision: number;
    questionCount: number;
    correctCount: number;
    score: number;
    passed: number;
    submittedOn: string;
  }> = [];
  try {
    evidenceRows = (
      await d1
        .prepare(
          `SELECT evidence_type AS evidenceType,
                  source_type AS sourceType,
                  source_ref AS sourceRef,
                  course_id AS courseId,
                  lesson_id AS lessonId,
                  l.day AS lessonDay,
                  status,
                  ei.score,
                  metadata_json AS metadataJson,
                  occurred_on AS occurredOn
           FROM evidence_items ei
           LEFT JOIN lessons l ON l.id = ei.lesson_id
           WHERE ei.user_id = ?
             AND ei.status = 'accepted'`,
        )
        .bind(userId)
        .all<{
          evidenceType: string;
          sourceType: string;
          sourceRef: string | number;
          courseId: string | null;
          lessonId: string | null;
          lessonDay: number | null;
          status: string;
          score: number;
          metadataJson: string | null;
          occurredOn: string | null;
        }>()
    ).results;
  } catch (error) {
    if (!isMissingDatabaseRelationError(error, ["evidence_items"])) {
      throw error;
    }
  }
  try {
    quizAttemptRows = (
      await d1
        .prepare(
          `SELECT lesson_id AS lessonId,
                  course_id AS courseId,
                  attempt_number AS attemptNumber,
                  is_revision AS isRevision,
                  question_count AS questionCount,
                  correct_count AS correctCount,
                  score,
                  passed,
                  submitted_on AS submittedOn
           FROM quiz_attempts
           WHERE user_id = ?
           ORDER BY lesson_id, attempt_number`,
        )
        .bind(userId)
        .all<{
          lessonId: string;
          courseId: string;
          attemptNumber: number;
          isRevision: number;
          questionCount: number;
          correctCount: number;
          score: number;
          passed: number;
          submittedOn: string;
        }>()
    ).results;
  } catch (error) {
    if (!isMissingDatabaseRelationError(error, ["quiz_attempts"])) {
      throw error;
    }
  }

  const enrollments = enrollmentResult.results.map((row) => ({
    courseId: row.courseId,
    startedOn: datePart(row.startedOn),
    pausedOn: datePart(row.pausedAt),
    active: Boolean(row.active),
  }));

  const completionsByDay = new Map<string, Set<string>>();
  const lessonEvidenceRows = evidenceRows.filter(
    (row) => row.sourceType === "lesson_submission" && row.courseId,
  );

  for (const row of lessonEvidenceRows) {
    const metadata = parseJsonObject(row.metadataJson);
    if (metadata.completionSource === "extra") continue;
    const day = datePart(row.occurredOn);
    if (!day) continue;

    const completedCourses = completionsByDay.get(day) ?? new Set<string>();
    completedCourses.add(String(row.courseId));
    completionsByDay.set(day, completedCourses);
  }

  const effectiveDays = [...completionsByDay.keys()]
    .sort()
    .filter((day) => {
      const requiredCourses = new Set(
        enrollments
          .filter((enrollment) => {
            if (!enrollment.startedOn || enrollment.startedOn > day) return false;
            if (enrollment.active) return true;
            return Boolean(enrollment.pausedOn && enrollment.pausedOn >= day);
          })
          .map((enrollment) => enrollment.courseId),
      );
      if (requiredCourses.size === 0) return false;

      const completedCourses = completionsByDay.get(day) ?? new Set<string>();
      for (const courseId of requiredCourses) {
        if (!completedCourses.has(courseId)) return false;
      }
      return true;
    });

  let currentStreak = 0;
  if (effectiveDays.length > 0) {
    currentStreak = 1;
    for (let index = effectiveDays.length - 1; index > 0; index -= 1) {
      if (dateDistance(effectiveDays[index - 1], effectiveDays[index]) !== 1) break;
      currentStreak += 1;
    }
  }

  const deliveredReminders = reminderResult.results.filter(
    (row) => row.deliveryStatus === "delivered",
  );
  const completedAfterReminder = deliveredReminders.filter((row) => row.completedAt);
  const completionDurations = completedAfterReminder
    .map((row) => minutesBetween(row.sentAt, row.completedAt))
    .filter((value): value is number => value != null);
  const evidenceByType = {
    quiz: evidenceRows.filter((row) => row.evidenceType === "quiz").length,
    project: evidenceRows.filter((row) => row.evidenceType === "project").length,
    reflection: evidenceRows.filter((row) => row.evidenceType === "reflection").length,
    checkpoint: evidenceRows.filter((row) => row.evidenceType === "checkpoint").length,
    review: evidenceRows.filter((row) => row.evidenceType === "review").length,
    runtimeSuccess: evidenceRows.filter(
      (row) => row.evidenceType === "runtime_success",
    ).length,
  };
  const lessonEvidenceWithoutExtra = lessonEvidenceRows.filter(
    (row) => parseJsonObject(row.metadataJson).completionSource !== "extra",
  );
  const evidenceScores = evidenceRows
    .map((row) => Number(row.score))
    .filter((score) => Number.isFinite(score));
  const goalEvidenceRows = evidenceRows.filter(
    (row) => row.sourceType === "project_milestone",
  );
  const acceptedGoalCheckpointDays = new Set(
    goalEvidenceRows
      .map((row) => Number(parseJsonObject(row.metadataJson).checkpointDay))
      .filter((day) => Number.isFinite(day)),
  );
  const requiredGoalCheckpointDays = [0, 7, 21];
  const completedGoalCheckpointCount = requiredGoalCheckpointDays.filter((day) =>
    acceptedGoalCheckpointDays.has(day),
  ).length;
  const hasDay0Environment = acceptedGoalCheckpointDays.has(0);
  const hasDay7Prototype = acceptedGoalCheckpointDays.has(7);
  const hasDay21Dod = acceptedGoalCheckpointDays.has(21);
  const quizAttemptsByLesson = new Map<string, typeof quizAttemptRows>();
  for (const attempt of quizAttemptRows) {
    const attempts = quizAttemptsByLesson.get(attempt.lessonId) ?? [];
    attempts.push(attempt);
    quizAttemptsByLesson.set(attempt.lessonId, attempts);
  }
  const firstAttempts = [...quizAttemptsByLesson.values()]
    .map((attempts) =>
      attempts
        .slice()
        .sort((left, right) => Number(left.attemptNumber) - Number(right.attemptNumber))[0],
    )
    .filter(Boolean);
  const firstPassedCount = firstAttempts.filter(
    (attempt) => Number(attempt.passed) === 1,
  ).length;
  const firstFailedLessons = [...quizAttemptsByLesson.entries()].filter(([, attempts]) => {
    const first = attempts
      .slice()
      .sort((left, right) => Number(left.attemptNumber) - Number(right.attemptNumber))[0];
    return first && Number(first.passed) !== 1;
  });
  const revisionPassedAfterFailCount = firstFailedLessons.filter(([, attempts]) =>
    attempts.some(
      (attempt) => Number(attempt.attemptNumber) > 1 && Number(attempt.passed) === 1,
    ),
  ).length;
  const revisionAttemptLessons = [...quizAttemptsByLesson.values()].filter((attempts) =>
    attempts.some((attempt) => Number(attempt.attemptNumber) > 1),
  ).length;
  const totalQuizQuestions = quizAttemptRows.reduce(
    (sum, attempt) => sum + Number(attempt.questionCount ?? 0),
    0,
  );
  const totalQuizCorrect = quizAttemptRows.reduce(
    (sum, attempt) => sum + Number(attempt.correctCount ?? 0),
    0,
  );
  const competencyGraph = await buildCompetencyGraph(evidenceRows);

  return {
    effectiveLearningDays: effectiveDays.length,
    currentEffectiveStreak: currentStreak,
    latestEffectiveDay: effectiveDays.at(-1) ?? null,
    completedEvidenceCount: lessonEvidenceWithoutExtra.length,
    completionBreakdown: {
      self: lessonEvidenceWithoutExtra.filter(
        (row) => parseJsonObject(row.metadataJson).completionSource === "self",
      ).length,
      prompted: lessonEvidenceWithoutExtra.filter(
        (row) => parseJsonObject(row.metadataJson).completionSource === "prompted",
      ).length,
      supervised: lessonEvidenceWithoutExtra.filter(
        (row) => parseJsonObject(row.metadataJson).completionSource === "supervised",
      ).length,
    },
    evidenceMetrics: {
      acceptedCount: evidenceRows.length,
      lessonAcceptedCount: lessonEvidenceWithoutExtra.length,
      averageScore: evidenceScores.length
        ? Math.round(
            evidenceScores.reduce((sum, value) => sum + value, 0) /
              evidenceScores.length,
          )
        : null,
      byType: evidenceByType,
    },
    quizMetrics: {
      attemptCount: quizAttemptRows.length,
      lessonAttemptedCount: quizAttemptsByLesson.size,
      firstAttemptCount: firstAttempts.length,
      firstPassCount: firstPassedCount,
      firstPassRate: percentage(firstPassedCount, firstAttempts.length),
      firstFailCount: firstFailedLessons.length,
      revisionAttemptLessonCount: revisionAttemptLessons,
      revisionPassAfterFailCount: revisionPassedAfterFailCount,
      revisionPassAfterFailRate: percentage(
        revisionPassedAfterFailCount,
        firstFailedLessons.length,
      ),
      questionAccuracyRate: percentage(totalQuizCorrect, totalQuizQuestions),
    },
    goalMetrics: {
      templateId: PRIMARY_GOAL_TEMPLATE_ID,
      requiredCheckpointCount: requiredGoalCheckpointDays.length,
      completedCheckpointCount: completedGoalCheckpointCount,
      evidenceSubmissionRate: Math.round(
        (completedGoalCheckpointCount / requiredGoalCheckpointDays.length) * 100,
      ),
      fwpr7: {
        eligible: hasDay0Environment,
        achieved: hasDay0Environment && hasDay7Prototype,
      },
      day21Dod: {
        achieved: hasDay21Dod,
      },
    },
    competencyGraph,
    reminderMetrics: {
      deliveredCount: deliveredReminders.length,
      clickedCount: deliveredReminders.filter((row) => row.clickedAt).length,
      completedCount: completedAfterReminder.length,
      averageCompletionMinutes: completionDurations.length
        ? Math.round(
            completionDurations.reduce((sum, value) => sum + value, 0) /
              completionDurations.length,
          )
        : null,
      byLevel: {
        l1: completedAfterReminder.filter((row) => row.level === 1).length,
        l2: completedAfterReminder.filter((row) => row.level === 2).length,
        l3: completedAfterReminder.filter((row) => row.level === 3).length,
        l4: completedAfterReminder.filter((row) => row.level === 4).length,
      },
    },
  };
}

async function getAbilityAssessments(userId: string) {
  const rows = await getD1()
    .prepare(
      `SELECT id,
              course_id AS courseId,
              stage_key AS stageKey,
              version,
              prompt,
              rubric_json AS rubricJson,
              original_answer AS originalAnswer,
              revised_answer AS revisedAnswer,
              score,
              status,
              notes,
              created_at AS createdAt,
              updated_at AS updatedAt
       FROM ability_assessments
       WHERE user_id = ?
       ORDER BY id DESC`,
    )
    .bind(userId)
    .all<AbilityAssessmentRecord>();
  return rows.results;
}

function scoreAbilityAssessment(answer: string, rubric: string[]) {
  const normalized = answer.toLowerCase();
  const matched = rubric.filter((criterion) =>
    matchesCriterion(normalized, criterion),
  );
  const structureScore =
    rubric.length === 0 ? 70 : Math.round((matched.length / rubric.length) * 70);
  const lengthScore = Math.min(30, Math.floor(answer.trim().length / 8));
  const score = Math.min(100, structureScore + lengthScore);
  const missing = rubric.filter((criterion) => !matched.includes(criterion));
  return {
    score,
    status: score >= 67 ? "completed" : "needs_revision",
    notes:
      missing.length === 0
        ? "关键维度已覆盖，可以用于阶段对比。"
        : `建议补充：${missing.join("、")}。`,
  };
}

async function getDueAbilityAssessments(
  userId: string,
  enrollments: Array<{ courseId: string; currentDay: number }>,
) {
  const existing = await getAbilityAssessments(userId);
  const completedKeys = new Set(
    existing.map((item) => `${item.courseId}:${item.stageKey}`),
  );

  return enrollments
    .flatMap((enrollment) =>
      ASSESSMENT_STAGES.filter(
        (stage) => enrollment.currentDay >= stage.targetDay,
      ).map((stage) => {
        const question = assessmentQuestionFor(enrollment.courseId, stage.key);
        if (!question) return null;
        return {
          courseId: enrollment.courseId,
          stageKey: stage.key,
          label: stage.label,
          targetDay: stage.targetDay,
          title: question.title,
          prompt: question.prompt,
          rubric: question.rubric,
          completed: completedKeys.has(`${enrollment.courseId}:${stage.key}`),
        };
      }),
    )
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function buildAssessmentRecommendations(
  catalog: Array<{ id: string; title: string }>,
  dueAssessments: Array<{
    courseId: string;
    stageKey: AssessmentStageKey;
    label: string;
    targetDay: number;
    title: string;
    prompt: string;
    rubric: string[];
    completed: boolean;
  }>,
  abilityAssessments: AbilityAssessmentRecord[],
) {
  const courseTitleById = new Map(catalog.map((item) => [String(item.id), item.title]));
  const recommendations: Array<{
    courseId: string;
    courseTitle: string;
    stageKey: AssessmentStageKey;
    label: string;
    title: string;
    priority: "due" | "revise";
    status: "pending" | "needs_revision";
    message: string;
    actionLabel: string;
  }> = [];

  for (const assessment of dueAssessments.filter((item) => !item.completed)) {
    recommendations.push({
      courseId: assessment.courseId,
      courseTitle: courseTitleById.get(assessment.courseId) ?? assessment.courseId,
      stageKey: assessment.stageKey,
      label: assessment.label,
      title: assessment.title,
      priority: "due",
      status: "pending",
      message: `${assessment.label} 已到期。先做这次 checkpoint，系统才能判断你是真掌握了，还是只是今天刚做完。`,
      actionLabel: `去做 ${assessment.label}`,
    });
  }

  for (const record of abilityAssessments.filter((item) => item.status === "needs_revision")) {
    const stageLabel =
      ASSESSMENT_STAGES.find((stage) => stage.key === record.stageKey)?.label ??
      record.stageKey;
    recommendations.push({
      courseId: record.courseId,
      courseTitle: courseTitleById.get(record.courseId) ?? record.courseId,
      stageKey: record.stageKey,
      label: stageLabel,
      title: `${courseTitleById.get(record.courseId) ?? record.courseId} · ${stageLabel}`,
      priority: "revise",
      status: "needs_revision",
      message: record.notes?.trim()
        ? `${stageLabel} 还差一点：${record.notes}`
        : `${stageLabel} 还没过线。先按提示补齐关键维度，再继续往后学。`,
      actionLabel: `修正 ${stageLabel}`,
    });
  }

  return recommendations
    .sort((left, right) => {
      const priorityOrder = { due: 0, revise: 1 };
      return priorityOrder[left.priority] - priorityOrder[right.priority];
    })
    .slice(0, 3);
}

async function upsertReviewQueueItem(input: {
  userId: string;
  sourceType: "lesson" | "assessment";
  sourceRef: string;
  courseId: string | null;
  lessonId?: string | null;
  assessmentStageKey?: string | null;
  reason: "needs_revision" | "weekly_review";
  title: string;
  recommendation: string;
  dueOn: string;
}) {
  await getD1()
    .prepare(
      `INSERT INTO review_queue_items
         (user_id, source_type, source_ref, course_id, lesson_id, assessment_stage_key,
          reason, title, recommendation, due_on, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
       ON CONFLICT(user_id, source_type, source_ref, reason) DO UPDATE SET
         title = excluded.title,
         recommendation = excluded.recommendation,
         due_on = excluded.due_on,
         status = 'open',
         resolved_at = NULL,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      input.userId,
      input.sourceType,
      input.sourceRef,
      input.courseId,
      input.lessonId ?? null,
      input.assessmentStageKey ?? null,
      input.reason,
      input.title,
      input.recommendation,
      input.dueOn,
    )
    .run();
}

async function resolveReviewQueueItem(
  userId: string,
  sourceType: "lesson" | "assessment",
  sourceRef: string,
  reason?: "needs_revision" | "weekly_review",
) {
  await getD1()
    .prepare(
      `UPDATE review_queue_items
       SET status = 'completed',
           resolved_at = COALESCE(resolved_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?
         AND source_type = ?
         AND source_ref = ?
         ${reason ? "AND reason = ?" : ""}
         AND status = 'open'`,
    )
    .bind(
      ...(reason
        ? [userId, sourceType, sourceRef, reason]
        : [userId, sourceType, sourceRef]),
    )
    .run();
}

async function reconcileReviewQueue(
  userId: string,
  timezone = "Asia/Bangkok",
) {
  const d1 = getD1();
  const todayKey = localDateKey(timezone);
  const weeklyReviewCutoff = localDateKey(
    timezone,
    addDays(parseDatabaseDate(`${todayKey} 00:00:00`), -7),
  );

  const [lessons, assessments] = await Promise.all([
    d1
      .prepare(
        `SELECT s.lesson_id AS lessonId,
                s.status,
                s.rule_score AS ruleScore,
                s.completed_on AS completedOn,
                l.course_id AS courseId,
                l.title
         FROM submissions s
         JOIN lessons l ON l.id = s.lesson_id
         WHERE s.user_id = ?`,
      )
      .bind(userId)
      .all<{
        lessonId: string;
        status: string;
        ruleScore: number;
        completedOn: string | null;
        courseId: string;
        title: string;
      }>(),
    d1
      .prepare(
        `SELECT course_id AS courseId,
                stage_key AS stageKey,
                status,
                score,
                updated_at AS updatedAt
         FROM ability_assessments
         WHERE user_id = ?`,
      )
      .bind(userId)
      .all<{
        courseId: string;
        stageKey: string;
        status: string;
        score: number;
        updatedAt: string;
      }>(),
  ]);

  for (const lesson of lessons.results) {
    if (lesson.status === "needs_revision") {
      await upsertReviewQueueItem({
        userId,
        sourceType: "lesson",
        sourceRef: lesson.lessonId,
        courseId: lesson.courseId,
        lessonId: lesson.lessonId,
        reason: "needs_revision",
        title: `${lesson.title} · 重新修正`,
        recommendation: "先回看本课知识点，再按反馈补齐缺失项后重新提交。",
        dueOn: todayKey,
      });
    } else {
      await resolveReviewQueueItem(userId, "lesson", lesson.lessonId, "needs_revision");
    }

    if (
      lesson.status === "completed" &&
      lesson.completedOn &&
      lesson.completedOn <= weeklyReviewCutoff &&
      Number(lesson.ruleScore ?? 0) < 80
    ) {
      await upsertReviewQueueItem({
        userId,
        sourceType: "lesson",
        sourceRef: lesson.lessonId,
        courseId: lesson.courseId,
        lessonId: lesson.lessonId,
        reason: "weekly_review",
        title: `${lesson.title} · 7 天后复习`,
        recommendation: "这节课当时通过了，但分数偏低。请重新复述关键知识点，确认一周后仍然记得。",
        dueOn: todayKey,
      });
    }
  }

  for (const assessment of assessments.results) {
    const sourceRef = `${assessment.courseId}:${assessment.stageKey}`;
    if (assessment.status === "needs_revision") {
      await upsertReviewQueueItem({
        userId,
        sourceType: "assessment",
        sourceRef,
        courseId: assessment.courseId,
        assessmentStageKey: assessment.stageKey,
        reason: "needs_revision",
        title: `${assessment.stageKey.toUpperCase()} · 阶段测试补救`,
        recommendation: "先按阶段测试提示补齐关键维度，再重提这次 checkpoint。",
        dueOn: todayKey,
      });
    } else {
      await resolveReviewQueueItem(userId, "assessment", sourceRef, "needs_revision");
    }
  }
}

async function listReviewQueue(userId: string) {
  const rows = await getD1()
    .prepare(
      `SELECT id,
              source_type AS sourceType,
              source_ref AS sourceRef,
              course_id AS courseId,
              lesson_id AS lessonId,
              assessment_stage_key AS assessmentStageKey,
              reason,
              title,
              recommendation,
              due_on AS dueOn,
              status,
              resolved_at AS resolvedAt,
              created_at AS createdAt,
              updated_at AS updatedAt
       FROM review_queue_items
       WHERE user_id = ?
       ORDER BY status = 'open' DESC, due_on ASC, id DESC
       LIMIT 20`,
    )
    .bind(userId)
    .all<ReviewQueueItem>();
  return rows.results;
}

export async function resolveReviewQueueEntry(
  identity: AcademyIdentity,
  reviewQueueItemId: number,
) {
  await assertLearningAccess(identity);
  if (!Number.isInteger(reviewQueueItemId) || reviewQueueItemId <= 0) {
    throw new Response("复习项无效", { status: 400 });
  }

  const updated = await getD1()
    .prepare(
      `UPDATE review_queue_items
       SET status = 'completed',
           resolved_at = COALESCE(resolved_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?
       RETURNING id,
                 source_type AS sourceType,
                 source_ref AS sourceRef,
                 course_id AS courseId,
                 lesson_id AS lessonId,
                 assessment_stage_key AS assessmentStageKey,
                 reason,
                 title,
                 recommendation,
                 due_on AS dueOn,
                 status,
                 resolved_at AS resolvedAt,
                 created_at AS createdAt,
                 updated_at AS updatedAt`,
    )
    .bind(reviewQueueItemId, identity.id)
    .first<ReviewQueueItem>();

  if (!updated) {
    throw new Response("复习项不存在或不属于当前用户", { status: 404 });
  }

  await upsertEvidenceItem({
    userId: identity.id,
    evidenceType: "review",
    sourceType: "review_queue_item",
    sourceRef: updated.id,
    courseId: updated.courseId,
    lessonId: updated.lessonId,
    assessmentStageKey: updated.assessmentStageKey,
    status: "accepted",
    score: 100,
    metadata: {
      reason: updated.reason,
      title: updated.title,
      sourceType: updated.sourceType,
      sourceRef: updated.sourceRef,
    },
    occurredOn: updated.resolvedAt ?? updated.dueOn,
  });

  return updated;
}

async function syncEnrollmentDays(userId: string, todayKey: string) {
  const d1 = getD1();
  const completed = await d1
    .prepare(
      `SELECT e.id, e.current_day AS currentDay,
              ev.occurred_on AS acceptedOn,
              s.completion_source AS completionSource
       FROM enrollments e
       JOIN lessons l
         ON l.course_id = e.course_id AND l.day = e.current_day
       LEFT JOIN submissions s
         ON s.lesson_id = l.id AND s.user_id = e.user_id
       LEFT JOIN evidence_items ev
         ON ev.lesson_id = l.id
        AND ev.user_id = e.user_id
        AND ev.source_type = 'lesson_submission'
        AND ev.status = 'accepted'
       WHERE e.user_id = ? AND e.active = 1`,
    )
    .bind(userId)
    .all<{
      id: number;
      currentDay: number;
      acceptedOn: string | null;
      completionSource: string | null;
    }>();

  const advances = completed.results
    .filter(
      (item) =>
        item.currentDay < 60 &&
        Boolean(item.acceptedOn) &&
        item.completionSource !== "extra" &&
        String(item.acceptedOn) < todayKey,
    )
    .map((item) =>
      d1
        .prepare(
          `UPDATE enrollments
           SET current_day = current_day + 1
           WHERE id = ? AND user_id = ? AND current_day = ?`,
        )
        .bind(item.id, userId, item.currentDay),
    );

  if (advances.length > 0) await d1.batch(advances);
}

export async function updateEnrollments(
  identity: AcademyIdentity,
  courseIds: string[],
) {
  await assertLearningAccess(identity);
  if (courseIds.length < 1 || courseIds.length > 3) {
    throw new Response("请选择 1–3 门课程", { status: 400 });
  }

  const uniqueCourseIds = [...new Set(courseIds)];
  if (uniqueCourseIds.length !== courseIds.length) {
    throw new Response("课程不能重复选择", { status: 400 });
  }

  const d1 = getD1();
  const timezoneRow = await d1
    .prepare("SELECT timezone FROM users WHERE id = ?")
    .bind(identity.id)
    .first<{ timezone: string }>();
  const startedOn = localDateKey(timezoneRow?.timezone || "Asia/Bangkok");
  const placeholders = uniqueCourseIds.map(() => "?").join(",");
  const valid = await d1
    .prepare(
      `SELECT id FROM courses WHERE id IN (${placeholders}) AND status = 'active'`,
    )
    .bind(...uniqueCourseIds)
    .all();
  if (valid.results.length !== uniqueCourseIds.length) {
    throw new Response("包含不可用课程", { status: 400 });
  }

  const statements = [
    d1
      .prepare(
        `UPDATE enrollments SET active = 0, paused_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
      )
      .bind(identity.id),
    ...uniqueCourseIds.map((courseId) =>
      d1
        .prepare(
          `INSERT INTO enrollments
             (user_id, course_id, current_day, active, started_on)
           VALUES (?, ?, 1, 1, ?)
           ON CONFLICT(user_id, course_id) DO UPDATE SET
             active = 1,
             paused_at = NULL`,
        )
        .bind(identity.id, courseId, startedOn),
    ),
  ];
  await d1.batch(statements);
}

const CRITERION_ALIASES: Record<string, string[]> = {
  角色: ["你是", "身份", "担任", "扮演", "专家", "设计师", "顾问", "经理"],
  任务: ["任务", "请完成", "负责", "需要完成", "目标是"],
  背景: ["背景", "场景", "当前情况", "面向", "用户是", "因为"],
  约束: ["约束", "限制", "必须", "不得", "不超过", "优先"],
  验收标准: ["验收", "判断完成", "成功标准", "达到以下", "可交付"],
};

// A few lesson criteria describe an intent rather than a word learners should
// literally type. Day 1's `city`, for example, is normally expressed as
// "I'm from Fuzhou" or "I live in Phnom Penh", not as the word "city".
// Keep these patterns narrow so the rule score remains explainable.
const CRITERION_PATTERNS: Record<string, RegExp[]> = {
  city: [
    /\b(?:i(?:'m| am) from|from|live in|i(?:'m| am) living in|based in|located in)\s+[a-z][a-z .,'-]{1,48}/,
  ],
};

function matchesCriterion(normalizedAnswer: string, criterion: string) {
  const normalizedCriterion = criterion.toLowerCase();
  const candidates = [
    normalizedCriterion,
    ...(CRITERION_ALIASES[normalizedCriterion] ?? []),
  ];
  return (
    candidates.some((candidate) =>
      normalizedAnswer.includes(candidate.toLowerCase()),
    ) ||
    (CRITERION_PATTERNS[normalizedCriterion] ?? []).some((pattern) =>
      pattern.test(normalizedAnswer),
    )
  );
}

function scoreAnswer(
  answer: string,
  criteria: string[],
  assessment?: MultipleChoiceAssessment,
) {
  if (assessment) {
    const answers = JSON.parse(answer) as Record<string, string>;
    const correctCount = assessment.questions.filter(
      (question, index) => answers[String(index)] === question.correctOptionId,
    ).length;
    const total = assessment.questions.length;
    const score = Math.round((correctCount / total) * 100);
    const incorrect = assessment.questions
      .map((question, index) => ({ question, index }))
      .filter(({ question, index }) => answers[String(index)] !== question.correctOptionId)
      .map(({ question, index }) => `第 ${index + 1} 题：${question.explanation}`);
    return {
      score,
      correctCount,
      questionCount: total,
      feedback:
        correctCount === total
          ? `全部答对（${correctCount}/${total}）。关键知识点已掌握。`
          : `答对 ${correctCount}/${total} 题。${incorrect.join(" ")}`,
    };
  }

  const normalized = answer.toLowerCase();
  const matched = criteria.filter((criterion) =>
    matchesCriterion(normalized, criterion),
  );
  const lengthScore = Math.min(20, Math.floor(answer.trim().length / 5));
  const criteriaScore =
    criteria.length === 0 ? 40 : Math.round((matched.length / criteria.length) * 60);
  const score = Math.min(100, lengthScore + criteriaScore + 20);
  const missing = criteria.filter((criterion) => !matched.includes(criterion));

  return {
    score,
    correctCount: matched.length,
    questionCount: criteria.length,
    feedback:
      missing.length === 0
        ? "结构完整。下一步请用真实结果验证这份答案。"
        : `已经覆盖 ${matched.length}/${criteria.length} 个检查项。建议补充：${missing.join("、")}。`,
  };
}

async function classifyCompletionSource(
  userId: string,
  timezone: string,
  requestedSource?: string,
) {
  if (requestedSource === "extra") return "extra";
  if (requestedSource && requestedSource !== "self") return requestedSource;

  const completionDay = localDateKey(timezone);
  const reminderEvents = await getD1()
    .prepare(
      `SELECT level,
              delivery_status AS deliveryStatus,
              sent_at AS sentAt,
              clicked_at AS clickedAt
       FROM reminder_events
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 20`,
    )
    .bind(userId)
    .all<{
      level: number;
      deliveryStatus: string;
      sentAt: string;
      clickedAt: string | null;
    }>();

  const sameDayEvents = reminderEvents.results.filter((event) => {
    const relevantAt = event.clickedAt ?? event.sentAt;
    return localDateKey(timezone, parseDatabaseDate(relevantAt)) === completionDay;
  });

  if (sameDayEvents.length === 0) return "self";
  const highestLevel = sameDayEvents.reduce(
    (max, event) => Math.max(max, Number(event.level ?? 0)),
    0,
  );
  return highestLevel >= 3 ? "supervised" : "prompted";
}

async function markReminderCompleted(
  userId: string,
  timezone: string,
  submissionId: number,
) {
  const completionDay = localDateKey(timezone);
  const event = await getD1()
    .prepare(
      `SELECT id,
              clicked_at AS clickedAt,
              sent_at AS sentAt
       FROM reminder_events
       WHERE user_id = ?
         AND delivery_status = 'delivered'
       ORDER BY id DESC
       LIMIT 20`,
    )
    .bind(userId)
    .all<{
      id: number;
      clickedAt: string | null;
      sentAt: string;
    }>();

  const matching = event.results.find((row) => {
    const relevantAt = row.clickedAt ?? row.sentAt;
    return localDateKey(timezone, parseDatabaseDate(relevantAt)) === completionDay;
  });
  if (!matching) return;

  await getD1()
    .prepare(
      `UPDATE reminder_events
       SET completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP),
           completed_submission_id = COALESCE(completed_submission_id, ?)
       WHERE id = ?`,
    )
    .bind(submissionId, matching.id)
    .run();
}

async function recordQuizAttempt(input: {
  userId: string;
  enrollmentId: number;
  lessonId: string;
  courseId: string;
  contentVersionId: number | null;
  answersJson: string;
  questionCount: number;
  correctCount: number;
  score: number;
  passed: boolean;
  submittedOn: string;
}) {
  const d1 = getD1();
  const existing = await d1
    .prepare(
      `SELECT COALESCE(MAX(attempt_number), 0) AS maxAttempt
       FROM quiz_attempts
       WHERE user_id = ? AND lesson_id = ?`,
    )
    .bind(input.userId, input.lessonId)
    .first<{ maxAttempt: number }>();
  const attemptNumber = Number(existing?.maxAttempt ?? 0) + 1;

  await d1
    .prepare(
      `INSERT INTO quiz_attempts
         (user_id, enrollment_id, lesson_id, course_id, content_version_id, attempt_number,
          is_revision, question_count, correct_count, score, passed,
          answers_json, submitted_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.userId,
      input.enrollmentId,
      input.lessonId,
      input.courseId,
      input.contentVersionId,
      attemptNumber,
      attemptNumber > 1 ? 1 : 0,
      input.questionCount,
      input.correctCount,
      input.score,
      input.passed ? 1 : 0,
      input.answersJson,
      input.submittedOn,
    )
    .run();
}

async function getCurrentPublishedCourseVersionId(courseId: string) {
  try {
    const row = await getD1()
      .prepare(
        `SELECT id
           FROM course_content_versions
          WHERE course_id = ?
            AND status = 'published'
          ORDER BY published_at DESC, id DESC
          LIMIT 1`,
      )
      .bind(courseId)
      .first<{ id: number }>();
    return row?.id ? Number(row.id) : null;
  } catch (error) {
    if (!isMissingDatabaseRelationError(error, ["course_content_versions"])) {
      throw error;
    }
    return null;
  }
}

export async function markReminderOpened(
  identity: AcademyIdentity,
  reminderEventId: number,
) {
  if (!Number.isInteger(reminderEventId) || reminderEventId <= 0) {
    throw new Response("提醒事件无效", { status: 400 });
  }

  await getD1()
    .prepare(
      `UPDATE reminder_events
       SET clicked_at = COALESCE(clicked_at, CURRENT_TIMESTAMP)
       WHERE id = ? AND user_id = ?`,
    )
    .bind(reminderEventId, identity.id)
    .run();
}

function normalizeArtifactUrl(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  if (!normalized) return null;
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Response("链接格式不正确，请填写 http 或 https 地址", {
      status: 400,
    });
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Response("链接必须是 http 或 https 地址", { status: 400 });
  }
  return parsed.toString().slice(0, 500);
}

function evidenceItemsFromText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeRuntimeTestCases(value: unknown): RuntimeTestCase[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record =
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : {};
      return {
        question: String(record.question ?? "").trim(),
        expected: String(record.expected ?? "").trim(),
        actual: String(record.actual ?? "").trim(),
        citation: String(record.citation ?? "").trim(),
      };
    })
    .filter(
      (item) =>
        item.question || item.expected || item.actual || item.citation,
    )
    .slice(0, 5);
}

function hasCitationSignal(value: string) {
  return /(source|citation|引用|来源|出处|参考|page\s*\d+|p\.\s*\d+|\[[0-9]+\]|https?:\/\/|\.pdf|\.md|document|file)/i.test(
    value,
  );
}

function checkStructuredRuntimeEvidence(input: {
  checkpointDay: number;
  runtimeTests: RuntimeTestCase[];
  artifactUrl: string | null;
  uploadedArtifacts: UploadedArtifactRecord[];
  evidenceText: string;
}): StructuredRuntimeEvidenceCheck {
  if (input.checkpointDay < 7) {
    return {
      required: false,
      ok: true,
      validCaseCount: 0,
      citationCaseCount: 0,
      workflowExportProvided: false,
      errors: [],
    };
  }
  const validCases = input.runtimeTests.filter(
    (testCase) =>
      testCase.question.length >= 5 &&
      testCase.expected.length >= 3 &&
      testCase.actual.length >= 10,
  );
  const citationCases = validCases.filter((testCase) =>
    hasCitationSignal(`${testCase.actual}\n${testCase.citation}`),
  );
  const workflowExportProvided =
    /\.json($|\?)/i.test(input.artifactUrl ?? "") ||
    input.uploadedArtifacts.some(
      (artifact) =>
        artifact.mimeType === "application/json" ||
        /\.json$/i.test(artifact.originalFilename),
    ) ||
    /\b(flowise|workflow export|export json|工作流|导出)\b/i.test(
      input.evidenceText,
    );
  const errors: string[] = [];
  if (validCases.length < 3) {
    errors.push("runtime_tests_min_3");
  }
  if (citationCases.length < 2) {
    errors.push("runtime_tests_citations_min_2");
  }
  if (input.checkpointDay >= 21 && !workflowExportProvided) {
    errors.push("workflow_export_required_day21");
  }
  return {
    required: true,
    ok: errors.length === 0,
    validCaseCount: validCases.length,
    citationCaseCount: citationCases.length,
    workflowExportProvided,
    errors,
  };
}

type ArtifactRuntimeCheck = {
  ok: boolean;
  url: string | null;
  method: "HEAD" | "GET" | "not_required";
  status: number | null;
  error: string | null;
  contentType?: string | null;
  contentLength?: number | null;
  probe?: {
    mode: "remote_runtime_probe_v1";
    finalUrl: string | null;
    contentType: string | null;
    sampleBytes: number;
    hasHtmlShell: boolean;
    hasApiSignal: boolean;
    hasInteractiveSignal: boolean;
    hasFlowiseSignal: boolean;
    hasRuntimeSignal: boolean;
    signals: string[];
  };
};

function runtimeProbeFromResponse(response: Response, body: string): ArtifactRuntimeCheck["probe"] {
  const sample = body.slice(0, 80_000);
  const contentType = response.headers.get("content-type");
  const lower = sample.toLowerCase();
  const signals: string[] = [];
  const hasHtmlShell = /<html|<body|<script|<form|<input|<textarea|<button/i.test(sample);
  if (hasHtmlShell) signals.push("html_shell");
  const hasApiSignal =
    /application\/json/i.test(contentType ?? "") ||
    /"status"\s*:|"data"\s*:|"message"\s*:|"answer"\s*:|"response"\s*:/i.test(sample);
  if (hasApiSignal) signals.push("api_response");
  const hasInteractiveSignal =
    /\b(chat|ask|question|prompt|message|send|submit|upload|demo|playground|try it|start)\b/i.test(
      sample,
    );
  if (hasInteractiveSignal) signals.push("interactive_surface");
  const hasFlowiseSignal =
    /\b(flowise|chatflow|prediction|api\/v1\/prediction|chatbotConfig|embed)\b/i.test(
      sample,
    );
  if (hasFlowiseSignal) signals.push("flowise_runtime");
  const hasRuntimeSignal =
    hasApiSignal || hasInteractiveSignal || hasFlowiseSignal || /\b(runtime|agent|rag|retrieval|source|citation)\b/i.test(lower);
  if (hasRuntimeSignal) signals.push("runtime_signal");
  return {
    mode: "remote_runtime_probe_v1",
    finalUrl: response.url || null,
    contentType,
    sampleBytes: sample.length,
    hasHtmlShell,
    hasApiSignal,
    hasInteractiveSignal,
    hasFlowiseSignal,
    hasRuntimeSignal,
    signals: [...new Set(signals)],
  };
}

async function checkArtifactRuntime(
  artifactUrl: string | null,
  checkpointDay: number,
): Promise<ArtifactRuntimeCheck> {
  if (checkpointDay < 7) {
    return {
      ok: true,
      url: artifactUrl,
      method: "not_required",
      status: null,
      error: null,
      contentType: null,
      contentLength: null,
    };
  }
  if (!artifactUrl) {
    return {
      ok: false,
      url: null,
      method: "not_required",
      status: null,
      error: "artifact_url_required",
      contentType: null,
      contentLength: null,
    };
  }
  const safeUrl = validatePublicRuntimeUrl(artifactUrl);
  if (!safeUrl.ok || !safeUrl.url) {
    return {
      ok: false,
      url: artifactUrl,
      method: "not_required",
      status: null,
      error: safeUrl.error,
      contentType: null,
      contentLength: null,
    };
  }

  async function attempt(method: "HEAD" | "GET") {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    try {
      const response = await fetch(safeUrl.url, {
        method,
        redirect: "manual",
        signal: controller.signal,
        cache: "no-store",
      });
      const contentType = response.headers.get("content-type");
      const contentLengthHeader = response.headers.get("content-length");
      const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;
      const body =
        method === "GET" && response.ok
          ? await response
              .clone()
              .text()
              .then((text) => text.slice(0, 80_000))
              .catch(() => "")
          : "";
      const probe = method === "GET" && response.ok
        ? runtimeProbeFromResponse(response, body)
        : undefined;
      return {
        ok: response.ok && (method !== "GET" || Boolean(probe?.hasRuntimeSignal)),
        url: response.url || safeUrl.url,
        method,
        status: response.status,
        error: !response.ok
          ? `http_${response.status}`
          : method === "GET" && !probe?.hasRuntimeSignal
            ? "runtime_signal_missing"
            : null,
        contentType,
        contentLength: Number.isFinite(contentLength) ? contentLength : null,
        probe,
      } satisfies ArtifactRuntimeCheck;
    } finally {
      clearTimeout(timer);
    }
  }

  try {
    const head = await attempt("HEAD");
    if (head.status && ![403, 405, 501].includes(head.status)) {
      const get = await attempt("GET");
      if (get.status) return get;
      return head;
    }
    return await attempt("GET");
  } catch (error) {
    return {
      ok: false,
      url: artifactUrl,
      method: "HEAD",
      status: null,
      error: error instanceof Error ? error.name || error.message : "fetch_failed",
      contentType: null,
      contentLength: null,
    };
  }
}

function scoreProjectMilestone(input: {
  evidenceText: string;
  evidenceItems: string[];
  artifactUrl: string | null;
  checkpointDay: number;
  runtimeCheck: ArtifactRuntimeCheck;
  structuredRuntimeEvidence: StructuredRuntimeEvidenceCheck;
}) {
  const evidenceScore = Math.min(45, input.evidenceItems.length * 15);
  const artifactScore = input.artifactUrl ? 25 : 0;
  const runtimeTestScore = input.structuredRuntimeEvidence.required
    ? Math.min(
        30,
        input.structuredRuntimeEvidence.validCaseCount * 7 +
          input.structuredRuntimeEvidence.citationCaseCount * 3 +
          (input.structuredRuntimeEvidence.workflowExportProvided ? 3 : 0),
      )
    : 0;
  const explanationScore = Math.min(
    input.structuredRuntimeEvidence.required ? 10 : 30,
    Math.floor(input.evidenceText.length / 8),
  );
  const score = Math.min(
    100,
    evidenceScore + artifactScore + explanationScore + runtimeTestScore,
  );
  const status =
    score < 60
      ? "needs_revision"
      : input.checkpointDay >= 7 && !input.runtimeCheck.ok
        ? "needs_revision"
      : input.checkpointDay >= 7 && !input.structuredRuntimeEvidence.ok
        ? "needs_revision"
      : input.checkpointDay >= 7
        ? "pending_review"
        : "accepted";
  return {
    score,
    status,
    notes:
      status === "accepted"
        ? "里程碑证据已记录，可用于原型进度计算。"
        : status === "pending_review"
          ? "链接可访问，里程碑证据已通过规则检查，等待人工审核后计入原型进度。"
        : input.checkpointDay >= 7 && !input.runtimeCheck.ok
          ? `运行链接校验未通过：${input.runtimeCheck.error ?? "unknown"}。请补充可打开的 Demo / README / workflow 链接。`
        : input.checkpointDay >= 7 && !input.structuredRuntimeEvidence.ok
          ? `运行测试证据不足：${input.structuredRuntimeEvidence.errors.join(", ")}。请补齐 3 个测试问题、实际回答和至少 2 个来源/引用线索。`
        : "建议补充可检查链接、运行结果、测试问题或失败修正记录。",
  };
}

const UPLOAD_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
]);

const UPLOAD_EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/markdown": ".md",
  "application/json": ".json",
};

function uploadReference(id: number) {
  return `academy-upload:${id}`;
}

function uploadMaxBytes() {
  const configured = Number(runtimeEnv().ACADEMY_UPLOAD_MAX_BYTES ?? "");
  return Number.isFinite(configured) && configured > 0 ? configured : 5 * 1024 * 1024;
}

function sanitizeUploadFilename(filename: string) {
  const normalized = filename.trim().replace(/[\\/]/g, "-");
  return normalized.replace(/[^\p{L}\p{N}._ -]/gu, "").slice(0, 120) || "artifact";
}

function sanitizeUserDirectory(userId: string) {
  return userId.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 80) || "unknown";
}

async function resolveUploadTarget(userId: string, storedFilename: string) {
  const [{ mkdir }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const baseDirectory = path.resolve(
    runtimeEnv().ACADEMY_UPLOAD_DIR ?? path.join(process.cwd(), ".academy-uploads"),
  );
  const userDirectory = path.resolve(baseDirectory, sanitizeUserDirectory(userId));
  const targetPath = path.resolve(userDirectory, storedFilename);
  const baseWithSeparator = `${baseDirectory}${path.sep}`;
  if (!userDirectory.startsWith(baseWithSeparator) || !targetPath.startsWith(`${userDirectory}${path.sep}`)) {
    throw new Response("invalid upload path", { status: 400 });
  }
  await mkdir(userDirectory, { recursive: true });
  return { targetPath };
}

async function listOwnedUploadedArtifacts(
  userId: string,
  artifactIds: number[],
): Promise<UploadedArtifactRecord[]> {
  const uniqueIds = [...new Set(artifactIds.filter((id) => Number.isInteger(id) && id > 0))];
  if (!uniqueIds.length) return [];
  const placeholders = uniqueIds.map(() => "?").join(", ");
  const rows = await getD1()
    .prepare(
      `SELECT id,
              purpose,
              original_filename AS originalFilename,
              mime_type AS mimeType,
              size_bytes AS sizeBytes,
              sha256,
              status,
              created_at AS createdAt
       FROM uploaded_artifacts
       WHERE user_id = ? AND status = 'stored' AND id IN (${placeholders})`,
    )
    .bind(userId, ...uniqueIds)
    .all<{
      id: number;
      purpose: string;
      originalFilename: string;
      mimeType: string;
      sizeBytes: number;
      sha256: string;
      status: string;
      createdAt: string;
    }>();
  return rows.results.map((row) => ({
    id: Number(row.id),
    reference: uploadReference(Number(row.id)),
    purpose: row.purpose,
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    sizeBytes: Number(row.sizeBytes),
    sha256: row.sha256,
    status: row.status,
    createdAt: row.createdAt,
  }));
}

async function attachUploadedArtifactsToSource(
  userId: string,
  artifactIds: number[],
  sourceType: string,
  sourceRef: string | number,
) {
  const uniqueIds = [...new Set(artifactIds.filter((id) => Number.isInteger(id) && id > 0))];
  if (!uniqueIds.length) return;
  const placeholders = uniqueIds.map(() => "?").join(", ");
  await getD1()
    .prepare(
      `UPDATE uploaded_artifacts
       SET related_source_type = ?, related_source_ref = ?
       WHERE user_id = ? AND id IN (${placeholders})`,
    )
    .bind(sourceType, String(sourceRef), userId, ...uniqueIds)
    .run();
}

export async function saveUploadedArtifact(
  identity: AcademyIdentity,
  payload: {
    file: File;
    purpose?: string | null;
  },
): Promise<UploadedArtifactRecord> {
  await assertLearningAccess(identity);

  const file = payload.file;
  if (!file || file.size <= 0) {
    throw new Response("file is required", { status: 400 });
  }
  const maxBytes = uploadMaxBytes();
  if (file.size > maxBytes) {
    throw new Response(`file is too large. max=${maxBytes}`, { status: 413 });
  }
  const mimeType = file.type || "application/octet-stream";
  if (!UPLOAD_ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Response("unsupported file type", { status: 415 });
  }

  const [{ createHash }, { writeFile }] = await Promise.all([
    import("node:crypto"),
    import("node:fs/promises"),
  ]);
  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const extension = UPLOAD_EXTENSION_BY_MIME[mimeType] ?? "";
  const originalFilename = sanitizeUploadFilename(file.name || `artifact${extension}`);
  const storedFilename = `${Date.now()}-${sha256.slice(0, 16)}${extension}`;
  const { targetPath } = await resolveUploadTarget(identity.id, storedFilename);
  await writeFile(targetPath, buffer, { flag: "wx" });

  const saved = await getD1()
    .prepare(
      `INSERT INTO uploaded_artifacts
         (user_id, purpose, original_filename, stored_filename, storage_path,
          mime_type, size_bytes, sha256, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'stored')
       RETURNING id,
                 purpose,
                 original_filename AS originalFilename,
                 mime_type AS mimeType,
                 size_bytes AS sizeBytes,
                 sha256,
                 status,
                 created_at AS createdAt`,
    )
    .bind(
      identity.id,
      payload.purpose?.trim() || "project_milestone",
      originalFilename,
      storedFilename,
      targetPath,
      mimeType,
      file.size,
      sha256,
    )
    .first<{
      id: number;
      purpose: string;
      originalFilename: string;
      mimeType: string;
      sizeBytes: number;
      sha256: string;
      status: string;
      createdAt: string;
    }>();
  if (!saved) {
    throw new Error("uploaded artifact was not saved");
  }

  return {
    id: Number(saved.id),
    reference: uploadReference(Number(saved.id)),
    purpose: saved.purpose,
    originalFilename: saved.originalFilename,
    mimeType: saved.mimeType,
    sizeBytes: Number(saved.sizeBytes),
    sha256: saved.sha256,
    status: saved.status,
    createdAt: saved.createdAt,
  };
}

export async function submitProjectMilestone(
  identity: AcademyIdentity,
  payload: {
    templateId: string;
    checkpointId: string;
    evidenceText: string;
    artifactUrl?: string | null;
    attachmentIds?: number[];
    runtimeTests?: unknown;
  },
) {
  await assertLearningAccess(identity);

  const templateId = payload.templateId.trim();
  const checkpointId = payload.checkpointId.trim();
  const template = await getGoalTemplateDefinition(templateId);
  if (template.id !== templateId) {
    throw new Response("目标模板不存在或尚未启用", { status: 404 });
  }

  const checkpoint = template.checkpoints.find((item) => item.id === checkpointId);
  if (!checkpoint) {
    throw new Response("目标检查点不存在", { status: 404 });
  }

  const aiEnrollment = await getD1()
    .prepare(
      `SELECT id FROM enrollments
       WHERE user_id = ? AND course_id = 'ai-command-skills' AND active = 1
       LIMIT 1`,
    )
    .bind(identity.id)
    .first<{ id: number }>();
  if (!aiEnrollment) {
    throw new Response("请先启用 AI 课程，再提交 AI 助手里程碑。", {
      status: 409,
    });
  }

  const evidenceText = payload.evidenceText.trim();
  if (evidenceText.length < 20) {
    throw new Response("里程碑说明至少需要 20 个字", { status: 400 });
  }
  const artifactUrl = normalizeArtifactUrl(payload.artifactUrl);
  const evidenceItems = evidenceItemsFromText(evidenceText);
  const uploadedArtifacts = await listOwnedUploadedArtifacts(
    identity.id,
    payload.attachmentIds ?? [],
  );
  const requestedAttachmentIds = [
    ...new Set((payload.attachmentIds ?? []).filter((id) => Number.isInteger(id) && id > 0)),
  ];
  if (uploadedArtifacts.length !== requestedAttachmentIds.length) {
    throw new Response("one or more attachments are unavailable", { status: 400 });
  }
  const runtimeTests = normalizeRuntimeTestCases(payload.runtimeTests);
  const structuredRuntimeEvidence = checkStructuredRuntimeEvidence({
    checkpointDay: checkpoint.day,
    runtimeTests,
    artifactUrl,
    uploadedArtifacts,
    evidenceText,
  });
  const runtimeCheck = await checkArtifactRuntime(artifactUrl, checkpoint.day);
  const rule = scoreProjectMilestone({
    evidenceText,
    evidenceItems,
    artifactUrl,
    checkpointDay: checkpoint.day,
    runtimeCheck,
    structuredRuntimeEvidence,
  });

  const saved = await getD1()
    .prepare(
      `INSERT INTO project_milestones
         (user_id, template_id, checkpoint_id, checkpoint_day, artifact_url,
          evidence_text, evidence_json, status, score, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, template_id, checkpoint_id) DO UPDATE SET
         checkpoint_day = excluded.checkpoint_day,
         artifact_url = excluded.artifact_url,
         evidence_text = excluded.evidence_text,
         evidence_json = excluded.evidence_json,
         status = excluded.status,
         score = excluded.score,
         notes = excluded.notes,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id,
                 template_id AS templateId,
                 checkpoint_id AS checkpointId,
                 checkpoint_day AS checkpointDay,
                 artifact_url AS artifactUrl,
                 evidence_text AS evidenceText,
                 evidence_json AS evidenceJson,
                 status,
                 score,
                 notes,
                 reviewed_at AS reviewedAt,
                 reviewed_by AS reviewedBy,
                 submitted_at AS submittedAt,
                 updated_at AS updatedAt`,
    )
    .bind(
      identity.id,
      template.id,
      checkpoint.id,
      checkpoint.day,
      artifactUrl,
      evidenceText,
      JSON.stringify(evidenceItems),
      rule.status,
      rule.score,
      rule.notes,
    )
    .first<{
      id: number;
      templateId: string;
      checkpointId: string;
      checkpointDay: number;
      artifactUrl: string | null;
      evidenceText: string;
      evidenceJson: string;
      status: string;
      score: number;
      notes: string | null;
      reviewedAt: string | null;
      reviewedBy: string | null;
      submittedAt: string;
      updatedAt: string;
    }>();
  if (!saved) {
    throw new Error("project milestone was not saved");
  }
  await attachUploadedArtifactsToSource(
    identity.id,
    uploadedArtifacts.map((artifact) => artifact.id),
    "project_milestone",
    saved.id,
  );

  const timezoneRow = await getD1()
    .prepare("SELECT timezone FROM users WHERE id = ?")
    .bind(identity.id)
    .first<{ timezone: string }>();
  await upsertEvidenceItem({
    userId: identity.id,
    evidenceType: checkpoint.day >= 7 ? "runtime_success" : "project",
    sourceType: "project_milestone",
    sourceRef: saved.id,
    courseId: "ai-command-skills",
    lessonId: null,
    assessmentStageKey: null,
    sourceVersion: template.version,
    status: rule.status === "accepted" ? "accepted" : "needs_revision",
    score: rule.score,
    metadata: {
      templateId: template.id,
      checkpointId: checkpoint.id,
      checkpointDay: checkpoint.day,
      artifactUrl,
      evidenceItems,
      uploadedArtifacts,
      runtimeCheck,
      runtimeTests,
      structuredRuntimeEvidence,
      notes: rule.notes,
    },
    occurredOn: localDateKey(timezoneRow?.timezone || "Asia/Bangkok"),
  });

  return {
    id: Number(saved.id),
    templateId: saved.templateId,
    checkpointId: saved.checkpointId,
    checkpointDay: Number(saved.checkpointDay),
    artifactUrl: saved.artifactUrl,
    evidenceText: saved.evidenceText,
    evidenceItems: parseJsonArray(saved.evidenceJson),
    status: saved.status,
    score: Number(saved.score),
    notes: saved.notes,
    reviewedAt: saved.reviewedAt,
    reviewedBy: saved.reviewedBy,
    submittedAt: saved.submittedAt,
    updatedAt: saved.updatedAt,
  } satisfies ProjectMilestoneRecord;
}

export async function reviewProjectMilestone(
  payload: {
    milestoneId: number;
    action: "approve" | "request_revision";
    reviewedBy?: string | null;
    note?: string | null;
  },
) {
  if (!Number.isInteger(payload.milestoneId) || payload.milestoneId <= 0) {
    throw new Response("milestoneId is required", { status: 400 });
  }
  const nextStatus = payload.action === "approve" ? "accepted" : "needs_revision";
  const d1 = getD1();
  const existing = await d1
    .prepare(
      `SELECT pm.id,
              pm.user_id AS userId,
              pm.template_id AS templateId,
              pm.checkpoint_id AS checkpointId,
              pm.checkpoint_day AS checkpointDay,
              pm.artifact_url AS artifactUrl,
              pm.evidence_text AS evidenceText,
              pm.evidence_json AS evidenceJson,
              pm.score,
              pm.notes,
              pm.submitted_at AS submittedAt,
              gt.version AS templateVersion
       FROM project_milestones pm
       JOIN goal_templates gt ON gt.id = pm.template_id
       WHERE pm.id = ?`,
    )
    .bind(payload.milestoneId)
    .first<{
      id: number;
      userId: string;
      templateId: string;
      checkpointId: string;
      checkpointDay: number;
      artifactUrl: string | null;
      evidenceText: string;
      evidenceJson: string;
      score: number;
      notes: string | null;
      submittedAt: string;
      templateVersion: string;
    }>();
  if (!existing) {
    throw new Response("project milestone not found", { status: 404 });
  }

  const reviewedBy = payload.reviewedBy?.trim().slice(0, 120) || "academy-admin";
  const note =
    payload.note?.trim().slice(0, 800) ||
    (nextStatus === "accepted"
      ? "人工审核通过，计入目标模板证据。"
      : "人工审核要求补充证据后重新提交。");
  const reviewed = await d1
    .prepare(
      `UPDATE project_milestones
       SET status = ?,
           notes = ?,
           reviewed_at = CURRENT_TIMESTAMP,
           reviewed_by = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?
       RETURNING id,
                 template_id AS templateId,
                 checkpoint_id AS checkpointId,
                 checkpoint_day AS checkpointDay,
                 artifact_url AS artifactUrl,
                 evidence_text AS evidenceText,
                 evidence_json AS evidenceJson,
                 status,
                 score,
                 notes,
                 reviewed_at AS reviewedAt,
                 reviewed_by AS reviewedBy,
                 submitted_at AS submittedAt,
                 updated_at AS updatedAt`,
    )
    .bind(nextStatus, note, reviewedBy, payload.milestoneId)
    .first<{
      id: number;
      templateId: string;
      checkpointId: string;
      checkpointDay: number;
      artifactUrl: string | null;
      evidenceText: string;
      evidenceJson: string;
      status: string;
      score: number;
      notes: string | null;
      reviewedAt: string | null;
      reviewedBy: string | null;
      submittedAt: string;
      updatedAt: string;
    }>();
  if (!reviewed) {
    throw new Error("project milestone review was not saved");
  }

  await upsertEvidenceItem({
    userId: existing.userId,
    evidenceType: Number(existing.checkpointDay) >= 7 ? "runtime_success" : "project",
    sourceType: "project_milestone",
    sourceRef: existing.id,
    courseId: "ai-command-skills",
    lessonId: null,
    assessmentStageKey: null,
    sourceVersion: existing.templateVersion,
    status: nextStatus === "accepted" ? "accepted" : "needs_revision",
    score: Number(existing.score ?? 0),
    metadata: {
      templateId: existing.templateId,
      checkpointId: existing.checkpointId,
      checkpointDay: Number(existing.checkpointDay),
      artifactUrl: existing.artifactUrl,
      evidenceItems: parseJsonArray(existing.evidenceJson),
      manualReview: {
        action: payload.action,
        reviewedBy,
        note,
      },
    },
    occurredOn: datePart(existing.submittedAt) || localDateKey("Asia/Bangkok"),
  });

  return {
    id: Number(reviewed.id),
    templateId: reviewed.templateId,
    checkpointId: reviewed.checkpointId,
    checkpointDay: Number(reviewed.checkpointDay),
    artifactUrl: reviewed.artifactUrl,
    evidenceText: reviewed.evidenceText,
    evidenceItems: parseJsonArray(reviewed.evidenceJson),
    status: reviewed.status,
    score: Number(reviewed.score),
    notes: reviewed.notes,
    reviewedAt: reviewed.reviewedAt,
    reviewedBy: reviewed.reviewedBy,
    submittedAt: reviewed.submittedAt,
    updatedAt: reviewed.updatedAt,
  } satisfies ProjectMilestoneRecord;
}

function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

export async function getSeedValidationMetrics() {
  const d1 = getD1();
  try {
    const participantRows = (
      await d1
        .prepare(
          `SELECT DISTINCT user_id AS userId, MIN(started_on) AS startedOn
           FROM enrollments
           WHERE course_id = 'ai-command-skills'
           GROUP BY user_id`,
        )
        .all<{ userId: string; startedOn: string }>()
    ).results;
    const participantIds = new Set(participantRows.map((row) => row.userId));
    const participantCount = participantIds.size;
    const todayKey = localDateKey("Asia/Bangkok");

    const evidenceRows = (
      await d1
        .prepare(
          `SELECT user_id AS userId, occurred_on AS occurredOn
           FROM evidence_items
           WHERE status = 'accepted'`,
        )
        .all<{ userId: string; occurredOn: string }>()
    ).results.filter((row) => participantIds.has(row.userId));

    const evidenceDaysByUser = new Map<string, Set<number>>();
    const startByUser = new Map(
      participantRows.map((row) => [row.userId, datePart(row.startedOn)]),
    );
    for (const row of evidenceRows) {
      const startedOn = startByUser.get(row.userId);
      const occurredOn = datePart(row.occurredOn);
      if (!startedOn || !occurredOn) continue;
      const dayNumber = dateDistance(startedOn, occurredOn) + 1;
      if (dayNumber < 1) continue;
      const days = evidenceDaysByUser.get(row.userId) ?? new Set<number>();
      days.add(dayNumber);
      evidenceDaysByUser.set(row.userId, days);
    }

    const retentionForDay = (targetDay: 1 | 7 | 21) => {
      const eligible = participantRows.filter((row) => {
        const startedOn = datePart(row.startedOn);
        return Boolean(startedOn && dateDistance(startedOn, todayKey) + 1 >= targetDay);
      });
      const retained = eligible.filter((row) => {
        const evidenceDays = evidenceDaysByUser.get(row.userId) ?? new Set<number>();
        return [...evidenceDays].some((day) => day >= targetDay);
      });
      return {
        day: targetDay,
        numerator: retained.length,
        denominator: eligible.length,
        rate: percentage(retained.length, eligible.length),
      };
    };

    const milestoneRows = (
      await d1
        .prepare(
          `SELECT user_id AS userId, checkpoint_day AS checkpointDay, status
           FROM project_milestones
           WHERE template_id = ?
             AND status = 'accepted'`,
        )
        .bind(PRIMARY_GOAL_TEMPLATE_ID)
        .all<{ userId: string; checkpointDay: number; status: string }>()
    ).results.filter((row) => participantIds.has(row.userId));
    const pendingProjectReviews = (
      await d1
        .prepare(
          `SELECT pm.id,
                  pm.user_id AS userId,
                  u.display_name AS displayName,
                  pm.template_id AS templateId,
                  pm.checkpoint_day AS checkpointDay,
                  pm.artifact_url AS artifactUrl,
                  pm.score,
                  pm.notes,
                  pm.submitted_at AS submittedAt
           FROM project_milestones pm
           JOIN users u ON u.id = pm.user_id
           WHERE pm.status = 'pending_review'
           ORDER BY pm.submitted_at ASC
           LIMIT 30`,
        )
        .all<{
          id: number;
          userId: string;
          displayName: string;
          templateId: string;
          checkpointDay: number;
          artifactUrl: string | null;
          score: number;
          notes: string | null;
          submittedAt: string;
        }>()
    ).results;

    const day0Users = new Set(
      milestoneRows
        .filter((row) => Number(row.checkpointDay) === 0)
        .map((row) => row.userId),
    );
    const day7Users = new Set(
      milestoneRows
        .filter((row) => Number(row.checkpointDay) === 7)
        .map((row) => row.userId),
    );
    const day21Users = new Set(
      milestoneRows
        .filter((row) => Number(row.checkpointDay) === 21)
        .map((row) => row.userId),
    );
    const fwpr7Users = [...day0Users].filter((userId) => day7Users.has(userId));
    const evidenceSubmitters = new Set(milestoneRows.map((row) => row.userId));
    const totalRequiredEvidence = participantCount * 3;
    const completedRequiredEvidence =
      day0Users.size + day7Users.size + day21Users.size;
    const quizRows = (
      await d1
        .prepare(
           `SELECT qa.user_id AS userId,
                   qa.lesson_id AS lessonId,
                   qa.course_id AS courseId,
                   qa.content_version_id AS contentVersionId,
                   qa.attempt_number AS attemptNumber,
                   qa.score,
                   qa.passed,
                  qa.question_count AS questionCount,
                  qa.correct_count AS correctCount,
                  l.day,
                  l.title,
                  c.title AS courseTitle
           FROM quiz_attempts qa
           JOIN lessons l ON l.id = qa.lesson_id
           JOIN courses c ON c.id = qa.course_id`,
        )
        .all<{
          userId: string;
          lessonId: string;
          courseId: string;
          contentVersionId: number | null;
          attemptNumber: number;
          score: number;
          passed: number;
          questionCount: number;
          correctCount: number;
          day: number;
          title: string;
          courseTitle: string;
        }>()
    ).results;
    const quizRowsByLessonVersion = new Map<string, typeof quizRows>();
    for (const row of quizRows) {
      const contentVersionKey = row.contentVersionId ?? "unversioned";
      const key = `${row.lessonId}:${contentVersionKey}`;
      const rows = quizRowsByLessonVersion.get(key) ?? [];
      rows.push(row);
      quizRowsByLessonVersion.set(key, rows);
    }
    const quizNeedsReview = [...quizRowsByLessonVersion.values()]
      .map((rows) => {
        const sample = rows[0];
        const firstAttempts = rows.filter((row) => Number(row.attemptNumber) === 1);
        const firstPassCount = firstAttempts.filter((row) => Number(row.passed) === 1).length;
        const firstFailedUsers = new Set(
          firstAttempts
            .filter((row) => Number(row.passed) !== 1)
            .map((row) => row.userId),
        );
        const revisionPassedAfterFailUsers = new Set(
          rows
            .filter(
              (row) =>
                firstFailedUsers.has(row.userId) &&
                Number(row.attemptNumber) > 1 &&
                Number(row.passed) === 1,
            )
            .map((row) => row.userId),
        );
        const correctTotal = rows.reduce(
          (sum, row) => sum + Number(row.correctCount ?? 0),
          0,
        );
        const questionTotal = rows.reduce(
          (sum, row) => sum + Number(row.questionCount ?? 0),
          0,
        );
        const averageScore = rows.length
          ? Math.round(
              rows.reduce((sum, row) => sum + Number(row.score ?? 0), 0) /
                rows.length,
            )
          : 0;
        const firstPassRate = percentage(firstPassCount, firstAttempts.length);
        return {
          courseId: sample.courseId,
          courseTitle: sample.courseTitle,
          lessonId: sample.lessonId,
          contentVersionId:
            sample.contentVersionId == null ? null : Number(sample.contentVersionId),
          day: Number(sample.day),
          title: sample.title,
          attemptCount: rows.length,
          firstAttemptCount: firstAttempts.length,
          firstPassRate,
          revisionPassAfterFailRate: percentage(
            revisionPassedAfterFailUsers.size,
            firstFailedUsers.size,
          ),
          questionAccuracyRate: percentage(correctTotal, questionTotal),
          averageScore,
          severity:
            firstAttempts.length >= 3 && firstPassRate < 40
              ? "high"
              : firstAttempts.length >= 3 && firstPassRate < 60
                ? "medium"
                : "watch",
        };
      })
      .filter((item) => item.firstAttemptCount >= 3 && item.firstPassRate < 60)
      .sort((left, right) => {
        if (left.firstPassRate !== right.firstPassRate) {
          return left.firstPassRate - right.firstPassRate;
        }
        return right.attemptCount - left.attemptCount;
      })
      .slice(0, 20);
    await upsertQuizQualityEvents(quizNeedsReview);
    const conversionEventRows = (
      await d1
        .prepare(
          `SELECT event_type AS eventType, COUNT(DISTINCT user_id) AS users
           FROM conversion_events
           WHERE event_type IN ('trial_expired_exposed', 'plans_opened', 'price_clicked')
           GROUP BY event_type`,
        )
        .all<{ eventType: string; users: number }>()
    ).results;
    const conversionByEvent = new Map(
      conversionEventRows.map((row) => [row.eventType, Number(row.users ?? 0)]),
    );
    const invoiceCreated = await d1
      .prepare(
        `SELECT COUNT(DISTINCT user_id) AS users
         FROM payment_orders`,
      )
      .first<{ users: number }>();
    const paidUsers = await d1
      .prepare(
        `SELECT COUNT(DISTINCT user_id) AS users
         FROM payment_transactions
         WHERE status = 'paid'`,
      )
      .first<{ users: number }>();
    const creditsRedeemedUsers = await d1
      .prepare(
        `SELECT COUNT(DISTINCT user_id) AS users
         FROM order_pricing_snapshots
         WHERE status = 'paid'
           AND credits_redeemed_points > 0`,
      )
      .first<{ users: number }>();
    const reminderRows = (
      await d1
        .prepare(
          `SELECT user_id AS userId,
                  level,
                  delivery_status AS deliveryStatus,
                  sent_at AS sentAt,
                  delivered_at AS deliveredAt,
                  clicked_at AS clickedAt,
                  completed_at AS completedAt
           FROM reminder_events`,
        )
        .all<{
          userId: string;
          level: number;
          deliveryStatus: string;
          sentAt: string | null;
          deliveredAt: string | null;
          clickedAt: string | null;
          completedAt: string | null;
        }>()
    ).results.filter((row) => participantIds.has(row.userId));
    const reminderConversion = [1, 2, 3, 4].map((level) => {
      const rows = reminderRows.filter((row) => Number(row.level) === level);
      const sent = rows.length;
      const delivered = rows.filter((row) => row.deliveryStatus === "delivered" || row.deliveredAt).length;
      const clicked = rows.filter((row) => row.clickedAt).length;
      const completed = rows.filter((row) => row.completedAt).length;
      const completionMinutes = rows
        .map((row) => {
          if (!row.sentAt || !row.completedAt) return null;
          const minutes = Math.round(
            (new Date(row.completedAt).getTime() - new Date(row.sentAt).getTime()) /
              60_000,
          );
          return Number.isFinite(minutes) && minutes >= 0 ? minutes : null;
        })
        .filter((value): value is number => value !== null);
      return {
        level,
        sent,
        delivered,
        clicked,
        completed,
        deliveryRate: percentage(delivered, sent),
        clickRate: percentage(clicked, delivered),
        completionRate: percentage(completed, delivered),
        averageCompletionMinutes: completionMinutes.length
          ? Math.round(
              completionMinutes.reduce((sum, value) => sum + value, 0) /
                completionMinutes.length,
            )
          : null,
      };
    });
    const pendingKnowledgeSources = await listKnowledgeSources({
      status: "pending_review",
      limit: 30,
    });
    const runtimeAuditRows = (
      await d1
        .prepare(
          `SELECT arc.id,
                  arc.user_id AS userId,
                  u.display_name AS displayName,
                  arc.agent_project_id AS agentProjectId,
                  arc.check_type AS checkType,
                  arc.status,
                  arc.score,
                  arc.result_json AS resultJson,
                  arc.created_at AS createdAt
           FROM agent_runtime_checks arc
           JOIN users u ON u.id = arc.user_id
           WHERE arc.check_type = 'structured_runtime'
           ORDER BY arc.id DESC
           LIMIT 30`,
        )
        .all<{
          id: number;
          userId: string;
          displayName: string;
          agentProjectId: number;
          checkType: string;
          status: string;
          score: number;
          resultJson: string;
          createdAt: string;
        }>()
    ).results;
    const runtimeAuditItems = runtimeAuditRows.map((row) => {
      const result = parseJsonObject(row.resultJson);
      const audit = parseJsonObject(
        JSON.stringify(
          result.structuredRuntime &&
            typeof result.structuredRuntime === "object"
            ? result.structuredRuntime
            : {},
        ),
      );
      const referenceCheck = parseJsonObject(
        JSON.stringify(
          audit.referenceCheck && typeof audit.referenceCheck === "object"
            ? audit.referenceCheck
            : {},
        ),
      );
      const runtimeProbe = parseJsonObject(
        JSON.stringify(
          referenceCheck.probe && typeof referenceCheck.probe === "object"
            ? referenceCheck.probe
            : {},
        ),
      );
      const remoteExecution = parseJsonObject(
        JSON.stringify(
          audit.remoteExecution && typeof audit.remoteExecution === "object"
            ? audit.remoteExecution
            : {},
        ),
      );
      const flowiseWorkflow = parseJsonObject(
        JSON.stringify(
          audit.flowiseWorkflow && typeof audit.flowiseWorkflow === "object"
            ? audit.flowiseWorkflow
            : {},
        ),
      );
      const errors = Array.isArray(audit.errors)
        ? audit.errors.filter((item): item is string => typeof item === "string")
        : [];
      return {
        id: Number(row.id),
        userId: row.userId,
        displayName: row.displayName,
        agentProjectId: Number(row.agentProjectId),
        checkType: row.checkType,
        status: row.status,
        score: Number(row.score ?? 0),
        validCaseCount: Number(audit.validCaseCount ?? 0),
        citationCaseCount: Number(audit.citationCaseCount ?? 0),
        workflowExportProvided: Boolean(audit.workflowExportProvided),
        workflowValid: Boolean(flowiseWorkflow.ok),
        workflowNodeCount: Number(flowiseWorkflow.nodeCount ?? 0),
        workflowEdgeCount: Number(flowiseWorkflow.edgeCount ?? 0),
        workflowUsefulNodeCount: Number(flowiseWorkflow.usefulNodeCount ?? 0),
        referenceOk: Boolean(referenceCheck.ok),
        referenceStatus: referenceCheck.status ?? null,
        referenceProbeSignals: Array.isArray(runtimeProbe.signals)
          ? runtimeProbe.signals.filter((item): item is string => typeof item === "string")
          : [],
        remoteExecutionAvailable: Boolean(remoteExecution.available),
        remoteExecutionEndpoint: String(remoteExecution.endpoint ?? ""),
        remoteExecutionAttemptedCaseCount: Number(remoteExecution.attemptedCaseCount ?? 0),
        remoteExecutionSuccessfulCaseCount: Number(remoteExecution.successfulCaseCount ?? 0),
        errors,
        createdAt: row.createdAt,
      };
    });

    return {
      templateId: PRIMARY_GOAL_TEMPLATE_ID,
      participantCount,
      day0CompletedCount: day0Users.size,
      day7PrototypeCount: day7Users.size,
      day21DodCount: day21Users.size,
      fwpr7: {
        numerator: fwpr7Users.length,
        denominator: day0Users.size,
        rate: percentage(fwpr7Users.length, day0Users.size),
      },
      day21DodRate: percentage(day21Users.size, participantCount),
      evidenceSubmissionRate: percentage(
        completedRequiredEvidence,
        totalRequiredEvidence,
      ),
      evidenceSubmitterRate: percentage(evidenceSubmitters.size, participantCount),
      retention: {
        d1: retentionForDay(1),
        d7: retentionForDay(7),
        d21: retentionForDay(21),
      },
      quizNeedsReview,
      pendingProjectReviews,
      conversionFunnel: {
        trialExpiredExposedUsers: conversionByEvent.get("trial_expired_exposed") ?? 0,
        plansOpenedUsers: conversionByEvent.get("plans_opened") ?? 0,
        priceClickedUsers: conversionByEvent.get("price_clicked") ?? 0,
        invoiceCreatedUsers: Number(invoiceCreated?.users ?? 0),
        paidUsers: Number(paidUsers?.users ?? 0),
        creditsRedeemedPaidUsers: Number(creditsRedeemedUsers?.users ?? 0),
      },
      reminderConversion,
      pendingKnowledgeSources,
      runtimeAuditItems,
      targets: {
        seedUsers: 10,
        fwpr7Rate: 60,
        day21DodCount: 3,
      },
    };
  } catch (error) {
    if (
      isMissingDatabaseRelationError(error, [
        "project_milestones",
        "enrollments",
        "evidence_items",
        "quiz_attempts",
        "conversion_events",
        "uploaded_artifacts",
        "reminder_events",
        "knowledge_sources",
        "course_quality_events",
        "agent_runtime_checks",
      ])
    ) {
      return {
        templateId: PRIMARY_GOAL_TEMPLATE_ID,
        participantCount: 0,
        day0CompletedCount: 0,
        day7PrototypeCount: 0,
        day21DodCount: 0,
        fwpr7: { numerator: 0, denominator: 0, rate: 0 },
        day21DodRate: 0,
        evidenceSubmissionRate: 0,
        evidenceSubmitterRate: 0,
        retention: {
          d1: { day: 1, numerator: 0, denominator: 0, rate: 0 },
          d7: { day: 7, numerator: 0, denominator: 0, rate: 0 },
          d21: { day: 21, numerator: 0, denominator: 0, rate: 0 },
        },
        quizNeedsReview: [],
        pendingProjectReviews: [],
        conversionFunnel: {
          trialExpiredExposedUsers: 0,
          plansOpenedUsers: 0,
          priceClickedUsers: 0,
          invoiceCreatedUsers: 0,
          paidUsers: 0,
          creditsRedeemedPaidUsers: 0,
        },
        reminderConversion: [1, 2, 3, 4].map((level) => ({
          level,
          sent: 0,
          delivered: 0,
          clicked: 0,
          completed: 0,
          deliveryRate: 0,
          clickRate: 0,
          completionRate: 0,
          averageCompletionMinutes: null,
        })),
        pendingKnowledgeSources: [],
        runtimeAuditItems: [],
        targets: {
          seedUsers: 10,
          fwpr7Rate: 60,
          day21DodCount: 3,
        },
      };
    }
    throw error;
  }
}

export async function getAdminOpsDashboardData() {
  const d1 = getD1();
  const validation = await getSeedValidationMetrics();
  try {
    const [
      learners,
      payments,
      riskyInvitations,
      openReviews,
      openFeedback,
      seedNotes,
      reminderHealth,
      recentReminderEvents,
    ] = await Promise.all([
      d1
        .prepare(
          `SELECT u.id,
                  u.telegram_id AS telegramId,
                  u.display_name AS displayName,
                  u.timezone,
                  u.reminder_enabled AS reminderEnabled,
                  COUNT(DISTINCT e.id) AS activeCourses,
                  MAX(e.current_day) AS maxCurrentDay,
                  COUNT(DISTINCT ev.id) AS acceptedEvidence,
                  MAX(ev.occurred_on) AS lastEvidenceOn
           FROM users u
           LEFT JOIN enrollments e
             ON e.user_id = u.id AND e.active = 1
           LEFT JOIN evidence_items ev
             ON ev.user_id = u.id AND ev.status = 'accepted'
           GROUP BY u.id, u.telegram_id, u.display_name, u.timezone, u.reminder_enabled
           ORDER BY COALESCE(MAX(ev.created_at), MAX(u.created_at)) DESC
           LIMIT 50`,
        )
        .all<{
          id: string;
          telegramId: string | null;
          displayName: string;
          timezone: string;
          reminderEnabled: number;
          activeCourses: number;
          maxCurrentDay: number | null;
          acceptedEvidence: number;
          lastEvidenceOn: string | null;
        }>(),
      d1
        .prepare(
          `SELECT o.id AS orderId,
                  o.user_id AS userId,
                  u.display_name AS displayName,
                  o.plan_key AS planKey,
                  o.amount_stars AS amountStars,
                  o.status AS orderStatus,
                  o.created_at AS orderCreatedAt,
                  pt.telegram_payment_charge_id AS telegramPaymentChargeId,
                  pt.status AS transactionStatus,
                  pt.paid_at AS paidAt,
                  pt.refunded_at AS refundedAt
           FROM payment_orders o
           LEFT JOIN payment_transactions pt ON pt.order_id = o.id
           LEFT JOIN users u ON u.id = o.user_id
           ORDER BY o.id DESC
           LIMIT 50`,
        )
        .all<{
          orderId: number;
          userId: string;
          displayName: string | null;
          planKey: string;
          amountStars: number;
          orderStatus: string;
          orderCreatedAt: string;
          telegramPaymentChargeId: string | null;
          transactionStatus: string | null;
          paidAt: string | null;
          refundedAt: string | null;
        }>(),
      d1
        .prepare(
          `SELECT i.id,
                  i.inviter_user_id AS inviterUserId,
                  inviter.display_name AS inviterName,
                  i.invited_user_id AS invitedUserId,
                  invited.display_name AS invitedName,
                  i.status,
                  i.status_reason AS statusReason,
                  i.risk_level AS riskLevel,
                  i.risk_signals_json AS riskSignalsJson,
                  i.reward_granted_at AS rewardGrantedAt,
                  i.reviewed_at AS reviewedAt,
                  i.created_at AS createdAt
           FROM invitations i
           LEFT JOIN users inviter ON inviter.id = i.inviter_user_id
           LEFT JOIN users invited ON invited.id = i.invited_user_id
           WHERE i.risk_level <> 'low'
              OR i.status IN ('pending', 'rejected')
           ORDER BY i.id DESC
           LIMIT 50`,
        )
        .all<{
          id: number;
          inviterUserId: string;
          inviterName: string | null;
          invitedUserId: string;
          invitedName: string | null;
          status: string;
          statusReason: string | null;
          riskLevel: string;
          riskSignalsJson: string;
          rewardGrantedAt: string | null;
          reviewedAt: string | null;
          createdAt: string;
        }>(),
      d1
        .prepare(
          `SELECT rq.id,
                  rq.user_id AS userId,
                  u.display_name AS displayName,
                  rq.source_type AS sourceType,
                  rq.source_ref AS sourceRef,
                  rq.title,
                  rq.reason,
                  rq.due_on AS dueOn,
                  rq.created_at AS createdAt
           FROM review_queue_items rq
           LEFT JOIN users u ON u.id = rq.user_id
           WHERE rq.status = 'open'
           ORDER BY rq.due_on ASC, rq.id DESC
           LIMIT 50`,
        )
        .all<{
          id: number;
          userId: string;
          displayName: string | null;
          sourceType: string;
          sourceRef: string;
          title: string;
          reason: string;
          dueOn: string;
          createdAt: string;
        }>(),
      d1
        .prepare(
          `SELECT f.id,
                  f.user_id AS userId,
                  u.display_name AS displayName,
                  f.category,
                  f.content,
                  f.page_context AS pageContext,
                  f.status,
                  f.created_at AS createdAt
           FROM feedback f
           LEFT JOIN users u ON u.id = f.user_id
           WHERE f.status = 'open'
           ORDER BY f.id DESC
           LIMIT 50`,
        )
        .all<{
          id: number;
          userId: string;
          displayName: string | null;
          category: string;
          content: string;
          pageContext: string | null;
          status: string;
          createdAt: string;
        }>(),
      d1
        .prepare(
          `SELECT sn.id,
                  sn.user_id AS userId,
                  u.display_name AS displayName,
                  sn.note_type AS noteType,
                  sn.completion_source AS completionSource,
                  sn.failure_reason AS failureReason,
                  sn.status,
                  sn.content,
                  sn.recorded_by AS recordedBy,
                  sn.recorded_on AS recordedOn,
                  sn.created_at AS createdAt
           FROM seed_user_notes sn
           LEFT JOIN users u ON u.id = sn.user_id
           ORDER BY sn.id DESC
           LIMIT 80`,
        )
        .all<{
          id: number;
          userId: string;
          displayName: string | null;
          noteType: string;
          completionSource: string | null;
          failureReason: string | null;
          status: string;
          content: string;
          recordedBy: string | null;
          recordedOn: string;
          createdAt: string;
        }>(),
      d1
        .prepare(
          `SELECT
             COUNT(*) AS total24h,
             SUM(CASE WHEN delivery_status = 'delivered' THEN 1 ELSE 0 END) AS delivered24h,
             SUM(CASE WHEN delivery_status = 'failed' THEN 1 ELSE 0 END) AS failed24h,
             SUM(CASE WHEN delivery_status = 'queued' THEN 1 ELSE 0 END) AS queued24h,
             SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) AS opened24h,
             SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) AS completed24h,
             MAX(sent_at) AS lastSentAt,
             MAX(delivered_at) AS lastDeliveredAt
           FROM reminder_events
           WHERE sent_at >= ?`,
        )
        .bind(databaseTimestamp(new Date(Date.now() - 86_400_000)))
        .first<{
          total24h: number;
          delivered24h: number | null;
          failed24h: number | null;
          queued24h: number | null;
          opened24h: number | null;
          completed24h: number | null;
          lastSentAt: string | null;
          lastDeliveredAt: string | null;
        }>(),
      d1
        .prepare(
          `SELECT re.id,
                  re.level,
                  re.delivery_status AS deliveryStatus,
                  re.sent_at AS sentAt,
                  re.delivered_at AS deliveredAt,
                  re.clicked_at AS clickedAt,
                  re.completed_at AS completedAt,
                  u.display_name AS displayName
           FROM reminder_events re
           LEFT JOIN users u ON u.id = re.user_id
           ORDER BY re.id DESC
           LIMIT 10`,
        )
        .all<{
          id: number;
          level: number;
          deliveryStatus: string;
          sentAt: string;
          deliveredAt: string | null;
          clickedAt: string | null;
          completedAt: string | null;
          displayName: string | null;
        }>(),
    ]);

    return {
      validation,
      learners: learners.results.map((row) => ({
        ...row,
        reminderEnabled: Boolean(row.reminderEnabled),
        activeCourses: Number(row.activeCourses ?? 0),
        maxCurrentDay: Number(row.maxCurrentDay ?? 0),
        acceptedEvidence: Number(row.acceptedEvidence ?? 0),
      })),
      payments: payments.results,
      riskyInvitations: riskyInvitations.results,
      openReviews: openReviews.results,
      openFeedback: openFeedback.results,
      seedNotes: seedNotes.results,
      reminderHealth: {
        total24h: Number(reminderHealth?.total24h ?? 0),
        delivered24h: Number(reminderHealth?.delivered24h ?? 0),
        failed24h: Number(reminderHealth?.failed24h ?? 0),
        queued24h: Number(reminderHealth?.queued24h ?? 0),
        opened24h: Number(reminderHealth?.opened24h ?? 0),
        completed24h: Number(reminderHealth?.completed24h ?? 0),
        lastSentAt: reminderHealth?.lastSentAt ?? null,
        lastDeliveredAt: reminderHealth?.lastDeliveredAt ?? null,
        status:
          Number(reminderHealth?.failed24h ?? 0) > 0
            ? "has_failures"
            : Number(reminderHealth?.total24h ?? 0) === 0
              ? "no_events_24h"
              : "healthy",
      },
      recentReminderEvents: recentReminderEvents.results,
    };
  } catch (error) {
    if (
      isMissingDatabaseRelationError(error, [
        "users",
        "enrollments",
        "evidence_items",
        "payment_orders",
        "payment_transactions",
        "invitations",
        "review_queue_items",
        "feedback",
        "seed_user_notes",
        "reminder_events",
      ])
    ) {
      return {
        validation,
        learners: [],
        payments: [],
        riskyInvitations: [],
        openReviews: [],
        openFeedback: [],
        seedNotes: [],
        reminderHealth: {
          total24h: 0,
          delivered24h: 0,
          failed24h: 0,
          queued24h: 0,
          opened24h: 0,
          completed24h: 0,
          lastSentAt: null,
          lastDeliveredAt: null,
          status: "missing_table",
        },
        recentReminderEvents: [],
      };
    }
    throw error;
  }
}

export async function submitLesson(
  identity: AcademyIdentity,
  payload: {
    enrollmentId: number;
    lessonId: string;
    answer: string;
    completionSource?: string;
  },
) {
  await assertLearningAccess(identity);
  const answer = payload.answer.trim();

  const d1 = getD1();
  const lesson = await d1
    .prepare(
      `SELECT l.id, l.course_id AS courseId, l.title, l.objective, l.criteria_json AS criteriaJson,
              l.day,
              e.id AS enrollmentId,
              e.current_day AS currentDay,
              e.started_on AS startedOn
       FROM lessons l
       JOIN enrollments e ON e.course_id = l.course_id
       WHERE l.id = ? AND e.id = ? AND e.user_id = ? AND e.active = 1`,
    )
    .bind(payload.lessonId, payload.enrollmentId, identity.id)
    .first<{
      id: string;
      courseId: string;
      title: string;
      objective: string;
      criteriaJson: string;
      day: number;
      enrollmentId: number;
      currentDay: number;
      startedOn: string;
    }>();

  if (!lesson) {
    throw new Response("课程不存在或不属于当前用户", { status: 404 });
  }

  const { criteria, assessment } = lessonMetadataFromJson(lesson.criteriaJson);
  const timezoneRow = await d1
    .prepare("SELECT timezone FROM users WHERE id = ?")
    .bind(identity.id)
    .first<{ timezone: string }>();
  const timezone = timezoneRow?.timezone || "Asia/Bangkok";
  const todayKey = localDateKey(timezone);
  const calendarDay = Math.min(
    60,
    dateDistance(lesson.startedOn, todayKey) + 1,
  );
  const lagDays = Math.max(0, calendarDay - Number(lesson.currentDay));

  if (Number(lesson.day) > Number(lesson.currentDay)) {
    if (lagDays > 0) {
      throw new Response("已经落后，下一课不会解锁。请先完成当前任务。", {
        status: 409,
      });
    }

    const currentLessonSubmission = await d1
      .prepare(
        `SELECT s.status,
                s.completion_source AS completionSource,
                ev.status AS evidenceStatus
         FROM enrollments e
         JOIN lessons l
           ON l.course_id = e.course_id AND l.day = e.current_day
         LEFT JOIN submissions s
           ON s.lesson_id = l.id AND s.user_id = e.user_id
         LEFT JOIN evidence_items ev
           ON ev.lesson_id = l.id
          AND ev.user_id = e.user_id
          AND ev.source_type = 'lesson_submission'
         WHERE e.id = ? AND e.user_id = ? AND e.active = 1`,
      )
      .bind(payload.enrollmentId, identity.id)
      .first<{
        status: string | null;
        completionSource: string | null;
        evidenceStatus: string | null;
      }>();

    const currentCompleted =
      currentLessonSubmission?.status === "completed" &&
      currentLessonSubmission.evidenceStatus === "accepted" &&
      currentLessonSubmission.completionSource !== "extra";

    if (!currentCompleted) {
      throw new Response("当前课程还没完成，下一课暂不解锁。", {
        status: 409,
      });
    }
  }

  if (!assessment && answer.length < 20) {
    throw new Response("主动练习至少需要 20 个字", { status: 400 });
  }
  if (assessment) {
    let selectedAnswers: Record<string, string>;
    try {
      selectedAnswers = JSON.parse(answer) as Record<string, string>;
    } catch {
      throw new Response("请选择每一道题的有效答案", { status: 400 });
    }

    const allAnswersValid = assessment.questions.every((question, index) =>
      question.options.some((option) => option.id === selectedAnswers[String(index)]),
    );
    if (!allAnswersValid) {
      throw new Response("请选择每一道题的有效答案", { status: 400 });
    }
  }

  const rule = scoreAnswer(answer, criteria, assessment);
  const aiFeedback = assessment
    ? null
    : await requestAiFeedback({
        lessonTitle: String(lesson.title),
        objective: String(lesson.objective),
        criteria,
        answer,
        ruleScore: rule.score,
        ruleFeedback: rule.feedback,
      });
  const status = rule.score >= 60 ? "completed" : "needs_revision";
  const completedOn =
    status === "completed"
      ? localDateKey(timezone)
      : null;
  const completionSource =
    status === "completed"
      ? await classifyCompletionSource(
          identity.id,
          timezone,
          payload.completionSource,
        )
      : payload.completionSource ?? "self";

  if (assessment) {
    const contentVersionId = await getCurrentPublishedCourseVersionId(
      lesson.courseId,
    );
    await recordQuizAttempt({
      userId: identity.id,
      enrollmentId: Number(payload.enrollmentId),
      lessonId: payload.lessonId,
      courseId: lesson.courseId,
      contentVersionId,
      answersJson: answer,
      questionCount: Number(rule.questionCount ?? assessment.questions.length),
      correctCount: Number(rule.correctCount ?? 0),
      score: rule.score,
      passed: status === "completed",
      submittedOn: todayKey,
    });
    await upsertQuizQualityEventForLesson({
      courseId: lesson.courseId,
      lessonId: payload.lessonId,
      day: Number(lesson.day),
      title: String(lesson.title),
      contentVersionId,
    });
  }

  const saved = await d1
    .prepare(
      `INSERT INTO submissions
         (user_id, enrollment_id, lesson_id, original_answer, status,
          rule_score, rule_feedback, ai_feedback, completion_source, completed_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, lesson_id) DO UPDATE SET
         revised_answer = excluded.original_answer,
         status = excluded.status,
         rule_score = excluded.rule_score,
         rule_feedback = excluded.rule_feedback,
         ai_feedback = excluded.ai_feedback,
         completion_source = excluded.completion_source,
         completed_on = excluded.completed_on,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, status, rule_score AS ruleScore, rule_feedback AS ruleFeedback,
                 ai_feedback AS aiFeedback`,
    )
    .bind(
      identity.id,
      payload.enrollmentId,
      payload.lessonId,
      answer,
      status,
      rule.score,
      rule.feedback,
      aiFeedback,
      completionSource,
      completedOn,
    )
    .first();

  const savedId = Number((saved as { id?: unknown } | null)?.id);
  if (Number.isInteger(savedId) && savedId > 0) {
    await upsertEvidenceItem({
      userId: identity.id,
      evidenceType: assessment
        ? "quiz"
        : Number(lesson.day) >= 57
          ? "project"
          : "reflection",
      sourceType: "lesson_submission",
      sourceRef: savedId,
      courseId: lesson.courseId,
      lessonId: payload.lessonId,
      status: status === "completed" ? "accepted" : "needs_revision",
      score: rule.score,
      metadata: {
        ruleFeedback: rule.feedback,
        hasAiFeedback: Boolean(aiFeedback),
        completionSource,
        assessmentQuestionCount: assessment?.questions.length ?? 0,
      },
      occurredOn: completedOn ?? todayKey,
    });
  }

  if (
    status === "completed" &&
    Number.isInteger(savedId) &&
    savedId > 0
  ) {
    await markReminderCompleted(
      identity.id,
      timezone,
      savedId,
    );
  }

  return saved
    ? {
        ...saved,
        evidenceStatus: status === "completed" ? "accepted" : "needs_revision",
      }
    : saved;
}

export async function saveNote(
  identity: AcademyIdentity,
  payload: { content: string; lessonId?: string | null },
) {
  await assertLearningAccess(identity);
  const content = payload.content.trim();
  if (!content) {
    throw new Response("笔记内容不能为空", { status: 400 });
  }
  if (content.length > 2000) {
    throw new Response("笔记不能超过 2000 字", { status: 400 });
  }

  const d1 = getD1();
  return d1
    .prepare(
      `INSERT INTO notes (user_id, lesson_id, content)
       VALUES (?, ?, ?)
       RETURNING id, lesson_id AS lessonId, content, created_at AS createdAt`,
    )
    .bind(identity.id, payload.lessonId ?? null, content)
    .first();
}

export async function submitAbilityAssessment(
  identity: AcademyIdentity,
  payload: {
    courseId: string;
    stageKey: AssessmentStageKey;
    answer: string;
  },
) {
  await assertLearningAccess(identity);
  const answer = payload.answer.trim();
  if (answer.length < 30) {
    throw new Response("阶段测试至少需要 30 个字", { status: 400 });
  }

  const question = assessmentQuestionFor(payload.courseId, payload.stageKey);
  if (!question) {
    throw new Response("阶段测试不存在", { status: 404 });
  }

  const enrollment = await getD1()
    .prepare(
      `SELECT current_day AS currentDay
       FROM enrollments
       WHERE user_id = ? AND course_id = ? AND active = 1`,
    )
    .bind(identity.id, payload.courseId)
    .first<{ currentDay: number }>();
  if (!enrollment) {
    throw new Response("课程未启用，无法提交阶段测试", { status: 400 });
  }
  if (Number(enrollment.currentDay) < question.targetDay) {
    throw new Response("当前还没到这个阶段测试", { status: 409 });
  }

  const scored = scoreAbilityAssessment(answer, question.rubric);
  const record = await getD1()
    .prepare(
      `INSERT INTO ability_assessments
         (user_id, course_id, stage_key, version, prompt, rubric_json,
          original_answer, score, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, course_id, stage_key) DO UPDATE SET
         revised_answer = excluded.original_answer,
         score = excluded.score,
         status = excluded.status,
         notes = excluded.notes,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id,
                 course_id AS courseId,
                 stage_key AS stageKey,
                 version,
                 prompt,
                 rubric_json AS rubricJson,
                 original_answer AS originalAnswer,
                 revised_answer AS revisedAnswer,
                 score,
                 status,
                 notes,
                 created_at AS createdAt,
                 updated_at AS updatedAt`,
    )
    .bind(
      identity.id,
      payload.courseId,
      payload.stageKey,
      question.version,
      question.prompt,
      JSON.stringify(question.rubric),
      answer,
      scored.score,
      scored.status,
      scored.notes,
    )
    .first<AbilityAssessmentRecord>();
  if (record) {
    await upsertEvidenceItem({
      userId: identity.id,
      evidenceType: "checkpoint",
      sourceType: "ability_assessment",
      sourceRef: record.id,
      courseId: payload.courseId,
      assessmentStageKey: payload.stageKey,
      sourceVersion: question.version,
      status: record.status === "completed" ? "accepted" : "needs_revision",
      score: Number(record.score ?? 0),
      metadata: {
        prompt: question.title,
        notes: record.notes,
        rubric: question.rubric,
      },
      occurredOn: localDateKey("Asia/Bangkok"),
    });
  }
  return record;
}

export async function createFeedback(
  identity: AcademyIdentity,
  payload: {
    category: string;
    content: string;
    pageContext?: string | null;
    appVersion?: string | null;
  },
) {
  const category = payload.category.trim().toLowerCase();
  const content = payload.content.trim();
  if (!new Set(["bug", "content", "idea", "other"]).has(category)) {
    throw new Response("Feedback category is invalid", { status: 400 });
  }
  if (content.length < 5) {
    throw new Response("请至少描述 5 个字，方便定位问题", { status: 400 });
  }
  if (content.length > 2_000) {
    throw new Response("反馈不能超过 2000 个字", { status: 400 });
  }
  return getD1()
    .prepare(
      `INSERT INTO feedback (user_id, category, content, page_context, app_version)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id, category, content, status, created_at AS createdAt`,
    )
    .bind(
      identity.id,
      category,
      content,
      payload.pageContext?.slice(0, 120) ?? null,
      payload.appVersion?.slice(0, 80) ?? null,
    )
    .first();
}

const SEED_NOTE_TYPES = new Set([
  "follow_up",
  "failure_reason",
  "payment_objection",
  "manual_check",
  "weekly_review",
]);

const SEED_COMPLETION_SOURCES = new Set([
  "self",
  "reminder",
  "strong_supervision",
  "unknown",
]);

const SEED_NOTE_STATUSES = new Set(["open", "resolved", "watch"]);

const SEED_FAILURE_REASONS = new Set([
  "forgot",
  "too_hard",
  "too_easy",
  "unclear_task",
  "not_enough_time",
  "telegram_no_reminder",
  "bug",
  "content_unclear",
  "not_willing",
  "payment_failed",
  "price",
  "value_not_clear",
  "other",
]);

function normalizeSeedNoteValue(
  value: unknown,
  allowed: Set<string>,
  fallback: string | null,
) {
  const normalized =
    typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!normalized) return fallback;
  if (!allowed.has(normalized)) {
    throw new Response(`Invalid seed note value: ${normalized}`, { status: 400 });
  }
  return normalized;
}

export async function createSeedUserNote(payload: {
  userId: string;
  noteType?: string | null;
  completionSource?: string | null;
  failureReason?: string | null;
  status?: string | null;
  content: string;
  recordedBy?: string | null;
  recordedOn?: string | null;
}) {
  const userId = payload.userId.trim();
  const content = payload.content.trim();
  const noteType = normalizeSeedNoteValue(
    payload.noteType,
    SEED_NOTE_TYPES,
    "follow_up",
  );
  const completionSource = normalizeSeedNoteValue(
    payload.completionSource,
    SEED_COMPLETION_SOURCES,
    null,
  );
  const failureReason = normalizeSeedNoteValue(
    payload.failureReason,
    SEED_FAILURE_REASONS,
    null,
  );
  const status = normalizeSeedNoteValue(
    payload.status,
    SEED_NOTE_STATUSES,
    "open",
  );
  const recordedBy = payload.recordedBy?.trim().slice(0, 80) || null;
  const recordedOn = payload.recordedOn?.trim().slice(0, 20) || localDateKey("Asia/Bangkok");

  if (!userId) {
    throw new Response("userId is required", { status: 400 });
  }
  if (content.length < 3) {
    throw new Response("Seed note content is too short", { status: 400 });
  }
  if (content.length > 2_000) {
    throw new Response("Seed note content cannot exceed 2000 characters", {
      status: 400,
    });
  }

  const user = await getD1()
    .prepare("SELECT id FROM users WHERE id = ?")
    .bind(userId)
    .first<{ id: string }>();
  if (!user) {
    throw new Response("Seed note user was not found", { status: 404 });
  }

  return getD1()
    .prepare(
      `INSERT INTO seed_user_notes
         (user_id, note_type, completion_source, failure_reason, status, content, recorded_by, recorded_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id,
                 user_id AS userId,
                 note_type AS noteType,
                 completion_source AS completionSource,
                 failure_reason AS failureReason,
                 status,
                 content,
                 recorded_by AS recordedBy,
                 recorded_on AS recordedOn,
                 created_at AS createdAt`,
    )
    .bind(
      userId,
      noteType,
      completionSource,
      failureReason,
      status,
      content,
      recordedBy,
      recordedOn,
    )
    .first();
}

export async function recordConversionEvent(
  identity: AcademyIdentity,
  payload: {
    eventType: string;
    planKey?: string | null;
    metadata?: Record<string, unknown> | null;
  },
) {
  const eventType = payload.eventType.trim().toLowerCase();
  if (
    !new Set([
      "trial_expired_exposed",
      "plans_opened",
      "price_clicked",
    ]).has(eventType)
  ) {
    throw new Response("Conversion event type is invalid", { status: 400 });
  }
  const metadataJson = JSON.stringify(payload.metadata ?? {});
  return getD1()
    .prepare(
      `INSERT INTO conversion_events (user_id, event_type, plan_key, metadata_json)
       VALUES (?, ?, ?, ?)
       RETURNING id, event_type AS eventType, occurred_at AS occurredAt`,
    )
    .bind(
      identity.id,
      eventType,
      payload.planKey?.trim().slice(0, 60) || null,
      metadataJson.slice(0, 2_000),
    )
    .first();
}

export function verifyCronSecret(request: Request) {
  const expected = runtimeEnv().ACADEMY_CRON_SECRET;
  const supplied = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied || supplied !== expected) {
    throw new Response("Cron authorization required", { status: 401 });
  }
}

export async function getReminderDeliveryDiagnostic(input: {
  userId?: string | null;
  telegramUserId?: string | null;
}) {
  const d1 = getD1();
  const userId = input.userId?.trim() || null;
  const telegramUserId = input.telegramUserId?.trim() || null;
  if (!userId && !telegramUserId) {
    throw new Response("userId or telegramUserId is required", { status: 400 });
  }

  const user = await (
    userId
      ? d1
          .prepare(
            `SELECT id,
                    telegram_id AS telegramId,
                    display_name AS displayName,
                    timezone,
                    reminder_enabled AS reminderEnabled,
                    reminder_hour AS reminderHour,
                    dnd_start_hour AS dndStartHour,
                    dnd_end_hour AS dndEndHour
             FROM users
             WHERE id = ?`,
          )
          .bind(userId)
      : d1
          .prepare(
            `SELECT id,
                    telegram_id AS telegramId,
                    display_name AS displayName,
                    timezone,
                    reminder_enabled AS reminderEnabled,
                    reminder_hour AS reminderHour,
                    dnd_start_hour AS dndStartHour,
                    dnd_end_hour AS dndEndHour
             FROM users
             WHERE telegram_id = ?`,
          )
          .bind(telegramUserId)
  ).first<{
    id: string;
    telegramId: string | null;
    displayName: string;
    timezone: string;
    reminderEnabled: number;
    reminderHour: number;
    dndStartHour: number | null;
    dndEndHour: number | null;
  }>();
  if (!user) throw new Response("User not found", { status: 404 });

  const todayKey = localDateKey(user.timezone);
  await syncEnrollmentDays(user.id, todayKey);

  const [access, dueState, lastEvents] = await Promise.all([
    getLearningAccess(user.id),
    d1
      .prepare(
        `SELECT COUNT(DISTINCT e.id) AS total,
                COUNT(DISTINCT CASE
                  WHEN ev.id IS NOT NULL
                   AND COALESCE(s.completion_source, 'self') <> 'extra'
                  THEN e.id
                END) AS completed
         FROM enrollments e
         JOIN lessons l
           ON l.course_id = e.course_id AND l.day = e.current_day
         LEFT JOIN submissions s
           ON s.lesson_id = l.id AND s.user_id = e.user_id
         LEFT JOIN evidence_items ev
           ON ev.lesson_id = l.id
          AND ev.user_id = e.user_id
          AND ev.source_type = 'lesson_submission'
          AND ev.status = 'accepted'
         WHERE e.user_id = ? AND e.active = 1`,
      )
      .bind(user.id)
      .first<{ total: number; completed: number | null }>(),
    d1
      .prepare(
        `SELECT id, level, delivery_status AS deliveryStatus,
                sent_at AS sentAt, delivered_at AS deliveredAt,
                clicked_at AS clickedAt, completed_at AS completedAt
         FROM reminder_events
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 10`,
      )
      .bind(user.id)
      .all<{
        id: number;
        level: number;
        deliveryStatus: string;
        sentAt: string;
        deliveredAt: string | null;
        clickedAt: string | null;
        completedAt: string | null;
      }>(),
  ]);

  const totalDue = Number(dueState?.total ?? 0);
  const completedDue = Number(dueState?.completed ?? 0);
  const preferences = reminderPreferencesFromUser(user);
  const diagnostic = buildReminderDiagnostic({
    user,
    preferences,
    accessActive: access.active,
    activeCourseCount: totalDue,
    allCompleted: totalDue > 0 && completedDue >= totalDue,
    lastEvent: lastEvents.results[0] ?? null,
  });

  return {
    user: {
      id: user.id,
      telegramId: user.telegramId,
      displayName: user.displayName,
      timezone: user.timezone,
    },
    access,
    preferences,
    today: {
      date: todayKey,
      totalDue,
      completedDue,
      allCompleted: totalDue > 0 && completedDue >= totalDue,
    },
    diagnostic,
    lastEvents: lastEvents.results,
  };
}

export async function createReminder(
  userId: string,
  requestedLevel: 1 | 2 | 3 | 4,
) {
  const d1 = getD1();
  const access = await getLearningAccess(userId);
  if (!access.active) {
    return { skipped: true as const, reason: "access_expired" as const };
  }

  const user = await d1
    .prepare(
      `SELECT id,
              timezone,
              ui_locale AS uiLocale,
              reminder_enabled AS reminderEnabled,
              reminder_hour AS reminderHour,
              dnd_start_hour AS dndStartHour,
              dnd_end_hour AS dndEndHour
       FROM users
       WHERE id = ?`,
    )
    .bind(userId)
    .first<{
      id: string;
      timezone: string;
      uiLocale: string | null;
      reminderEnabled: number;
      reminderHour: number;
      dndStartHour: number | null;
      dndEndHour: number | null;
    }>();
  if (!user) throw new Response("User not found", { status: 404 });

  const preferences = reminderPreferencesFromUser(user);
  if (!preferences.enabled) {
    return { skipped: true as const, reason: "reminders_paused" as const };
  }

  const todayKey = localDateKey(user.timezone);
  await syncEnrollmentDays(userId, todayKey);

  const state = await d1
    .prepare(
      `SELECT
         COUNT(DISTINCT e.id) AS total,
         COUNT(DISTINCT CASE
           WHEN ev.id IS NOT NULL
            AND COALESCE(s.completion_source, 'self') <> 'extra'
           THEN e.id
         END) AS completed,
         MAX(
           (CAST(? AS DATE) - CAST(e.started_on AS DATE))
           - (e.current_day - 1)
         ) AS lagDays
       FROM enrollments e
       JOIN lessons l
         ON l.course_id = e.course_id AND l.day = e.current_day
       LEFT JOIN submissions s
         ON s.lesson_id = l.id AND s.user_id = e.user_id
       LEFT JOIN evidence_items ev
         ON ev.lesson_id = l.id
        AND ev.user_id = e.user_id
        AND ev.source_type = 'lesson_submission'
        AND ev.status = 'accepted'
       WHERE e.user_id = ? AND e.active = 1`,
    )
    .bind(todayKey, userId)
    .first<{ total: number; completed: number; lagDays: number | null }>();

  const total = Number(state?.total ?? 0);
  const completed = Number(state?.completed ?? 0);
  if (total === 0 || completed >= total) {
    return {
      skipped: true as const,
      reason: total === 0 ? "no_active_courses" : "already_completed",
    };
  }

  const lagDays = Math.max(0, Number(state?.lagDays ?? 0));
  const hour = localHour(user.timezone);
  if (
    hourInQuietWindow(hour, preferences.dndStartHour, preferences.dndEndHour)
  ) {
    return { skipped: true as const, reason: "do_not_disturb" as const };
  }

  if (requestedLevel === 1 && hour < preferences.reminderHour) {
    return { skipped: true as const, reason: "before_schedule" as const };
  }

  const baseLevel: 1 | 2 | 3 | 4 =
    lagDays >= 2 ? 4 : lagDays === 1 ? 2 : requestedLevel;
  const level: 1 | 2 | 3 | 4 =
    lagDays === 0 && Number.isFinite(hour) && hour >= 18 ? 3 : baseLevel;

  const alreadySentToday = await d1
    .prepare(
      `SELECT sent_at AS sentAt
       FROM reminder_events
       WHERE user_id = ? AND level = ?
       ORDER BY id DESC
       LIMIT 20`,
    )
    .bind(userId, level)
    .all<{ sentAt: string }>();
  if (
    alreadySentToday.results.some(
      (row) => localDateKey(user.timezone, parseDatabaseDate(row.sentAt)) === todayKey,
    )
  ) {
    return { skipped: true as const, reason: "already_sent_today" as const };
  }

  const recent = await d1
    .prepare(
      `SELECT template_id AS templateId
       FROM reminder_events
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 5`,
    )
    .bind(userId)
    .all<{ templateId: string }>();
  const template = selectReminder(
    level,
    recent.results.map((item) => item.templateId),
    resolveAppLocale(user.uiLocale),
  );

  const reminderEvent = await d1
    .prepare(
      `INSERT INTO reminder_events (user_id, template_id, level, delivery_status)
       VALUES (?, ?, ?, 'queued')
       RETURNING id`,
    )
    .bind(userId, template.id, level)
    .first<{ id: number }>();

  if (!reminderEvent) {
    throw new Response("Unable to create reminder event", { status: 500 });
  }

  return {
    skipped: false as const,
    reminderEventId: reminderEvent.id,
    reminder: template,
    miniAppUrl: runtimeEnv().ACADEMY_MINI_APP_URL ?? null,
    state: {
      total,
      completed,
      lagDays,
      level,
      reminderHour: preferences.reminderHour,
      dndStartHour: preferences.dndStartHour,
      dndEndHour: preferences.dndEndHour,
    },
  };
}

export async function deliverReminder(
  userId: string,
  requestedLevel: 1 | 2 | 3 | 4,
) {
  const result = await createReminder(userId, requestedLevel);
  if (result.skipped) {
    return {
      ...result,
      delivered: false as const,
      deliveryReason: result.reason,
    };
  }

  const user = await getD1()
    .prepare(
      `SELECT telegram_id AS telegramId
       FROM users
       WHERE id = ?`,
    )
    .bind(userId)
    .first<{ telegramId: string | null }>();

  if (!user?.telegramId) {
    await getD1()
      .prepare(
        `UPDATE reminder_events
         SET delivery_status = 'missing_telegram_id'
         WHERE id = ?`,
      )
      .bind(result.reminderEventId)
      .run();
    return {
      ...result,
      delivered: false as const,
      deliveryReason: "missing_telegram_id" as const,
    };
  }

  let message: { message_id: number };
  try {
    message = await sendTelegramBotMessage({
      chatId: user.telegramId,
      text: result.reminder.content,
      buttonText: result.reminder.buttonText,
      miniAppUrl: reminderUrlWithEvent(result.miniAppUrl, result.reminderEventId),
      disableNotification: result.state.level === 1,
    });

    await getD1()
      .prepare(
        `UPDATE reminder_events
         SET delivery_status = 'delivered',
             delivered_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(result.reminderEventId)
      .run();
  } catch (error) {
    await getD1()
      .prepare(
        `UPDATE reminder_events
         SET delivery_status = 'failed'
         WHERE id = ?`,
      )
      .bind(result.reminderEventId)
      .run();
    throw error;
  }

  return {
    ...result,
    delivered: true as const,
    deliveryReason: "sent" as const,
    telegramId: user.telegramId,
    telegramMessageId: message.message_id,
  };
}

export async function deliverTestReminder(identity: AcademyIdentity) {
  if (!identity.telegramId) {
    return {
      delivered: false as const,
      deliveryReason: "missing_telegram_id" as const,
    };
  }

  const d1 = getD1();
  const user = await d1
    .prepare(
      `SELECT ui_locale AS uiLocale
       FROM users
       WHERE id = ?`,
    )
    .bind(identity.id)
    .first<{ uiLocale: string | null }>();
  const template = selectReminder(1, [], resolveAppLocale(user?.uiLocale));
  const reminderEvent = await d1
    .prepare(
      `INSERT INTO reminder_events (user_id, template_id, level, delivery_status)
       VALUES (?, ?, 1, 'queued')
       RETURNING id`,
    )
    .bind(identity.id, template.id)
    .first<{ id: number }>();

  if (!reminderEvent) {
    throw new Response("Unable to create test reminder event", { status: 500 });
  }

  try {
    const message = await sendTelegramBotMessage({
      chatId: identity.telegramId,
      text: `🧪 测试提醒：${template.content}`,
      buttonText: template.buttonText,
      miniAppUrl: reminderUrlWithEvent(
        runtimeEnv().ACADEMY_MINI_APP_URL ?? null,
        reminderEvent.id,
      ),
      disableNotification: false,
    });
    await d1
      .prepare(
        `UPDATE reminder_events
         SET delivery_status = 'delivered',
             delivered_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(reminderEvent.id)
      .run();
    return {
      delivered: true as const,
      deliveryReason: "sent" as const,
      reminderEventId: reminderEvent.id,
      telegramMessageId: message.message_id,
    };
  } catch (error) {
    await d1
      .prepare(
        `UPDATE reminder_events
         SET delivery_status = 'failed'
         WHERE id = ?`,
      )
      .bind(reminderEvent.id)
      .run();
    throw error;
  }
}

export async function deliverDueReminders(
  requestedLevel: 1 | 2 | 3 | 4,
  limit = 50,
) {
  const d1 = getD1();
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 200);
  const users = await d1
    .prepare(
      `SELECT id
       FROM users
       WHERE reminder_enabled = 1
       ORDER BY created_at ASC
       LIMIT ?`,
    )
    .bind(safeLimit)
    .all<{ id: string }>();

  const results: Array<
    | (Awaited<ReturnType<typeof deliverReminder>> & { userId: string })
    | {
        userId: string;
        delivered: false;
        deliveryReason: "failed";
        error: string;
      }
  > = [];

  for (const user of users.results) {
    try {
      const outcome = await deliverReminder(user.id, requestedLevel);
      results.push({ userId: user.id, ...outcome });
    } catch (error) {
      // One invalid Telegram chat or transient network failure must not prevent
      // the rest of the eligible learners from receiving their reminders.
      results.push({
        userId: user.id,
        delivered: false,
        deliveryReason: "failed",
        error: error instanceof Error ? error.message : "Unexpected delivery failure",
      });
    }
  }

  const failed = results.filter(
    (item) => item.deliveryReason === "failed",
  ).length;
  return {
    requestedLevel,
    scanned: users.results.length,
    delivered: results.filter((item) => item.delivered).length,
    skipped: results.filter((item) => !item.delivered).length,
    failed,
    results,
  };
}
