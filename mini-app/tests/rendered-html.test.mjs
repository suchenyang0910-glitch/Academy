import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the Academy product shell without starter content", async () => {
  const [page, layout, i18n] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/i18n.ts", import.meta.url), "utf8"),
    access(new URL("../dist/server/index.js", import.meta.url)),
  ]);

  assert.match(layout, /Academy · 学习监督系统/);
  assert.match(page, /Academy Telegram Mini App/);
  assert.match(page, /copy\.brandSubtitle/);
  assert.match(i18n, /学习监督系统/);
  assert.match(page, /正在整理今天的学习/);
  assert.doesNotMatch(page, /codex-preview|Your site is taking shape/i);
});

test("ships five fixed 60-day curricula and the reminder pool", async () => {
  const [curriculum, reminders, hosting] = await Promise.all([
    readFile(new URL("../lib/curriculum.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/reminders.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);

  assert.match(curriculum, /Array\.from\(\{ length: 60 \}/);
  assert.match(curriculum, /结构化分析与决策辅助/);
  assert.match(curriculum, /认识 AI：它是什么、不是什麽/);
  assert.match(curriculum, /先建立正确预期，再学习操作/);
  assert.match(curriculum, /AI 给出很像答案的文字，不代表它已经查证过/);
  assert.match(curriculum, /type: "multiple_choice"/);
  assert.match(curriculum, /课后检查：读完本课后，完成下方 1 道选择题/);
  assert.match(curriculum, /毕业项目 · 20例测试/);
  assert.match(curriculum, /export const ENGLISH_LESSONS/);
  assert.match(curriculum, /export const BUSINESS_LESSONS/);
  assert.match(curriculum, /export const FOUNDER_NOTE_LESSONS/);
  assert.match(curriculum, /export const QUIZ_LESSONS/);
  assert.match(curriculum, /\.\.\.ENGLISH_LESSONS/);
  assert.match(curriculum, /\.\.\.BUSINESS_LESSONS/);
  assert.match(reminders, /recentTemplateIds\.slice\(0, 5\)/);
  assert.match(reminders, /今天的知识不会自己长进脑子/);
  assert.equal(JSON.parse(hosting).d1, "DB");
});

test("records Telegram profile fields and tracks qualified referrals", async () => {
  const [page, store, schema, migration] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/academy-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../drizzle/0002_neat_doctor_octopus.sql", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(page, /function ProfileView/);
  assert.match(page, /有效邀请 = Telegram 认证/);
  assert.match(store, /start_param/);
  assert.match(store, /startapp=ref_/);
  assert.match(store, /status = 'qualified'/);
  assert.match(
    store,
    /CAST\(s\.completed_on AS DATE\) <= CAST\(\? AS DATE\) \+ INTERVAL '7 days'/,
  );
  assert.match(store, /ORDER BY CAST\(ends_at AS TIMESTAMP\) DESC/);
  assert.match(store, /correctOptionId/);
  assert.match(store, /请选择每一道题的有效答案/);
  assert.match(schema, /export const invitations/);
  assert.match(migration, /CREATE TABLE `invitations`/);
  assert.match(migration, /ADD `telegram_username`/);
});

test("enforces trial access and grants referral subscription rewards", async () => {
  const [page, store, schema, migration, payments] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/academy-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../drizzle/0003_ordinary_captain_flint.sql", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../lib/telegram-payments.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /21 天免费试用/);
  assert.match(payments, /\$19\.9/);
  assert.match(payments, /\$199/);
  assert.match(store, /export async function assertLearningAccess/);
  assert.match(store, /referral_30d/);
  assert.match(store, /21 天试用已结束/);
  assert.match(schema, /export const subscriptions/);
  assert.match(migration, /CREATE TABLE `subscriptions`/);
});

test("connects Telegram Stars invoices, payment callbacks, and refunds", async () => {
  const [page, payments, schema, migration] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/telegram-payments.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../drizzle/0004_round_morbius.sql", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(page, /openInvoice/);
  assert.match(page, /Stars 待定/);
  assert.match(payments, /createInvoiceLink/);
  assert.match(payments, /currency: "XTR"/);
  assert.match(payments, /subscription_period = 2_592_000/);
  assert.match(payments, /answerPreCheckoutQuery/);
  assert.match(payments, /successful_payment/);
  assert.match(payments, /telegram_payment_charge_id/);
  assert.match(payments, /refunded_payment/);
  assert.match(schema, /export const paymentOrders/);
  assert.match(schema, /export const paymentTransactions/);
  assert.match(migration, /CREATE TABLE `payment_orders`/);
  assert.match(migration, /CREATE TABLE `payment_transactions`/);
});

test("uses DeepSeek for AI coaching with Ollama and rules-only fallback", async () => {
  const [page, store, feedback, envExample] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/academy-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/ai-feedback.ts", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
  ]);

  assert.match(page, /AI 教练点评/);
  assert.match(store, /requestAiFeedback/);
  assert.match(store, /getAiRuntimeStatus/);
  assert.match(feedback, /https:\/\/api\.deepseek\.com/);
  assert.match(feedback, /deepseek-v4-flash/);
  assert.match(feedback, /response_format: \{ type: "json_object" \}/);
  assert.match(feedback, /authorization: `Bearer \$\{config\.DEEPSEEK_API_KEY\}`/);
  assert.match(feedback, /return requestOllamaFeedback/);
  assert.match(envExample, /DEEPSEEK_API_KEY=/);
  assert.match(envExample, /DEEPSEEK_TIMEOUT_MS=20000/);
});

test("ships PostgreSQL migration and SQLite preservation tools", async () => {
  const [adapter, schema, migrate, importer, envExample] = await Promise.all([
    readFile(new URL("../db/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../postgres/0000_academy.sql", import.meta.url), "utf8"),
    readFile(new URL("../scripts/migrate-postgres.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/import-sqlite-to-postgres.mjs", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
  ]);

  assert.match(adapter, /import \{ Pool/);
  assert.match(adapter, /ACADEMY_DATABASE_URL/);
  assert.match(adapter, /client\.query\("BEGIN"\)/);
  assert.match(adapter, /alias\.toLowerCase\(\)/);
  assert.match(schema, /CREATE TABLE payment_transactions/);
  assert.match(schema, /CREATE TABLE submissions/);
  assert.match(migrate, /__academy_migrations/);
  assert.match(importer, /DatabaseSync/);
  assert.match(importer, /ACADEMY_SQLITE_SOURCE_PATH/);
  assert.match(envExample, /ACADEMY_PG_POOL_SIZE=5/);
});

test("keeps the local logo reliable and AI research material reviewable", async () => {
  const [page, styles, crawler, seeds] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../scripts/crawl-ai-sources.mjs", import.meta.url), "utf8"),
    readFile(new URL("../content/ai-source-seeds.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /academy-bot-logo\.png/);
  assert.match(page, /unoptimized/);
  assert.match(page, /lesson-submit-bar/);
  assert.match(styles, /\.lesson-submit-bar/);
  assert.match(styles, /safe-area-inset-bottom/);
  assert.match(crawler, /pending_human_review/);
  assert.match(crawler, /不得自动发布为正式课程/);
  assert.match(crawler, /allowedHosts/);
  assert.equal(JSON.parse(seeds).length, 3);
});

test("ships a persisted four-language interface foundation", async () => {
  const [page, store, schema, postgresMigration, localeModule] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/academy-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../postgres/0001_localized_spectrum.sql", import.meta.url), "utf8"),
    readFile(new URL("../lib/i18n.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /api\/academy\/preferences/);
  assert.match(page, /interfaceLanguage/);
  assert.match(store, /updateUserLocale/);
  assert.match(store, /ui_locale AS uiLocale/);
  assert.match(schema, /uiLocale: text\("ui_locale"\)/);
  assert.match(postgresMigration, /ADD COLUMN IF NOT EXISTS ui_locale/);
  assert.match(localeModule, /"zh-Hans", "vi", "km", "th"/);
  assert.match(localeModule, /Tiếng Việt/);
  assert.match(localeModule, /ខ្មែរ/);
  assert.match(localeModule, /ไทย/);
});
