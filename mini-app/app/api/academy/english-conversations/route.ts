import { ensureSeedData, getIdentity } from "../../../../lib/academy-store";
import { parseEnglishAction } from "../../../../lib/english-conversation";
import { listEnglishConversations, updateEnglishConversation } from "../../../../lib/english-conversation-store";

async function handleError(error: unknown) {
  if (error instanceof Response) return error;
  // Never expose provider errors, connection strings, or learner transcripts.
  return Response.json({ error: "conversation_unavailable" }, { status: 503 });
}
export async function GET(request: Request) {
  try {
    const identity = await getIdentity(request);
    const lessonId = new URL(request.url).searchParams.get("lessonId");
    if (!lessonId || lessonId.length > 100) return Response.json({ error: "invalid_request" }, { status: 400 });
    return Response.json(await listEnglishConversations(identity, lessonId), { headers: { "cache-control": "no-store" } });
  } catch (error) { return handleError(error); }
}
export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    // Bound the streamed request, including clients that omit Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: "invalid_request" }, { status: 400 });
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 8192) {
        await reader.cancel();
        return Response.json({ error: "request_too_large" }, { status: 413 });
      }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let payload: unknown;
    try { payload = JSON.parse(new TextDecoder().decode(bytes)); }
    catch { return Response.json({ error: "invalid_request" }, { status: 400 }); }
    const action = parseEnglishAction(payload);
    if (!action) return Response.json({ error: "invalid_request" }, { status: 400 });
    await ensureSeedData(identity);
    return Response.json({ session: await updateEnglishConversation(identity, action) }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return handleError(error); }
}
