import { test, expect } from "bun:test";
import { InMemorySessionStore } from "../src/auth/in-memory-session-store";

// The SessionStore contract (ADR-0007): create / get / delete over an opaque
// session id. Tested against the in-memory double so the suite stays infra-free
// (no Postgres needed); the Postgres impl behind the same interface is proven by
// the E2E gate. These tests assert *behavior* of the contract, not the Map
// backing the double, so they survive any refactor.
test("create returns a session with a unique opaque id and a future expiry", async () => {
  const store = new InMemorySessionStore();
  const session = await store.create(42, 3600);

  expect(session.id).toHaveLength(36); // UUID-format opaque id
  expect(session.userId).toBe(42);
  expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
});

test("each created session gets a distinct id", async () => {
  const store = new InMemorySessionStore();
  const a = await store.create(1, 60);
  const b = await store.create(1, 60);
  expect(a.id).not.toBe(b.id);
});

test("get round-trips a created session by id", async () => {
  const store = new InMemorySessionStore();
  const created = await store.create(7, 3600);
  const found = await store.get(created.id);
  expect(found).toEqual(created);
});

test("get returns null for an unknown id", async () => {
  const store = new InMemorySessionStore();
  expect(await store.get("does-not-exist")).toBeNull();
});

test("get returns null for an expired session", async () => {
  const store = new InMemorySessionStore();
  const created = await store.create(1, -1); // already expired
  expect(await store.get(created.id)).toBeNull();
});

test("delete removes a session", async () => {
  const store = new InMemorySessionStore();
  const created = await store.create(1, 3600);
  await store.delete(created.id);
  expect(await store.get(created.id)).toBeNull();
});

test("delete is idempotent for an unknown id", async () => {
  const store = new InMemorySessionStore();
  await expect(store.delete("never-existed")).resolves.toBeUndefined();
});
