import type { Cookie, CookieOptions } from "elysia";
import { SESSION_COOKIE } from "@gujot/shared";

// Session cookie mechanics (ADR-0007). The cookie carries only the opaque
// session id — no claim, no user data. Attributes are non-negotiable except
// `secure`: that must be false over plain HTTP (the local compose stack and the
// E2E gate run without TLS; Caddy provides TLS in production only), so it is
// driven by the COOKIE_SECURE env var rather than hardcoded. httpOnly,
// SameSite=Lax, and Path=/ are constant and asserted from the Set-Cookie header
// in the E2E test.
//
// Reading and writing go through Elysia's typed cookie jar (`context.cookie` /
// `context.set.cookie`) rather than hand-parsing the Cookie header — the jar is
// already parsed for every request, is type-checked, and is where signing would
// plug in if a later slice needs it.

// The jar's element type is Elysia's `ElysiaCookie = CookieOptions & { value? }`,
// which is not re-exported, so the same structural shape is named here to keep
// the setters type-honest without any `unknown` cast. `cookie` itself is typed
// optional because Elysia declares `set.cookie?` that way — it is always present
// when a response is serialized, so the `??=` below is a runtime no-op that
// only satisfies the type.
type CookieJar = { cookie?: Record<string, CookieOptions & { value?: unknown }> };

/** Read the opaque session id from Elysia's parsed cookie jar, if present. */
export function readSessionId(cookie: Record<string, Cookie<unknown>>): string | null {
  const value = cookie[SESSION_COOKIE]?.value;
  return typeof value === "string" ? value : null;
}

/** Set the session cookie to `id` with the project's fixed attributes. */
export function setSessionCookie(set: CookieJar, id: string, secure: boolean): void {
  (set.cookie ??= {})[SESSION_COOKIE] = {
    value: id,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  };
}

/** Clear the session cookie by expiring it immediately. */
export function clearSessionCookie(set: CookieJar, secure: boolean): void {
  (set.cookie ??= {})[SESSION_COOKIE] = {
    value: "",
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  };
}
