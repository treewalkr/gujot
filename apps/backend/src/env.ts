import { env as createEnv } from "@yolk-oss/elysia-env";
import { t } from "elysia";

// Request-scoped, type-safe, fail-fast backend env (ADR-0009). Declare vars a
// route handler needs here; handlers read them via the validated decorator.
// Boot/app-construction reads (listen port in server.ts, DB URLs in database/client)
// use process.env directly — they run before this decorator exists, and the DB
// client stays lazy so importing `app` stays side-effect-free for unit tests.
export const envPlugin = createEnv({
  BACKEND_PORT: t.Number({ default: 3000 }),
});
