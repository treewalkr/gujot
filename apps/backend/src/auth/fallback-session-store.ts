import type { Session, SessionStore } from "./session-store";

// FallbackSessionStore (ADR-0007 / #5): the resilience layer that makes Redis
// optional at runtime. When REDIS_URL is configured, the Redis store is primary
// and Postgres wraps in as the fallback; with no REDIS_URL, this class is not
// used and Postgres stands alone.
//
// The contract is narrow and deliberate: the secondary is consulted *only* when
// the primary rejects (Redis is configured but unreachable). A legitimate null
// miss from a healthy primary is NOT a failure — the session genuinely doesn't
// exist — so it does not trigger a fallback round-trip. This keeps the
// "Redis is the store when enabled; Postgres is the safety net when Redis is
// down" guarantee honest, and avoids doubling latency on every cache miss.
//
// Availability, not state replication: a session created on a healthy Redis is
// not copied to Postgres, so a Redis that later loses it (restart, eviction)
// means that one session 401s and the user re-authenticates into Postgres. That
// tradeoff is accepted because Redis is infra, not a source of truth.

export class FallbackSessionStore implements SessionStore {
  constructor(
    private readonly primary: SessionStore,
    private readonly fallback: SessionStore,
  ) {}

  async create(userId: number, ttlSeconds: number): Promise<Session> {
    try {
      return await this.primary.create(userId, ttlSeconds);
    } catch {
      return this.fallback.create(userId, ttlSeconds);
    }
  }

  async get(id: string): Promise<Session | null> {
    try {
      return await this.primary.get(id);
    } catch {
      return this.fallback.get(id);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.primary.delete(id);
    } catch {
      await this.fallback.delete(id);
    }
  }
}
