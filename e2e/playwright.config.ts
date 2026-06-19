import { defineConfig } from "@playwright/test";

/**
 * Drives the fully-containerized compose stack (mode 2). The orchestrator
 * (`e2e/run.ts`, run via `bun test:e2e`) brings the stack up, exports
 * FRONTEND_URL, then runs these tests.
 */
export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 1,
  use: {
    baseURL: process.env.FRONTEND_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
  },
});
