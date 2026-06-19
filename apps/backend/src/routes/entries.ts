import { Elysia } from "elysia";
import { desc } from "drizzle-orm";
import { getDb } from "../database/client";
import { entries } from "../database/schema";
import { createEntrySchema, entryListSchema, entrySchema } from "../database/model";

// One Elysia instance = one controller (MVC, Elysia pattern). Validation models
// are composed from the Drizzle table's spreads in src/database/model.ts and
// registered by name so they surface in OpenAPI and tighten Eden's inferred
// contract; body and response schemas reference those names.
export const entriesRoutes = new Elysia({ prefix: "/entries", name: "Entries", tags: ["entries"] })
  .model({
    entry: entrySchema,
    "entry.create": createEntrySchema,
    "entry.list": entryListSchema,
  })
  .get(
    "",
    async () => {
      // TODO(slice growth): return all rows for now; add limit/cursor pagination
      // before the ledger grows enough for this to matter.
      return getDb().select().from(entries).orderBy(desc(entries.id));
    },
    {
      response: "entry.list",
      detail: {
        summary: "List entries",
        description: "Returns every ledger entry, newest first.",
      },
    },
  )
  .post(
    "",
    async ({ body }) => {
      const [row] = await getDb().insert(entries).values(body).returning();
      return row;
    },
    {
      body: "entry.create",
      response: "entry",
      detail: {
        summary: "Create an entry",
        description: "Persists a Money value as a ledger entry.",
      },
    },
  );
