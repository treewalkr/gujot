import { test, expect } from "@playwright/test";

// The gate test for #2. Loads the frontend in a browser and asserts it
// renders data returned by the backend over Eden — proving the monorepo
// layout, the two-runtime split, and compile-time Eden typing in one flow.
test("renders backend data served over Eden", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("backend-service")).toHaveText("gujot-backend");
});
