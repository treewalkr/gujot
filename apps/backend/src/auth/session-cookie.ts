// Session cookie mechanics (ADR-0007). The cookie carries only the opaque
// session id — no claim, no user data. Attributes are non-negotiable except
// `secure`: that must be false over plain HTTP (the local compose stack and the
// E2E gate run without TLS; Caddy provides TLS in production only), so it is
// driven by the COOKIE_SECURE env var rather than hardcoded. httpOnly,
// SameSite=Lax, and Path=/ are constant and asserted from the Set-Cookie header
// in the E2E test.

export const SESSION_COOKIE = "session";

/** Read the opaque session id from an incoming Cookie header, if present. */
export function readSessionId(headers: Headers): string | null {
  const header = headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return null;
}

// Elysia's `set.cookie` is typed as optional, though it is always present when a
// response is serialized. The `??=` keeps the helpers type-honest and is a
// runtime no-op.
type CookieJar = { cookie?: Record<string, unknown> };

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
