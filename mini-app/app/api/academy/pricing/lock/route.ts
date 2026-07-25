import { ensureSeedData, getIdentity } from "../../../../../lib/academy-store";
import { getD1 } from "../../../../../db";

export async function POST(request: Request) {
  try {
    const identity = await getIdentity(request);
    await ensureSeedData(identity);
    const payload = (await request.json()) as {
      snapshotId?: string;
      idempotencyKey?: string;
    };

    if (!payload.snapshotId) {
      return Response.json({ error: "snapshotId 为必填项" }, { status: 400 });
    }
    if (!payload.idempotencyKey) {
      return Response.json({ error: "idempotencyKey 为必填项" }, { status: 400 });
    }

    const d1 = getD1();
    const snapshot = await d1
      .prepare(
        `SELECT id,
                user_id AS userId,
                status,
                idempotency_key AS idempotencyKey
         FROM order_pricing_snapshots
         WHERE id = ?`,
      )
      .bind(payload.snapshotId)
      .first<{
        id: string;
        userId: string;
        status: string;
        idempotencyKey: string | null;
      }>();

    if (!snapshot || snapshot.userId !== identity.id) {
      return Response.json({ error: "结算快照不存在" }, { status: 404 });
    }

    if (snapshot.status === "locked") {
      if (snapshot.idempotencyKey === payload.idempotencyKey) {
        return Response.json({ snapshot: { id: snapshot.id, status: "locked" } });
      }
      return Response.json({ error: "该订单已锁定" }, { status: 409 });
    }

    if (snapshot.status !== "preview") {
      return Response.json({ error: "结算快照状态不允许锁定" }, { status: 409 });
    }

    await d1
      .prepare(
        `UPDATE order_pricing_snapshots
         SET status = 'locked', idempotency_key = ?
         WHERE id = ? AND status = 'preview'`,
      )
      .bind(payload.idempotencyKey, snapshot.id)
      .run();

    const locked = await d1
      .prepare(
        `SELECT status, idempotency_key AS idempotencyKey
         FROM order_pricing_snapshots
         WHERE id = ?`,
      )
      .bind(snapshot.id)
      .first<{ status: string; idempotencyKey: string | null }>();

    if (locked?.status !== "locked") {
      return Response.json({ error: "锁单失败，请重试" }, { status: 409 });
    }

    if (locked.idempotencyKey !== payload.idempotencyKey) {
      return Response.json({ error: "该订单已锁定" }, { status: 409 });
    }

    return Response.json({ snapshot: { id: snapshot.id, status: "locked" } });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

