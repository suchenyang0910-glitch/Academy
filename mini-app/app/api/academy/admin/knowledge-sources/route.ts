import {
  createKnowledgeSource,
  listKnowledgeSources,
  reviewKnowledgeSource,
  verifyCronSecret,
} from "../../../../../lib/academy-store";

export async function GET(request: Request) {
  try {
    verifyCronSecret(request);
    const url = new URL(request.url);
    const sources = await listKnowledgeSources({
      status: url.searchParams.get("status"),
      limit: Number(url.searchParams.get("limit") ?? 30),
    });
    return Response.json({ sources });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("GET /api/academy/admin/knowledge-sources failed", error);
    return Response.json({ error: "knowledge source list failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    verifyCronSecret(request);
    const payload = (await request.json().catch(() => ({}))) as {
      action?: string;
      sourceId?: number;
      status?: string;
      reviewNotes?: string | null;
      reviewedBy?: string | null;
      sourceType?: string | null;
      title?: string | null;
      sourceUrl?: string | null;
      canonicalRef?: string | null;
      license?: string | null;
      relevance?: string | null;
      metadata?: Record<string, unknown> | null;
      createdBy?: string | null;
    };

    if (payload.action === "review") {
      const source = await reviewKnowledgeSource({
        sourceId: Number(payload.sourceId),
        status: payload.status ?? "pending_review",
        reviewNotes: payload.reviewNotes,
        reviewedBy: payload.reviewedBy,
      });
      return Response.json({ source });
    }

    const source = await createKnowledgeSource({
      sourceType: payload.sourceType,
      title: payload.title,
      sourceUrl: payload.sourceUrl,
      canonicalRef: payload.canonicalRef,
      license: payload.license,
      relevance: payload.relevance,
      metadata: payload.metadata,
      createdBy: payload.createdBy,
    });
    return Response.json({ source });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("POST /api/academy/admin/knowledge-sources failed", error);
    return Response.json({ error: "knowledge source update failed" }, { status: 500 });
  }
}
