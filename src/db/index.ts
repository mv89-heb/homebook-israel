import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Standard `pg` (node-postgres) driver, pointed at Neon's connection string.
 * Neon supports the regular Postgres wire protocol, so this works the same
 * way against Neon in production as it does against any local Postgres in
 * development — no need for Neon's HTTP/WebSocket proxy driver, which only
 * matters for edge/serverless runtimes. Render.com runs a long-lived Node
 * process, so a normal pooled TCP connection is the simpler, more
 * appropriate choice here.
 *
 * Neon requires SSL; `sslmode=require` in the connection string (Neon's
 * default) handles this automatically via `pg`.
 */
const globalForDb = globalThis as unknown as { pgPool?: Pool };

function getPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL env var.");
  }

  // Reuse the pool across hot reloads in dev / across invocations on a
  // long-lived server, instead of exhausting Neon's connection limit.
  if (!globalForDb.pgPool) {
    globalForDb.pgPool = new Pool({ connectionString });
  }
  return globalForDb.pgPool;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: DrizzleDb | null = null;

function getDb(): DrizzleDb {
  if (!cachedDb) {
    cachedDb = drizzle(getPool(), { schema });
  }
  return cachedDb;
}

/**
 * Lazily-initialized Drizzle client. Importing this module never throws —
 * the pool/client is only created (and DATABASE_URL only checked) the first
 * time a property on `db` is actually accessed, e.g. `db.select(...)`.
 * This mirrors the fix applied to the Supabase middleware bug: a missing
 * env var should surface as a contained error at the point of use, not
 * crash every route that happens to import this module.
 */
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});
