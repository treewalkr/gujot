import { test, expect } from "@playwright/test";

// Gate test for #4 (Slice 3): the email/password auth model, end to end, through
// the containerized stack. Exercises register → SSR of the authenticated user's
// own data on the protected /account page → the session cookie's security
// attributes → logout (session revoked) → the protected page rejecting an
// unauthenticated visitor → login. Backend session handling (Postgres
// SessionStore, argon2id, cookie) is proven here against the real DB; the
// infra-free unit tests cover the SessionStore contract and password hashing.
//
// The stack starts from a clean DB each run, so a fixed email is fine.

const EMAIL = "e2e@example.com";
const PASSWORD = "correct horse battery staple";

test("registering renders the user's own data on the protected page", async ({ page, context }) => {
  await page.goto("/register");

  await page.getByTestId("register-form").locator("input[name='email']").fill(EMAIL);
  await page.getByTestId("register-form").locator("input[name='password']").fill(PASSWORD);
  await page.getByTestId("register-form").getByRole("button", { name: "Register" }).click();

  // The action sets the session cookie and redirects to /account, which SSRs
  // the authenticated user's own data via the Eden-typed /me call.
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByTestId("user-email")).toHaveText(EMAIL);

  // The session cookie carries the project's non-negotiable attributes
  // (ADR-0007). Secure is false here only because the local stack has no TLS.
  const cookies = await context.cookies();
  const session = cookies.find((c) => c.name === "session");
  expect(session).toBeDefined();
  expect(session!.httpOnly).toBe(true);
  expect(session!.sameSite).toBe("Lax");
});

test("logging out clears the session and rejects the protected page", async ({ page }) => {
  // Start signed in.
  await page.goto("/login");
  await page.getByTestId("login-form").locator("input[name='email']").fill(EMAIL);
  await page.getByTestId("login-form").locator("input[name='password']").fill(PASSWORD);
  await page.getByTestId("login-form").getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/account$/);

  // Logout revokes the session server-side and bounces to /login.
  await page.getByTestId("logout-form").getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  // The now-unauthenticated visitor is bounced off the protected page.
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login$/);
});

test("logging back in works after logout", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-form").locator("input[name='email']").fill(EMAIL);
  await page.getByTestId("login-form").locator("input[name='password']").fill(PASSWORD);
  await page.getByTestId("login-form").getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByTestId("user-email")).toHaveText(EMAIL);
});

test("an unauthenticated visitor is redirected away from /account", async ({ page, context }) => {
  // Ensure no session cookie is present.
  await context.clearCookies();
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login$/);
});
