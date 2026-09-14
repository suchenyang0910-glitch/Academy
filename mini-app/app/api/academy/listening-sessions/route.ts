import { ensureSeedData, getIdentity } from "../../../../lib/academy-store";
import { parseListeningAction } from "../../../../lib/english-listening-actions";
import { getListeningSession, listListeningSessions, updateListeningSession } from "../../../../lib/english-listening-store";

function unavailable(error: unknown) {
  if (error instanceof Response) return error;
  return Response.json({ error: { code: "listening_unavailable", message: "英语练习暂时无法连接，请稍后重试。" } }, { status: 503 });
}
export async function GET(request: Request) {
  try {
    const identity = await getIdentity(request); await ensureSeedData(identity);
    const url = new URL(request.url); const sessionId = url.searchParams.get("sessionId"); const lessonId = url.searchParams.get("lessonId");
    if (sessionId && /^[a-zA-Z0-9-]{16,80}$/.test(sessionId)) return Response.json(await getListeningSession(identity, sessionId), { headers: { "cache-control": "no-store" } });
    if (lessonId && /^[a-zA-Z0-9_-]{1,100}$/.test(lessonId)) return Response.json(await listListeningSessions(identity, lessonId), { headers: { "cache-control": "no-store" } });
    return Response.json({ error: { code: "invalid_request", message: "缺少练习信息。" } }, { status: 400 });
  } catch (error) { return unavailable(error); }
}
export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    const text = await request.text();
    if (text.length > 16_384) return Response.json({ error: { code: "request_too_large", message: "本次内容过长。" } }, { status: 413 });
    let payload: unknown; try { payload = JSON.parse(text); } catch { return Response.json({ error: { code: "invalid_request", message: "练习请求格式不正确。" } }, { status: 400 }); }
    const action = parseListeningAction(payload); if (!action) return Response.json({ error: { code: "invalid_request", message: "练习请求格式不正确。" } }, { status: 400 });
    await ensureSeedData(identity);
    return Response.json(await updateListeningSession(identity, action), { headers: { "cache-control": "no-store" } });
  } catch (error) { return unavailable(error); }
}
