import {
  getReminderDeliveryDiagnostic,
  verifyCronSecret,
} from "../../../../../../lib/academy-store";

function errorResponse(error: unknown) {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ error: message }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    verifyCronSecret(request);
    const payload = (await request.json()) as Record<string, unknown>;
    const userIdRaw = payload.userId ?? payload.user_id;
    const telegramUserIdRaw = payload.telegramUserId ?? payload.telegram_id;
    const diagnostic = await getReminderDeliveryDiagnostic({
      userId: userIdRaw ? String(userIdRaw) : null,
      telegramUserId: telegramUserIdRaw ? String(telegramUserIdRaw) : null,
    });

    return Response.json(diagnostic);
  } catch (error) {
    return errorResponse(error);
  }
}
