import { eq } from "drizzle-orm";
import { getDb } from "../database/client";
import { users, type User } from "../database/schema";
import { PostgresSessionStore } from "./postgres-session-store";
import { readSessionId } from "./session-cookie";
import type { SessionStore } from "./session-store";

// The store is constructed lazily: getDb() throws without a DATABASE_URL, and
// importing `app` must stay side-effect-free so the infra-free /status and
// /openapi unit tests never need a DB. First use — on the first auth-gated
// request — opens the pooled client.
let store: SessionStore | undefined;
export function getSessionStore(): SessionStore {
  return (store ??= new PostgresSessionStore(getDb()));
}

/** A 401 response for unauthenticated requests to a protected route. */
export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

// Resolve the authenticated user for an incoming request, or null when there is
// no session cookie, the session is unknown/expired, or the user was deleted.
// Returning null (rather than throwing) lets each protected route decide how to
// reject — keeping this free of framework coupling and trivially testable.
export async function authenticate(request: Request): Promise<User | null> {
  const sid = readSessionId(request.headers);
  if (!sid) return null;
  const session = await getSessionStore().get(sid);
  if (!session) return null;
  const [user] = await getDb().select().from(users).where(eq(users.id, session.userId));
  return user ?? null;
}
