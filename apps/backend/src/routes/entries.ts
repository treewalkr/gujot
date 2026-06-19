import { Elysia, t } from "elysia";
import { desc } from "drizzle-orm";
import { getDb } from "../db/client";
import { entries, type Entry } from "../db/schema";
import { CURRENCIES, type Currency } from "@gujot/shared";

// The on-the-wire shape of a stored entry. `amount` is integer minor units —
// the same representation the @gujot/shared Money primitive uses — so a client
// (the frontend, over Eden) reconstructs Money.of(amount, currency) losslessly.
export interface EntryDto {
  id: number;
  amount: number;
  currency: Currency;
  label: string;
  createdAt: string;
}

// TypeBox schema for the currency literals, derived from @gujot/shared so the
// API never accepts a code the Money primitive does not understand.
const currencySchema = t.Union(
  CURRENCIES.map((c) => t.Literal(c)),
);

function toDto(row: Entry): EntryDto {
  return {
    id: row.id,
    amount: row.amountMinor,
    currency: row.currency as Currency,
    label: row.label,
    createdAt: row.createdAt.toISOString(),
  };
}

export const entriesRoutes = new Elysia().get("/entries", async () => {
  const rows = await getDb().select().from(entries).orderBy(desc(entries.id));
  return rows.map(toDto);
}).post(
  "/entries",
  async ({ body }) => {
    const [row] = await getDb()
      .insert(entries)
      .values({
        amountMinor: body.amount,
        currency: body.currency,
        label: body.label,
      })
      .returning();
    return toDto(row);
  },
  {
    body: t.Object({
      amount: t.Integer(),
      currency: currencySchema,
      label: t.String({ minLength: 1 }),
    }),
  },
);
