import {
  ensureSeedData,
  getIdentity,
  submitLesson,
} from "../../../../lib/academy-store";

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const payload = (await request.json()) as {
      enrollmentId?: number;
      lessonId?: string;
      answer?: string;
      completionSource?: string;
    };

    if (!payload.enrollmentId || !payload.lessonId || !payload.answer) {
      return Response.json(
        { error: "enrollmentId、lessonId 和 answer 为必填项" },
        { status: 400 },
      );
    }

    const submission = await submitLesson(identity, {
      enrollmentId: payload.enrollmentId,
      lessonId: payload.lessonId,
      answer: payload.answer,
      completionSource: payload.completionSource,
    });
    return Response.json({ submission }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
