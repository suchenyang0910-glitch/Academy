import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const postgresDir = resolve("postgres");
const drizzleDir = resolve("drizzle");
const schemaPath = resolve("db/schema.ts");

function readRequiredFile(path) {
  if (!existsSync(path)) {
    console.error(`ERROR: missing required file or directory: ${path}`);
    process.exit(1);
  }
  return readFileSync(path, "utf8");
}

function collectMigrationTables(directory, pattern) {
  if (!existsSync(directory)) return new Set();
  const tables = new Set();
  for (const file of readdirSync(directory).filter((name) => name.endsWith(".sql"))) {
    const text = readFileSync(join(directory, file), "utf8");
    for (const match of text.matchAll(pattern)) {
      tables.add(match[1]);
    }
  }
  return tables;
}

function collectSchemaTables(schema) {
  return new Set(
    [...schema.matchAll(/sqliteTable\(\s*["`]([A-Za-z0-9_]+)["`]/g)].map(
      (match) => match[1],
    ),
  );
}

function diff(left, right) {
  return [...left].filter((item) => !right.has(item)).sort();
}

const schema = readRequiredFile(schemaPath);
const schemaTables = collectSchemaTables(schema);
const postgresTables = collectMigrationTables(
  postgresDir,
  /CREATE TABLE(?: IF NOT EXISTS)?\s+([A-Za-z0-9_]+)/g,
);
const drizzleTables = collectMigrationTables(
  drizzleDir,
  /CREATE TABLE\s+`([A-Za-z0-9_]+)`/g,
);

const missingFromSchema = diff(postgresTables, schemaTables);
const missingFromDrizzleSchema = diff(drizzleTables, schemaTables);
const missingFromPostgres = diff(drizzleTables, postgresTables).filter(
  (table) => table !== "schema_version",
);

const failures = [];
if (missingFromSchema.length) {
  failures.push(`PostgreSQL migration tables missing from db/schema.ts: ${missingFromSchema.join(", ")}`);
}
if (missingFromDrizzleSchema.length) {
  failures.push(`SQLite migration tables missing from db/schema.ts: ${missingFromDrizzleSchema.join(", ")}`);
}
if (missingFromPostgres.length) {
  failures.push(`SQLite migration tables missing from PostgreSQL migrations: ${missingFromPostgres.join(", ")}`);
}

if (failures.length) {
  console.error("Academy schema coverage check failed");
  console.error("restart_safe=no");
  console.error("next_action=align_schema_and_migrations_before_deploy");
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}

console.log(
  `OK schema coverage: postgres_tables=${postgresTables.size} sqlite_tables=${drizzleTables.size} schema_tables=${schemaTables.size}`,
);
