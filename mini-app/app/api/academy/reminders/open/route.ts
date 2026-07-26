import {
  ensureSeedData,
  getIdentity,
  markReminderOpened,
} from "../../../../../lib/academy-store";

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const payload = (await request.json()) as { reminderEventId?: number };
    if (!payload.reminderEventId) {
      return Response.json({ error: "reminderEventId 为必填项" }, { status: 400 });
    }

    await markReminderOpened(identity, Number(payload.reminderEventId));
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
