import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = resolve(process.env.ACADEMY_DATABASE_PATH ?? "data/academy.sqlite");
if (!existsSync(databasePath)) {
  console.log("No local Academy database exists yet.");
  process.exit(0);
}

const db = new DatabaseSync(databasePath, { enableForeignKeyConstraints: true });
db.exec(`
  DELETE FROM payment_transactions;
  DELETE FROM payment_orders;
  DELETE FROM subscriptions;
  DELETE FROM invitations;
  DELETE FROM reminder_events;
  DELETE FROM notes;
  DELETE FROM submissions;
  DELETE FROM enrollments;
  DELETE FROM users;
  DELETE FROM schema_version;
`);
db.close();
console.log("Local learning data was reset. The curriculum and schema remain intact.");
