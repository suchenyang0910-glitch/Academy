import {
  createFeedback,
  ensureSeedData,
  getIdentity,
} from "../../../../lib/academy-store";

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const payload = (await request.json()) as {
      category?: string;
      content?: string;
      pageContext?: string | null;
      appVersion?: string | null;
    };
    const feedback = await createFeedback(identity, {
      category: payload.category ?? "other",
      content: payload.content ?? "",
      pageContext: payload.pageContext,
      appVersion: payload.appVersion,
    });
    return Response.json({ feedback }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
