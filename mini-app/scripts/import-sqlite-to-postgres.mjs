import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";
import pg from "pg";

const { Client } = pg;
const sourcePath = resolve(process.env.ACADEMY_SQLITE_SOURCE_PATH ?? "/var/lib/academy/academy.sqlite");
const databaseUrl = process.env.ACADEMY_DATABASE_URL;
if (!databaseUrl) throw new Error("ACADEMY_DATABASE_URL is required");

const tables = [
  "users", "courses", "enrollments", "lessons", "reminder_templates",
  "submissions", "notes", "reminder_events", "invitations", "subscriptions",
  "payment_orders", "payment_transactions", "schema_version",
];
const identityTables = [
  "enrollments", "submissions", "notes", "reminder_events", "invitations",
  "subscriptions", "payment_orders", "payment_transactions",
];
const sqlite = new DatabaseSync(sourcePath, { readOnly: true });
const client = new Client({ connectionString: databaseUrl, application_name: "academy-import" });

function quoteIdentifier(name) {
  return `"${name.replaceAll('"', '""')}"`;
}

await client.connect();
try {
  await client.query("BEGIN");
  for (const table of tables) {
    const columns = sqlite.prepare(`PRAGMA table_info(${quoteIdentifier(table)})`).all().map((column) => column.name);
    if (!columns.length) throw new Error(`SQLite source is missing table: ${table}`);
    const rows = sqlite.prepare(`SELECT * FROM ${quoteIdentifier(table)}`).all();
    if (!rows.length) continue;
    const fields = columns.map(quoteIdentifier).join(", ");
    const parameters = columns.map((_, index) => `$${index + 1}`).join(", ");
    const sql = `INSERT INTO ${quoteIdentifier(table)} (${fields}) VALUES (${parameters})`;
    for (const row of rows) {
      await client.query(sql, columns.map((column) => row[column] ?? null));
    }
    console.log(`${table}: ${rows.length}`);
  }
  for (const table of identityTables) {
    await client.query(
      `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${quoteIdentifier(table)}), 1), true)`,
      [table],
    );
  }
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  sqlite.close();
  await client.end();
}
