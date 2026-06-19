import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Runtime Drizzle client (ADR-0004). Uses the POOLED connection (Supabase
// pooler, transaction mode, port 6543, pgbouncer=true) — suitable for the app
// runtime but not for Drizzle Kit migrations, which use the direct/session
// connection declared in drizzle.config.ts.
//
// DATABASE_URL is read straight from process.env at boot, like the listen port
// in server.ts: this is the app-construction path, not request-scoped access.
const pooledUrl = process.env.DATABASE_URL;
if (!pooledUrl) throw new Error("DATABASE_URL is required (pooled, port 6543)");

// connection_limit=1 is the documented recommendation for pgbouncer transaction
// mode; it is a no-op against a plain local Postgres (ADR-0004 fallback).
const queryClient = postgres(pooledUrl, { max: 1 });

export const db = drizzle(queryClient, { schema });
