import {
  reviewProjectMilestone,
  verifyCronSecret,
} from "../../../../../../lib/academy-store";

function errorResponse(error: unknown) {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ error: message }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    verifyCronSecret(request);
    const payload = (await request.json()) as {
      milestoneId?: number;
      action?: "approve" | "request_revision";
      reviewedBy?: string | null;
      note?: string | null;
    };
    if (!payload.milestoneId) {
      return Response.json({ error: "milestoneId is required" }, { status: 400 });
    }
    if (payload.action !== "approve" && payload.action !== "request_revision") {
      return Response.json(
        { error: "action must be approve or request_revision" },
        { status: 400 },
      );
    }
    const milestone = await reviewProjectMilestone({
      milestoneId: Number(payload.milestoneId),
      action: payload.action,
      reviewedBy: payload.reviewedBy,
      note: payload.note,
    });
    return Response.json({ milestone });
  } catch (error) {
    return errorResponse(error);
  }
}
