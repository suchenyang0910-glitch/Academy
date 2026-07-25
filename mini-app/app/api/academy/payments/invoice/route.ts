import {
  ensureSeedData,
  getIdentity,
} from "../../../../../lib/academy-store";
import { createStarsInvoice } from "../../../../../lib/telegram-payments";

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const payload = (await request.json()) as { snapshotId?: string };
    if (!payload.snapshotId) {
      return Response.json({ error: "snapshotId 为必填项" }, { status: 400 });
    }
    return Response.json(
      await createStarsInvoice(identity, payload.snapshotId),
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
