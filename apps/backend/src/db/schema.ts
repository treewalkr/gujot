import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// A ledger entry: a stored Money value (ADR-0004). Money is held as integer
// minor units (amount_minor) plus its ISO 4217 currency code, so the same
// representation the @gujot/shared Money primitive uses is what persists.

export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
