# Elysia Eden as the end-to-end typed client

**Status:** accepted

The frontend (SvelteKit) calls the backend (Elysia) through Elysia **Eden** — a typed
client that imports the *live route type* of the running Elysia server directly, with no
code generation or OpenAPI step. The backend package is a workspace dependency of the
frontend; changing a route signature on the backend becomes a compile-time type error at
the frontend call site until fixed. TanStack Query layers on top of Eden for caching,
refetch, and loading state — it is the cache layer, Eden is the transport.

## Considered options

- **Eden (chosen).** Compile-time-only type coupling via direct workspace import. Zero
  runtime overhead, zero codegen, zero drift. Requires both apps in one repo with the
  backend as a frontend dependency.
- **Generated client (OpenAPI via `@elysiajs/openapi` → codegen → typed fetch).** Loosely
  coupled; works across separate repos. Rejected: pays a codegen-and-regenerate tax
  preemptively, for a coupling we *want*.
- **Plain `fetch` + hand-typed responses.** No coupling, no safety. Rejected: for a
  personal-finance app, amounts/dates/account-IDs must be typed end to end.

## Consequences

- The monorepo is **architectural, not cosmetic** — the frontend literally cannot type its
  API calls without importing the backend package.
- Splitting frontend and backend into separate repos would require migrating Eden → a
  generated client. Do not assume the repo can be trivially cleaved later.
- The backend must export its instantiated `Elysia` app's type (`export type App = typeof app`)
  for the frontend to import.
