import { getD1 } from "../db";

export const POINTS_PER_USD = 100;

export type CreditsLedgerEntryType = "earn" | "hold" | "redeem" | "expire" | "revoke";
export type CreditsLedgerRewardType =
  | "study_reward"
  | "referral_reward"
  | "campaign_reward";
export type CreditsLedgerStatus = "pending" | "posted" | "voided";

export type CreditsLedgerEntry = {
  id: number;
  entryType: CreditsLedgerEntryType;
  rewardType: CreditsLedgerRewardType;
  amountPoints: number;
  status: CreditsLedgerStatus;
  relatedOrderId: number | null;
  relatedInvitationId: number | null;
  relatedCampaignRewardId: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export async function ensureCreditsLedgerEntry(input: {
  userId: string;
  entryType: CreditsLedgerEntryType;
  rewardType: CreditsLedgerRewardType;
  amountPoints: number;
  status?: CreditsLedgerStatus;
  businessKey: string;
  relatedOrderId?: number | null;
  relatedInvitationId?: number | null;
  relatedCampaignRewardId?: string | null;
  expiresAt?: string | null;
}) {
  const d1 = getD1();
  await d1
    .prepare(
      `INSERT INTO credits_ledger
         (user_id, entry_type, reward_type, amount_points, status, business_key,
          related_order_id, related_invitation_id, related_campaign_reward_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(business_key) DO NOTHING`,
    )
    .bind(
      input.userId,
      input.entryType,
      input.rewardType,
      input.amountPoints,
      input.status ?? "posted",
      input.businessKey,
      input.relatedOrderId ?? null,
      input.relatedInvitationId ?? null,
      input.relatedCampaignRewardId ?? null,
      input.expiresAt ?? null,
    )
    .run();

  const entry = await d1
    .prepare(
      `SELECT id,
              entry_type AS entryType,
              reward_type AS rewardType,
              amount_points AS amountPoints,
              status,
              related_order_id AS relatedOrderId,
              related_invitation_id AS relatedInvitationId,
              related_campaign_reward_id AS relatedCampaignRewardId,
              expires_at AS expiresAt,
              created_at AS createdAt
       FROM credits_ledger
       WHERE business_key = ?`,
    )
    .bind(input.businessKey)
    .first<CreditsLedgerEntry>();

  if (!entry) {
    throw new Error("credits_ledger entry not found after insert");
  }

  return entry;
}

export async function getCreditsBalance(userId: string) {
  const d1 = getD1();
  const result = await d1
    .prepare(
      `SELECT
         COALESCE(SUM(CASE
           WHEN status = 'posted' AND (expires_at IS NULL OR CAST(expires_at AS TIMESTAMP) > CURRENT_TIMESTAMP)
           THEN amount_points ELSE 0 END), 0) AS availablePoints,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_points ELSE 0 END), 0) AS pendingPoints
       FROM credits_ledger
       WHERE user_id = ? AND status IN ('posted', 'pending')`,
    )
    .bind(userId)
    .first<{ availablePoints: number; pendingPoints: number }>();

  const availablePoints = Number(result?.availablePoints ?? 0);
  const pendingPoints = Number(result?.pendingPoints ?? 0);
  return {
    balancePoints: availablePoints + pendingPoints,
    availablePoints,
    pendingPoints,
    anchor: {
      pointsPerUsd: POINTS_PER_USD,
      rule: "100 points = 1 USD discount right",
    },
  };
}

export async function listCreditsLedger(
  userId: string,
  input?: { cursor?: number; limit?: number },
) {
  const limit = Math.min(Math.max(input?.limit ?? 50, 1), 200);
  const d1 = getD1();
  const cursor = input?.cursor ?? null;
  const statement =
    cursor === null
      ? d1.prepare(
          `SELECT id,
                  entry_type AS entryType,
                  reward_type AS rewardType,
                  amount_points AS amountPoints,
                  status,
                  related_order_id AS relatedOrderId,
                  related_invitation_id AS relatedInvitationId,
                  related_campaign_reward_id AS relatedCampaignRewardId,
                  expires_at AS expiresAt,
                  created_at AS createdAt
           FROM credits_ledger
           WHERE user_id = ?
           ORDER BY id DESC
           LIMIT ?`,
        )
      : d1.prepare(
          `SELECT id,
                  entry_type AS entryType,
                  reward_type AS rewardType,
                  amount_points AS amountPoints,
                  status,
                  related_order_id AS relatedOrderId,
                  related_invitation_id AS relatedInvitationId,
                  related_campaign_reward_id AS relatedCampaignRewardId,
                  expires_at AS expiresAt,
                  created_at AS createdAt
           FROM credits_ledger
           WHERE user_id = ? AND id < ?
           ORDER BY id DESC
           LIMIT ?`,
        );

  const rows = await (cursor === null
    ? statement.bind(userId, limit).all<CreditsLedgerEntry>()
    : statement.bind(userId, cursor, limit).all<CreditsLedgerEntry>());

  const items = rows.results;
  const nextCursor = items.length === limit ? items[items.length - 1].id : null;
  return { items, nextCursor };
}

