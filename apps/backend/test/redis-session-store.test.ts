import { test, expect } from "bun:test";
import { RedisSessionStore } from "../src/auth/redis-session-store";
import type { RedisCommands } from "../src/auth/redis-commands";

// Infra-free SessionStore contract for the Redis impl (ADR-0007 / #5), run
// against an in-memory FakeRedisCommands double so no Redis process is needed.
// The Postgres impl is proven by the E2E gate; this proves the Redis store
// honors the same SessionStore contract through the RedisCommands seam. These
// tests assert *behavior* (the contract every impl must satisfy), not the
// JSON/Bun-wire details, so they survive any refactor.

// A minimal in-memory Redis double: stores values with a TTL and reaps expired
// keys on read, exactly like real Redis. Lives in the test (not src) because it
// is test scaffolding — the production client is BunRedisCommands.
class FakeRedisCommands implements RedisCommands {
  private readonly values = new Map<string, string>();
  private readonly expiresAt = new Map<string, number>();

  async setex(key: string, seconds: number, value: string): Promise<unknown> {
    this.values.set(key, value);
    this.expiresAt.set(key, Date.now() + seconds * 1000);
    return "OK";
  }

  async get(key: string): Promise<string | null> {
    const exp = this.expiresAt.get(key);
    if (exp !== undefined && exp <= Date.now()) {
      this.values.delete(key);
      this.expiresAt.delete(key);
      return null;
    }
    return this.values.get(key) ?? null;
  }

  async del(key: string): Promise<unknown> {
    this.values.delete(key);
    this.expiresAt.delete(key);
    return 1;
  }
}

test("create returns a session with a unique opaque id and a future expiry", async () => {
  const redis = new FakeRedisCommands();
  const store = new RedisSessionStore(redis);

  const session = await store.create(42, 3600);

  expect(session.id).toHaveLength(36); // UUID-format opaque id
  expect(session.userId).toBe(42);
  expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
});

test("each created session gets a distinct id", async () => {
  const store = new RedisSessionStore(new FakeRedisCommands());
  const a = await store.create(1, 60);
  const b = await store.create(1, 60);
  expect(a.id).not.toBe(b.id);
});

test("get round-trips a created session by id", async () => {
  const store = new RedisSessionStore(new FakeRedisCommands());
  const created = await store.create(7, 3600);
  const found = await store.get(created.id);
  expect(found).toEqual(created);
});

test("get returns null for an unknown id", async () => {
  const store = new RedisSessionStore(new FakeRedisCommands());
  expect(await store.get("does-not-exist")).toBeNull();
});

test("get returns null for an expired session (Redis reaps via TTL)", async () => {
  const redis = new FakeRedisCommands();
  const store = new RedisSessionStore(redis);
  const created = await store.create(1, -1); // already expired
  expect(await store.get(created.id)).toBeNull();
});

test("delete removes a session", async () => {
  const store = new RedisSessionStore(new FakeRedisCommands());
  const created = await store.create(1, 3600);
  await store.delete(created.id);
  expect(await store.get(created.id)).toBeNull();
});

test("delete is idempotent for an unknown id", async () => {
  const store = new RedisSessionStore(new FakeRedisCommands());
  await expect(store.delete("never-existed")).resolves.toBeUndefined();
});
