import { getD1 } from "../../../../../db";
import { ensureCreditsLedgerEntry } from "../../../../../lib/credits-ledger";
import { verifyCronSecret } from "../../../../../lib/academy-store";

function errorResponse(error: unknown) {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ error: message }, { status: 500 });
}

type AdminAction =
  | {
      action: "approve";
      invitationId: number;
      reviewedBy?: string | null;
      note?: string | null;
    }
  | {
      action: "reject";
      invitationId: number;
      reviewedBy?: string | null;
      note?: string | null;
    }
  | {
      action: "revoke_reward";
      invitationId: number;
      reviewedBy?: string | null;
      note?: string | null;
    };

function parseAdminAction(input: unknown): AdminAction {
  if (!input || typeof input !== "object") {
    throw new Response("Invalid payload", { status: 400 });
  }
  const payload = input as Record<string, unknown>;
  const action = String(payload.action ?? "").trim();
  const invitationId = Number(payload.invitationId);
  if (!Number.isInteger(invitationId) || invitationId <= 0) {
    throw new Response("invitationId 必须是正整数", { status: 400 });
  }
  if (!new Set(["approve", "reject", "revoke_reward"]).has(action)) {
    throw new Response("Unsupported action", { status: 400 });
  }
  return {
    action: action as AdminAction["action"],
    invitationId,
    reviewedBy: payload.reviewedBy ? String(payload.reviewedBy) : null,
    note: payload.note ? String(payload.note).trim().slice(0, 240) : null,
  } as AdminAction;
}

async function invitationById(invitationId: number) {
  return getD1()
    .prepare(
      `SELECT id,
              inviter_user_id AS inviterUserId,
              invited_user_id AS invitedUserId,
              status,
              status_reason AS statusReason,
              risk_level AS riskLevel,
              risk_signals_json AS riskSignalsJson,
              qualified_at AS qualifiedAt,
              reward_granted_at AS rewardGrantedAt
       FROM invitations
       WHERE id = ?`,
    )
    .bind(invitationId)
    .first<{
      id: number;
      inviterUserId: string;
      invitedUserId: string;
      status: string;
      statusReason: string | null;
      riskLevel: string;
      riskSignalsJson: string;
      qualifiedAt: string | null;
      rewardGrantedAt: string | null;
    }>();
}

export async function GET(request: Request) {
  try {
    verifyCronSecret(request);
    const status = new URL(request.url).searchParams.get("status")?.trim();
    const d1 = getD1();
    const rows = await (
      status
        ? d1
            .prepare(
              `SELECT id,
                      inviter_user_id AS inviterUserId,
                      invited_user_id AS invitedUserId,
                      invite_code AS inviteCode,
                      status,
                      status_reason AS statusReason,
                      risk_level AS riskLevel,
                      risk_signals_json AS riskSignalsJson,
                      qualified_at AS qualifiedAt,
                      reward_granted_at AS rewardGrantedAt,
                      reviewed_at AS reviewedAt,
                      reviewed_by AS reviewedBy,
                      created_at AS createdAt
               FROM invitations
               WHERE status = ?
               ORDER BY id DESC
               LIMIT 100`,
            )
            .bind(status)
        : d1.prepare(
            `SELECT id,
                    inviter_user_id AS inviterUserId,
                    invited_user_id AS invitedUserId,
                    invite_code AS inviteCode,
                    status,
                    status_reason AS statusReason,
                    risk_level AS riskLevel,
                    risk_signals_json AS riskSignalsJson,
                    qualified_at AS qualifiedAt,
                    reward_granted_at AS rewardGrantedAt,
                    reviewed_at AS reviewedAt,
                    reviewed_by AS reviewedBy,
                    created_at AS createdAt
             FROM invitations
             ORDER BY id DESC
             LIMIT 100`,
          )
    ).all<Record<string, unknown>>();
    return Response.json({ items: rows.results });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    verifyCronSecret(request);
    const payload = parseAdminAction(await request.json());
    const d1 = getD1();
    const invitation = await invitationById(payload.invitationId);
    if (!invitation) {
      return Response.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (payload.action === "approve") {
      const updated = await d1
        .prepare(
          `UPDATE invitations
           SET status = 'qualified',
               status_reason = ?,
               risk_level = CASE WHEN risk_level = 'high' THEN 'high' ELSE 'low' END,
               qualified_at = COALESCE(qualified_at, CURRENT_TIMESTAMP),
               reviewed_at = CURRENT_TIMESTAMP,
               reviewed_by = ?
           WHERE id = ?
           RETURNING id, status, status_reason AS statusReason,
                     qualified_at AS qualifiedAt, reward_granted_at AS rewardGrantedAt`,
        )
        .bind(payload.note ?? "manually_approved", payload.reviewedBy ?? null, payload.invitationId)
        .first<Record<string, unknown>>();
      return Response.json({ item: updated });
    }

    if (payload.action === "reject") {
      const updated = await d1
        .prepare(
          `UPDATE invitations
           SET status = 'rejected',
               status_reason = ?,
               reviewed_at = CURRENT_TIMESTAMP,
               reviewed_by = ?
           WHERE id = ?
           RETURNING id, status, status_reason AS statusReason,
                     reviewed_at AS reviewedAt, reviewed_by AS reviewedBy`,
        )
        .bind(payload.note ?? "manually_rejected", payload.reviewedBy ?? null, payload.invitationId)
        .first<Record<string, unknown>>();
      return Response.json({ item: updated });
    }

    const existingReward = await d1
      .prepare(
        `SELECT amount_points AS amountPoints,
                related_order_id AS relatedOrderId
         FROM credits_ledger
         WHERE related_invitation_id = ?
           AND reward_type = 'referral_reward'
           AND entry_type = 'earn'
         ORDER BY id DESC
         LIMIT 1`,
      )
      .bind(invitation.id)
      .first<{ amountPoints: number; relatedOrderId: number | null }>();

    const rewardEntry = await ensureCreditsLedgerEntry({
      userId: invitation.inviterUserId,
      entryType: "revoke",
      rewardType: "referral_reward",
      amountPoints: -Math.abs(
        Number(existingReward?.amountPoints ?? 0) > 0
          ? Number(existingReward?.amountPoints ?? 0)
          : 1,
      ),
      status: "posted",
      businessKey: `referral_reward_revoke:${invitation.inviterUserId}:${invitation.id}`,
      relatedOrderId: existingReward?.relatedOrderId ?? null,
      relatedInvitationId: invitation.id,
      expiresAt: null,
    });

    const updated = await d1
      .prepare(
        `UPDATE invitations
         SET status = 'rejected',
             status_reason = ?,
             risk_level = 'high',
             reviewed_at = CURRENT_TIMESTAMP,
             reviewed_by = ?
         WHERE id = ?
         RETURNING id, status, status_reason AS statusReason,
                   reviewed_at AS reviewedAt, reviewed_by AS reviewedBy,
                   reward_granted_at AS rewardGrantedAt`,
      )
      .bind(payload.note ?? "reward_revoked", payload.reviewedBy ?? null, payload.invitationId)
      .first<Record<string, unknown>>();

    return Response.json({
      item: updated,
      ledgerEntry: rewardEntry,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
