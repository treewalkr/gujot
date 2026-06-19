import type { RedisCommands, StoredSession } from "./redis-commands";
import type { Session, SessionStore } from "./session-store";

// RedisSessionStore (ADR-0007 / #5): the optional, lower-latency session
// backend, used when REDIS_URL is configured. Like the Postgres impl it
// programs only against the SessionStore contract, but persists to Redis
// through the RedisCommands seam — so it is infra-free unit-testable (an
// in-memory double stands in for the client) and the wire format is the only
// thing this class adds over the contract.
//
// A session lives under `session:<id>` as a JSON `{userId, expiresAt}` value,
// written with SETEX so Redis owns the TTL and reaps expired keys itself. That
// makes expiry a property of the store, not a per-read check (contrast
// PostgresSessionStore's `gt(expiresAt, now())`): a key that GET resolves is, by
// Redis's guarantee, not yet expired. The opaque id is generated here with the
// same crypto.randomUUID() used by the other impls (122 bits of entropy, and
// unguessable regardless of backend).

const KEY_PREFIX = "session:";

export class RedisSessionStore implements SessionStore {
  constructor(private readonly redis: RedisCommands) {}

  async create(userId: number, ttlSeconds: number): Promise<Session> {
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const stored: StoredSession = { userId, expiresAt: expiresAt.toISOString() };
    await this.redis.setex(KEY_PREFIX + id, ttlSeconds, JSON.stringify(stored));
    return { id, userId, expiresAt };
  }

  async get(id: string): Promise<Session | null> {
    const raw = await this.redis.get(KEY_PREFIX + id);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredSession;
    return { id, userId: stored.userId, expiresAt: new Date(stored.expiresAt) };
  }

  async delete(id: string): Promise<void> {
    await this.redis.del(KEY_PREFIX + id);
  }
}
