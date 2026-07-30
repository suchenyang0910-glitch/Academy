import { getD1 } from "../db";
import { getCreditsBalance, POINTS_PER_USD } from "./credits-ledger";
import { isMissingDatabaseRelationError } from "./db-errors";
import { getPaymentCatalog } from "./telegram-payments";
import type { AcademyIdentity } from "./academy-store";

type PlanPricing = {
  planKey: string;
  currency: string;
  starsAmount: number;
  usdPrice: string;
  anchorRateVersion: string;
};

type MainOffer =
  | { type: "none" }
  | {
      type: "campaign";
      id: string;
      discountAmountMinor: number;
    };

export type PricingSnapshot = {
  id: string;
  status: string;
  planKey: string;
  currency: string;
  originalAmountMinor: number;
  mainOfferType: string;
  mainOfferId: string | null;
  mainDiscountAmountMinor: number;
  creditsRedeemedPoints: number;
  creditsRedeemedAmountMinor: number;
  finalPayableAmountMinor: number;
  maxCreditsRedeemablePoints: number;
  pricingRuleVersion: string;
  anchorRateVersion: string;
  createdAt: string;
};

function parseUsdCents(value: string) {
  const normalized = value.trim().replace(/^\$/, "");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid usdPrice: ${value}`);
  }
  return Math.round(parsed * 100);
}

function floorDiv(numerator: number, denominator: number) {
  if (denominator <= 0) throw new Error("Invalid denominator");
  return Math.floor(numerator / denominator);
}

async function getPlanPricing(planKey: string): Promise<PlanPricing> {
  const catalog = getPaymentCatalog();
  const plan = catalog.plans.find((p) => p.key === planKey);
  if (!plan || !plan.enabled || !plan.stars) {
    throw new Response("该方案尚未配置 Stars 价格", { status: 503 });
  }
  return {
    planKey,
    currency: catalog.currency,
    starsAmount: plan.stars,
    usdPrice: plan.usdPrice,
    anchorRateVersion: "stars_price_v1",
  };
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function getEligibleMainOffer(
  identity: AcademyIdentity,
  planKey: string,
  pricing: PlanPricing,
) {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const d1 = getD1();
  let campaign: {
    id: string;
    rewardMode: string;
    stackableWithCredits: number;
    eligibilityRuleJson: string;
    settlementRuleVersion: string;
  } | null = null;
  try {
    campaign = await d1
      .prepare(
        `SELECT id, reward_mode AS rewardMode,
                stackable_with_credits AS stackableWithCredits,
                eligibility_rule_json AS eligibilityRuleJson,
                settlement_rule_version AS settlementRuleVersion
         FROM campaign_rewards
         WHERE status = 'active'
           AND start_at <= ? AND end_at > ?
         ORDER BY start_at DESC
         LIMIT 1`,
      )
      .bind(now, now)
      .first<{
        id: string;
        rewardMode: string;
        stackableWithCredits: number;
        eligibilityRuleJson: string;
        settlementRuleVersion: string;
      }>();
  } catch (error) {
    if (!isMissingDatabaseRelationError(error, ["campaign_rewards"])) {
      throw error;
    }
  }

  if (!campaign) return { mainOffer: { type: "none" } as MainOffer, stackableWithCredits: true };

  if (campaign.rewardMode !== "discount" || campaign.settlementRuleVersion !== "v1") {
    return { mainOffer: { type: "none" } as MainOffer, stackableWithCredits: true };
  }

  const rule = safeJsonParse(campaign.eligibilityRuleJson);
  const includeUserIds = Array.isArray(rule.include_user_ids)
    ? rule.include_user_ids.filter((id): id is string => typeof id === "string")
    : [];
  if (includeUserIds.length > 0 && !includeUserIds.includes(identity.id)) {
    return { mainOffer: { type: "none" } as MainOffer, stackableWithCredits: true };
  }
  const excludeUserIds = Array.isArray(rule.exclude_user_ids)
    ? rule.exclude_user_ids.filter((id): id is string => typeof id === "string")
    : [];
  if (excludeUserIds.includes(identity.id)) {
    return { mainOffer: { type: "none" } as MainOffer, stackableWithCredits: true };
  }
  const planKeys = Array.isArray(rule.plan_keys)
    ? rule.plan_keys.filter((id): id is string => typeof id === "string")
    : [];
  if (planKeys.length > 0 && !planKeys.includes(planKey)) {
    return { mainOffer: { type: "none" } as MainOffer, stackableWithCredits: true };
  }
  const minPaidOrdersRaw = rule.min_paid_orders;
  const minPaidOrders =
    typeof minPaidOrdersRaw === "number" && Number.isFinite(minPaidOrdersRaw)
      ? Math.max(0, Math.floor(minPaidOrdersRaw))
      : 0;
  if (minPaidOrders > 0) {
    const paidOrders = await d1
      .prepare(
        `SELECT COUNT(*) AS count
         FROM payment_transactions
         WHERE user_id = ? AND status = 'paid'`,
      )
      .bind(identity.id)
      .first<{ count: number }>();
    if (Number(paidOrders?.count ?? 0) < minPaidOrders) {
      return { mainOffer: { type: "none" } as MainOffer, stackableWithCredits: true };
    }
  }

  const discountAmountMinorRaw = rule.discount_amount_minor;
  const discountAmountMinor =
    typeof discountAmountMinorRaw === "number" && Number.isFinite(discountAmountMinorRaw)
      ? Math.max(0, Math.floor(discountAmountMinorRaw))
      : 0;

  return {
    mainOffer: {
      type: "campaign",
      id: campaign.id,
      discountAmountMinor: Math.min(discountAmountMinor, pricing.starsAmount),
    } as MainOffer,
    stackableWithCredits: Boolean(campaign.stackableWithCredits),
  };
}

export async function createPricingPreview(
  identity: AcademyIdentity,
  input: { planKey: string; redeemCredits?: boolean },
): Promise<{ snapshot: PricingSnapshot }> {
  const pricing = await getPlanPricing(input.planKey);
  const { mainOffer, stackableWithCredits } = await getEligibleMainOffer(
    identity,
    input.planKey,
    pricing,
  );

  const originalAmountMinor = pricing.starsAmount;
  const mainDiscountAmountMinor =
    mainOffer.type === "campaign" ? mainOffer.discountAmountMinor : 0;
  const amountAfterMainDiscount = Math.max(0, originalAmountMinor - mainDiscountAmountMinor);
  const maxCreditsRedeemableAmountMinor = floorDiv(amountAfterMainDiscount, 2);

  const usdCents = parseUsdCents(pricing.usdPrice);
  const maxCreditsRedeemablePoints = floorDiv(
    maxCreditsRedeemableAmountMinor * usdCents,
    pricing.starsAmount,
  );

  const balance = await getCreditsBalance(identity.id);
  const redeemCredits =
    Boolean(input.redeemCredits) &&
    (mainOffer.type === "none" || stackableWithCredits);
  const creditsRedeemedPoints = redeemCredits
    ? Math.max(0, Math.min(balance.availablePoints, maxCreditsRedeemablePoints))
    : 0;

  const creditsRedeemedAmountMinor = redeemCredits
    ? floorDiv(creditsRedeemedPoints * pricing.starsAmount, usdCents)
    : 0;

  const cappedCreditsRedeemedAmountMinor = Math.min(
    creditsRedeemedAmountMinor,
    maxCreditsRedeemableAmountMinor,
  );

  const finalPayableAmountMinor = Math.max(
    0,
    originalAmountMinor - mainDiscountAmountMinor - cappedCreditsRedeemedAmountMinor,
  );

  const snapshotId = `ps_${crypto.randomUUID()}`;
  const d1 = getD1();
  await d1
    .prepare(
      `INSERT INTO order_pricing_snapshots
         (id, user_id, plan_key, currency, original_amount_minor,
          main_offer_type, main_offer_id, main_discount_amount_minor,
          credits_redeemed_points, credits_redeemed_amount_minor,
          final_payable_amount_minor, anchor_rate_version, pricing_rule_version, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'preview')`,
    )
    .bind(
      snapshotId,
      identity.id,
      input.planKey,
      pricing.currency,
      originalAmountMinor,
      mainOffer.type === "campaign" ? "campaign" : "none",
      mainOffer.type === "campaign" ? mainOffer.id : null,
      mainDiscountAmountMinor,
      creditsRedeemedPoints,
      cappedCreditsRedeemedAmountMinor,
      finalPayableAmountMinor,
      pricing.anchorRateVersion,
      "pricing_v1",
    )
    .run();

  const snapshot = await d1
    .prepare(
      `SELECT id,
              status,
              plan_key AS planKey,
              currency,
              original_amount_minor AS originalAmountMinor,
              main_offer_type AS mainOfferType,
              main_offer_id AS mainOfferId,
              main_discount_amount_minor AS mainDiscountAmountMinor,
              credits_redeemed_points AS creditsRedeemedPoints,
              credits_redeemed_amount_minor AS creditsRedeemedAmountMinor,
              final_payable_amount_minor AS finalPayableAmountMinor,
              anchor_rate_version AS anchorRateVersion,
              pricing_rule_version AS pricingRuleVersion,
              created_at AS createdAt
       FROM order_pricing_snapshots
       WHERE id = ?`,
    )
    .bind(snapshotId)
    .first<Omit<PricingSnapshot, "maxCreditsRedeemablePoints">>();

  if (!snapshot) {
    throw new Error("order_pricing_snapshots not found after insert");
  }

  return {
    snapshot: {
      ...snapshot,
      maxCreditsRedeemablePoints: maxCreditsRedeemablePoints,
    },
  };
}

export function pointsToUsdCents(points: number) {
  return floorDiv(points * 100, POINTS_PER_USD);
}
