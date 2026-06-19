import { openapi } from "@elysiajs/openapi";

// OpenAPI docs + spec. Served at /openapi (Scalar docs UI) and /openapi/json
// (raw spec). Named models registered on the app (ADR-0008) auto-surface as
// reusable schemas, so the spec stays in sync with the Drizzle-derived models.
//
// Per-controller tags are set on each Elysia instance (e.g. entriesRoutes);
// they're declared here so the docs list them with descriptions.
export const openapiPlugin = openapi({
  documentation: {
    info: {
      title: "GuJot API",
      version: "0.1.0",
      description: "Personal finance backend (Elysia + Drizzle + Postgres).",
    },
    tags: [
      { name: "health", description: "Service health and liveness" },
      { name: "entries", description: "Ledger entries (stored Money values)" },
    ],
  },
});
