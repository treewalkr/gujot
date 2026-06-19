# Backend context — the Elysia API

The Elysia backend: data model, validation, and business rules for personal
finance. Sibling to [`apps/frontend/CONTEXT.md`](../frontend/CONTEXT.md);
system-wide decisions live in [`docs/adr/`](../../docs/adr/).

## Domain glossary

- **Money** — a value object representing an amount in a specific currency, held
  as **integer minor units** (cents) to avoid floating-point error. Defined in
  [`@gujot/shared`](../../packages/shared/src/index.ts) (`Money.of`, `.add`,
  `.subtract`, `.equals`, `.format`, `.fromDecimal`). Construct via `Money.of`,
  never `new`. Same-currency arithmetic only; mismatched currencies throw.
- **Currency** — an ISO 4217 code from the curated set in `@gujot/shared`'s
  `CURRENCIES` (`USD`, `EUR`, `GBP`). This tuple is the single source for valid
  codes; the DB `currency` column is a `pgEnum` built from it.
- **minor units** — the integer count of the smallest currency unit (e.g. 1500 =
  $15.00). The wire `amount` field and the `entries.amount` column are both minor
  units, matching `Money.amount`.
- **Entry** — one persisted Money value: a row in the `entries` table
  (`amount`, `currency`, `label`, `createdAt`). The backend writes and reads
  these via Drizzle.
- **Ledger** — the collection of entries, surfaced as `GET /entries`
  (newest first) and created via `POST /entries`.

## Conventions

- **Drizzle schema is the single source of truth** for an entry's shape. API
  validation models are derived from the `entries` table via `drizzle-typebox`
  (`createSelectSchema` / `createInsertSchema`) in
  [`src/db/models.ts`](src/db/models.ts) — not hand-written. See
  [ADR-0008](../../docs/adr/0008-elysia-drizzle-single-source-models.md).
- **No interface/class DTOs.** DTO types come from `typeof schema.static`, so the
  wire shape, the validation, and the DB cannot drift apart.
- **Controller-as-Elysia-instance.** One `Elysia({ prefix })` instance per
  resource (e.g. `entriesRoutes`), `.use`d into the app in `src/index.ts`.
  Business logic stays in inline handlers unless it grows real rules, then it
  moves to a service.
- **`type App` is the Eden contract.** `src/index.ts` exports `type App`; the
  frontend imports it (compile-time only) to build the Eden treaty client
  ([ADR-0001](../../docs/adr/0001-elysia-eden-typed-client.md)). Changing a route
  signature is a frontend type error.
- **DB connections are lazy and dual** (ADR-0004). `getDb()` opens the pooled
  runtime connection on first use (so importing `app` is side-effect-free and
  infra-free unit tests need no DB); migrations use the direct connection in
  `drizzle.config.ts`. Read both from `process.env` at boot.
