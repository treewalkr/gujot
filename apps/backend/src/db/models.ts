import { t } from "elysia";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { entries } from "./schema";

// API validation models, derived from the Drizzle table — the single source of
// truth for an entry's shape. Declared as standalone variables (not nested
// inline) so Elysia's type instantiation stays finite; see
// https://elysiajs.com/recipe/drizzle.html#type-instantiation-error.

/** A full entry as read from the DB and returned over the API. */
const entrySchema = createSelectSchema(entries);

/** Fields a client supplies to create an entry; id and createdAt are server-set. */
const insertEntry = createInsertSchema(entries);
const createEntrySchema = t.Omit(insertEntry, ["id", "createdAt"]);

/** A page of entries. */
const entryListSchema = t.Array(entrySchema);

export { entrySchema, createEntrySchema, entryListSchema };

export type EntryDto = typeof entrySchema.static;
export type CreateEntryDto = typeof createEntrySchema.static;
