# Supabase as managed Postgres only — Elysia owns auth and the API

**Status:** accepted

Supabase is used **solely as managed Postgres hosting**. Drizzle connects via the
connection string and treats it as any Postgres. Supabase's Auth, Row-Level Security,
Storage, Realtime, and auto-REST features are **not** used.

## Decision

**Elysia owns authentication, authorization, and the entire API surface.** The frontend
talks to one backend (Elysia) via Eden (ADR-0001). Authorization is enforced in the
application layer, not in the database.

## Rejected: Supabase as platform (Auth + RLS)

Using Supabase Auth + Row-Level Security would move authorization *into the database* and
demote Elysia to a thinner pass-through. It would also give the frontend a second backend
(Supabase) alongside Elysia, fragmenting the single-typed-client architecture in ADR-0001.
That is a legitimate architecture, but a *different* one than the one chosen here.

## Known constraint — Supabase pooler vs Drizzle Kit

Supabase's connection pooler (Supavisor/pgBouncer) runs in **transaction mode** (port
`6543`), which is fine for the app runtime but **breaks Drizzle Kit migrations**
(prepared statements / session state are stripped). Mitigation — two connection strings:

- **App runtime (Elysia):** pooled, port `6543`, `?pgbouncer=true&connection_limit=1`
- **Drizzle Kit (`drizzle.config.ts`):** *direct*, port `5432` (Session mode, no pooler)

## Fallback

If the Supabase connection proves unworkable, the database moves to self-hosted Postgres
in the docker-compose stack on the deployment droplet (see deployment ADR). Supabase is a
hosting choice, not an architectural one — nothing in the application layer changes.
