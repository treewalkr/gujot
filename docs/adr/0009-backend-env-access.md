# ADR-0009: Backend environment access — validated plugin for request scope, `process.env` for boot

**Status:** accepted

## Context

The backend reads configuration from the environment in two distinct situations,
which have different constraints:

1. **Request-scoped** — values a route handler wants typed access to at request
   time.
2. **Boot / app-construction** — values read once while building the app, before
   any request exists: the listen port (`server.ts`) and the Postgres connection
   URLs (`db/client.ts`).

`@yolk-oss/elysia-env` gives a TypeBox-validated environment attached as an
Elysia **decorator**, which is ideal for case 1 — fail-fast validation at boot,
typed request-scoped access, self-documenting schema. But it validates at
instantiation, and the decorator only exists inside the Elysia instance, so it
cannot serve case 2 (the listen port is read in `server.ts`; the DB client is
constructed on the app-construction path).

There is also a testability constraint: importing `app` (e.g. the `/status` unit
test) must stay **side-effect-free** — it must not require a live `DATABASE_URL`
or open a connection. This is why the DB client is lazy (`getDb()` opens on first
use), and it rules out validating `DATABASE_URL` in the boot-time plugin.

## Decision

Two access modes, chosen by *when* the value is read:

- **Request-scoped reads → the `elysia-env` plugin** (`src/env.ts`). Declare the
  var in the TypeBox schema; handlers read it via the validated decorator. This
  is the encouraged, general pattern for anything a handler needs.
- **Boot / app-construction reads → `process.env` directly.** Used for the listen
  port and the DB connection URLs, which run outside request scope. The DB client
  stays lazy so importing `app` has no side effects.

`.env.example` remains the single catalog of every env var shared across
services, regardless of which mode reads it.

## Consequences

- Adding a request-scoped config value: declare it in `env.ts`, read it via the
  decorator. Boot-only value: read `process.env`, document it in `.env.example`.
- Do **not** move `DATABASE_URL` / `DATABASE_URL_DIRECT` into the validated
  plugin — that validates at import time and re-breaks the side-effect-free
  import that the infra-free unit tests rely on.
- Two env-reading patterns coexist by design; this ADR is the reason they are not
  unified.

## Rejected

- **One unified validated schema for all env** — breaks the side-effect-free
  import because `elysia-env` validates at instantiation, forcing every importer
  of `app` (including unit tests) to supply a live `DATABASE_URL`.
- **Reading the listen port / DB URLs through the decorator** — they are needed
  on the app-construction path before the decorator exists.
