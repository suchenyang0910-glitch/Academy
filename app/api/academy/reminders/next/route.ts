import {
  createReminder,
  verifyCronSecret,
} from "../../../../../lib/academy-store";

export async function POST(request: Request) {
  try {
    verifyCronSecret(request);
    const payload = (await request.json()) as {
      userId?: string;
      level?: number;
    };
    const level = Number(payload.level ?? 1);
    if (![1, 2, 3, 4].includes(level)) {
      return Response.json({ error: "level must be 1-4" }, { status: 400 });
    }

    const result = await createReminder(
      payload.userId?.trim() || "founder",
      level as 1 | 2 | 3 | 4,
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
