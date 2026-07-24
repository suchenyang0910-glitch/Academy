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

export const schemaVersion = sqliteTable("schema_version", {
  key: text("key").notNull(),
  value: text("value").notNull(),
}, (table) => [primaryKey({ columns: [table.key] })]);
