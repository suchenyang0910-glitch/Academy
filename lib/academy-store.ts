import { env } from "cloudflare:workers";
import { getD1 } from "../db";
import { COURSE_CATALOG, FIXED_LESSONS } from "./curriculum";
import { REMINDER_TEMPLATES } from "./reminders";

export type AcademyIdentity = {
  id: string;
  telegramId: string | null;
  displayName: string;
};

type RuntimeEnv = {
  TELEGRAM_BOT_TOKEN?: string;
  OLLAMA_BASE_URL?: string;
  OLLAMA_MODEL?: string;
};

function runtimeEnv(): RuntimeEnv {
  return env as unknown as RuntimeEnv;
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
  };
  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.username ||
    "Academy 学员";

  return {
    id: `tg:${user.id}`,
    telegramId: String(user.id),
    displayName,
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
  };
}

export async function ensureSeedData(identity: AcademyIdentity) {
  const d1 = getD1();
  await d1
    .prepare(
      `INSERT INTO users (id, telegram_id, display_name, timezone)
       VALUES (?, ?, ?, 'Asia/Bangkok')
       ON CONFLICT(id) DO UPDATE SET
         telegram_id = excluded.telegram_id,
         display_name = excluded.display_name,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(identity.id, identity.telegramId, identity.displayName)
    .run();

  const seeded = await d1
    .prepare("SELECT value FROM schema_version WHERE key = 'academy_seed'")
    .first<{ value: string }>();
  if (seeded?.value === "v1") return;

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
        `INSERT INTO schema_version (key, value) VALUES ('academy_seed', 'v1')
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ),
  ];

  for (let offset = 0; offset < statements.length; offset += 40) {
    await d1.batch(statements.slice(offset, offset + 40));
  }
}

export async function getBootstrap(identity: AcademyIdentity) {
  const d1 = getD1();
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
                  e.active, c.title, c.slug, c.accent, c.daily_minutes AS dailyMinutes
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

  return {
    user: identity,
    catalog: catalogResult.results,
    enrollments,
    today,
    notes: noteResult.results,
  };
}

export async function updateEnrollments(
  identity: AcademyIdentity,
  courseIds: string[],
) {
  if (courseIds.length < 1 || courseIds.length > 3) {
    throw new Response("请选择 1–3 门课程", { status: 400 });
  }

  const uniqueCourseIds = [...new Set(courseIds)];
  if (uniqueCourseIds.length !== courseIds.length) {
    throw new Response("课程不能重复选择", { status: 400 });
  }

  const d1 = getD1();
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
          `INSERT INTO enrollments (user_id, course_id, current_day, active)
           VALUES (?, ?, 1, 1)
           ON CONFLICT(user_id, course_id) DO UPDATE SET
             active = 1,
             paused_at = NULL`,
        )
        .bind(identity.id, courseId),
    ),
  ];
  await d1.batch(statements);
}

function scoreAnswer(answer: string, criteria: string[]) {
  const normalized = answer.toLowerCase();
  const matched = criteria.filter((criterion) =>
    normalized.includes(criterion.toLowerCase()),
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

async function requestOllamaFeedback(input: {
  lessonTitle: string;
  objective: string;
  criteria: string[];
  answer: string;
  ruleScore: number;
  ruleFeedback: string;
}) {
  const env = runtimeEnv();
  if (!env.OLLAMA_BASE_URL) return null;

  try {
    const response = await fetch(
      `${env.OLLAMA_BASE_URL.replace(/\/$/, "")}/api/chat`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: env.OLLAMA_MODEL ?? "deepseek-r1:7b",
          stream: false,
          messages: [
            {
              role: "system",
              content:
                "你是 Academy 学习点评教练。只基于课程目标和用户原始回答，输出不超过120字的中文反馈：先指出一个做得好的点，再给一个可以立刻执行的修改。不要替用户重写完整答案。",
            },
            {
              role: "user",
              content: JSON.stringify(input),
            },
          ],
        }),
      },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      message?: { content?: string };
    };
    return payload.message?.content?.trim() || null;
  } catch {
    return null;
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
  const aiFeedback = await requestOllamaFeedback({
    lessonTitle: String(lesson.title),
    objective: String(lesson.objective),
    criteria,
    answer,
    ruleScore: rule.score,
    ruleFeedback: rule.feedback,
  });
  const status = rule.score >= 60 ? "completed" : "needs_revision";

  const saved = await d1
    .prepare(
      `INSERT INTO submissions
         (user_id, enrollment_id, lesson_id, original_answer, status,
          rule_score, rule_feedback, ai_feedback, completion_source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, lesson_id) DO UPDATE SET
         revised_answer = excluded.original_answer,
         status = excluded.status,
         rule_score = excluded.rule_score,
         rule_feedback = excluded.rule_feedback,
         ai_feedback = excluded.ai_feedback,
         completion_source = excluded.completion_source,
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
    )
    .first();

  return saved;
}

export async function saveNote(
  identity: AcademyIdentity,
  payload: { content: string; lessonId?: string | null },
) {
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
