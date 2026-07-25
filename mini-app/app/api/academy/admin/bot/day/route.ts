import { getD1 } from "../../../../../../db";
import {
  ensureSeedData,
  verifyCronSecret,
  type AcademyIdentity,
} from "../../../../../../lib/academy-store";

function errorResponse(error: unknown) {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ error: message }, { status: 500 });
}

function identityFromPayload(payload: Record<string, unknown>): AcademyIdentity {
  const telegramUserIdRaw = payload.telegramUserId ?? payload.telegram_id;
  const telegramUserId = telegramUserIdRaw
    ? String(telegramUserIdRaw).trim()
    : null;
  const userIdRaw = payload.userId ?? payload.user_id;
  const userId = userIdRaw ? String(userIdRaw).trim() : null;
  const resolvedUserId = userId || (telegramUserId ? `tg:${telegramUserId}` : null);
  if (!resolvedUserId) {
    throw new Response("userId or telegramUserId is required", { status: 400 });
  }

  const displayName = String(payload.displayName ?? payload.display_name ?? resolvedUserId);
  return {
    id: resolvedUserId,
    telegramId: telegramUserId,
    displayName,
    telegramUsername: null,
    firstName: null,
    lastName: null,
    languageCode: null,
    photoUrl: null,
    isPremium: false,
    startParam: null,
  };
}

export async function POST(request: Request) {
  try {
    verifyCronSecret(request);
    const payload = (await request.json()) as Record<string, unknown>;
    const dayRaw = payload.day;
    const day = Number(dayRaw);
    if (!Number.isInteger(day) || day < 1 || day > 60) {
      return Response.json({ error: "day must be 1-60" }, { status: 400 });
    }

    const identity = identityFromPayload(payload);
    await ensureSeedData(identity);
    const d1 = getD1();
    const enrollments = await d1
      .prepare(
        `SELECT e.course_id AS courseId,
                c.title AS courseTitle,
                c.slug AS courseSlug
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE e.user_id = ? AND e.active = 1
         ORDER BY e.enrolled_at`,
      )
      .bind(identity.id)
      .all<{ courseId: string; courseTitle: string; courseSlug: string }>();

    const results: Array<Record<string, unknown>> = [];
    for (const enrollment of enrollments.results) {
      const lesson = await d1
        .prepare(
          `SELECT id, title, objective, content, estimated_minutes AS estimatedMinutes
           FROM lessons
           WHERE course_id = ? AND day = ?`,
        )
        .bind(enrollment.courseId, day)
        .first<{
          id: string;
          title: string;
          objective: string;
          content: string;
          estimatedMinutes: number;
        }>();
      if (!lesson) continue;

      const submission = await d1
        .prepare(
          `SELECT status, rule_score AS ruleScore
           FROM submissions
           WHERE user_id = ? AND lesson_id = ?`,
        )
        .bind(identity.id, lesson.id)
        .first<{ status: string; ruleScore: number }>();

      const content = String(lesson.content ?? "");
      const preview = content.length > 350 ? `${content.slice(0, 350)}...` : content;
      results.push({
        courseTitle: enrollment.courseTitle,
        courseSlug: enrollment.courseSlug,
        day,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        objective: lesson.objective,
        estimatedMinutes: Number(lesson.estimatedMinutes ?? 0),
        preview,
        submissionStatus: submission?.status ?? null,
        ruleScore: submission?.ruleScore ?? null,
      });
    }

    return Response.json({ day, items: results });
  } catch (error) {
    return errorResponse(error);
  }
}

