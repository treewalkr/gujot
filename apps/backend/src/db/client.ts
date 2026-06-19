import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type DB = PostgresJsDatabase<typeof schema>;

// Lazy: the pooled connection is opened on first use, not at import. This keeps
// importing the app module side-effect-free, so infra-free unit tests (e.g. the
// /status test) never need a live DATABASE_URL.
let instance: DB | undefined;

/** The runtime Drizzle client against the POOLED connection (ADR-0004). */
export function getDb(): DB {
  if (instance) return instance;

  // Pooled connection (Supabase pooler, transaction mode, port 6543,
  // pgbouncer=true) — suitable for the app runtime but not for Drizzle Kit
  // migrations, which use the direct/session connection in drizzle.config.ts.
  // connection_limit=1 is the documented pgbouncer recommendation; a no-op
  // against a plain local Postgres (ADR-0004 fallback).
  const pooledUrl = process.env.DATABASE_URL;
  if (!pooledUrl) throw new Error("DATABASE_URL is required (pooled, port 6543)");

  instance = drizzle(postgres(pooledUrl, { max: 1 }), { schema });
  return instance;
}
