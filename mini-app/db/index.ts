import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

type SqlValue = string | number | null | Uint8Array;

export type D1Result<T = Record<string, unknown>> = { results: T[] };

export type D1PreparedStatement = {
  bind: (...values: SqlValue[]) => D1PreparedStatement;
  all: <T = Record<string, unknown>>() => Promise<D1Result<T>>;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  run: () => Promise<{ meta: { changes: number; last_row_id: number | bigint } }>;
  execute: () => { changes: number; lastInsertRowid: number | bigint };
};

export type D1Database = {
  prepare: (source: string) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => Promise<unknown[]>;
};

let database: DatabaseSync | undefined;
let d1: D1Database | undefined;

function databasePath() {
  return resolve(
    process.env.ACADEMY_DATABASE_PATH ?? "data/academy.sqlite",
  );
}

function openDatabase() {
  if (database) return database;
  const path = databasePath();
  mkdirSync(dirname(path), { recursive: true });
  database = new DatabaseSync(path, { enableForeignKeyConstraints: true });
  database.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  return database;
}

function prepare(source: string): D1PreparedStatement {
  let values: SqlValue[] = [];
  const statement = openDatabase().prepare(source);
  const query: D1PreparedStatement = {
    bind(...nextValues) {
      values = nextValues;
      return query;
    },
    async all<T = Record<string, unknown>>() {
      return { results: statement.all(...values) as T[] };
    },
    async first<T = Record<string, unknown>>() {
      return (statement.get(...values) as T | undefined) ?? null;
    },
    async run() {
      const result = statement.run(...values);
      return {
        meta: {
          changes: Number(result.changes),
          last_row_id: result.lastInsertRowid,
        },
      };
    },
    execute() {
      return statement.run(...values);
    },
  };
  return query;
}

/**
 * Small compatibility layer for the D1 statement API already used by the
 * Academy services. It lets the VPS use one local SQLite database without
 * changing every course, payment, reminder, and referral query.
 */
export function getD1(): D1Database {
  if (d1) return d1;
  d1 = {
    prepare,
    async batch(statements) {
      const sqlite = openDatabase();
      sqlite.exec("BEGIN IMMEDIATE");
      try {
        const results = statements.map((statement) => statement.execute());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
  return d1;
}
