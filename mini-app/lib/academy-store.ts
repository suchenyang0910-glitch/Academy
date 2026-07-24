import { getD1 } from "../db";
import { getRuntimeEnv } from "./runtime-env";
import { COURSE_CATALOG, FIXED_LESSONS } from "./curriculum";
import { REMINDER_TEMPLATES, selectReminder } from "./reminders";
import { getPaymentCatalog } from "./telegram-payments";
import { getAiRuntimeStatus, requestAiFeedback } from "./ai-feedback";

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

type RuntimeEnv = {
  TELEGRAM_BOT_TOKEN?: string;
  ACADEMY_CRON_SECRET?: string;
  ACADEMY_MINI_APP_URL?: string;
  TELEGRAM_BOT_USERNAME?: string;
};

function runtimeEnv(): RuntimeEnv {
  return getRuntimeEnv<RuntimeEnv>();
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

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > 86400) {
    return null;
  }

  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secret = await hmac("WebAppData", botToken);
  const calculated = bytesToHex(await hmac(secret, dataCheckString));
  if (calculated !== hash.toLowerCase()) return null;

  const rawUser = params.get("user");
  if (!rawUser) return null;

  const user = JSON.parse(rawUser) as {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
    is_premium?: boolean;
  };
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

  // Founder-only self-test mode. As soon as TELEGRAM_BOT_TOKEN is configured,
  // unsigned requests are rejected automatically.
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
          last_name, language_code, photo_url, is_premium, referral_code, timezone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Asia/Bangkok')
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
  if (seeded?.value === "v2") return;

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
          JSON.stringify(lesson.criteria),
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
        `INSERT INTO schema_version (key, value) VALUES ('academy_seed', 'v2')
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
              last_name AS lastName, language_code AS languageCode,
              photo_url AS photoUrl, is_premium AS isPremium,
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
      photoUrl: string | null;
      isPremium: number;
      referralCode: string;
      timezone: string;
      trialStartedAt: string;
    }>();
  const timezone = user?.timezone || "Asia/Bangkok";
  const todayKey = localDateKey(timezone);
  await syncEnrollmentDays(identity.id, todayKey);

  const [catalogResult, enrollmentResult, submissionResult, noteResult] =
    await Promise.all([
      d1
        .prepare(
          `SELECT id, slug, title, subtitle, summary, daily_minutes AS dailyMinutes,
                  duration_days AS durationDays, accent, status
           FROM courses ORDER BY rowid`,
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

      return {
        enrollment,
        lesson: lesson
          ? {
              ...lesson,
              criteria: JSON.parse(String(lesson.criteriaJson ?? "[]")),
              criteriaJson: undefined,
            }
          : null,
        submission: lesson
          ? submittedByLesson.get(String(lesson.id)) ?? null
          : null,
      };
    }),
  );

  const allCompleted =
    today.length > 0 &&
    today.every((item) => item.submission?.status === "completed");
  const lagDays = enrollments.reduce((maximum, enrollment) => {
    const calendarDay = Math.min(
      60,
      dateDistance(enrollment.startedOn, todayKey) + 1,
    );
    return Math.max(maximum, Math.max(0, calendarDay - enrollment.currentDay));
  }, 0);

  const referral = await getReferralSummary(identity.id, user?.referralCode);
  const access = await getLearningAccess(identity.id);

  return {
    user: user
      ? { ...user, isPremium: Boolean(user.isPremium) }
      : identity,
    referral,
    access,
    ai: getAiRuntimeStatus(),
    payment: getPaymentCatalog(),
    catalog: catalogResult.results,
    enrollments,
    today,
    notes: noteResult.results,
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

async function grantReferralRewards(userId: string, qualified: number) {
  const d1 = getD1();
  const milestoneCount = Math.floor(qualified / 3);
  if (milestoneCount < 1) return 0;

  const user = await d1
    .prepare("SELECT trial_started_at AS trialStartedAt FROM users WHERE id = ?")
    .bind(userId)
    .first<{ trialStartedAt: string }>();
  if (!user) return 0;

  for (let milestone = 1; milestone <= milestoneCount; milestone += 1) {
    const externalRef = `referral:${userId}:${milestone}`;
    const exists = await d1
      .prepare("SELECT id FROM subscriptions WHERE external_ref = ?")
      .bind(externalRef)
      .first();
    if (exists) continue;

    const latest = await d1
      .prepare(
        `SELECT ends_at AS endsAt
         FROM subscriptions
         WHERE user_id = ? AND status = 'active'
         ORDER BY datetime(ends_at) DESC LIMIT 1`,
      )
      .bind(userId)
      .first<{ endsAt: string }>();
    const trialEnd = addDays(parseDatabaseDate(user.trialStartedAt), 21);
    const latestEnd = latest?.endsAt
      ? parseDatabaseDate(latest.endsAt)
      : trialEnd;
    const now = new Date();
    const startsAt = new Date(
      Math.max(now.getTime(), trialEnd.getTime(), latestEnd.getTime()),
    );
    const endsAt = addDays(startsAt, 30);

    await d1
      .prepare(
        `INSERT INTO subscriptions
           (user_id, plan_key, status, source, starts_at, ends_at, external_ref)
         VALUES (?, 'referral_30d', 'active', 'referral', ?, ?, ?)
         ON CONFLICT(external_ref) DO NOTHING`,
      )
      .bind(
        userId,
        databaseTimestamp(startsAt),
        databaseTimestamp(endsAt),
        externalRef,
      )
      .run();
  }

  const rewards = await d1
    .prepare(
      `SELECT COUNT(*) AS count
       FROM subscriptions
       WHERE user_id = ? AND source = 'referral'`,
    )
    .bind(userId)
    .first<{ count: number }>();
  return Number(rewards?.count ?? 0);
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
       ORDER BY datetime(ends_at) DESC LIMIT 1`,
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
       WHERE inviter_user_id = ? AND status = 'pending'`,
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

    const validDays = await d1
      .prepare(
        `SELECT COUNT(*) AS count
         FROM (
           SELECT s.completed_on
           FROM submissions s
           JOIN lessons l ON l.id = s.lesson_id
           JOIN enrollments e
             ON e.user_id = s.user_id AND e.course_id = l.course_id
           WHERE s.user_id = ?
             AND s.status = 'completed'
             AND s.completed_on IS NOT NULL
             AND date(s.completed_on) <= date(?, '+7 day')
             AND e.active = 1
           GROUP BY s.completed_on
           HAVING COUNT(DISTINCT l.course_id) >= ?
         ) valid_days`,
      )
      .bind(invitation.invitedUserId, invitation.createdAt, activeCount)
      .first<{ count: number }>();

    if (Number(validDays?.count ?? 0) >= 3) {
      await d1
        .prepare(
          `UPDATE invitations
           SET status = 'qualified', qualified_at = CURRENT_TIMESTAMP
           WHERE id = ? AND status = 'pending'`,
        )
        .bind(invitation.id)
        .run();
    }
  }

  const stats = await d1
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
              SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) AS qualified
       FROM invitations WHERE inviter_user_id = ?`,
    )
    .bind(userId)
    .first<{ total: number; pending: number | null; qualified: number | null }>();

  const qualified = Number(stats?.qualified ?? 0);
  const earnedRewards = await grantReferralRewards(userId, qualified);
  const code = referralCode || (await referralCodeFor(userId));
  const botUsername = runtimeEnv().TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
  return {
    code,
    total: Number(stats?.total ?? 0),
    pending: Number(stats?.pending ?? 0),
    qualified,
    rewardTarget: 3,
    rewardDays: 30,
    earnedRewards,
    nextRewardRemaining: 3 - (qualified % 3),
    shareUrl: botUsername
      ? `https://t.me/${botUsername}?startapp=ref_${code}`
      : null,
  };
}

async function syncEnrollmentDays(userId: string, todayKey: string) {
  const d1 = getD1();
  const completed = await d1
    .prepare(
      `SELECT e.id, e.current_day AS currentDay, s.completed_on AS completedOn
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
    }>();

  const advances = completed.results
    .filter(
      (item) =>
        item.currentDay < 60 &&
        Boolean(item.completedOn) &&
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

function scoreAnswer(answer: string, criteria: string[]) {
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
  if (answer.length < 20) {
    throw new Response("主动练习至少需要 20 个字", { status: 400 });
  }

  const d1 = getD1();
  const lesson = await d1
    .prepare(
      `SELECT l.id, l.title, l.objective, l.criteria_json AS criteriaJson,
              e.id AS enrollmentId
       FROM lessons l
       JOIN enrollments e ON e.course_id = l.course_id
       WHERE l.id = ? AND e.id = ? AND e.user_id = ? AND e.active = 1`,
    )
    .bind(payload.lessonId, payload.enrollmentId, identity.id)
    .first();

  if (!lesson) {
    throw new Response("课程不存在或不属于当前用户", { status: 404 });
  }

  const criteria = JSON.parse(String(lesson.criteriaJson ?? "[]")) as string[];
  const rule = scoreAnswer(answer, criteria);
  const aiFeedback = await requestAiFeedback({
    lessonTitle: String(lesson.title),
    objective: String(lesson.objective),
    criteria,
    answer,
    ruleScore: rule.score,
    ruleFeedback: rule.feedback,
  });
  const status = rule.score >= 60 ? "completed" : "needs_revision";
  const timezoneRow = await d1
    .prepare("SELECT timezone FROM users WHERE id = ?")
    .bind(identity.id)
    .first<{ timezone: string }>();
  const completedOn =
    status === "completed"
      ? localDateKey(timezoneRow?.timezone || "Asia/Bangkok")
      : null;

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
      payload.completionSource ?? "self",
      completedOn,
    )
    .first();

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
  const user = await d1
    .prepare("SELECT id, timezone FROM users WHERE id = ?")
    .bind(userId)
    .first<{ id: string; timezone: string }>();
  if (!user) throw new Response("User not found", { status: 404 });

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
  const level: 1 | 2 | 3 | 4 =
    lagDays >= 2 ? 4 : lagDays === 1 ? 3 : requestedLevel;
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
  );

  await d1
    .prepare(
      `INSERT INTO reminder_events (user_id, template_id, level)
       VALUES (?, ?, ?)`,
    )
    .bind(userId, template.id, level)
    .run();

  return {
    skipped: false as const,
    reminder: template,
    miniAppUrl: runtimeEnv().ACADEMY_MINI_APP_URL ?? null,
    state: { total, completed, lagDays, level },
  };
}
