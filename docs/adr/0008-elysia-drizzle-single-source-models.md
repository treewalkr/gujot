# ADR-0008: Derive Elysia API models from the Drizzle schema (single source of truth)

**Status:** accepted

## Context

Slice 2 (#3) introduced the `entries` table and `POST`/`GET /entries`. The first
cut defined the entry's shape three separate times: a Drizzle table, a
hand-written TypeBox body schema, and a TypeScript `EntryDto` **interface**, plus
a `t.Enum(Object.fromEntries(...))` workaround for the currency field. Nothing
linked these definitions — they could (and would) drift, and the interface-as-DTO
pattern fights Elysia's "validation is the single source of truth for both type
and runtime" principle.

This is a finance domain: the wire shape, the validation, and the persisted row
must stay locked together.

## Decision

**The Drizzle schema is the single source of truth for every entry's shape.**
API validation models are derived from it with
[`drizzle-typebox`](https://orio.dev/docs/drizzle-typebox) and consumed by Elysia
and Eden:

```
Drizzle table → drizzle-typebox (createSelectSchema / createInsertSchema)
             → Elysia body/response models (registered by name)
             → Eden treaty type App → frontend types
```

Concretely, in `apps/backend/src/db/models.ts`:

- `entrySchema` = `createSelectSchema(entries)` — full row, used for responses.
- `createEntrySchema` = `t.Omit(createInsertSchema(entries), ["id", "createdAt"])`
  — what a client posts.
- DTO types are `typeof schema.static`, never a hand-written `interface`.

The column names **are** the wire field names (`amount`, `currency`, `label`),
so no mapping layer is needed between the DB row and the API response — a handler
returns the Drizzle row directly. `currency` is a `pgEnum` built from
`@gujot/shared`'s `CURRENCIES`, so the enum values flow shared → DB → API without
a second list.

Routes register the derived schemas as named models (`.model({ entry,
"entry.create", "entry.list" })`) and reference them by name in `body` and
`response`, which also surfaces them in OpenAPI and tightens Eden's inferred
contract.

### Supporting decisions

- **Pin `@sinclair/typebox`** via npm `overrides` so `drizzle-typebox` and Elysia
  share one TypeBox version. Different versions carry different `Symbol`s and
  validation silently breaks.
- **`drizzle-orm` ≥ 0.37** is required: `drizzle-typebox` imports `isView` /
  `isTable` / `getTableColumns` from the drizzle-orm barrel, which those versions
  added. 0.36 fails at module load.
- **`timestamp` columns use `mode: "string"`** so Drizzle returns ISO strings,
  matching the JSON wire shape and the derived select schema (no `Date` vs string
  mismatch under response validation).
- **Controller-as-Elysia-instance** (one `Elysia({ prefix })` per resource), per
  the Elysia MVC pattern — not a `Context`-coupled controller class.

## Consequences

- Adding a column to `entries` automatically extends the API contract and the
  frontend types; there is exactly one place to change.
- No `interface`/class DTOs, no hand-maintained body/response schemas, no
  `toDto` mapping.
- New tables follow the same recipe: define the Drizzle table, derive the
  schemas in `src/db/models.ts`, register and reference them in a route module.
- Cost: a `drizzle-typebox` runtime dependency and a TypeBox version pin to
  maintain. If a Drizzle type can't be expressed as we want, we refine it
  explicitly via `createSelectSchema(table, { col: t.String(...) })` rather than
  abandoning the single-source approach.

## Rejected

- **Hand-written TypeBox schemas + a TS interface per shape** — the original
  approach; duplicates the definition and lets them drift.
- **Generating models from the frontend / sharing validation client-side** —
  rejected by [ADR-0003](./0003-no-client-side-validation-reuse.md); the backend
  owns the API contract.
