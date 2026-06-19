import { env as createEnv } from "@yolk-oss/elysia-env";
import { t } from "elysia";

// Request-scoped, type-safe, fail-fast backend env (ADR-0009). Declare vars a
// route handler needs here; handlers read them via the validated decorator.
// Boot/app-construction reads (listen port in server.ts, DB URLs in database/client)
// use process.env directly — they run before this decorator exists, and the DB
// client stays lazy so importing `app` stays side-effect-free for unit tests.
export const envPlugin = createEnv({
  BACKEND_PORT: t.Number({ default: 3000 }),
  // Session cookie + lifetime (ADR-0007). Secure is env-driven: true in
  // production (HTTPS via Caddy), false in the local compose stack and the E2E
  // gate where there is no TLS and a Secure cookie would not be sent over HTTP.
  COOKIE_SECURE: t.Boolean({ default: true }),
  // Session lifetime in seconds (default: 7 days).
  SESSION_TTL_SECONDS: t.Number({ default: 60 * 60 * 24 * 7 }),
});
