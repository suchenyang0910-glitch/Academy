import {
  createReminder,
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
  const telegramUsername = payload.telegramUsername ?? payload.telegram_username;
  const firstName = payload.firstName ?? payload.first_name;
  const lastName = payload.lastName ?? payload.last_name;
  const languageCode = payload.languageCode ?? payload.language_code;

  return {
    id: resolvedUserId,
    telegramId: telegramUserId,
    displayName,
    telegramUsername: telegramUsername ? String(telegramUsername) : null,
    firstName: firstName ? String(firstName) : null,
    lastName: lastName ? String(lastName) : null,
    languageCode: languageCode ? String(languageCode) : null,
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

    const levelRaw = payload.level;
    const level = Number(levelRaw ?? 1);
    if (![1, 2, 3, 4].includes(level)) {
      return Response.json({ error: "level must be 1-4" }, { status: 400 });
    }

    const result = await createReminder(identity.id, level as 1 | 2 | 3 | 4);
    return Response.json({ userId: identity.id, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}

