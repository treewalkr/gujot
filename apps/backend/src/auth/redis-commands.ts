import type { RedisClient } from "bun";

// The Redis command surface RedisSessionStore needs (ADR-0007 / #5). Naming the
// operations explicitly — rather than depending on Bun's RedisClient directly —
// is the dependency-inversion seam: the store programs against this tiny
// interface, and the contract tests supply an in-memory double (no Redis
// process, no network). The production adapter below is the only place that
// knows about Bun's client, so the store stays infra-free and the fake stays
// honest about behavior, not implementation.
//
// The interface is shaped by the three SessionStore operations: create needs an
// atomic write-with-TTL (SETEX), get needs a string lookup, delete needs a key
// removal. Redis reaps expired keys itself, so — unlike Postgres — there is no
// per-read expiry check and no lazy reaper: a key that still resolves is, by
// Redis's guarantee, not yet expired.

/** The minimal Redis command set a session store relies on. */
export interface RedisCommands {
  /** Set `key` to `value`, expiring after `seconds`. Atomic (SETEX). */
  setex(key: string, seconds: number, value: string): Promise<unknown>;
  /** Return the string at `key`, or null if it is absent or expired. */
  get(key: string): Promise<string | null>;
  /** Remove `key`; a no-op if it never existed. */
  del(key: string): Promise<unknown>;
}

/**
 * Production adapter: maps the `RedisCommands` seam onto Bun's built-in
 * RedisClient (`import { RedisClient } from "bun"`, added in Bun 1.2.9). The
 * connection is lazy — `new RedisClient(url)` opens nothing until the first
 * command — so constructing this is side-effect-free and importing the app
 * stays infra-free for unit tests.
 *
 * `setex` uses the raw `SETEX` command via `send` (the typed client has no
 * set-with-TTL overload) so the write and its expiry land atomically.
 */
export class BunRedisCommands implements RedisCommands {
  constructor(private readonly client: RedisClient) {}

  setex(key: string, seconds: number, value: string): Promise<unknown> {
    return this.client.send("SETEX", [key, String(seconds), value]);
  }

  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  del(key: string): Promise<unknown> {
    return this.client.del(key);
  }
}

/** The persisted shape stored under each session key. */
export interface StoredSession {
  userId: number;
  expiresAt: string; // ISO, mirroring the Postgres column's wire form
}
