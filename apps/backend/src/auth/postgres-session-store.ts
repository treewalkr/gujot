import { and, eq, gt, sql } from "drizzle-orm";
import type { DB } from "../database/client";
import { sessions } from "../database/schema";
import type { Session, SessionStore } from "./session-store";

// PostgresSessionStore (ADR-0007): the always-available session backend. The
// opaque session id is both the cookie value and the `sessions` primary key, so
// create/get/delete are single-row operations. Not unit-tested infra-free — it
// needs Postgres — so its correctness is proven by the E2E gate running against
// the real DB. The in-memory double covers the contract; this covers the wire.
export class PostgresSessionStore implements SessionStore {
  constructor(private readonly db: DB) {}

  async create(userId: number, ttlSeconds: number): Promise<Session> {
    // crypto.randomUUID() is the unguessable session token — a v4 UUID carries
    // 122 bits of entropy, far beyond any feasible online brute force. The id is
    // also the DB primary key, so uniqueness is enforced on write.
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    // The `expires_at` column is mode: "string" (ISO), so persist the ISO form.
    await this.db.insert(sessions).values({ id, userId, expiresAt: expiresAt.toISOString() });
    return { id, userId, expiresAt };
  }

  async get(id: string): Promise<Session | null> {
    // Filter at the DB so an expired (or unknown) session is a single query and
    // never loads a dead row into JS. `expires_at` is a timestamptz column —
    // `mode: "string"` only shapes the JS value, not the SQL type — so it
    // compares directly against `now()`. A stale id can therefore never
    // authenticate; cleanup of already-expired rows is a separate concern
    // (TODO: a periodic reaper) rather than a per-read delete round-trip.
    const [row] = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, id), gt(sessions.expiresAt, sql`now()`)));
    if (!row) return null;
    const expiresAt = new Date(row.expiresAt);
    return { id: row.id, userId: row.userId, expiresAt };
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.id, id));
  }
}
