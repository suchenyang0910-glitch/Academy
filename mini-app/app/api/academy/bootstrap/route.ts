import {
  ensureSeedData,
  getBootstrap,
  getIdentity,
} from "../../../../lib/academy-store";

function errorResponse(error: unknown, requestId: string) {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error("[academy-bootstrap] failed", {
    requestId,
    message,
    stack: error instanceof Error ? error.stack : undefined,
  });
  return Response.json(
    { error: "bootstrap_unavailable", requestId },
    { status: 500, headers: { "x-academy-request-id": requestId } },
  );
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    return Response.json(await getBootstrap(identity), {
      headers: { "x-academy-request-id": requestId },
    });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
