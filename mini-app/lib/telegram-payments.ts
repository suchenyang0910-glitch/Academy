import { getD1 } from "../db";
import { getRuntimeEnv } from "./runtime-env";
import type { AcademyIdentity } from "./academy-store";

type PaymentEnv = {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  ACADEMY_PAYMENT_SUPPORT?: string;
  ACADEMY_STARS_MONTHLY?: string;
  ACADEMY_STARS_QUARTERLY?: string;
  ACADEMY_STARS_HALF_YEAR?: string;
  ACADEMY_STARS_YEARLY?: string;
};

type PlanKey = "monthly" | "quarterly" | "half_year" | "yearly";

const PLANS: Record<
  PlanKey,
  {
    label: string;
    usdPrice: string;
    durationDays: number;
    recurring: boolean;
    envKey:
      | "ACADEMY_STARS_MONTHLY"
      | "ACADEMY_STARS_QUARTERLY"
      | "ACADEMY_STARS_HALF_YEAR"
      | "ACADEMY_STARS_YEARLY";
  }
> = {
  monthly: {
    label: "Academy 月付",
    usdPrice: "$19.9",
    durationDays: 30,
    recurring: true,
    envKey: "ACADEMY_STARS_MONTHLY",
  },
  quarterly: {
    label: "Academy 季度",
    usdPrice: "$55.9",
    durationDays: 90,
    recurring: false,
    envKey: "ACADEMY_STARS_QUARTERLY",
  },
  half_year: {
    label: "Academy 半年",
    usdPrice: "$109",
    durationDays: 180,
    recurring: false,
    envKey: "ACADEMY_STARS_HALF_YEAR",
  },
  yearly: {
    label: "Academy 年付",
    usdPrice: "$199",
    durationDays: 365,
    recurring: false,
    envKey: "ACADEMY_STARS_YEARLY",
  },
};

function paymentEnv() {
  return getRuntimeEnv<PaymentEnv>();
}

function amountFor(planKey: PlanKey) {
  const raw = paymentEnv()[PLANS[planKey].envKey];
  const amount = Number(raw);
  return Number.isInteger(amount) && amount > 0 ? amount : null;
}

function parseDatabaseDate(value: string) {
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function databaseTimestamp(date: Date) {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

async function telegramCall<T>(
  method: string,
  payload: Record<string, unknown>,
) {
  const token = paymentEnv().TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Response("Telegram Stars 尚未配置", { status: 503 });
  }
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as {
    ok?: boolean;
    result?: T;
    description?: string;
  };
  if (!response.ok || !result.ok) {
    throw new Error(result.description || `Telegram ${method} failed`);
  }
  return result.result as T;
}

export function getPaymentCatalog() {
  const configured = Boolean(paymentEnv().TELEGRAM_BOT_TOKEN);
  return {
    provider: "telegram_stars" as const,
    currency: "XTR" as const,
    webhookConfigured: Boolean(paymentEnv().TELEGRAM_WEBHOOK_SECRET),
    enabled:
      configured &&
      (Object.keys(PLANS) as PlanKey[]).some(
        (planKey) => amountFor(planKey) !== null,
      ),
    plans: (Object.entries(PLANS) as Array<
      [PlanKey, (typeof PLANS)[PlanKey]]
    >).map(([key, plan]) => ({
      key,
      label: plan.label,
      usdPrice: plan.usdPrice,
      durationDays: plan.durationDays,
      recurring: plan.recurring,
      stars: amountFor(key),
      enabled: configured && amountFor(key) !== null,
    })),
  };
}

export async function createStarsInvoice(
  identity: AcademyIdentity,
  planKeyInput: string,
) {
  if (!identity.telegramId) {
    throw new Response("请从 Telegram Mini App 内发起 Stars 支付", {
      status: 400,
    });
  }
  if (!(planKeyInput in PLANS)) {
    throw new Response("订阅方案不存在", { status: 400 });
  }

  const planKey = planKeyInput as PlanKey;
  const plan = PLANS[planKey];
  const amountStars = amountFor(planKey);
  if (!amountStars) {
    throw new Response("该方案尚未配置 Stars 价格", { status: 503 });
  }

  const invoicePayload = `academy:${crypto.randomUUID()}`;
  const d1 = getD1();
  await d1
    .prepare(
      `INSERT INTO payment_orders
         (user_id, plan_key, invoice_payload, amount_stars, recurring, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
    )
    .bind(
      identity.id,
      planKey,
      invoicePayload,
      amountStars,
      plan.recurring ? 1 : 0,
    )
    .run();

  try {
    const request: Record<string, unknown> = {
      title: plan.label,
      description: `${plan.durationDays} 天 Academy 学习权限`,
      payload: invoicePayload,
      currency: "XTR",
      prices: [{ label: plan.label, amount: amountStars }],
    };
    if (plan.recurring) request.subscription_period = 2_592_000;

    const invoiceUrl = await telegramCall<string>("createInvoiceLink", request);
    return { invoiceUrl, invoicePayload, planKey, amountStars };
  } catch (error) {
    await d1
      .prepare(
        `UPDATE payment_orders
         SET status = 'failed', updated_at = CURRENT_TIMESTAMP
         WHERE invoice_payload = ?`,
      )
      .bind(invoicePayload)
      .run();
    throw new Response(
      error instanceof Error ? error.message : "Telegram 发票创建失败",
      { status: 502 },
    );
  }
}

export function verifyTelegramWebhook(request: Request) {
  const expected = paymentEnv().TELEGRAM_WEBHOOK_SECRET;
  const supplied = request.headers.get(
    "x-telegram-bot-api-secret-token",
  );
  if (!expected || supplied !== expected) {
    throw new Response("Telegram webhook authorization required", {
      status: 401,
    });
  }
}

type TelegramPreCheckoutQuery = {
  id: string;
  from: { id: number };
  currency: string;
  total_amount: number;
  invoice_payload: string;
};

type TelegramSuccessfulPayment = {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  telegram_payment_charge_id: string;
  provider_payment_charge_id?: string;
  subscription_expiration_date?: number;
  is_recurring?: boolean;
};

type TelegramRefundedPayment = {
  telegram_payment_charge_id: string;
};

type TelegramUpdate = {
  pre_checkout_query?: TelegramPreCheckoutQuery;
  message?: {
    from?: { id: number };
    text?: string;
    successful_payment?: TelegramSuccessfulPayment;
    refunded_payment?: TelegramRefundedPayment;
  };
};

async function handlePreCheckout(query: TelegramPreCheckoutQuery) {
  const d1 = getD1();
  const order = await d1
    .prepare(
      `SELECT o.amount_stars AS amountStars, o.status, o.recurring,
              u.telegram_id AS telegramId
       FROM payment_orders o
       JOIN users u ON u.id = o.user_id
       WHERE o.invoice_payload = ?`,
    )
    .bind(query.invoice_payload)
    .first<{
      amountStars: number;
      status: string;
      recurring: number;
      telegramId: string | null;
    }>();
  const valid =
    Boolean(order) &&
    query.currency === "XTR" &&
    Number(order?.amountStars) === query.total_amount &&
    order?.telegramId === String(query.from.id) &&
    (order?.status === "pending" ||
      (Boolean(order?.recurring) && order?.status === "active"));

  await telegramCall<boolean>("answerPreCheckoutQuery", {
    pre_checkout_query_id: query.id,
    ok: valid,
    ...(valid
      ? {}
      : {
          error_message:
            "订单已失效或价格不匹配，请返回 Academy 重新发起支付。",
        }),
  });
  return { type: "pre_checkout", accepted: valid };
}

async function accessBaseFor(userId: string) {
  const d1 = getD1();
  const user = await d1
    .prepare("SELECT trial_started_at AS trialStartedAt FROM users WHERE id = ?")
    .bind(userId)
    .first<{ trialStartedAt: string }>();
  const latest = await d1
    .prepare(
      `SELECT ends_at AS endsAt FROM subscriptions
       WHERE user_id = ? AND status = 'active'
       ORDER BY datetime(ends_at) DESC LIMIT 1`,
    )
    .bind(userId)
    .first<{ endsAt: string }>();
  const now = new Date();
  const trialEnd = user
    ? addDays(parseDatabaseDate(user.trialStartedAt), 21)
    : now;
  const latestEnd = latest?.endsAt
    ? parseDatabaseDate(latest.endsAt)
    : new Date(0);
  return new Date(
    Math.max(now.getTime(), trialEnd.getTime(), latestEnd.getTime()),
  );
}

async function handleSuccessfulPayment(
  telegramUserId: number,
  payment: TelegramSuccessfulPayment,
) {
  const d1 = getD1();
  const existing = await d1
    .prepare(
      `SELECT id FROM payment_transactions
       WHERE telegram_payment_charge_id = ?`,
    )
    .bind(payment.telegram_payment_charge_id)
    .first();
  if (existing) return { type: "successful_payment", duplicate: true };

  const order = await d1
    .prepare(
      `SELECT o.id, o.user_id AS userId, o.plan_key AS planKey,
              o.amount_stars AS amountStars, o.recurring,
              u.telegram_id AS telegramId
       FROM payment_orders o
       JOIN users u ON u.id = o.user_id
       WHERE o.invoice_payload = ?`,
    )
    .bind(payment.invoice_payload)
    .first<{
      id: number;
      userId: string;
      planKey: PlanKey;
      amountStars: number;
      recurring: number;
      telegramId: string;
    }>();
  if (
    !order ||
    payment.currency !== "XTR" ||
    payment.total_amount !== Number(order.amountStars) ||
    order.telegramId !== String(telegramUserId)
  ) {
    throw new Error("Successful payment did not match an Academy order");
  }

  const plan = PLANS[order.planKey];
  const startsAt = await accessBaseFor(order.userId);
  const telegramExpiration = payment.subscription_expiration_date
    ? new Date(payment.subscription_expiration_date * 1000)
    : null;
  const endsAt =
    telegramExpiration && telegramExpiration.getTime() > startsAt.getTime()
      ? telegramExpiration
      : addDays(startsAt, plan.durationDays);
  const externalRef = `telegram:${payment.telegram_payment_charge_id}`;

  await d1.batch([
    d1
      .prepare(
        `INSERT INTO payment_transactions
           (order_id, user_id, telegram_payment_charge_id,
            provider_payment_charge_id, currency, amount_stars,
            subscription_expiration_date, status)
         VALUES (?, ?, ?, ?, 'XTR', ?, ?, 'paid')`,
      )
      .bind(
        order.id,
        order.userId,
        payment.telegram_payment_charge_id,
        payment.provider_payment_charge_id ?? null,
        payment.total_amount,
        payment.subscription_expiration_date ?? null,
      ),
    d1
      .prepare(
        `INSERT INTO subscriptions
           (user_id, plan_key, status, source, starts_at, ends_at, external_ref)
         VALUES (?, ?, 'active', 'payment', ?, ?, ?)
         ON CONFLICT(external_ref) DO NOTHING`,
      )
      .bind(
        order.userId,
        order.planKey,
        databaseTimestamp(startsAt),
        databaseTimestamp(endsAt),
        externalRef,
      ),
    d1
      .prepare(
        `UPDATE payment_orders
         SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(Boolean(order.recurring) ? "active" : "paid", order.id),
  ]);

  return {
    type: "successful_payment",
    duplicate: false,
    userId: order.userId,
    planKey: order.planKey,
    endsAt: endsAt.toISOString(),
  };
}

async function handleRefund(payment: TelegramRefundedPayment) {
  const d1 = getD1();
  const externalRef = `telegram:${payment.telegram_payment_charge_id}`;
  await d1.batch([
    d1
      .prepare(
        `UPDATE payment_transactions
         SET status = 'refunded', refunded_at = CURRENT_TIMESTAMP
         WHERE telegram_payment_charge_id = ?`,
      )
      .bind(payment.telegram_payment_charge_id),
    d1
      .prepare(
        `UPDATE subscriptions
         SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
         WHERE external_ref = ?`,
      )
      .bind(externalRef),
  ]);
  return { type: "refunded_payment" };
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  if (update.pre_checkout_query) {
    return handlePreCheckout(update.pre_checkout_query);
  }

  const message = update.message;
  if (message?.successful_payment && message.from) {
    return handleSuccessfulPayment(
      message.from.id,
      message.successful_payment,
    );
  }
  if (message?.refunded_payment) {
    return handleRefund(message.refunded_payment);
  }
  if (message?.text?.startsWith("/paysupport") && message.from) {
    await telegramCall<boolean>("sendMessage", {
      chat_id: message.from.id,
      text:
        paymentEnv().ACADEMY_PAYMENT_SUPPORT ||
        "请回复本消息说明付款时间、方案和问题。我们会核对 Telegram Stars 交易记录。",
    });
    return { type: "payment_support" };
  }
  return { type: "ignored" };
}
