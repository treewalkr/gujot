# Auth: server-side sessions, optional Redis, argon2id passwords

**Status:** accepted

Authentication is owned by Elysia (ADR-0004). Password-based, with opaque server-side
sessions stored behind an interface that can run with or without Redis.

## Decision

- **Identity (MVP):** email + password. OAuth (Google/GitHub) deferred — same session
  table can absorb it later.
- **Password hashing:** `Bun.password` with **argon2id** (OWASP-preferred). Built into Bun,
  zero dependencies, no native compilation.
- **Session:** on login, Elysia creates a session and stores only an **opaque session id**
  in a cookie: `httpOnly` + `Secure` + `SameSite=Lax`. The id carries no claim and no user
  data.
- **Session store:** a `SessionStore` interface with two implementations:
  - **Postgres** (`sessions` table) — always available; the baseline.
  - **Redis** — used when Redis is enabled, for lower-latency lookups and to share infra
    with jobs/cache/rate-limiting.
- **Redis is optional.** The app boots and core authentication works on Postgres alone.
  Redis is enabled by a config flag; when absent, the Postgres store is used. Redis is
  *infrastructure*, not a dependency.

## Why sessions, not JWTs

Sessions are instantly revocable (`DELETE FROM sessions` — powers "log out everywhere,"
breach response, password-change invalidation) and need no signing-secret management.
Stateless JWTs solve distributed/federated auth across services, which this single-backend
stack does not have.

## Scope of "works without Redis"

Core app functionality — auth, API, UI — runs on Postgres sessions without Redis. Features
that *require* Redis (background job queues e.g. recurring-transaction processing, email
reminders; response caching; rate-limiting) are **no-ops when Redis is disabled**, not
silently broken. "Everything works fine without Redis" means the core runs; Redis-gated
features are skipped, not crashed.

## Consequences

- One abstraction (`SessionStore`) with two backends — a deliberate cost, accepted because
  Redis is optional infra rather than a hard dependency.
- Redis, when enabled, is shared across sessions + jobs + cache + rate-limiting (justifies
  its operational cost).
- Session cookie attributes are non-negotiable: `httpOnly` (no JS access), `Secure`
  (HTTPS only — Caddy provides TLS, ADR-0005), `SameSite=Lax`.
