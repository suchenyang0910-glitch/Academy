import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

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

function parseArgs(argv) {
  const args = {
    mode: "auto",
    databasePath: process.env.ACADEMY_DATABASE_PATH ?? "data/academy.sqlite",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--mode") args.mode = String(argv[i + 1] ?? "");
    if (token === "--database-path") args.databasePath = String(argv[i + 1] ?? "");
  }
  return args;
}

function runNodeScript(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`Script failed: ${script}`);
  }
}

function verifySqlite(databasePath) {
  process.env.ACADEMY_DATABASE_PATH = databasePath;
  mkdirSync(dirname(databasePath), { recursive: true });
  runNodeScript(resolve("scripts/migrate.mjs"));

  const db = new DatabaseSync(databasePath, { enableForeignKeyConstraints: true });
  const tables = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table'`)
    .all()
    .map((row) => row.name);
  for (const required of [
    "__academy_migrations",
    "users",
    "courses",
    "enrollments",
    "lessons",
    "submissions",
    "notes",
    "invitations",
    "seed_user_notes",
    "credits_ledger",
    "campaign_rewards",
    "order_pricing_snapshots",
    "competency_proof_shares",
    "agent_lab_projects",
    "agent_runtime_checks",
    "knowledge_sources",
  ]) {
    if (!tables.includes(required)) {
      throw new Error(`Missing SQLite table: ${required}`);
    }
  }

  const applied = db.prepare("SELECT COUNT(*) AS count FROM __academy_migrations").get();
  const migrationFiles = readdirSync(resolve("drizzle")).filter((name) => name.endsWith(".sql"));
  if (Number(applied?.count ?? 0) < migrationFiles.length) {
    throw new Error("SQLite migrations are not fully applied");
  }

  db.close();
  console.log("OK sqlite");
}

async function verifyPostgres() {
  const databaseUrl = process.env.ACADEMY_DATABASE_URL;
  if (!databaseUrl) throw new Error("ACADEMY_DATABASE_URL is required for postgres mode");
  runNodeScript(resolve("scripts/migrate-postgres.mjs"));

  const { Client } = pg;
  const client = new Client({ connectionString: databaseUrl, application_name: "academy-verify" });
  await client.connect();
  try {
    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
    );
    const names = new Set(tables.rows.map((row) => row.table_name));
    for (const required of [
      "__academy_migrations",
      "users",
      "courses",
      "enrollments",
      "lessons",
      "submissions",
      "notes",
      "invitations",
      "seed_user_notes",
      "credits_ledger",
      "campaign_rewards",
      "order_pricing_snapshots",
      "goal_templates",
      "goal_template_checkpoints",
      "project_milestones",
      "uploaded_artifacts",
      "competency_nodes",
      "competency_proof_shares",
      "agent_lab_projects",
      "agent_runtime_checks",
      "knowledge_sources",
    ]) {
      if (!names.has(required)) throw new Error(`Missing Postgres table: ${required}`);
    }
    const applied = await client.query("SELECT COUNT(*) AS count FROM __academy_migrations");
    if (Number(applied.rows[0]?.count ?? 0) < 1) {
      throw new Error("Postgres migrations are not applied");
    }
  } finally {
    await client.end();
  }
  console.log("OK postgres");
}

loadEnvFile(resolve(".env"));
const args = parseArgs(process.argv.slice(2));
const mode =
  args.mode === "auto"
    ? process.env.ACADEMY_DATABASE_URL
      ? "postgres"
      : "sqlite"
    : args.mode;

try {
  if (mode === "sqlite") {
    verifySqlite(resolve(args.databasePath));
  } else if (mode === "postgres") {
    await verifyPostgres();
  } else {
    throw new Error("Invalid mode. Use --mode sqlite|postgres|auto");
  }
} catch (error) {
  console.error(`ERROR: ${error instanceof Error ? error.message : "Unexpected error"}`);
  process.exitCode = 1;
}
