import {
  ensureSeedData,
  getBootstrap,
  getIdentity,
  recordAgentRuntimeCheck,
  saveAgentLabProject,
} from "../../../../lib/academy-store";

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const payload = (await request.json().catch(() => ({}))) as {
      action?: string;
      templateId?: string;
      builderProjectRef?: string | null;
      workflowRef?: string | null;
      workflowExport?: unknown;
      agentProjectId?: number;
      status?: string;
      score?: number;
      notes?: string | null;
      runtimeTests?: unknown;
      result?: Record<string, unknown> | null;
    };

    if (payload.action === "record_runtime_check") {
      const runtimeCheck = await recordAgentRuntimeCheck(identity, {
        agentProjectId: Number(payload.agentProjectId),
        status: payload.status ?? "recorded",
        score: payload.score,
        notes: payload.notes,
        runtimeTests: payload.runtimeTests,
        result: payload.result,
      });
      return Response.json({
        runtimeCheck,
        bootstrap: await getBootstrap(identity),
      });
    }

    const project = await saveAgentLabProject(identity, {
      templateId: String(payload.templateId ?? ""),
      builderProjectRef: payload.builderProjectRef,
      workflowRef: payload.workflowRef,
      workflowExport: payload.workflowExport,
    });
    return Response.json({
      project,
      bootstrap: await getBootstrap(identity),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("POST /api/academy/agent-lab failed", error);
    return Response.json({ error: "agent lab update failed" }, { status: 500 });
  }
}
