import {
  ensureSeedData,
  getIdentity,
} from "../../../../../lib/academy-store";
import { createStarsInvoice } from "../../../../../lib/telegram-payments";

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const payload = (await request.json()) as { planKey?: string };
    if (!payload.planKey) {
      return Response.json({ error: "planKey 为必填项" }, { status: 400 });
    }
    return Response.json(
      await createStarsInvoice(identity, payload.planKey),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
