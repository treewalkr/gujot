import { test, expect } from "bun:test";
import { selectSessionStore } from "../src/auth/plugin";
import { InMemorySessionStore } from "../src/auth/in-memory-session-store";
import type { SessionStore } from "../src/auth/session-store";

// The config-driven selection (ADR-0007 / #5): which store backs sessions given
// an optional Redis store and the always-available Postgres store. Tested in
// isolation (no real clients) to pin two things the FallbackSessionStore tests
// can't: the null branch returns Postgres unwrapped, and when Redis is present
// it is the *primary* with Postgres the *fallback* (argument order). A swapped
// order would route a Redis outage straight to 500 instead of degrading.

const BOOM = new Error("this store must not be consulted");

// Tripwire: if the selection ever routes an op here unexpectedly, the test
// rejects. Reusing InMemorySessionStore for the store that *should* be hit.
class ThrowingSessionStore implements SessionStore {
  create(): Promise<never> {
    throw BOOM;
  }
  get(): Promise<never> {
    throw BOOM;
  }
  delete(): Promise<never> {
    throw BOOM;
  }
}

test("with no Redis store, Postgres is returned unchanged", () => {
  const postgres = new InMemorySessionStore();
  expect(selectSessionStore(null, postgres)).toBe(postgres);
});

test("with a Redis store, Redis is primary and Postgres is the fallback", async () => {
  // A session created through the selection lands in Redis (the primary): the
  // throwing Postgres tripwire proves create did not fall through to it.
  const redis = new InMemorySessionStore();
  const selected = selectSessionStore(redis, new ThrowingSessionStore());
  const session = await selected.create(1, 3600);
  expect(await redis.get(session.id)).toEqual(session);
});
