import {
  deliverDueReminders,
  deliverReminder,
  verifyCronSecret,
} from "../../../../../lib/academy-store";

export async function POST(request: Request) {
  try {
    verifyCronSecret(request);
    const payload = ((await request
      .json()
      .catch(() => ({}))) ?? {}) as {
      userId?: string;
      level?: number;
      limit?: number;
    };
    const level = Number(payload.level ?? 1);
    if (![1, 2, 3, 4].includes(level)) {
      return Response.json({ error: "level must be 1-4" }, { status: 400 });
    }

    const result = payload.userId?.trim()
      ? await deliverReminder(payload.userId.trim(), level as 1 | 2 | 3 | 4)
      : await deliverDueReminders(
          level as 1 | 2 | 3 | 4,
          Number(payload.limit ?? 50),
        );
    return Response.json(result);
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
