import { getD1 } from "../../../../../../db";
import {
  ensureSeedData,
  saveNote,
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
    const identity = identityFromPayload(payload);
    await ensureSeedData(identity);

    const action = String(payload.action ?? "list");
    if (action === "create") {
      const content = String(payload.content ?? "");
      const lessonId = payload.lessonId ? String(payload.lessonId) : null;
      const note = await saveNote(identity, { content, lessonId });
      return Response.json({ note }, { status: 201 });
    }

    const limit = Math.min(Math.max(Number(payload.limit ?? 20), 1), 50);
    const d1 = getD1();
    const rows = await d1
      .prepare(
        `SELECT n.id,
                n.lesson_id AS lessonId,
                n.content,
                n.created_at AS createdAt,
                l.day AS day,
                c.title AS courseTitle,
                c.slug AS courseSlug
         FROM notes n
         LEFT JOIN lessons l ON l.id = n.lesson_id
         LEFT JOIN courses c ON c.id = l.course_id
         WHERE n.user_id = ?
         ORDER BY n.created_at DESC
         LIMIT ?`,
      )
      .bind(identity.id, limit)
      .all<Record<string, unknown>>();
    return Response.json({ items: rows.results });
  } catch (error) {
    return errorResponse(error);
  }
}

