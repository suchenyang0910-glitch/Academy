import {
  ensureSeedData,
  getIdentity,
  saveUploadedArtifact,
} from "../../../../lib/academy-store";

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const formData = await request.formData();
    const file = formData.get("file");
    const purpose = formData.get("purpose");
    if (!(file instanceof File)) {
      return Response.json({ error: "file is required" }, { status: 400 });
    }
    const artifact = await saveUploadedArtifact(identity, {
      file,
      purpose: typeof purpose === "string" ? purpose : "project_milestone",
    });
    return Response.json({ artifact });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("POST /api/academy/uploads failed", error);
    return Response.json({ error: "upload failed" }, { status: 500 });
  }
}
