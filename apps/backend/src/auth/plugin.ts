import { Elysia, status } from "elysia";
import type { Cookie } from "elysia";
import { RedisClient } from "bun";
import { eq } from "drizzle-orm";
import { getDb } from "../database/client";
import { users } from "../database/schema";
import { PostgresSessionStore } from "./postgres-session-store";
import { BunRedisCommands } from "./redis-commands";
import { RedisSessionStore } from "./redis-session-store";
import { FallbackSessionStore } from "./fallback-session-store";
import { readSessionId } from "./session-cookie";
import type { SessionStore } from "./session-store";

// The user shape carried in request context after auth resolves. Deliberately
// just id + email — the password hash must never enter context, so the protected
// route can't accidentally serialize it and a wider select is never tempted.
export type CurrentUser = { id: number; email: string };

// The store is constructed lazily: getDb() throws without a DATABASE_URL, and
// importing `app` must stay side-effect-free so the infra-free /status and
// /openapi unit tests never need a DB. First use — on the first auth-gated
// request — opens the pooled client (and, if REDIS_URL is set, the Redis one).
let store: SessionStore | undefined;
export function getSessionStore(): SessionStore {
  return (store ??= buildSessionStore());
}

// Pure selection: which store backs sessions given an optional Redis store and
// the always-available Postgres store (ADR-0007 / #5). Extracted from
// buildSessionStore so the Redis-vs-Postgres decision and the primary/fallback
// ordering are unit-testable without constructing real clients (which need
// infra). Redis is the primary when present; Postgres is always the fallback.
export function selectSessionStore(
  redis: SessionStore | null,
  postgres: SessionStore,
): SessionStore {
  return redis ? new FallbackSessionStore(redis, postgres) : postgres;
}

// Build the session store graph from config. Postgres is always available;
// Redis joins as an optional primary when REDIS_URL is set, with Postgres
// wrapping in as the fallback. REDIS_URL is a boot/construction read, so it
// comes straight from process.env (ADR-0009). All construction is lazy —
// new RedisClient(url) opens nothing until the first command — so this stays
// side-effect-free until the first auth-gated request.
function buildSessionStore(): SessionStore {
  const postgres = new PostgresSessionStore(getDb());
  const redisUrl = process.env.REDIS_URL;
  const redis = redisUrl
    ? new RedisSessionStore(new BunRedisCommands(new RedisClient(redisUrl)))
    : null;
  return selectSessionStore(redis, postgres);
}

async function findUserById(id: number): Promise<CurrentUser | null> {
  const [row] = await getDb()
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, id));
  return row ?? null;
}

// The auth plugin (ADR-0007). `isAuth` is a route-level macro: apply
// `{ isAuth: true }` to a route and, before its handler runs, the session cookie
// is resolved to the current user — rejecting with 401 when there is no valid
// session, and otherwise adding a non-null `currentUser` to the handler's
// context. Mounted via `.use(auth)` on any protected route group; public routes
// and the infra-free unit tests never touch the DB through this path.
export const auth = new Elysia({ name: "auth" }).macro({
  isAuth(enabled: boolean) {
    if (!enabled) return {};
    return {
      // Elysia parses the Cookie header into the typed jar before resolve runs,
      // so read from it directly rather than reaching into request.headers.
      async resolve({ cookie }: { cookie: Record<string, Cookie<unknown>> }) {
        const sid = readSessionId(cookie);
        const session = sid ? await getSessionStore().get(sid) : null;
        const currentUser = session ? await findUserById(session.userId) : null;
        if (!currentUser) return status(401, { error: "unauthorized" });
        return { currentUser };
      },
    };
  },
});
