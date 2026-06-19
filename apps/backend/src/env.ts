import { env as createEnv } from "@yolk-oss/elysia-env";
import { t } from "elysia";

/**
 * Type-safe, fail-fast backend environment (ADR-0013).
 *
 * Validated against a TypeBox schema when the app starts. The validated
 * object is attached as an Elysia decorator, so it is available as `app.env`
 * at boot (e.g. for the listen port) and as `env` in route handlers.
 */
export const envPlugin = createEnv({
  BACKEND_PORT: t.Number({ default: 3000 }),
});
