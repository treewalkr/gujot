import { test, expect } from "@playwright/test";
import { PERSISTED_LABEL } from "./ledger-fixtures";

// Gate test for #3 (Slice 2): the survives-restart AC. `e2e/run.ts` runs
// ledger.spec.ts (which creates the entry above), restarts the backend
// container, then runs this. If the row is still here, persistence is real
// Postgres, not in-memory state.
test("ledger entry survives a backend restart", async ({ page }) => {
  await page.goto("/");
  const entries = page.getByTestId("entries");
  await expect(entries).toContainText("$15.00");
  await expect(entries).toContainText(PERSISTED_LABEL);
});
