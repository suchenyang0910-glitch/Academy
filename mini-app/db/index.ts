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
  return pool;
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
