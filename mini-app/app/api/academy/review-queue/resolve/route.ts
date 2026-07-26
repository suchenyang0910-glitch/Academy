import {
  ensureSeedData,
  getBootstrap,
  getIdentity,
  resolveReviewQueueEntry,
} from "../../../../../lib/academy-store";

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const payload = (await request.json()) as { reviewQueueItemId?: number };
    if (!payload.reviewQueueItemId) {
      return Response.json(
        { error: "reviewQueueItemId 为必填项" },
        { status: 400 },
      );
    }

    const item = await resolveReviewQueueEntry(
      identity,
      Number(payload.reviewQueueItemId),
    );

    return Response.json(
      {
        item,
        bootstrap: await getBootstrap(identity),
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
