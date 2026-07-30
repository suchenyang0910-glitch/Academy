import {
  ensureSeedData,
  getBootstrap,
  getIdentity,
  submitProjectMilestone,
} from "../../../../../lib/academy-store";

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const payload = (await request.json()) as {
      templateId?: string;
      checkpointId?: string;
      evidenceText?: string;
      artifactUrl?: string | null;
      attachmentIds?: number[];
      runtimeTests?: unknown;
    };
    if (!payload.templateId || !payload.checkpointId || !payload.evidenceText) {
      return Response.json(
        { error: "templateId、checkpointId 和 evidenceText 为必填项" },
        { status: 400 },
      );
    }

    const milestone = await submitProjectMilestone(identity, {
      templateId: payload.templateId,
      checkpointId: payload.checkpointId,
      evidenceText: payload.evidenceText,
      artifactUrl: payload.artifactUrl,
      attachmentIds: payload.attachmentIds,
      runtimeTests: payload.runtimeTests,
    });

    return Response.json(
      {
        milestone,
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
