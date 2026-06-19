import { test, expect } from "@playwright/test";
import { PERSISTED_LABEL } from "./ledger-fixtures";

// Gate test for #3 (Slice 2): the ledger write→render path. The orchestrator
// (`e2e/run.ts`) runs this against the fully-containerized stack, then restarts
// the backend and runs ledger-persist.spec.ts to prove the row survived —
// together they exercise shared → backend → DB → UI and real Postgres
// persistence. The stack starts with a clean DB each run, so the entry created
// here is the one the persist spec looks for.
test("user can add a ledger entry and see the Money value rendered", async ({ page }) => {
  await page.goto("/");

  const form = page.getByTestId("add-entry");
  await form.locator("input[name='amount']").fill("15.00");
  await form.locator("select[name='currency']").selectOption("USD");
  await form.locator("input[name='label']").fill(PERSISTED_LABEL);
  await form.getByRole("button", { name: "Add" }).click();

  // The form posts to the action and reloads with the new entry.
  const entries = page.getByTestId("entries");
  await expect(entries).toContainText("$15.00");
  await expect(entries).toContainText(PERSISTED_LABEL);
});
