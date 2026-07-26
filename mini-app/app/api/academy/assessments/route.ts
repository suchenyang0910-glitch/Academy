import {
  ensureSeedData,
  getBootstrap,
  getIdentity,
  submitAbilityAssessment,
} from "../../../../lib/academy-store";

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const payload = (await request.json()) as {
      courseId?: string;
      stageKey?: "day0" | "day7" | "day21";
      answer?: string;
    };
    if (!payload.courseId || !payload.stageKey || !payload.answer) {
      return Response.json(
        { error: "courseId、stageKey 和 answer 为必填项" },
        { status: 400 },
      );
    }

    const assessment = await submitAbilityAssessment(identity, {
      courseId: payload.courseId,
      stageKey: payload.stageKey,
      answer: payload.answer,
    });

    return Response.json(
      {
        assessment,
        bootstrap: await getBootstrap(identity),
      },
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
