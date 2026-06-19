// Password hashing (ADR-0007): argon2id via Bun.password — zero dependencies, no
// native compilation, OWASP-preferred. The salt is randomized per hash by
// Bun.password, so identical passwords yield distinct PHC strings. Both helpers
// are thin so the algorithm choice has one source; the auth route never reaches
// past this module.

/** Hash a plaintext password with argon2id, returning a PHC-format string. */
export function hashPassword(plaintext: string): Promise<string> {
  return Bun.password.hash(plaintext, "argon2id");
}

/** Verify a plaintext password against a stored PHC-format hash. */
export function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return Bun.password.verify(plaintext, hash);
}
