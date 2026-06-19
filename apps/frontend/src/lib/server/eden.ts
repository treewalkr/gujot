import { treaty } from "@elysiajs/eden";
import type { App } from "@gujot/backend";
import { env } from "$env/dynamic/private";
import type { Cookies } from "@sveltejs/kit";

/**
 * Eden treaty client built from the backend's live route type (ADR-0001).
 * Lives under `$lib/server` so it never ships to the browser — the backend is
 * called server-side during SSR. BACKEND_URL is read at runtime so the same
 * image works on host (mode 1) and in the compose network (mode 2).
 */
export const eden = treaty<App>(env.BACKEND_URL ?? "http://localhost:3000");

// Must match the backend's SESSION_COOKIE (apps/backend/src/auth/session-cookie.ts).
export const SESSION_COOKIE = "session";

/**
 * Forward the browser's session cookie on a server-side Eden call so the
 * backend's session lookup authenticates the SSR request. Returns Eden call
 * options (empty when there is no session cookie).
 */
export function withSession(cookies: Pick<Cookies, "get">) {
  const sid = cookies.get(SESSION_COOKIE);
  return sid ? { headers: { cookie: `${SESSION_COOKIE}=${sid}` } } : {};
}

type CookieOptions = NonNullable<Parameters<Cookies["set"]>[2]>;

/**
 * Parse the backend's `Set-Cookie` for the session cookie into the value +
 * options SvelteKit's `cookies.set` expects. The backend is the single source
 * of the cookie attributes (httpOnly / Secure / SameSite / Path, ADR-0007); the
 * frontend forwards them verbatim rather than re-declaring them.
 */
export function parseSessionSetCookie(setCookie: string): { value: string; options: CookieOptions } {
  const [pair, ...attrs] = setCookie.split(";").map((s) => s.trim());
  const value = pair.split("=").slice(1).join("=");

  // secure defaults to false (RFC: absence of the Secure attribute means the
  // cookie is sent over HTTP too). Set explicitly — SvelteKit otherwise defaults
  // `secure` to true in production, which would drop the cookie over the
  // compose stack's plain HTTP and break the E2E auth flow.
  const options: CookieOptions = { path: "/", secure: false };
  for (const attr of attrs) {
    const [rawKey, rawVal] = attr.split("=");
    const key = rawKey.toLowerCase();
    const val = rawVal;
    if (key === "path") options.path = val;
    else if (key === "httponly") options.httpOnly = true;
    else if (key === "secure") options.secure = true;
    else if (key === "samesite") options.sameSite = val.toLowerCase() as CookieOptions["sameSite"];
    else if (key === "max-age") options.maxAge = Number(val);
  }
  return { value, options };
}

/** Extract the session cookie's Set-Cookie from a backend response, if present. */
export function sessionSetCookieFrom(response: Response): string | undefined {
  return response.headers.getSetCookie().find((c) => c.startsWith(`${SESSION_COOKIE}=`));
}
