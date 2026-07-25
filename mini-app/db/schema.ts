import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    telegramId: text("telegram_id"),
    displayName: text("display_name").notNull(),
    telegramUsername: text("telegram_username"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    languageCode: text("language_code"),
    uiLocale: text("ui_locale").notNull().default("zh-Hans"),
    photoUrl: text("photo_url"),
    isPremium: integer("is_premium", { mode: "boolean" }).notNull().default(false),
    referralCode: text("referral_code"),
    timezone: text("timezone").notNull().default("Asia/Bangkok"),
    trialStartedAt: text("trial_started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("users_telegram_id_unique").on(table.telegramId),
    uniqueIndex("users_referral_code_unique").on(table.referralCode),
  ],
);

export const courses = sqliteTable(
  "courses",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull(),
    summary: text("summary").notNull(),
    dailyMinutes: integer("daily_minutes").notNull(),
    durationDays: integer("duration_days").notNull().default(60),
    accent: text("accent").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("courses_slug_unique").on(table.slug)],
);

export const enrollments = sqliteTable(
  "enrollments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id),
    currentDay: integer("current_day").notNull().default(1),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    startedOn: text("started_on").notNull().default(sql`CURRENT_DATE`),
    enrolledAt: text("enrolled_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    pausedAt: text("paused_at"),
  },
  (table) => [
    uniqueIndex("enrollments_user_course_unique").on(table.userId, table.courseId),
    index("enrollments_user_active_idx").on(table.userId, table.active),
  ],
);

export const lessons = sqliteTable(
  "lessons",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id),
    day: integer("day").notNull(),
    level: integer("level").notNull(),
    round: integer("round").notNull(),
    title: text("title").notNull(),
    objective: text("objective").notNull(),
    content: text("content").notNull(),
    practicePrompt: text("practice_prompt").notNull(),
    criteriaJson: text("criteria_json").notNull().default("[]"),
    estimatedMinutes: integer("estimated_minutes").notNull().default(18),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("lessons_course_day_unique").on(table.courseId, table.day),
    index("lessons_course_idx").on(table.courseId),
  ],
);

export const courseLocalizations = sqliteTable(
  "course_localizations",
  {
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull(),
    summary: text("summary").notNull(),
    sourceVersion: text("source_version").notNull().default("v1"),
    reviewStatus: text("review_status").notNull().default("draft"),
    reviewedAt: text("reviewed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.courseId, table.locale] }),
    index("course_localizations_locale_status_idx").on(table.locale, table.reviewStatus),
  ],
);

export const lessonLocalizations = sqliteTable(
  "lesson_localizations",
  {
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    objective: text("objective").notNull(),
    content: text("content").notNull(),
    practicePrompt: text("practice_prompt").notNull(),
    criteriaJson: text("criteria_json").notNull().default("[]"),
    sourceVersion: text("source_version").notNull().default("v1"),
    reviewStatus: text("review_status").notNull().default("draft"),
    reviewedAt: text("reviewed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.lessonId, table.locale] }),
    index("lesson_localizations_locale_status_idx").on(table.locale, table.reviewStatus),
  ],
);

export const submissions = sqliteTable(
  "submissions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id),
    originalAnswer: text("original_answer").notNull(),
    revisedAnswer: text("revised_answer"),
    status: text("status").notNull().default("submitted"),
    ruleScore: real("rule_score").notNull().default(0),
    ruleFeedback: text("rule_feedback").notNull().default(""),
    aiFeedback: text("ai_feedback"),
    completionSource: text("completion_source").notNull().default("self"),
    completedOn: text("completed_on"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("submissions_user_lesson_unique").on(table.userId, table.lessonId),
    index("submissions_user_idx").on(table.userId),
  ],
);

export const notes = sqliteTable(
  "notes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    lessonId: text("lesson_id").references(() => lessons.id),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("notes_user_created_idx").on(table.userId, table.createdAt)],
);

export const feedback = sqliteTable(
  "feedback",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    category: text("category").notNull(),
    content: text("content").notNull(),
    pageContext: text("page_context"),
    appVersion: text("app_version"),
    status: text("status").notNull().default("open"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("feedback_status_created_idx").on(table.status, table.createdAt),
    index("feedback_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const reminderTemplates = sqliteTable("reminder_templates", {
  id: text("id").primaryKey(),
  level: integer("level").notNull(),
  content: text("content").notNull(),
  buttonText: text("button_text").notNull(),
  weight: integer("weight").notNull().default(100),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const reminderEvents = sqliteTable(
  "reminder_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    templateId: text("template_id")
      .notNull()
      .references(() => reminderTemplates.id),
    level: integer("level").notNull(),
    sentAt: text("sent_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    clickedAt: text("clicked_at"),
    completedAt: text("completed_at"),
  },
  (table) => [index("reminder_events_user_sent_idx").on(table.userId, table.sentAt)],
);

export const invitations = sqliteTable(
  "invitations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    inviterUserId: text("inviter_user_id")
      .notNull()
      .references(() => users.id),
    invitedUserId: text("invited_user_id")
      .notNull()
      .references(() => users.id),
    inviteCode: text("invite_code").notNull(),
    status: text("status").notNull().default("pending"),
    qualifiedAt: text("qualified_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("invitations_invited_user_unique").on(table.invitedUserId),
    index("invitations_inviter_status_idx").on(
      table.inviterUserId,
      table.status,
    ),
  ],
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    planKey: text("plan_key").notNull(),
    status: text("status").notNull().default("active"),
    source: text("source").notNull(),
    startsAt: text("starts_at").notNull(),
    endsAt: text("ends_at").notNull(),
    externalRef: text("external_ref"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("subscriptions_external_ref_unique").on(table.externalRef),
    index("subscriptions_user_status_end_idx").on(
      table.userId,
      table.status,
      table.endsAt,
    ),
  ],
);

export const paymentOrders = sqliteTable(
  "payment_orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    planKey: text("plan_key").notNull(),
    invoicePayload: text("invoice_payload").notNull(),
    amountStars: integer("amount_stars").notNull(),
    recurring: integer("recurring", { mode: "boolean" }).notNull().default(false),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("payment_orders_payload_unique").on(table.invoicePayload),
    index("payment_orders_user_status_idx").on(table.userId, table.status),
  ],
);

export const paymentTransactions = sqliteTable(
  "payment_transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => paymentOrders.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    telegramPaymentChargeId: text("telegram_payment_charge_id").notNull(),
    providerPaymentChargeId: text("provider_payment_charge_id"),
    currency: text("currency").notNull().default("XTR"),
    amountStars: integer("amount_stars").notNull(),
    subscriptionExpirationDate: integer("subscription_expiration_date"),
    status: text("status").notNull().default("paid"),
    paidAt: text("paid_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    refundedAt: text("refunded_at"),
  },
  (table) => [
    uniqueIndex("payment_transactions_charge_unique").on(
      table.telegramPaymentChargeId,
    ),
    index("payment_transactions_user_paid_idx").on(table.userId, table.paidAt),
  ],
);

export const schemaVersion = sqliteTable("schema_version", {
  key: text("key").notNull(),
  value: text("value").notNull(),
}, (table) => [primaryKey({ columns: [table.key] })]);
