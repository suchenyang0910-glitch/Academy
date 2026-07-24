import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = resolve(process.env.ACADEMY_DATABASE_PATH ?? "data/academy.sqlite");
const migrationsPath = resolve("drizzle");
mkdirSync(dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath, { enableForeignKeyConstraints: true });
db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
db.exec(`CREATE TABLE IF NOT EXISTS __academy_migrations (
  name TEXT PRIMARY KEY NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
)`);

const migrations = readdirSync(migrationsPath)
  .filter((name) => name.endsWith(".sql"))
  .sort();

for (const name of migrations) {
  const exists = db.prepare("SELECT name FROM __academy_migrations WHERE name = ?").get(name);
  if (exists) continue;
  const sql = readFileSync(resolve(migrationsPath, name), "utf8")
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  db.exec("BEGIN IMMEDIATE");
  try {
    for (const statement of sql) db.exec(statement);
    db.prepare("INSERT INTO __academy_migrations (name) VALUES (?)").run(name);
    db.exec("COMMIT");
    console.log(`Applied ${name}`);
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

db.close();
