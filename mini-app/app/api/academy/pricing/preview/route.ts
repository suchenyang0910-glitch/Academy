import { ensureSeedData, getIdentity } from "../../../../../lib/academy-store";
import { createPricingPreview } from "../../../../../lib/pricing";

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const payload = (await request.json()) as {
      planKey?: string;
      redeemCredits?: boolean;
    };
    if (!payload.planKey) {
      return Response.json({ error: "planKey 为必填项" }, { status: 400 });
    }

    return Response.json(
      await createPricingPreview(identity, {
        planKey: payload.planKey,
        redeemCredits: payload.redeemCredits,
      }),
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

