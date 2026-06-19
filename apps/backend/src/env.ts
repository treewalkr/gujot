import { env as createEnv } from "@yolk-oss/elysia-env";
import { t } from "elysia";

/**
 * Type-safe, fail-fast backend environment (ADR-0013).
 *
 * Validated against a TypeBox schema and attached as an Elysia decorator, so
 * route handlers read `env` with full types and fail-fast validation. Boot-time
 * reads (e.g. the listen port in server.ts) read `process.env` directly — this
 * plugin is for request-scoped, type-safe access, not for the one-off boot path.
 */
export const envPlugin = createEnv({
  BACKEND_PORT: t.Number({ default: 3000 }),
});
