import { Elysia, t } from "elysia";
import { envPlugin } from "./env";
import { openapiPlugin } from "./openapi";
import { entriesRoutes } from "./routes/entries";

/**
 * The instantiated Elysia app. The frontend imports `type App` from here to
 * construct an Eden treaty client (ADR-0001) — the coupling is compile-time
 * types only, never a runtime import.
 */
export const app = new Elysia()
  .use(envPlugin)
  .use(openapiPlugin)
  .use(entriesRoutes)
  .get(
    "/status",
    () => ({ service: "gujot-backend", status: "ok" }),
    {
      response: t.Object({
        service: t.String(),
        status: t.String(),
      }),
      detail: {
        summary: "Service status",
        description: "Liveness probe — reports the backend is up.",
        tags: ["health"],
      },
    },
  );

/** Live route type, consumed by Eden on the frontend. */
export type App = typeof app;
