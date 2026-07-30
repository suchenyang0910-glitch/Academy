import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import pg from "pg";

const REQUIRED_TABLES = [
  "__academy_migrations",
  "users",
  "courses",
  "enrollments",
  "lessons",
  "submissions",
  "quiz_attempts",
  "notes",
  "reminder_templates",
  "reminder_events",
  "invitations",
  "subscriptions",
  "payment_orders",
  "payment_transactions",
  "course_localizations",
  "lesson_localizations",
  "course_content_versions",
  "course_quality_events",
  "feedback",
  "seed_user_notes",
  "campaign_rewards",
  "order_pricing_snapshots",
  "credits_ledger",
  "ability_assessments",
  "review_queue_items",
  "evidence_items",
  "goal_templates",
  "goal_template_checkpoints",
  "project_milestones",
  "conversion_events",
  "uploaded_artifacts",
  "competency_nodes",
  "competency_proof_shares",
  "agent_lab_projects",
  "agent_runtime_checks",
  "knowledge_sources",
];

const REQUIRED_INDEXES = [
  "enrollments_user_active_idx",
  "lessons_course_idx",
  "submissions_user_idx",
  "quiz_attempts_user_lesson_attempt_unique",
  "quiz_attempts_user_created_idx",
  "quiz_attempts_course_lesson_idx",
  "quiz_attempts_content_version_idx",
  "notes_user_created_idx",
  "reminder_events_user_sent_idx",
  "invitations_inviter_status_idx",
  "subscriptions_user_status_end_idx",
  "payment_orders_user_status_idx",
  "payment_transactions_user_paid_idx",
  "course_localizations_locale_status_idx",
  "lesson_localizations_locale_status_idx",
  "course_content_versions_course_version_unique",
  "course_content_versions_status_updated_idx",
  "course_content_versions_course_status_idx",
  "course_quality_events_source_unique",
  "course_quality_events_status_severity_idx",
  "course_quality_events_course_lesson_idx",
  "feedback_status_created_idx",
  "feedback_user_created_idx",
  "seed_user_notes_user_created_idx",
  "seed_user_notes_type_status_idx",
  "seed_user_notes_reason_idx",
  "campaign_rewards_status_window_idx",
  "campaign_rewards_end_at_idx",
  "order_pricing_snapshots_user_created_idx",
  "order_pricing_snapshots_status_created_idx",
  "credits_ledger_user_created_idx",
  "credits_ledger_user_status_expires_idx",
  "ability_assessments_user_created_idx",
  "review_queue_items_user_status_due_idx",
  "evidence_items_source_unique",
  "evidence_items_user_date_idx",
  "evidence_items_user_status_idx",
  "evidence_items_course_lesson_idx",
  "goal_template_checkpoints_template_day_unique",
  "goal_template_checkpoints_template_order_idx",
  "project_milestones_user_checkpoint_unique",
  "project_milestones_user_status_idx",
  "project_milestones_status_day_idx",
  "conversion_events_type_time_idx",
  "conversion_events_user_type_idx",
  "uploaded_artifacts_user_created_idx",
  "uploaded_artifacts_sha256_idx",
  "uploaded_artifacts_related_source_idx",
  "competency_nodes_category_status_idx",
  "competency_nodes_level_idx",
  "competency_proof_shares_token_idx",
  "competency_proof_shares_user_created_idx",
  "agent_lab_projects_user_template_provider_unique",
  "agent_lab_projects_user_status_idx",
  "agent_lab_projects_provider_status_idx",
  "agent_runtime_checks_project_created_idx",
  "agent_runtime_checks_user_status_idx",
  "knowledge_sources_canonical_ref_unique",
  "knowledge_sources_status_created_idx",
  "knowledge_sources_type_status_idx",
];

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [name, ...rest] = line.split("=");
    const value = rest.join("=").trim().replace(/^["']|["']$/g, "");
    if (name.trim()) process.env[name.trim()] ??= value;
  }
}

function expectedMigrations() {
  const directory = resolve("postgres");
  return readdirSync(directory)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => ({
      name,
      checksum: createHash("sha256")
        .update(readFileSync(join(directory, name), "utf8"))
        .digest("hex"),
    }));
}

function summarizeMissing(required, actual) {
  return required.filter((name) => !actual.has(name));
}

function printFailureReport(failures) {
  console.error("Academy PostgreSQL self-check failed");
  console.error("restart_safe=no");
  console.error("next_action=fix_database_before_restart");
  for (const failure of failures) console.error(`ERROR: ${failure}`);

  const hasMissingMigration = failures.some((failure) =>
    failure.startsWith("Missing migration:"),
  );
  const hasMissingSchemaObject = failures.some(
    (failure) =>
      failure.startsWith("Missing tables:") || failure.startsWith("Missing indexes:"),
  );
  const hasChecksumMismatch = failures.some((failure) =>
    failure.startsWith("Checksum mismatch:"),
  );

  if (hasMissingMigration || hasMissingSchemaObject) {
    console.error("repair_hint=run `npm run db:migrate:postgres` then `npm run db:check:postgres`");
  }
  if (hasChecksumMismatch) {
    console.error(
      "repair_hint=checksum mismatch means an applied migration file changed; stop deployment and inspect the migration history before restarting",
    );
  }
  console.error(
    "deploy_hint=do not run `sudo systemctl restart academy` until this check prints `OK postgres production schema`",
  );
}

loadEnvFile(resolve(".env"));

const databaseUrl = process.env.ACADEMY_DATABASE_URL;
if (!databaseUrl) {
  console.error("ERROR: ACADEMY_DATABASE_URL is required");
  process.exit(1);
}

const { Client } = pg;
const client = new Client({
  connectionString: databaseUrl,
  application_name: "academy-postgres-check",
});

const failures = [];

try {
  await client.connect();

  const [database, version] = await Promise.all([
    client.query("SELECT current_database() AS database, current_user AS user"),
    client.query("SHOW server_version"),
  ]);
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
  );
  const indexes = await client.query(
    "SELECT indexname FROM pg_indexes WHERE schemaname = 'public'",
  );
  const tableNames = new Set(tables.rows.map((row) => row.table_name));
  const indexNames = new Set(indexes.rows.map((row) => row.indexname));
  const missingTables = summarizeMissing(REQUIRED_TABLES, tableNames);
  const missingIndexes = summarizeMissing(REQUIRED_INDEXES, indexNames);

  if (missingTables.length) failures.push(`Missing tables: ${missingTables.join(", ")}`);
  if (missingIndexes.length) failures.push(`Missing indexes: ${missingIndexes.join(", ")}`);

  const migrationsTableExists = tableNames.has("__academy_migrations");
  let appliedRows = [];
  if (migrationsTableExists) {
    const applied = await client.query(
      "SELECT name, checksum FROM __academy_migrations ORDER BY name",
    );
    appliedRows = applied.rows;
    const appliedByName = new Map(applied.rows.map((row) => [row.name, row.checksum]));
    for (const migration of expectedMigrations()) {
      const checksum = appliedByName.get(migration.name);
      if (!checksum) {
        failures.push(`Missing migration: ${migration.name}`);
      } else if (checksum !== migration.checksum) {
        failures.push(`Checksum mismatch: ${migration.name}`);
      }
    }
  }

  console.log("Academy PostgreSQL self-check");
  console.log(`database=${database.rows[0].database} user=${database.rows[0].user}`);
  console.log(`postgres=${version.rows[0].server_version}`);
  console.log(`tables=${tableNames.size} indexes=${indexNames.size}`);
  console.log(`migrations=${appliedRows.length}/${expectedMigrations().length}`);

  if (failures.length) {
    printFailureReport(failures);
    process.exitCode = 1;
  } else {
    console.log("OK postgres production schema");
    console.log("restart_safe=yes");
    console.log("next_action=restart_academy_service");
  }
} catch (error) {
  console.error(`ERROR: ${error instanceof Error ? error.message : "Unexpected error"}`);
  console.error("restart_safe=no");
  console.error("next_action=fix_connection_or_environment_before_restart");
  console.error("repair_hint=check ACADEMY_DATABASE_URL, PostgreSQL status, credentials, and network access");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
