import {
  createCompetencyProofShare,
  ensureSeedData,
  getCompetencyProofPackage,
  getIdentity,
} from "../../../../lib/academy-store";

export async function GET(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const url = new URL(request.url);
    const requestedFormat = url.searchParams.get("format");
    const format = requestedFormat === "markdown" ? "markdown" : "json";
    const proof = await getCompetencyProofPackage(identity, format);
    return new Response(proof.body, {
      headers: {
        "content-type": proof.contentType,
        "content-disposition": `attachment; filename="${proof.filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("GET /api/academy/competency-proof failed", error);
    return Response.json({ error: "competency proof export failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const share = await createCompetencyProofShare(identity);
    const url = new URL(request.url);
    const shareUrl = `${url.origin}/proof/${share.token}`;
    return Response.json(
      {
        token: share.token,
        shareUrl,
        snapshot: share.snapshot,
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("POST /api/academy/competency-proof failed", error);
    return Response.json(
      { error: "competency proof share creation failed" },
      { status: 500 },
    );
  }
}
