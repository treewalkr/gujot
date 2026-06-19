import { eq } from "drizzle-orm";
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
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    // The `expires_at` column is mode: "string" (ISO), so persist the ISO form.
    await this.db.insert(sessions).values({ id, userId, expiresAt: expiresAt.toISOString() });
    return { id, userId, expiresAt };
  }

  async get(id: string): Promise<Session | null> {
    const [row] = await this.db.select().from(sessions).where(eq(sessions.id, id));
    if (!row) return null;
    // `expires_at` is stored as an ISO string (mode: "string" in the schema).
    const expiresAt = new Date(row.expiresAt);
    if (expiresAt.getTime() <= Date.now()) {
      // Reap expired sessions on read so a stale id can never authenticate.
      await this.db.delete(sessions).where(eq(sessions.id, id));
      return null;
    }
    return { id: row.id, userId: row.userId, expiresAt };
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.id, id));
  }
}
