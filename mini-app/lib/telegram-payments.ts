import { getD1 } from "../db";
import { getRuntimeEnv } from "./runtime-env";
import type { AcademyIdentity } from "./academy-store";
import { ensureCreditsLedgerEntry } from "./credits-ledger";

type PaymentEnv = {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  ACADEMY_PAYMENT_SUPPORT?: string;
  ACADEMY_MINI_APP_URL?: string;
  ACADEMY_STARS_MONTHLY?: string;
  ACADEMY_STARS_MONTH?: string;
  ACADEMY_STARS_30D?: string;
  ACADEMY_STARS_30_DAYS?: string;
  ACADEMY_STARS_QUARTERLY?: string;
  ACADEMY_STARS_QUARTER?: string;
  ACADEMY_STARS_90D?: string;
  ACADEMY_STARS_90_DAYS?: string;
  ACADEMY_STARS_HALF_YEAR?: string;
  ACADEMY_STARS_HALF_YEARLY?: string;
  ACADEMY_STARS_180D?: string;
  ACADEMY_STARS_180_DAYS?: string;
  ACADEMY_STARS_YEARLY?: string;
  ACADEMY_STARS_YEAR?: string;
  ACADEMY_STARS_365D?: string;
  ACADEMY_STARS_365_DAYS?: string;
};

type PlanKey = "monthly" | "quarterly" | "half_year" | "yearly";

const PLANS: Record<
  PlanKey,
  {
    label: string;
    usdPrice: string;
    durationDays: number;
    recurring: boolean;
    envKeys: Array<keyof PaymentEnv>;
  }
> = {
  monthly: {
    label: "Academy 月付",
    usdPrice: "$9.9",
    durationDays: 30,
    recurring: true,
    envKeys: [
      "ACADEMY_STARS_MONTHLY",
      "ACADEMY_STARS_MONTH",
      "ACADEMY_STARS_30D",
      "ACADEMY_STARS_30_DAYS",
    ],
  },
  quarterly: {
    label: "Academy 季度",
    usdPrice: "$55.9",
    durationDays: 90,
    recurring: false,
    envKeys: [
      "ACADEMY_STARS_QUARTERLY",
      "ACADEMY_STARS_QUARTER",
      "ACADEMY_STARS_90D",
      "ACADEMY_STARS_90_DAYS",
    ],
  },
  half_year: {
    label: "Academy 半年",
    usdPrice: "$109",
    durationDays: 180,
    recurring: false,
    envKeys: [
      "ACADEMY_STARS_HALF_YEAR",
      "ACADEMY_STARS_HALF_YEARLY",
      "ACADEMY_STARS_180D",
      "ACADEMY_STARS_180_DAYS",
    ],
  },
  yearly: {
    label: "Academy 年付",
    usdPrice: "$199",
    durationDays: 365,
    recurring: false,
    envKeys: [
      "ACADEMY_STARS_YEARLY",
      "ACADEMY_STARS_YEAR",
      "ACADEMY_STARS_365D",
      "ACADEMY_STARS_365_DAYS",
    ],
  },
};

function paymentEnv() {
  return getRuntimeEnv<PaymentEnv>();
}

function amountFor(planKey: PlanKey) {
  const env = paymentEnv();
  for (const key of PLANS[planKey].envKeys) {
    const raw = env[key];
    const amount = Number(raw);
    if (Number.isInteger(amount) && amount > 0) {
      return { amount, configuredBy: key };
    }
  }
  return { amount: null, configuredBy: null };
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

function localDateKey(timezone = "Asia/Bangkok", date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function dateDistance(from: string, to: string) {
  const fromTime = Date.parse(`${from}T00:00:00Z`);
  const toTime = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(fromTime) || !Number.isFinite(toTime)) return 0;
  return Math.max(0, Math.floor((toTime - fromTime) / 86_400_000));
}

function miniAppUrl() {
  return paymentEnv().ACADEMY_MINI_APP_URL ?? null;
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

export async function sendTelegramBotMessage(payload: {
  chatId: string | number;
  text: string;
  buttonText?: string | null;
  miniAppUrl?: string | null;
  disableNotification?: boolean;
}) {
  const replyMarkup =
    payload.buttonText && payload.miniAppUrl
      ? {
          inline_keyboard: [
            [
              {
                text: payload.buttonText,
                web_app: { url: payload.miniAppUrl },
              },
            ],
          ],
        }
      : undefined;

  return telegramCall<{ message_id: number }>("sendMessage", {
    chat_id: payload.chatId,
    text: payload.text,
    disable_notification: Boolean(payload.disableNotification),
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export function getPaymentCatalog() {
  const configured = Boolean(paymentEnv().TELEGRAM_BOT_TOKEN);
  const webhookConfigured = Boolean(paymentEnv().TELEGRAM_WEBHOOK_SECRET);
  return {
    provider: "telegram_stars" as const,
    currency: "XTR" as const,
    webhookConfigured,
    enabled:
      configured &&
      webhookConfigured &&
      (Object.keys(PLANS) as PlanKey[]).some(
        (planKey) => amountFor(planKey).amount !== null,
      ),
    plans: (Object.entries(PLANS) as Array<
      [PlanKey, (typeof PLANS)[PlanKey]]
    >).map(([key, plan]) => {
      const stars = amountFor(key);
      return {
        key,
        label: plan.label,
        usdPrice: plan.usdPrice,
        durationDays: plan.durationDays,
        recurring: plan.recurring,
        stars: stars.amount,
        configuredBy: stars.configuredBy,
        enabled: configured && webhookConfigured && stars.amount !== null,
        disabledReason: !configured
          ? "missing_bot_token"
          : stars.amount === null
            ? "missing_stars_amount"
            : !webhookConfigured
              ? "missing_webhook_secret"
              : null,
      };
    }),
  };
}

export async function createStarsInvoice(
  identity: AcademyIdentity,
  snapshotId: string,
) {
  if (!identity.telegramId) {
    throw new Response("请从 Telegram Mini App 内发起 Stars 支付", {
      status: 400,
    });
  }
  const d1 = getD1();
  const snapshot = await d1
    .prepare(
      `SELECT id,
              plan_key AS planKey,
              final_payable_amount_minor AS finalPayableAmountMinor,
              status
       FROM order_pricing_snapshots
       WHERE id = ? AND user_id = ?`,
    )
    .bind(snapshotId, identity.id)
    .first<{
      id: string;
      planKey: string;
      finalPayableAmountMinor: number;
      status: string;
    }>();
  if (!snapshot) throw new Response("结算快照不存在", { status: 404 });
  if (snapshot.status !== "locked") {
    throw new Response("请先锁定结算快照后再发起支付", { status: 409 });
  }
  if (!(snapshot.planKey in PLANS)) {
    throw new Response("订阅方案不存在", { status: 400 });
  }
  const planKey = snapshot.planKey as PlanKey;
  const plan = PLANS[planKey];
  const amountStars = Number(snapshot.finalPayableAmountMinor);
  if (!Number.isInteger(amountStars) || amountStars <= 0) {
    throw new Response("结算金额无效，请重新发起支付", { status: 409 });
  }

  const existing = await d1
    .prepare(
      `SELECT invoice_payload AS invoicePayload, status
       FROM payment_orders
       WHERE pricing_snapshot_id = ?`,
    )
    .bind(snapshot.id)
    .first<{ invoicePayload: string; status: string }>();
  if (existing) {
    throw new Response("该结算快照已创建过订单，请重新生成结算预览", {
      status: 409,
    });
  }

  const invoicePayload = `academy:${crypto.randomUUID()}`;
  await d1
    .prepare(
      `INSERT INTO payment_orders
         (user_id, plan_key, pricing_snapshot_id, invoice_payload, amount_stars, recurring, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    )
    .bind(
      identity.id,
      planKey,
      snapshot.id,
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
    from?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
    };
    text?: string;
    successful_payment?: TelegramSuccessfulPayment;
    refunded_payment?: TelegramRefundedPayment;
  };
};

async function ensureTelegramUser(messageFrom: NonNullable<TelegramUpdate["message"]>["from"]) {
  if (!messageFrom) return null;
  const userId = `tg:${messageFrom.id}`;
  const displayName =
    [messageFrom.first_name, messageFrom.last_name].filter(Boolean).join(" ") ||
    messageFrom.username ||
    userId;
  await getD1()
    .prepare(
      `INSERT INTO users
         (id, telegram_id, display_name, telegram_username, first_name, last_name,
          language_code, ui_locale, is_premium, timezone)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'zh-Hans', ?, 'Asia/Bangkok')
       ON CONFLICT(id) DO UPDATE SET
         telegram_id = excluded.telegram_id,
         display_name = excluded.display_name,
         telegram_username = excluded.telegram_username,
         first_name = excluded.first_name,
         last_name = excluded.last_name,
         language_code = excluded.language_code,
         is_premium = excluded.is_premium,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      userId,
      String(messageFrom.id),
      displayName,
      messageFrom.username ?? null,
      messageFrom.first_name ?? null,
      messageFrom.last_name ?? null,
      messageFrom.language_code ?? null,
      messageFrom.is_premium ? 1 : 0,
    )
    .run();
  return {
    id: userId,
    telegramId: String(messageFrom.id),
    displayName,
  };
}

async function setReminderEnabledForTelegramUser(
  telegramUserId: number,
  enabled: boolean,
) {
  await getD1()
    .prepare(
      `UPDATE users
       SET reminder_enabled = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE telegram_id = ?`,
    )
    .bind(enabled ? 1 : 0, String(telegramUserId))
    .run();
}

async function buildBotTodaySummary(userId: string) {
  const d1 = getD1();
  const user = await d1
    .prepare(
      `SELECT timezone,
              reminder_enabled AS reminderEnabled,
              reminder_hour AS reminderHour
       FROM users
       WHERE id = ?`,
    )
    .bind(userId)
    .first<{
      timezone: string | null;
      reminderEnabled: number | boolean | null;
      reminderHour: number | null;
    }>();
  const timezone = user?.timezone || "Asia/Bangkok";
  const todayKey = localDateKey(timezone);

  const rows = await d1
    .prepare(
      `SELECT e.current_day AS currentDay,
              e.started_on AS startedOn,
              c.title AS courseTitle,
              l.title AS lessonTitle,
              l.objective AS lessonObjective,
              s.status AS submissionStatus,
              s.completion_source AS completionSource
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN lessons l ON l.course_id = e.course_id AND l.day = e.current_day
       LEFT JOIN submissions s
         ON s.user_id = e.user_id AND s.lesson_id = l.id
       WHERE e.user_id = ? AND e.active = 1
       ORDER BY e.enrolled_at ASC`,
    )
    .bind(userId)
    .all<{
      currentDay: number;
      startedOn: string;
      courseTitle: string;
      lessonTitle: string;
      lessonObjective: string;
      submissionStatus: string | null;
      completionSource: string | null;
    }>();

  if (rows.results.length === 0) {
    return {
      text:
        "你还没有激活课程。\n\n打开 Academy 先选 1–3 门课，再回来我就能继续盯你。",
      buttonText: "打开 Academy",
    };
  }

  const lagDays = rows.results.reduce((maximum, item) => {
    const calendarDay = Math.min(
      60,
      dateDistance(item.startedOn, todayKey) + 1,
    );
    return Math.max(maximum, Math.max(0, calendarDay - Number(item.currentDay)));
  }, 0);

  const pending = rows.results.filter(
    (item) =>
      item.submissionStatus !== "completed" ||
      item.completionSource === "extra",
  );
  const completed = rows.results.length - pending.length;
  const firstPending = pending[0] ?? rows.results[0];

  const lines = [
    "Academy 今日监督",
    "",
    lagDays >= 2
      ? `连续中断：已经落后 ${lagDays} 天。下一课不会解锁，先补当前主线。`
      : lagDays === 1
        ? "当前落后 1 天。今天先补主线，别抢跑下一课。"
        : completed === rows.results.length
          ? "今天主线已完成。你可以继续预习，但不会替代明天主线。"
          : "今天先把当前主线做完，再谈后面的课。",
    "",
    `完成进度：${completed}/${rows.results.length}`,
    `提醒状态：${Boolean(user?.reminderEnabled) ? `开启（${user?.reminderHour ?? 20}:00）` : "已暂停"}`,
    "",
    "当前任务：",
    `${firstPending.courseTitle} · Day ${firstPending.currentDay}`,
    `${firstPending.lessonTitle}`,
    `${firstPending.lessonObjective}`,
  ];

  return {
    text: lines.join("\n"),
    buttonText: "打开 Academy",
  };
}

function normalizeBotCommand(text: string) {
  const [command = "", ...rest] = text.trim().split(/\s+/);
  return {
    command: command.toLowerCase(),
    args: rest.map((item) => item.toLowerCase()),
  };
}

async function handleLearningBotCommand(message: NonNullable<TelegramUpdate["message"]>) {
  if (!message.from || !message.text) return null;

  const actor = await ensureTelegramUser(message.from);
  if (!actor) return null;

  const { command, args } = normalizeBotCommand(message.text);
  const openAppPayload = {
    chatId: message.from.id,
    buttonText: "打开 Academy",
    miniAppUrl: miniAppUrl(),
  };

  if (command === "/start" || command.startsWith("/academy")) {
    const action =
      command === "/start"
        ? args[0] ?? ""
        : args[0] ?? command.replace("/academy", "").trim();

    if (!action) {
      await sendTelegramBotMessage({
        ...openAppPayload,
        text:
          "Academy 已在线。\n\n你可以直接回复：\n/academy today\n/academy pause\n/academy resume\n\n如果今天已经落后，我会明确告诉你先补哪一步。",
      });
      return { type: "academy_home" };
    }

    if (action === "today") {
      const summary = await buildBotTodaySummary(actor.id);
      await sendTelegramBotMessage({
        chatId: message.from.id,
        text: summary.text,
        buttonText: summary.buttonText,
        miniAppUrl: miniAppUrl(),
      });
      return { type: "academy_today" };
    }

    if (action === "pause") {
      await setReminderEnabledForTelegramUser(message.from.id, false);
      await sendTelegramBotMessage({
        ...openAppPayload,
        text:
          "已暂停 Telegram 监督提醒。\n\n课程和历史记录都还在。想重新被我催，就回复 /academy resume 。",
      });
      return { type: "academy_pause" };
    }

    if (action === "resume") {
      await setReminderEnabledForTelegramUser(message.from.id, true);
      const summary = await buildBotTodaySummary(actor.id);
      await sendTelegramBotMessage({
        ...openAppPayload,
        text:
          `监督已恢复。\n\n${summary.text}`,
      });
      return { type: "academy_resume" };
    }

    await sendTelegramBotMessage({
      ...openAppPayload,
      text:
        "我能处理这些命令：\n/academy today\n/academy pause\n/academy resume",
    });
    return { type: "academy_help" };
  }

  return null;
}

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
       ORDER BY CAST(ends_at AS TIMESTAMP) DESC LIMIT 1`,
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
              o.pricing_snapshot_id AS pricingSnapshotId,
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
      pricingSnapshotId: string | null;
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

  const snapshot = order.pricingSnapshotId
    ? await d1
        .prepare(
          `SELECT credits_redeemed_points AS creditsRedeemedPoints
           FROM order_pricing_snapshots
           WHERE id = ? AND user_id = ?`,
        )
        .bind(order.pricingSnapshotId, order.userId)
        .first<{ creditsRedeemedPoints: number }>()
    : null;

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
    order.pricingSnapshotId
      ? d1
          .prepare(
            `UPDATE order_pricing_snapshots
             SET status = 'paid'
             WHERE id = ? AND user_id = ?`,
          )
          .bind(order.pricingSnapshotId, order.userId)
      : d1.prepare("SELECT 1"),
  ]);

  const creditsRedeemedPoints = Math.max(
    0,
    Number(snapshot?.creditsRedeemedPoints ?? 0),
  );
  if (order.pricingSnapshotId && creditsRedeemedPoints > 0) {
    await ensureCreditsLedgerEntry({
      userId: order.userId,
      entryType: "redeem",
      rewardType: "campaign_reward",
      amountPoints: -creditsRedeemedPoints,
      status: "posted",
      businessKey: `credits_redeem:${order.userId}:${order.pricingSnapshotId}`,
      relatedOrderId: order.id,
      relatedInvitationId: null,
      relatedCampaignRewardId: null,
      expiresAt: null,
    });
  }

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
  const transaction = await d1
    .prepare(
      `SELECT order_id AS orderId, user_id AS userId
       FROM payment_transactions
       WHERE telegram_payment_charge_id = ?`,
    )
    .bind(payment.telegram_payment_charge_id)
    .first<{ orderId: number; userId: string }>();
  const order = transaction
    ? await d1
        .prepare(
          `SELECT pricing_snapshot_id AS pricingSnapshotId
           FROM payment_orders
           WHERE id = ? AND user_id = ?`,
        )
        .bind(transaction.orderId, transaction.userId)
        .first<{ pricingSnapshotId: string | null }>()
    : null;
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
    order?.pricingSnapshotId
      ? d1
          .prepare(
            `UPDATE order_pricing_snapshots
             SET status = 'refunded'
             WHERE id = ? AND user_id = ?`,
          )
          .bind(order.pricingSnapshotId, transaction?.userId ?? "")
      : d1.prepare("SELECT 1"),
  ]);
  return { type: "refunded_payment" };
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  if (update.pre_checkout_query) {
    return handlePreCheckout(update.pre_checkout_query);
  }

  const message = update.message;
  const learningCommandResult = message
    ? await handleLearningBotCommand(message)
    : null;
  if (learningCommandResult) {
    return learningCommandResult;
  }
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
