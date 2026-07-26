import {
  ensureSeedData,
  getBootstrap,
  getIdentity,
  updateUserPreferences,
} from "../../../../lib/academy-store";

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const payload = (await request.json()) as {
      uiLocale?: string;
      reminderEnabled?: boolean;
      reminderHour?: number;
      dndStartHour?: number | null;
      dndEndHour?: number | null;
    };
    await updateUserPreferences(identity, payload);
    return Response.json(await getBootstrap(identity));
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
