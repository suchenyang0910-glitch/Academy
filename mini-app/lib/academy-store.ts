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
import { resolveAppLocale, type AppLocale } from "./i18n";
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

type RuntimeEnv = {
  TELEGRAM_BOT_TOKEN?: string;
  ACADEMY_ALLOW_FOUNDER_PREVIEW?: string;
  ACADEMY_CRON_SECRET?: string;
  ACADEMY_MINI_APP_URL?: string;
  TELEGRAM_BOT_USERNAME?: string;
};

function runtimeEnv(): RuntimeEnv {
  return getRuntimeEnv<RuntimeEnv>();
}

type LessonMetadata = {
  criteria: string[];
  assessment?: MultipleChoiceAssessment;
};

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
  if (seeded?.value === "v7") return;

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
    d1
      .prepare(
        `INSERT INTO schema_version (key, value) VALUES ('academy_seed', 'v7')
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
  const submittedByLesson = new Map(
    submissions.map((submission) => [submission.lessonId, submission]),
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
  const metrics = await getLearningMetrics(identity.id);
  const abilityAssessments = await getAbilityAssessments(identity.id);
  const dueAssessments = await getDueAbilityAssessments(identity.id, enrollments);
  await reconcileReviewQueue(identity.id, timezone);
  const reviewQueue = await listReviewQueue(identity.id);
  const assessmentRecommendations = buildAssessmentRecommendations(
    catalog.map((item) => ({ id: String(item.id), title: String(item.title) })),
    dueAssessments,
    abilityAssessments,
  );
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const campaign = await d1
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

  return {
    user: user
      ? {
          ...user,
          uiLocale: resolveAppLocale(user.uiLocale ?? identity.languageCode),
          isPremium: Boolean(user.isPremium),
        }
      : identity,
    reminderPreferences: reminderPreferencesFromUser(user ?? {}),
    referral,
    access,
    credits,
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
    payment: getPaymentCatalog(),
    catalog,
    enrollments,
    today,
    learningAhead,
    notes: noteResult.results,
    metrics,
    abilityAssessments,
    dueAssessments,
    reviewQueue,
    assessmentRecommendations,
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
    submission: submission ?? null,
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
  const [enrollmentResult, completionResult, reminderResult] = await Promise.all([
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
        `SELECT s.completed_on AS completedOn,
                s.completion_source AS completionSource,
                l.course_id AS courseId
         FROM submissions s
         JOIN lessons l ON l.id = s.lesson_id
         WHERE s.user_id = ?
           AND s.status = 'completed'
           AND s.completed_on IS NOT NULL`,
      )
      .bind(userId)
      .all<{
        completedOn: string;
        completionSource: string | null;
        courseId: string;
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

  const enrollments = enrollmentResult.results.map((row) => ({
    courseId: row.courseId,
    startedOn: datePart(row.startedOn),
    pausedOn: datePart(row.pausedAt),
    active: Boolean(row.active),
  }));

  const completionsByDay = new Map<string, Set<string>>();

  for (const row of completionResult.results) {
    if (row.completionSource === "extra") continue;
    const day = datePart(row.completedOn);
    if (!day) continue;

    const completedCourses = completionsByDay.get(day) ?? new Set<string>();
    completedCourses.add(row.courseId);
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

  return {
    effectiveLearningDays: effectiveDays.length,
    currentEffectiveStreak: currentStreak,
    latestEffectiveDay: effectiveDays.at(-1) ?? null,
    completedEvidenceCount: completionResult.results.filter(
      (row) => row.completionSource !== "extra",
    ).length,
    completionBreakdown: {
      self: completionResult.results.filter((row) => row.completionSource === "self")
        .length,
      prompted: completionResult.results.filter(
        (row) => row.completionSource === "prompted",
      ).length,
      supervised: completionResult.results.filter(
        (row) => row.completionSource === "supervised",
      ).length,
    },
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

  return updated;
}

async function syncEnrollmentDays(userId: string, todayKey: string) {
  const d1 = getD1();
  const completed = await d1
    .prepare(
      `SELECT e.id, e.current_day AS currentDay, s.completed_on AS completedOn,
              s.completion_source AS completionSource
       FROM enrollments e
       JOIN lessons l
         ON l.course_id = e.course_id AND l.day = e.current_day
       LEFT JOIN submissions s
         ON s.lesson_id = l.id AND s.user_id = e.user_id
       WHERE e.user_id = ? AND e.active = 1`,
    )
    .bind(userId)
    .all<{
      id: number;
      currentDay: number;
      completedOn: string | null;
      completionSource: string | null;
    }>();

  const advances = completed.results
    .filter(
      (item) =>
        item.currentDay < 60 &&
        Boolean(item.completedOn) &&
        item.completionSource !== "extra" &&
        String(item.completedOn) < todayKey,
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
      `SELECT l.id, l.title, l.objective, l.criteria_json AS criteriaJson,
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
        `SELECT s.status, s.completion_source AS completionSource
         FROM enrollments e
         JOIN lessons l
           ON l.course_id = e.course_id AND l.day = e.current_day
         LEFT JOIN submissions s
           ON s.lesson_id = l.id AND s.user_id = e.user_id
         WHERE e.id = ? AND e.user_id = ? AND e.active = 1`,
      )
      .bind(payload.enrollmentId, identity.id)
      .first<{ status: string | null; completionSource: string | null }>();

    const currentCompleted =
      currentLessonSubmission?.status === "completed" &&
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

  if (
    status === "completed" &&
    saved &&
    typeof (saved as { id?: unknown }).id === "number"
  ) {
    await markReminderCompleted(
      identity.id,
      timezone,
      (saved as { id: number }).id,
    );
  }

  return saved;
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

export function verifyCronSecret(request: Request) {
  const expected = runtimeEnv().ACADEMY_CRON_SECRET;
  const supplied = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied || supplied !== expected) {
    throw new Response("Cron authorization required", { status: 401 });
  }
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
         COUNT(*) AS total,
         SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS completed,
         MAX(
           CAST(julianday(?) - julianday(e.started_on) AS INTEGER)
           - (e.current_day - 1)
         ) AS lagDays
       FROM enrollments e
       JOIN lessons l
         ON l.course_id = e.course_id AND l.day = e.current_day
       LEFT JOIN submissions s
         ON s.lesson_id = l.id AND s.user_id = e.user_id
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
