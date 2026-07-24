import {
  ensureSeedData,
  getIdentity,
  saveNote,
} from "../../../../lib/academy-store";

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const payload = (await request.json()) as {
      content?: string;
      lessonId?: string | null;
    };
    const note = await saveNote(identity, {
      content: payload.content ?? "",
      lessonId: payload.lessonId,
    });
    return Response.json({ note }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
