import { test, expect } from "bun:test";
import { hashPassword, verifyPassword } from "../src/auth/password";

// argon2id password hashing (ADR-0007) over Bun.password. The wrapper exists so
// the algorithm choice lives in one place and the auth route never calls
// Bun.password directly. Infra-free: Bun.password runs in-process.
test("hashPassword never returns the plaintext", async () => {
  const hash = await hashPassword("correct horse battery staple");
  expect(hash).not.toBe("correct horse battery staple");
  expect(hash.length).toBeGreaterThan(0);
});

test("hashPassword produces an argon2id PHC string", async () => {
  const hash = await hashPassword("secret");
  // Bun.password emits PHC-format hashes; argon2id's identifier is $argon2id$.
  expect(hash.startsWith("$argon2id$")).toBe(true);
});

test("the same password hashes to distinct values (random salt)", async () => {
  const a = await hashPassword("same-password");
  const b = await hashPassword("same-password");
  expect(a).not.toBe(b);
});

test("verifyPassword accepts the correct password", async () => {
  const hash = await hashPassword("hunter2");
  expect(await verifyPassword("hunter2", hash)).toBe(true);
});

test("verifyPassword rejects a wrong password", async () => {
  const hash = await hashPassword("hunter2");
  expect(await verifyPassword("wrong", hash)).toBe(false);
});
