import { test, expect } from "bun:test";
import { app } from "../src/index";

test("GET /status reports the backend service is up", async () => {
  const res = await app.handle(new Request("http://localhost/status"));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ service: "gujot-backend", status: "ok" });
});
