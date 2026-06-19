import { t } from "elysia";
import { table } from "./schema";
import { spreads } from "./utils";

// Validation-model singleton (Elysia Drizzle recipe). `db.insert` / `db.select`
// are *not* the runtime Postgres client — they spread each table's
// drizzle-typebox columns into a plain object so routes can compose t.Object
// schemas by picking fields. Spreading (rather than nesting a drizzle-typebox
// schema inside an Elysia type) is also what avoids the circular
// "type instantiation is possibly infinite" reference between drizzle-typebox
// and Elysia. The runtime client lives in client.ts (getDb).
//
// @see https://elysiajs.com/recipe/drizzle.html#table-singleton
export const db = {
  insert: spreads({ entries: table.entries }, "insert"),
  select: spreads({ entries: table.entries }, "select"),
} as const;

// Compose the API validation models from the spreads — the Drizzle table stays
// the single source of truth for the entry's shape. Declared as standalone
// variables (and built from the spread, not nested) so Elysia's type
// instantiation stays finite.
const selectColumns = db.select.entries;
const insertColumns = db.insert.entries;

/** A full entry as read from the DB and returned over the API. */
const entrySchema = t.Object({ ...selectColumns });

/** Fields a client supplies to create an entry; id and createdAt are server-set. */
const createEntrySchema = t.Object({
  amount: insertColumns.amount,
  currency: insertColumns.currency,
  label: insertColumns.label,
});

/** A page of entries. */
const entryListSchema = t.Array(entrySchema);

export { entrySchema, createEntrySchema, entryListSchema };

export type EntryDto = typeof entrySchema.static;
export type CreateEntryDto = typeof createEntrySchema.static;
