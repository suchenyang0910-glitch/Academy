import {
  ensureSeedData,
  getBootstrap,
  getIdentity,
} from "../../../../lib/academy-store";

function errorResponse(error: unknown) {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ error: message }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    return Response.json(await getBootstrap(identity));
  } catch (error) {
    return errorResponse(error);
  }
}
