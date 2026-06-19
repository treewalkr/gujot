// The session store abstraction (ADR-0007): sessions are opaque server-side
// records keyed by an unguessable id, carried in a cookie. The interface is the
// seam between the auth plugin (which only knows create/get/delete) and the
// storage backend. Postgres is the always-available baseline (this slice);
// Redis arrives as an optional second impl in #5. An in-memory impl ships here
// too — it is the infra-free double the unit tests run against, and a legitimate
// simple impl in its own right.

/** A persisted session: an opaque id, the user it belongs to, and its expiry. */
export interface Session {
  /** Opaque, unguessable token stored in the session cookie. Carries no claim. */
  id: string;
  userId: number;
  expiresAt: Date;
}

/** Create/read/delete sessions by opaque id. Implementations must be time-aware. */
export interface SessionStore {
  /** Create a new session for `userId`, expiring after `ttlSeconds`. */
  create(userId: number, ttlSeconds: number): Promise<Session>;
  /** Return the session for `id`, or null if unknown or expired. */
  get(id: string): Promise<Session | null>;
  /** Remove the session for `id`; a no-op if it never existed. */
  delete(id: string): Promise<void>;
}
