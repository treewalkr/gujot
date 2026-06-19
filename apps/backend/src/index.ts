import { Elysia } from "elysia";
import { envPlugin } from "./env";
import { entriesRoutes } from "./routes/entries";

/**
 * The instantiated Elysia app. The frontend imports `type App` from here to
 * construct an Eden treaty client (ADR-0001) — the coupling is compile-time
 * types only, never a runtime import.
 */
export const app = new Elysia()
  .use(envPlugin)
  .use(entriesRoutes)
  .get("/status", () => ({
    service: "gujot-backend",
    status: "ok",
  }));

/** Live route type, consumed by Eden on the frontend. */
export type App = typeof app;
