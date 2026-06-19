import { Elysia, status } from "elysia";
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

async function findUserById(id: number): Promise<User | null> {
  const [row] = await getDb().select().from(users).where(eq(users.id, id));
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
      async resolve({ request }: { request: Request }) {
        const sid = readSessionId(request.headers);
        const session = sid ? await getSessionStore().get(sid) : null;
        const currentUser = session ? await findUserById(session.userId) : null;
        if (!currentUser) return status(401, { error: "unauthorized" });
        return { currentUser };
      },
    };
  },
});
