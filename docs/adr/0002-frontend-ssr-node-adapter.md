# Frontend rendering: SSR via the Node adapter (two runtimes)

**Status:** accepted

The SvelteKit frontend runs as a server-rendered app using SvelteKit's **Node adapter**,
not a static SPA. This means the production stack has **two runtimes**: Node for the
frontend, Bun for the Elysia backend.

## Context

"Run Bun everywhere" is not achievable with SvelteKit in the stack. SvelteKit builds with
Vite (which runs fine under Bun), but its *served production app* runs on whatever its
adapter targets — Node by default, not Bun. Elysia, conversely, is hard-bound to Bun.
Running the SvelteKit Node-adapter output under `bun` is possible but unofficial and
unsupportable, and was rejected for a finance app where reliability matters.

## Decision

SSR on the Node adapter. The two-runtime cost (one extra process/container) is accepted in
exchange for:
- server-side auth evaluation and protected layouts,
- `httpOnly` cookie sessions,
- no "flash of unauthenticated content."

## Rejected: static SPA

A static SPA (`adapter-static`) would give a clean Bun-only runtime (the frontend would be
just static files), but it pushes auth client-side, gates routes on the client, and flashes
unprotected content — an unacceptable posture for a personal-finance app.

## Consequences

- Two runtime images in CI/deploy (Node + Bun).
- Eden still works unchanged — runtime coupling is irrelevant to Eden's compile-time types.
- The frontend is a long-running service, not static assets, so it needs its own
  health-checks, restart policy, and scaling consideration.
