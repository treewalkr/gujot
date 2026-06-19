import { test, expect } from "bun:test";
import { app } from "../src/index";

// The OpenAPI spec is generated from the app's registered routes and named
// models (ADR-0008), so asserting it surfaces the /entries paths and the
// Drizzle-derived entry schema proves the plugin is wired and the single-source
// models are exposed. No DB required — the spec is static.
test("GET /openapi/json serves a spec with the entries routes and model", async () => {
  const res = await app.handle(new Request("http://localhost/openapi/json"));
  expect(res.status).toBe(200);

  const spec: any = await res.json();
  expect(spec.info.title).toBe("GuJot API");

  expect(spec.paths["/entries"]?.get).toBeDefined();
  expect(spec.paths["/entries"]?.post).toBeDefined();
  expect(spec.paths["/status"]?.get).toBeDefined();

  const schemas = spec.components?.schemas ?? {};
  const hasEntrySchema = Object.values(schemas).some(
    (s: any) =>
      s &&
      typeof s === "object" &&
      "properties" in s &&
      "amount" in s.properties &&
      "currency" in s.properties,
  );
  expect(hasEntrySchema).toBe(true);
});
