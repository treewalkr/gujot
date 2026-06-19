import { test, expect } from "bun:test";
import { FallbackSessionStore } from "../src/auth/fallback-session-store";
import { InMemorySessionStore } from "../src/auth/in-memory-session-store";
import type { SessionStore } from "../src/auth/session-store";

// FallbackSessionStore (ADR-0007 / #5): when REDIS_URL is set, the Redis store
// is primary and Postgres is the safety net. These tests pin the resilience
// contract through the SessionStore interface alone — primary health vs.
// primary failure vs. a legitimate miss — using doubles, so no infra is
// needed. The behavior, not the wrapping, is what's asserted.

const BOOM = new Error("primary unreachable");

// A store whose every op rejects — used as a *tripwire*: if the fallback ever
// consults it when it shouldn't, the test throws and fails. Also stands in for
// a Redis that is configured but down (every command rejected).
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

test("create delegates to a healthy primary without touching the fallback", async () => {
  // The throwing fallback is the tripwire: had create fallen through to it,
  // this test would reject.
  const store = new FallbackSessionStore(new InMemorySessionStore(), new ThrowingSessionStore());

  const session = await store.create(5, 3600);
  expect(session.userId).toBe(5);
  expect(await store.get(session.id)).toEqual(session); // round-trips via primary
});

test("get falls back to the secondary when the primary errors", async () => {
  const secondary = new InMemorySessionStore();
  const existing = await secondary.create(9, 3600); // lives only in the fallback
  const store = new FallbackSessionStore(new ThrowingSessionStore(), secondary);

  expect(await store.get(existing.id)).toEqual(existing);
});

test("create falls back to the secondary when the primary errors", async () => {
  const secondary = new InMemorySessionStore();
  const store = new FallbackSessionStore(new ThrowingSessionStore(), secondary);

  const session = await store.create(3, 3600);
  expect(await secondary.get(session.id)).toEqual(session); // landed in the fallback
});

test("delete falls back to the secondary when the primary errors", async () => {
  const secondary = new InMemorySessionStore();
  const existing = await secondary.create(2, 3600);
  const store = new FallbackSessionStore(new ThrowingSessionStore(), secondary);

  await store.delete(existing.id);
  expect(await secondary.get(existing.id)).toBeNull();
});

test("a null miss on a healthy primary does NOT fall back", async () => {
  // Primary is up but has no such session (a real miss, not an outage). The
  // throwing fallback is the tripwire: get must resolve null from the primary
  // and never consult the fallback.
  const store = new FallbackSessionStore(new InMemorySessionStore(), new ThrowingSessionStore());

  await expect(store.get("absent")).resolves.toBeNull();
});
