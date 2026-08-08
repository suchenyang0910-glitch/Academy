import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("builds the Academy product shell without starter content", async () => {
  const [page, layout, i18n, css, runtimeCopy] = await Promise.all([
    read("../app/page.tsx"),
    read("../app/layout.tsx"),
    read("../lib/i18n.ts"),
    read("../app/globals.css"),
    read("../lib/runtime-copy.ts"),
    access(new URL("../dist/server/index.js", import.meta.url)),
  ]);

  assert.match(layout, /Academy/);
  assert.match(page, /Academy Telegram Mini App/);
  assert.match(page, /copy\.brandSubtitle/);
  assert.match(page, /copy\.ui\.loadingTitle/);
  assert.match(i18n, /brandSubtitle/);
  assert.match(i18n, /loadingTitle/);
  assert.match(css, /-webkit-text-size-adjust: 100%/);
  assert.match(css, /input,\s*textarea,\s*select\s*\{\s*font-size: 16px;/);
  assert.match(css, /\.lesson-page:focus-within \.lesson-page-content/);
  assert.match(runtimeCopy, /export function todayRuntimeCopy/);
  assert.match(runtimeCopy, /export function courseRuntimeCopy/);
  assert.match(runtimeCopy, /export function learningModeRuntimeCopy/);
  assert.match(runtimeCopy, /export function courseDomainRuntimeCopy/);
  assert.match(runtimeCopy, /export function notesRuntimeCopy/);
  assert.match(runtimeCopy, /export function progressRuntimeCopy/);
  assert.match(runtimeCopy, /export function lessonRuntimeCopy/);
  assert.match(runtimeCopy, /export function assessmentRuntimeCopy/);
  assert.match(runtimeCopy, /export function reviewRuntimeCopy/);
  assert.match(runtimeCopy, /export function profileRuntimeCopy/);
  assert.doesNotMatch(page, /codex-preview|Your site is taking shape/i);
});

test("ships fixed curricula with choice-based checks and the reminder pool", async () => {
  const [curriculum, reminders, hosting] = await Promise.all([
    read("../lib/curriculum.ts"),
    read("../lib/reminders.ts"),
    read("../.openai/hosting.json"),
  ]);

  assert.match(curriculum, /Array\.from\(\{ length: 60 \}/);
  assert.match(curriculum, /export const AI_LESSONS/);
  assert.match(curriculum, /export const ENGLISH_LESSONS/);
  assert.match(curriculum, /export const BUSINESS_LESSONS/);
  assert.match(curriculum, /export const FOUNDER_NOTE_LESSONS/);
  assert.match(curriculum, /export const QUIZ_LESSONS/);
  assert.match(curriculum, /type: "multiple_choice"/);
  assert.match(curriculum, /questions: \[/);
  assert.match(curriculum, /知识：模型不会自动知道你的公司文档/);
  assert.match(curriculum, /最小实操：选一份你自己的文档/);
  assert.match(curriculum, /可复核的数据结论至少包括四件事/);
  assert.match(curriculum, /AI 可以做初稿作者、改写助手和翻译助手/);
  assert.match(curriculum, /function buildSpiralKnowledgeCheck/);
  assert.match(curriculum, /function buildLessonEvidenceCheck/);
  assert.match(curriculum, /function ensureStructuredLessonFlow/);
  assert.match(curriculum, /\.map\(ensureStructuredLessonFlow\)/);
  assert.match(curriculum, /assessment: buildSpiralKnowledgeCheck\(definition\)/);
  assert.match(curriculum, /Evidence：提交前先完成选择题检查/);
  assert.match(curriculum, /核心原则：\$\{core\}/);
  assert.match(curriculum, /能力目标：\$\{objective\}/);
  assert.match(reminders, /recentTemplateIds\.slice\(0, 5\)/);
  assert.equal(JSON.parse(hosting).d1, "DB");
});

test("records Telegram profile fields and tracks qualified referrals", async () => {
  const [page, store, schema, migration, i18n] = await Promise.all([
    read("../app/page.tsx"),
    read("../lib/academy-store.ts"),
    read("../db/schema.ts"),
    read("../drizzle/0002_neat_doctor_octopus.sql"),
    read("../lib/i18n.ts"),
  ]);

  assert.match(page, /function ProfileView/);
  assert.match(page, /copy\.referralQualifiedDefinition/);
  assert.match(page, /copy\.referralValidBehavior/);
  assert.match(page, /CREDITS LEDGER/);
  assert.match(page, /creditsLedgerTypeCopy/);
  assert.match(store, /const creditsLedger = await listCreditsLedger/);
  assert.match(store, /ledger: creditsLedger\.items/);
  assert.match(store, /start_param/);
  assert.match(store, /startapp=ref_/);
  assert.match(store, /status = 'qualified'/);
  assert.match(store, /ORDER BY CAST\(ends_at AS TIMESTAMP\) DESC/);
  assert.match(store, /correctOptionId/);
  assert.match(i18n, /creditsLedgerTitle/);
  assert.match(schema, /export const invitations/);
  assert.match(migration, /CREATE TABLE `invitations`/);
  assert.match(migration, /ADD `telegram_username`/);
});

test("rejects unsigned identities in production", async () => {
  const store = await read("../lib/academy-store.ts");

  assert.match(store, /authDate - nowSeconds > 300/);
  assert.match(store, /secureEqualHex/);
  assert.match(store, /ACADEMY_ALLOW_FOUNDER_PREVIEW !== "true"/);
  assert.match(store, /Telegram authentication is not configured/);
});

test("enforces trial access and referral subscription rewards", async () => {
  const [page, store, schema, migration, payments, i18n] = await Promise.all([
    read("../app/page.tsx"),
    read("../lib/academy-store.ts"),
    read("../db/schema.ts"),
    read("../drizzle/0003_ordinary_captain_flint.sql"),
    read("../lib/telegram-payments.ts"),
    read("../lib/i18n.ts"),
  ]);

  assert.match(page, /copy\.accessTrial/);
  assert.match(payments, /\$9\.9/);
  assert.match(payments, /\$199/);
  assert.match(store, /export async function assertLearningAccess/);
  assert.match(store, /function buildAccessContinuation/);
  assert.match(store, /primaryUsdPrice/);
  assert.match(store, /qualifiedInvitesNeeded/);
  assert.match(store, /canReduceNextPaymentWithCredits/);
  assert.match(store, /referral_reward/);
  assert.match(page, /data\.access\.continuation/);
  assert.match(page, /continuation-card/);
  assert.match(page, /primaryUsdPrice/);
  assert.match(page, /qualifiedInvitesNeeded/);
  assert.match(page, /creditsAvailablePoints/);
  assert.match(i18n, /accessTrial/);
  assert.match(schema, /export const subscriptions/);
  assert.match(migration, /CREATE TABLE `subscriptions`/);
});

test("connects Telegram Stars invoices, payment callbacks, and refunds", async () => {
  const [page, runtimeCopy, payments, schema, migration, conversionRoute] =
    await Promise.all([
      read("../app/page.tsx"),
      read("../lib/runtime-copy.ts"),
      read("../lib/telegram-payments.ts"),
      read("../db/schema.ts"),
      read("../drizzle/0004_round_morbius.sql"),
      read("../app/api/academy/conversion-events/route.ts"),
    ]);

  assert.match(page, /openInvoice/);
  assert.match(page, /starsStatusCopy/);
  assert.match(runtimeCopy, /export function profileRuntimeCopy/);
  assert.match(runtimeCopy, /export function starsStatusCopy/);
  assert.match(page, /paymentStatusContent/);
  assert.match(page, /payment-state-card/);
  assert.match(page, /paymentRefundPolicy/);
  assert.match(page, /paymentOpenInTelegramRequired/);
  assert.match(page, /paymentInvoiceFailed/);
  assert.match(page, /trial_expired_exposed/);
  assert.match(page, /plans_opened/);
  assert.match(page, /price_clicked/);
  assert.match(page, /api\/academy\/conversion-events/);
  assert.match(page, /configuredBy/);
  assert.match(page, /missing_webhook_secret/);
  assert.match(payments, /createInvoiceLink/);
  assert.match(payments, /currency: "XTR"/);
  assert.match(payments, /ACADEMY_STARS_MONTH/);
  assert.match(payments, /ACADEMY_STARS_30D/);
  assert.match(payments, /configuredBy/);
  assert.match(payments, /disabledReason/);
  assert.match(payments, /subscription_period = 2_592_000/);
  assert.match(payments, /answerPreCheckoutQuery/);
  assert.match(payments, /successful_payment/);
  assert.match(payments, /telegram_payment_charge_id/);
  assert.match(payments, /refunded_payment/);
  assert.match(payments, /status = 'refunded'/);
  assert.match(schema, /export const paymentOrders/);
  assert.match(schema, /export const paymentTransactions/);
  assert.match(schema, /export const conversionEvents/);
  assert.match(migration, /CREATE TABLE `payment_orders`/);
  assert.match(migration, /CREATE TABLE `payment_transactions`/);
  assert.match(conversionRoute, /recordConversionEvent/);
  assert.match(conversionRoute, /eventType is required/);
  assert.match(page, /paid.*pending.*failed.*cancelled/s);
});

test("settles pricing snapshots with credits cap and no-stacking rules", async () => {
  const [pricing, credits, dbErrors, lockRoute, requirements] =
    await Promise.all([
      read("../lib/pricing.ts"),
      read("../lib/credits-ledger.ts"),
      read("../lib/db-errors.ts"),
      read("../app/api/academy/pricing/lock/route.ts"),
      read("../../REQUIREMENTS.md"),
    ]);

  assert.match(pricing, /const amountAfterMainDiscount = Math\.max\(0, originalAmountMinor - mainDiscountAmountMinor\)/);
  assert.match(pricing, /const maxCreditsRedeemableAmountMinor = floorDiv\(amountAfterMainDiscount, 2\)/);
  assert.match(pricing, /const redeemCredits\s*=\s*[\s\S]*\(mainOffer\.type === "none" \|\| stackableWithCredits\)/);
  assert.match(pricing, /Math\.min\(balance\.availablePoints, maxCreditsRedeemablePoints\)/);
  assert.match(pricing, /finalPayableAmountMinor[\s\S]*originalAmountMinor - mainDiscountAmountMinor - cappedCreditsRedeemedAmountMinor/);
  assert.match(pricing, /pricing_rule_version[\s\S]*'preview'/);
  assert.match(pricing, /isMissingDatabaseRelationError\(error, \["campaign_rewards"\]\)/);
  assert.match(credits, /export const POINTS_PER_USD = 100/);
  assert.match(credits, /isMissingDatabaseRelationError\(error, \["credits_ledger"\]\)/);
  assert.match(dbErrors, /candidate\.code !== "42P01"/);
  assert.match(lockRoute, /status !== "preview"/);
  assert.match(requirements, /9\.9|19\.9|199/);
});

test("qualifies referrals and grants laddered credits rewards idempotently", async () => {
  const [store, ledger, i18n, requirements] = await Promise.all([
    read("../lib/academy-store.ts"),
    read("../lib/credits-ledger.ts"),
    read("../lib/i18n.ts"),
    read("../../REQUIREMENTS.md"),
  ]);

  assert.match(store, /status = 'qualified' AND qualified_at IS NOT NULL/);
  assert.match(store, /sequence === 1 \? 10 : sequence === 2 \? 15 : sequence === 3 \? 20 : 10/);
  assert.match(store, /rewardType: "referral_reward"/);
  assert.match(store, /entryType: "earn"/);
  assert.match(store, /businessKey: `referral_reward:\$\{userId\}:\$\{invitation\.id\}`/);
  assert.match(store, /paid\.paidAt.*invitation\.createdAt/);
  assert.match(store, /Number\(validDays\?\.count.*\) >= 3/);
  assert.match(store, /nextRewardRemaining: \(3 - \(qualified % 3\)\) % 3/);
  assert.match(ledger, /ON CONFLICT\(business_key\) DO NOTHING/);
  assert.match(i18n, /referralRule/);
  assert.match(requirements, /10%.*15%.*20%/s);
});

test("uses DeepSeek for AI coaching with Ollama and rules-only fallback", async () => {
  const [page, store, feedback, envExample] = await Promise.all([
    read("../app/page.tsx"),
    read("../lib/academy-store.ts"),
    read("../lib/ai-feedback.ts"),
    read("../.env.example"),
  ]);

  assert.match(page, /aiCoach/);
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
  const [
    store,
    db,
    pgMigration,
    quizVersionMigration,
    importScript,
    checkPostgres,
    checkSchema,
    acceptanceStaticCheck,
    acceptanceRunCreator,
    packageJson,
    deploymentRunbook,
    acceptanceChecklist,
    templateGuide,
    templateCheck,
  ] = await Promise.all([
    read("../lib/academy-store.ts"),
    read("../db/index.ts"),
    read("../postgres/0000_academy.sql"),
    read("../postgres/0024_quiz_attempt_content_version.sql"),
    read("../scripts/import-sqlite-to-postgres.mjs"),
    read("../scripts/check-postgres.mjs"),
    read("../scripts/check-schema-coverage.mjs"),
    read("../scripts/check-acceptance-static.mjs"),
    read("../scripts/create-acceptance-run.mjs"),
    read("../package.json"),
    read("../../docs/DEPLOYMENT_RUNBOOK.md"),
    read("../../docs/TELEGRAM_MINI_APP_ACCEPTANCE_CHECKLIST.md"),
    read("../../TEMPLATE_DESIGN_GUIDE.md"),
    read("../scripts/check-template-design-guide.mjs"),
  ]);

  assert.match(store, /INSERT INTO users/);
  assert.match(db, /ACADEMY_DATABASE_URL/);
  assert.match(pgMigration, /CREATE TABLE users/);
  assert.match(pgMigration, /CREATE TABLE lessons/);
  assert.match(quizVersionMigration, /content_version_id/);
  assert.match(quizVersionMigration, /quiz_attempts_content_version_idx/);
  assert.match(importScript, /ACADEMY_SQLITE_SOURCE_PATH/);
  assert.match(importScript, /INSERT INTO \$\{quoteIdentifier\(table\)\}/);
  assert.match(checkPostgres, /restart_safe=no/);
  assert.match(checkPostgres, /restart_safe=yes/);
  assert.match(checkPostgres, /seed_user_notes/);
  assert.match(checkPostgres, /quiz_attempts_content_version_idx/);
  assert.match(db, /seed_user_notes/);
  assert.match(checkPostgres, /repair_hint=run `npm run db:migrate:postgres`/);
  assert.match(checkPostgres, /Checksum mismatch/);
  assert.match(checkSchema, /align_schema_and_migrations_before_deploy/);
  assert.match(checkSchema, /PostgreSQL migration tables missing from db\/schema\.ts/);
  assert.match(packageJson, /deploy:preflight/);
  assert.match(packageJson, /acceptance:check/);
  assert.match(packageJson, /acceptance:new/);
  assert.match(packageJson, /acceptance:validate/);
  assert.match(packageJson, /reminders:check/);
  assert.match(packageJson, /seed:new/);
  assert.match(packageJson, /seed:validate/);
  assert.match(packageJson, /templates:check/);
  assert.match(packageJson, /deploy:preflight[\s\S]*templates:check/);
  assert.match(packageJson, /access:check/);
  assert.match(packageJson, /deploy:preflight[\s\S]*access:check/);
  assert.match(packageJson, /content:quality:check/);
  assert.match(packageJson, /deploy:preflight[\s\S]*content:quality:check/);
  assert.match(packageJson, /deploy:preflight[\s\S]*acceptance:check/);
  assert.match(packageJson, /deploy:check/);
  assert.match(packageJson, /db:check:schema/);
  assert.match(packageJson, /deploy:check[\s\S]*acceptance:check/);
  assert.match(packageJson, /db:check:postgres/);
  assert.match(packageJson, /db:migrate:postgres/);
  assert.match(packageJson, /db:import:sqlite/);
  assert.match(acceptanceStaticCheck, /OK static P0 acceptance surface/);
  assert.match(acceptanceStaticCheck, /manual_required=yes/);
  assert.match(acceptanceStaticCheck, /openInvoice/);
  assert.match(acceptanceStaticCheck, /successful_payment/);
  assert.match(acceptanceStaticCheck, /refunded_payment/);
  assert.match(acceptanceStaticCheck, /deliverDueReminders/);
  assert.match(acceptanceStaticCheck, /validDays/);
  assert.match(acceptanceStaticCheck, /lesson-submit-bar/);
  assert.match(acceptanceStaticCheck, /safe-area-inset-bottom/);
  assert.match(acceptanceStaticCheck, /forbidPattern/);
  assert.match(acceptanceStaticCheck, /visible UI copy must live/);
  assert.match(acceptanceRunCreator, /docs", "acceptance-runs"/);
  assert.match(acceptanceRunCreator, /P0 发布判定/);
  assert.match(acceptanceRunCreator, /manual_required|真机验收记录/);
  assert.match(acceptanceRunCreator, /acceptance_result: TODO/);
  assert.match(acceptanceRunCreator, /acceptance:validate/);
  assert.match(acceptanceRunCreator, /--operator/);
  assert.match(acceptanceRunCreator, /--device/);
  assert.match(deploymentRunbook, /npm run deploy:preflight/);
  assert.match(deploymentRunbook, /npm run templates:check/);
  assert.match(deploymentRunbook, /npm run access:check/);
  assert.match(deploymentRunbook, /npm run acceptance:new/);
  assert.match(deploymentRunbook, /npm run reminders:check/);
  assert.match(deploymentRunbook, /非破坏性预检/);
  assert.match(deploymentRunbook, /只有 `deploy:preflight` 通过后/);
  assert.match(deploymentRunbook, /TELEGRAM_MINI_APP_ACCEPTANCE_CHECKLIST/);
  assert.match(acceptanceChecklist, /P0 发布判定/);
  assert.match(acceptanceChecklist, /npm run acceptance:new/);
  assert.match(acceptanceChecklist, /npm run acceptance:validate/);
  assert.match(acceptanceChecklist, /docs\/acceptance-runs\//);
  assert.match(acceptanceChecklist, /Telegram Stars 支付状态/);
  assert.match(acceptanceChecklist, /邀请与裂变/);
  assert.match(acceptanceChecklist, /移动端输入体验/);
  assert.match(templateGuide, /Template Card/);
  assert.match(templateGuide, /Definition of Done/);
  assert.match(templateGuide, /Evidence Model/);
  assert.match(templateGuide, /Progress Mapping/);
  assert.match(templateGuide, /Recovery Loop/);
  assert.match(templateGuide, /personal-knowledge-assistant-21d/);
  assert.match(templateCheck, /TEMPLATE_DESIGN_GUIDE\.md/);
  assert.match(templateCheck, /PRIMARY_GOAL_TEMPLATE_ID/);
});

test("ships release and seed validation operating checklists", async () => {
  const [deploymentRunbook, acceptanceChecklist, seedValidationSprint, opsDashboard] =
    await Promise.all([
      read("../../docs/DEPLOYMENT_RUNBOOK.md"),
      read("../../docs/TELEGRAM_MINI_APP_ACCEPTANCE_CHECKLIST.md"),
      read("../../docs/SEED_VALIDATION_SPRINT.md"),
      read("../app/api/academy/admin/ops-dashboard/route.ts"),
    ]);

  assert.match(deploymentRunbook, /TELEGRAM_MINI_APP_ACCEPTANCE_CHECKLIST/);
  assert.match(acceptanceChecklist, /P0 发布判定/);
  assert.match(acceptanceChecklist, /npm run acceptance:new/);
  assert.match(acceptanceChecklist, /npm run acceptance:validate/);
  assert.match(acceptanceChecklist, /docs\/acceptance-runs\//);
  assert.match(acceptanceChecklist, /Telegram Stars 支付状态/);
  assert.match(acceptanceChecklist, /邀请与裂变/);
  assert.match(acceptanceChecklist, /移动端输入体验/);
  assert.match(seedValidationSprint, /10 人种子验证 Sprint/);
  assert.match(seedValidationSprint, /FWPR-7/);
  assert.match(seedValidationSprint, /\$9\.9/);
  assert.match(seedValidationSprint, /npm run seed:new/);
  assert.match(seedValidationSprint, /npm run seed:validate/);
  assert.match(seedValidationSprint, /Day 0/);
  assert.match(seedValidationSprint, /Day 7/);
  assert.match(seedValidationSprint, /Day 21/);
  assert.match(seedValidationSprint, /不付费原因/);
  assert.match(seedValidationSprint, /自主\/提醒\/强监督/);
  assert.match(seedValidationSprint, /POST \/api\/academy\/admin\/ops-dashboard/);
  assert.match(seedValidationSprint, /strong_supervision/);
  assert.match(seedValidationSprint, /failureReason/);
  assert.match(opsDashboard, /createSeedUserNote/);
  assert.match(opsDashboard, /Seed User Follow-up Notes/);
  assert.match(opsDashboard, /strong_supervision/);
  assert.match(opsDashboard, /Reminder Delivery Health/);
  assert.match(opsDashboard, /academy-reminders\.timer/);
  assert.match(opsDashboard, /reminderEventRows/);
});

test("ships a persisted four-language interface foundation", async () => {
  const [
    page,
    runtimeCopy,
    i18n,
    schema,
    store,
    validationDashboard,
    competencyProofRoute,
    publicProofPage,
    courseReviewCenter,
    postgresProofShareMigration,
  ] = await Promise.all([
    read("../app/page.tsx"),
    read("../lib/runtime-copy.ts"),
    read("../lib/i18n.ts"),
    read("../db/schema.ts"),
    read("../lib/academy-store.ts"),
    read("../app/api/academy/admin/bot/validation-dashboard/route.ts"),
    read("../app/api/academy/competency-proof/route.ts"),
    read("../app/proof/[token]/page.tsx"),
    read("../app/api/academy/admin/course-review/route.ts"),
    read("../postgres/0023_competency_proof_shares.sql"),
  ]);

  assert.match(i18n, /SUPPORTED_LOCALES/);
  assert.match(i18n, /zh-Hans/);
  assert.match(i18n, /vi/);
  assert.match(i18n, /km/);
  assert.match(i18n, /th/);
  assert.match(page, /const \[locale, setLocale\] = useState<AppLocale>/);
  assert.match(page, /resolveAppLocale/);
  assert.match(page, /todayRuntimeCopy/);
  assert.match(page, /courseRuntimeCopy/);
  assert.match(page, /learningModeRuntimeCopy/);
  assert.match(page, /courseDomainRuntimeCopy/);
  assert.match(page, /goalRuntimeCopy/);
  assert.match(page, /requestRuntimeCopy/);
  assert.match(page, /notesRuntimeCopy/);
  assert.match(page, /progressRuntimeCopy/);
  assert.match(page, /lessonRuntimeCopy/);
  assert.match(page, /lesson-flow/);
  assert.match(page, /evidence-rule-card/);
  assert.match(page, /assessmentRuntimeCopy/);
  assert.match(page, /reviewRuntimeCopy/);
  assert.match(page, /function hasAcceptedLessonEvidence/);
  assert.match(page, /function hasAcceptedMainlineEvidence/);
  assert.match(page, /evidenceStatus === "accepted"/);
  assert.match(store, /evidenceStatusByLesson/);
  assert.match(store, /source_type = 'lesson_submission'/);
  assert.match(store, /ev.status = 'accepted'/);
  assert.match(store, /COURSE_COMPETENCY_MAPPINGS/);
  assert.match(store, /GOAL_PROGRESS_MAPPINGS/);
  assert.match(store, /lessonEvidence/);
  assert.match(store, /milestoneProgress/);
  assert.match(store, /upsertQuizQualityEventForLesson/);
  assert.match(store, /quiz_low_first_pass/);
  assert.match(store, /getCurrentPublishedCourseVersionId/);
  assert.match(store, /content_version_id AS contentVersionId/);
  assert.match(store, /contentVersionId \?\? "unversioned"/);
  assert.match(store, /firstPassRate >= 60/);
  assert.match(store, /source_ref = \?/);
  assert.match(store, /rewriteTarget/);
  assert.match(store, /evaluateStructuredAgentRuntimeCheck/);
  assert.match(store, /validateFlowiseWorkflowExport/);
  assert.match(store, /validatePublicRuntimeUrl/);
  assert.match(store, /runtime_url_private_ip/);
  assert.match(store, /runtime_url_private_host/);
  assert.match(store, /flowisePredictionEndpoint/);
  assert.match(store, /executeRemoteRuntimeCheck/);
  assert.match(store, /flowise_prediction_v1/);
  assert.match(store, /flowise_nodes_min_2/);
  assert.match(store, /flowise_useful_node_required/);
  assert.match(store, /structured_runtime/);
  assert.match(store, /structured_runtime_v2/);
  assert.match(store, /workflow_export_required/);
  assert.match(store, /flowiseWorkflow/);
  assert.match(store, /remote_runtime_probe_v1/);
  assert.match(store, /remote_runtime_execution_failed/);
  assert.match(store, /remoteExecutionSuccessfulCaseCount/);
  assert.match(store, /redirect: "manual"/);
  assert.match(store, /runtime_signal_missing/);
  assert.match(store, /referenceProbeSignals/);
  assert.match(store, /reminderHealth/);
  assert.match(store, /recentReminderEvents/);
  assert.match(store, /has_failures/);
  assert.match(page, /supervisionRuntimeCopy\(data\.supervision, locale\)/);
  assert.doesNotMatch(page, /function supervisionCopy/);
  assert.match(page, /creditsLedgerTypeCopy\(locale, entry\.rewardType\)/);
  assert.match(page, /creditsLedgerStatusCopy\(locale, entry\.status\)/);
  assert.doesNotMatch(page, /function formatCreditsLedgerType/);
  assert.match(page, /recordStructuredRuntimeCheck/);
  assert.match(page, /copy\.workflowExportPlaceholder/);
  assert.match(page, /copy\.runtimeEvidenceTitle/);
  assert.match(page, /copy\.submitMilestone/);
  assert.match(runtimeCopy, /Agent\/RAG\/LLM/);
  assert.match(store, /runtimeAuditItems/);
  assert.match(validationDashboard, /Structured Runtime Audit/);
  assert.match(validationDashboard, /runtimeAuditRows/);
  assert.match(validationDashboard, /<th>Flowise<\/th>/);
  assert.match(validationDashboard, /<th>Remote Exec<\/th>/);
  assert.match(validationDashboard, /remoteExecutionSuccessfulCaseCount/);
  assert.match(courseReviewCenter, /首交样本达到 3 次且通过率低于 60%/);
  assert.match(courseReviewCenter, /创建或复用该质量事件对应的 draft 课程版本/);
  assert.match(store, /createCompetencyProofShare/);
  assert.match(store, /getPublicCompetencyProofShare/);
  assert.match(page, /createProofShare/);
  assert.match(page, /progressCopy\.createProofShare/);
  assert.match(page, /progressCopy\.publicProofPage/);
  assert.doesNotMatch(page, /能力证明分享页已生成/);
  assert.match(page, /goalRuntimeCopy\(locale\)\.milestoneSaved/);
  assert.match(page, /todayCopy\.progressLabel/);
  assert.match(page, /todayCopy\.checkpointFirstTitle/);
  assert.match(page, /todayCopy\.reviewQueueTitle/);
  assert.match(page, /todayCopy\.chooseCoursesTitle/);
  assert.match(page, /todayCopy\.chooseCoursesSubtitle/);
  assert.match(page, /todayCopy\.lessonPreparing/);
  assert.match(page, /todayCopy\.evidenceQuote/);
  assert.match(page, /profileCopy\.continuationRulesLabel/);
  assert.match(page, /profileCopy\.monthlyPrice/);
  assert.match(page, /profileCopy\.starsAmount/);
  assert.match(page, /profileCopy\.pricingGridLabel/);
  assert.match(page, /profileCopy\.creditsToggleLabel/);
  assert.match(page, /profileCopy\.telegramUsernameMissing/);
  assert.match(page, /profileCopy\.telegramProfileLabel/);
  assert.match(page, /progressCopy\.baselineVsCheckpointTitle/);
  assert.match(page, /AcademyRequestError/);
  assert.match(page, /initialClientLocale/);
  assert.match(page, /courseCopy\.extensionPaths/);
  assert.match(page, /learning-mode-panel/);
  assert.match(page, /course-domain-tags/);
  assert.doesNotMatch(page, /先处理阶段测试/);
  assert.doesNotMatch(page, /待复习内容/);
  assert.doesNotMatch(page, /选择 1–3 门课程/);
  assert.doesNotMatch(page, /课程内容正在准备，先别假装完成/);
  assert.doesNotMatch(page, /未设置 Telegram 用户名/);
  assert.doesNotMatch(page, /[\u4e00-\u9fff\u0e00-\u0e7f\u1780-\u17ff]/);
  assert.match(competencyProofRoute, /createCompetencyProofShare/);
  assert.match(publicProofPage, /ACADEMY COMPETENCY PROOF/);
  assert.match(publicProofPage, /Nothing counts unless it is evidenced/);
  assert.match(schema, /export const competencyProofShares/);
  assert.match(postgresProofShareMigration, /competency_proof_shares/);
  assert.doesNotMatch(page, /function todayRuntimeCopy/);
  assert.doesNotMatch(page, /function courseRuntimeCopy/);
  assert.doesNotMatch(page, /function goalRuntimeCopy/);
  assert.doesNotMatch(page, /function notesRuntimeCopy/);
  assert.doesNotMatch(page, /function progressRuntimeCopy/);
  assert.doesNotMatch(page, /function lessonRuntimeCopy/);
  assert.doesNotMatch(page, /function assessmentRuntimeCopy/);
  assert.doesNotMatch(page, /function reviewRuntimeCopy/);
  assert.match(runtimeCopy, /export function todayRuntimeCopy/);
  assert.match(runtimeCopy, /export function courseRuntimeCopy/);
  assert.match(runtimeCopy, /export function requestRuntimeCopy/);
  assert.match(runtimeCopy, /export function goalRuntimeCopy/);
  assert.match(runtimeCopy, /export function notesRuntimeCopy/);
  assert.match(runtimeCopy, /export function progressRuntimeCopy/);
  assert.match(runtimeCopy, /createProofShare/);
  assert.match(runtimeCopy, /publicProofPage/);
  assert.match(runtimeCopy, /export function lessonRuntimeCopy/);
  assert.match(runtimeCopy, /export function assessmentRuntimeCopy/);
  assert.match(runtimeCopy, /export function reviewRuntimeCopy/);
  assert.match(runtimeCopy, /export function supervisionRuntimeCopy/);
  assert.match(runtimeCopy, /export function creditsLedgerTypeCopy/);
  assert.match(runtimeCopy, /export function creditsLedgerStatusCopy/);
  assert.match(runtimeCopy, /export function profileRuntimeCopy/);
  assert.match(runtimeCopy, /progressLabel/);
  assert.match(runtimeCopy, /checkpointFirstTitle/);
  assert.match(runtimeCopy, /reviewQueueTitle/);
  assert.match(runtimeCopy, /chooseCoursesTitle/);
  assert.match(runtimeCopy, /chooseCoursesSubtitle/);
  assert.match(runtimeCopy, /lessonPreparing/);
  assert.match(runtimeCopy, /evidenceQuote/);
  assert.match(runtimeCopy, /telegramUsernameMissing/);
  assert.match(runtimeCopy, /telegramProfileLabel/);
  assert.match(runtimeCopy, /baselineVsCheckpointTitle/);
  assert.match(runtimeCopy, /milestoneSaved/);
  assert.match(runtimeCopy, /telegramAuthRequired/);
  assert.match(runtimeCopy, /requestFailed/);
  assert.match(runtimeCopy, /loadFailed/);
  assert.match(runtimeCopy, /extensionPaths/);
  assert.match(runtimeCopy, /continuationRulesLabel/);
  assert.match(runtimeCopy, /monthlyPrice/);
  assert.match(runtimeCopy, /starsAmount/);
  assert.match(runtimeCopy, /pricingGridLabel/);
  assert.match(runtimeCopy, /creditsToggleLabel/);
  assert.match(runtimeCopy, /continueExtraTitle/);
  assert.match(runtimeCopy, /effectiveLearningDays/);
  assert.match(runtimeCopy, /missionAssessmentTitle/);
  assert.match(runtimeCopy, /lessonCheckTitle/);
  assert.match(runtimeCopy, /flowLearn/);
  assert.match(runtimeCopy, /flowExample/);
  assert.match(runtimeCopy, /flowCheck/);
  assert.match(runtimeCopy, /flowEvidence/);
  assert.match(runtimeCopy, /evidenceStepTitle/);
  assert.match(runtimeCopy, /submitAssessment/);
  assert.match(runtimeCopy, /recoveryMission/);
  assert.match(schema, /uiLocale/);
  assert.match(schema, /contentVersionId/);
  assert.match(store, /updateUserLocale/);
  assert.match(store, /ui_locale AS uiLocale/);
  assert.match(store, /function buildGoalTemplate/);
  assert.match(store, /personal-knowledge-assistant-21d/);
  assert.match(store, /Build a Personal Knowledge Assistant/);
});
