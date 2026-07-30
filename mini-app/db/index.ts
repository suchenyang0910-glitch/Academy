import { Pool, type PoolClient, type QueryResult } from "pg";

type SqlValue = string | number | boolean | null | Uint8Array | Date;

export type D1Result<T = Record<string, unknown>> = { results: T[] };

type QueryExecutor = Pick<Pool, "query"> | Pick<PoolClient, "query">;

export type D1PreparedStatement = {
  bind: (...values: SqlValue[]) => D1PreparedStatement;
  all: <T = Record<string, unknown>>() => Promise<D1Result<T>>;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  run: () => Promise<{ meta: { changes: number; last_row_id: number } }>;
  execute: (executor?: QueryExecutor) => Promise<QueryResult>;
};

export type D1Database = {
  prepare: (source: string) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => Promise<unknown[]>;
};

let pool: Pool | undefined;
let d1: D1Database | undefined;
let startupCheckScheduled = false;

const STARTUP_REQUIRED_TABLES = [
  "__academy_migrations",
  "users",
  "courses",
  "lessons",
  "enrollments",
  "submissions",
  "quiz_attempts",
  "reminder_events",
  "payment_orders",
  "payment_transactions",
  "seed_user_notes",
  "credits_ledger",
  "campaign_rewards",
  "order_pricing_snapshots",
  "evidence_items",
  "conversion_events",
  "uploaded_artifacts",
  "competency_nodes",
  "competency_proof_shares",
  "agent_lab_projects",
  "agent_runtime_checks",
  "knowledge_sources",
];

function databaseUrl() {
  const value = process.env.ACADEMY_DATABASE_URL;
  if (!value) {
    throw new Error(
      "ACADEMY_DATABASE_URL is required. SQLite data has not been deleted; finish the PostgreSQL migration before restarting Academy.",
    );
  }
  return value;
}

function getPool() {
  if (pool) return pool;
  pool = new Pool({
    connectionString: databaseUrl(),
    max: Number(process.env.ACADEMY_PG_POOL_SIZE ?? 5),
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 5_000,
    query_timeout: 10_000,
    application_name: "academy-mini-app",
  });
  scheduleStartupDatabaseCheck(pool);
  return pool;
}

function scheduleStartupDatabaseCheck(nextPool: Pool) {
  if (startupCheckScheduled) return;
  startupCheckScheduled = true;
  void nextPool
    .query(
      `SELECT
         current_database() AS database,
         current_user AS "user",
         (SELECT COUNT(*)::int FROM information_schema.tables WHERE table_schema = 'public') AS tables,
         (SELECT COUNT(*)::int FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '__academy_migrations') AS has_migrations_table`,
    )
    .then(async (summary) => {
      const migrationCount =
        Number(summary.rows[0]?.has_migrations_table ?? 0) > 0
          ? await nextPool
              .query("SELECT COUNT(*)::int AS count FROM __academy_migrations")
              .then((result) => Number(result.rows[0]?.count ?? 0))
          : 0;
      const tableRows = await nextPool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
      );
      const names = new Set(tableRows.rows.map((row) => row.table_name));
      const missingTables = STARTUP_REQUIRED_TABLES.filter(
        (table) => !names.has(table),
      );
      const base = summary.rows[0] ?? {};
      const message =
        `[academy-db] type=postgres database=${base.database ?? "unknown"} ` +
        `user=${base.user ?? "unknown"} tables=${base.tables ?? 0} ` +
        `migrations=${migrationCount}`;
      if (missingTables.length) {
        console.warn(`${message} missing_tables=${missingTables.join(",")}`);
      } else {
        console.info(message);
      }
    })
    .catch((error) => {
      console.warn(
        `[academy-db] startup_check_failed=${
          error instanceof Error ? error.message : "unknown"
        }`,
      );
    });
}

// Academy's service layer was deliberately written behind a small D1-like
// interface. PostgreSQL uses numbered parameters, so translate only bound
// placeholders. Academy SQL does not embed question marks inside string
// literals; keeping the conversion here avoids scattering driver specifics.
function postgresSql(source: string) {
  let index = 0;
  return source.replace(/\?/g, () => `$${++index}`);
}

function aliasesFor(source: string) {
  return [...source.matchAll(/\bAS\s+(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_$]*))/gi)]
    .map((match) => match[1] ?? match[2])
    .filter((alias) => alias !== "DATE");
}

function normalizeRows<T>(result: QueryResult, source: string) {
  const aliases = aliasesFor(source);
  if (!aliases.length) return result.rows as T[];
  return result.rows.map((row) => {
    const normalized = { ...row } as Record<string, unknown>;
    for (const alias of aliases) {
      const postgresKey = alias.toLowerCase();
      if (!(alias in normalized) && postgresKey in normalized) {
        normalized[alias] = normalized[postgresKey];
      }
    }
    return normalized as T;
  });
}

function prepare(source: string): D1PreparedStatement {
  let values: SqlValue[] = [];
  const text = postgresSql(source);
  const query: D1PreparedStatement = {
    bind(...nextValues) {
      values = nextValues;
      return query;
    },
    async execute(executor = getPool()) {
      return executor.query(text, values);
    },
    async all<T = Record<string, unknown>>() {
      const result = await query.execute();
      return { results: normalizeRows<T>(result, source) };
    },
    async first<T = Record<string, unknown>>() {
      const result = await query.execute();
      return normalizeRows<T>(result, source)[0] ?? null;
    },
    async run() {
      const result = await query.execute();
      return {
        meta: {
          changes: result.rowCount ?? 0,
          last_row_id: 0,
        },
      };
    },
  };
  return query;
}

/**
 * PostgreSQL compatibility layer for Academy's existing data services.
 * All application data flows through this layer; no route handler opens a
 * direct database connection.
 */
export function getD1(): D1Database {
  if (d1) return d1;
  d1 = {
    prepare,
    async batch(statements) {
      const client = await getPool().connect();
      try {
        await client.query("BEGIN");
        const results: QueryResult[] = [];
        for (const statement of statements) {
          results.push(await statement.execute(client));
        }
        await client.query("COMMIT");
        return results;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
  };
  return d1;
}
