import { defineConfig } from "drizzle-kit";

// Drizzle Kit config (ADR-0004). Migrations run against the DIRECT/session-mode
// connection (port 5432, no pooler) — the Supabase pooler (transaction mode)
// strips prepared statements and breaks migrations. The runtime uses the pooled
// connection in src/db/client.ts; this file is the only place the direct URL
// is used.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT!,
  },
});
