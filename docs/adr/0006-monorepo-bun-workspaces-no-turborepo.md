# Monorepo: Bun workspaces, no Turborepo

**Status:** accepted

The repo is a Bun-workspaces monorepo:

```
gujot/
├── apps/
│   ├── frontend/      ← SvelteKit (Node adapter, SSR)
│   └── backend/       ← Elysia on Bun, exports `type App` for Eden
├── packages/
│   └── shared/        ← Money/Currency primitives (ADR-0003)
├── docker-compose.yml
├── Caddyfile
└── package.json       ← Bun workspaces root: ["apps/*", "packages/*"]
```

Dependency graph: `frontend → backend (type-only, via Eden) + shared`; `backend → shared`.

## Decision

**Bun workspaces as the package manager and task runner. No Turborepo.** Root scripts use
`bun --filter` for per-package tasks and `concurrently` for parallel `dev`.

## Why not Turborepo

Turborepo's value is topological task ordering and caching. Neither is load-bearing here:

- **No build ordering needed.** Eden couples the frontend to the backend's TypeScript
  *source*, which `tsc`/`svelte-check` resolves directly across the workspace. There is no
  "build the backend before the frontend" step — the coupling is compile-time types, not
  build artifacts. Dev runs both concurrently; CI typechecks/builds in parallel.
- **3 packages, sub-second builds.** Caching is marginal.

## Reconsider when

Either (a) package count grows past ~5 with shared libs that *emit build artifacts*, or
(b) CI build time becomes painful. Adding Turborepo later is a half-day migration, not an
architecture change — deferring it is free.
