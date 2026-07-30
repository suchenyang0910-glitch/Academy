import {
  ensureSeedData,
  getIdentity,
  recordConversionEvent,
} from "../../../../lib/academy-store";

function errorResponse(error: unknown) {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ error: message }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const payload = (await request.json()) as {
      eventType?: string;
      planKey?: string | null;
      metadata?: Record<string, unknown> | null;
    };
    if (!payload.eventType) {
      return Response.json({ error: "eventType is required" }, { status: 400 });
    }
    const event = await recordConversionEvent(identity, {
      eventType: payload.eventType,
      planKey: payload.planKey,
      metadata: payload.metadata,
    });
    return Response.json({ event });
  } catch (error) {
    return errorResponse(error);
  }
}
