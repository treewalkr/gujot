import type { Session, SessionStore } from "./session-store";

// Infra-free SessionStore: a Map keyed by session id. Used by the unit tests
// (so they need no Postgres) and viable as a zero-dependency dev fallback. Not
// suitable for production — state is per-process and lost on restart — which is
// exactly why the Postgres impl exists. Implements the same interface, so the
// contract tests exercise behavior that every impl must honor.
export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, Session>();

  async create(userId: number, ttlSeconds: number): Promise<Session> {
    const session: Session = {
      // crypto.randomUUID() is the unguessable session token — a v4 UUID carries
      // 122 bits of entropy, far beyond any feasible online brute force. The id
      // is also the DB primary key, so uniqueness is enforced on write.
      id: crypto.randomUUID(),
      userId,
      // Date arithmetic is fine here — this is runtime/test code, not a
      // workflow script. `ttlSeconds` may be negative to express "already
      // expired," which the expiry test relies on.
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async get(id: string): Promise<Session | null> {
    const session = this.sessions.get(id);
    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) {
      // Lazily reap expired sessions so a stale id can't resolve.
      this.sessions.delete(id);
      return null;
    }
    return session;
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }
}
