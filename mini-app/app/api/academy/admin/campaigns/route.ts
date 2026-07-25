import { getD1 } from "../../../../../db";
import { verifyCronSecret } from "../../../../../lib/academy-store";

function errorResponse(error: unknown) {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ error: message }, { status: 500 });
}

type CampaignPayload = {
  id?: string;
  name: string;
  status?: "draft" | "active" | "disabled";
  rewardMode?: "discount";
  mainOfferType?: "campaign";
  stackableWithCredits?: boolean;
  budgetCapMinor?: number | null;
  startAt: string;
  endAt: string;
  eligibilityRule?: Record<string, unknown>;
  settlementRuleVersion?: "v1";
  createdBy?: string | null;
};

function normalizeCampaignPayload(input: unknown): CampaignPayload {
  if (!input || typeof input !== "object") {
    throw new Response("Invalid payload", { status: 400 });
  }
  const payload = input as Record<string, unknown>;
  const name = String(payload.name ?? "").trim();
  if (!name) throw new Response("Campaign name is required", { status: 400 });

  const startAt = String(payload.startAt ?? "").trim();
  const endAt = String(payload.endAt ?? "").trim();
  if (!startAt || !endAt) {
    throw new Response("Campaign time window is required", { status: 400 });
  }
  if (endAt <= startAt) {
    throw new Response("Campaign endAt must be after startAt", { status: 400 });
  }

  const statusRaw = String(payload.status ?? "draft");
  const status = (new Set(["draft", "active", "disabled"]).has(statusRaw)
    ? statusRaw
    : "draft") as CampaignPayload["status"];
  const stackableWithCredits = Boolean(payload.stackableWithCredits ?? false);
  const budgetCapMinorRaw = payload.budgetCapMinor;
  const budgetCapMinor =
    budgetCapMinorRaw === null || budgetCapMinorRaw === undefined
      ? null
      : typeof budgetCapMinorRaw === "number" && Number.isFinite(budgetCapMinorRaw)
        ? Math.max(0, Math.floor(budgetCapMinorRaw))
        : null;

  const eligibilityRuleRaw = payload.eligibilityRule;
  const eligibilityRule =
    eligibilityRuleRaw && typeof eligibilityRuleRaw === "object"
      ? (eligibilityRuleRaw as Record<string, unknown>)
      : {};

  const idRaw = payload.id;
  const id = idRaw ? String(idRaw).trim() : undefined;

  return {
    id,
    name,
    status,
    rewardMode: "discount",
    mainOfferType: "campaign",
    stackableWithCredits,
    budgetCapMinor,
    startAt,
    endAt,
    eligibilityRule,
    settlementRuleVersion: "v1",
    createdBy: payload.createdBy ? String(payload.createdBy) : null,
  };
}

export async function GET(request: Request) {
  try {
    verifyCronSecret(request);
    const d1 = getD1();
    const rows = await d1
      .prepare(
        `SELECT id,
                name,
                status,
                reward_mode AS rewardMode,
                main_offer_type AS mainOfferType,
                stackable_with_credits AS stackableWithCredits,
                budget_cap_minor AS budgetCapMinor,
                start_at AS startAt,
                end_at AS endAt,
                eligibility_rule_json AS eligibilityRuleJson,
                settlement_rule_version AS settlementRuleVersion,
                created_by AS createdBy,
                created_at AS createdAt,
                updated_at AS updatedAt
         FROM campaign_rewards
         ORDER BY updated_at DESC, created_at DESC`,
      )
      .all<Record<string, unknown>>();
    return Response.json({ items: rows.results });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    verifyCronSecret(request);
    const payload = normalizeCampaignPayload(await request.json());
    const d1 = getD1();
    const id = payload.id ?? crypto.randomUUID();
    const eligibilityRuleJson = JSON.stringify(payload.eligibilityRule ?? {});

    const item = await d1
      .prepare(
        `INSERT INTO campaign_rewards
           (id, name, status, reward_mode, main_offer_type, stackable_with_credits,
            budget_cap_minor, start_at, end_at, eligibility_rule_json,
            settlement_rule_version, created_by, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           status = excluded.status,
           reward_mode = excluded.reward_mode,
           main_offer_type = excluded.main_offer_type,
           stackable_with_credits = excluded.stackable_with_credits,
           budget_cap_minor = excluded.budget_cap_minor,
           start_at = excluded.start_at,
           end_at = excluded.end_at,
           eligibility_rule_json = excluded.eligibility_rule_json,
           settlement_rule_version = excluded.settlement_rule_version,
           created_by = COALESCE(excluded.created_by, campaign_rewards.created_by),
           updated_at = CURRENT_TIMESTAMP
         RETURNING id,
                   name,
                   status,
                   reward_mode AS rewardMode,
                   main_offer_type AS mainOfferType,
                   stackable_with_credits AS stackableWithCredits,
                   budget_cap_minor AS budgetCapMinor,
                   start_at AS startAt,
                   end_at AS endAt,
                   eligibility_rule_json AS eligibilityRuleJson,
                   settlement_rule_version AS settlementRuleVersion,
                   created_by AS createdBy,
                   created_at AS createdAt,
                   updated_at AS updatedAt`,
      )
      .bind(
        id,
        payload.name,
        payload.status ?? "draft",
        payload.rewardMode ?? "discount",
        payload.mainOfferType ?? "campaign",
        payload.stackableWithCredits ? 1 : 0,
        payload.budgetCapMinor ?? null,
        payload.startAt,
        payload.endAt,
        eligibilityRuleJson,
        payload.settlementRuleVersion ?? "v1",
        payload.createdBy ?? null,
      )
      .first<Record<string, unknown>>();

    if (!item) throw new Error("Campaign upsert failed");
    return Response.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}

