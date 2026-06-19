import { bigint, integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { CURRENCIES } from "@gujot/shared";

// A ledger entry: a stored Money value (ADR-0004). This table is the single
// source of truth for the entry's shape — the API validation models are derived
// from it via drizzle-typebox, and the column names are the wire field names.
//
// Money is held as integer `amount` (minor units) plus a `currency` enum whose
// values come from @gujot/shared's CURRENCIES, so the DB, the API, and the
// Money primitive all agree on which currency codes exist.

export const currencyEnum = pgEnum("currency", [...CURRENCIES]);

export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  // bigint (int64) mapped to a JS number. int32 (integer) capped at ~$21M of
  // minor units, below what Money can represent (up to Number.MAX_SAFE_INTEGER);
  // int64 storage removes the DB as the binding constraint. mode: "number"
  // keeps the wire shape a JSON number — no BigInt serialization.
  amount: bigint("amount", { mode: "number" }).notNull(),
  currency: currencyEnum("currency").notNull(),
  label: text("label").notNull(),
  // mode: "string" returns ISO strings (not Date), matching the JSON wire shape
  // and the drizzle-typebox select schema used for response validation.
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;

// An auth user (ADR-0007): email + an argon2id password hash. Email is unique —
// registration and login key off it. The hash column holds a PHC-format string
// from Bun.password; the plaintext is never stored.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// A session (ADR-0007): an opaque, unguessable id is both the cookie value and
// the primary key. It carries no claim and no user data — the server looks the
// user up by id on every protected request. Cascades on user delete so deleting
// a user revokes every session ("log out everywhere").
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export type SessionRow = typeof sessions.$inferSelect;
export type NewSessionRow = typeof sessions.$inferInsert;

// Table singleton (Elysia Drizzle recipe): one registry of every table, used by
// src/database/model.ts to derive the validation spreads. Add new tables here.
export const table = { entries, users, sessions } as const;
export type Table = typeof table;
