import {
  ensureSeedData,
  getIdentity,
  getLessonItem,
} from "../../../../lib/academy-store";

export async function GET(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const lessonId = new URL(request.url).searchParams.get("lessonId")?.trim();
    if (!lessonId) {
      return Response.json({ error: "lessonId 为必填项" }, { status: 400 });
    }

    return Response.json({ item: await getLessonItem(identity, lessonId) });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
