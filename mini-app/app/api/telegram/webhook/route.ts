import {
  handleTelegramUpdate,
  verifyTelegramWebhook,
} from "../../../../lib/telegram-payments";

export async function POST(request: Request) {
  try {
    verifyTelegramWebhook(request);
    const update = (await request.json()) as Parameters<
      typeof handleTelegramUpdate
    >[0];
    return Response.json({
      ok: true,
      result: await handleTelegramUpdate(update),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
