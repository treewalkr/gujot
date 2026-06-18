# Context Map

GuJot is a multi-context monorepo: an Elysia backend and a SvelteKit frontend, sharing a
single Bun workspace. Per-context domain glossaries live beside each app; system-wide
architectural decisions live in `docs/adr/` at the repo root.

## Contexts

- [Backend](./apps/backend/CONTEXT.md) — the Elysia API: data model, validation, business rules for personal finance _(not yet written — created when domain terms are resolved)_
- [Frontend](./apps/frontend/CONTEXT.md) — the SvelteKit UI: presentation and client-side state _(not yet written)_

## Relationships

- **Frontend → Backend**: the frontend imports the backend's live route type via Elysia
  Eden (see [ADR-0001](./docs/adr/0001-elysia-eden-typed-client.md)). The backend is a
  workspace dependency of the frontend. This is a *type* coupling, not a runtime one —
  Eden calls the backend over HTTP at runtime, but types flow at compile time.

Workspace layout is fixed in [ADR-0006](./docs/adr/0006-monorepo-bun-workspaces-no-turborepo.md):
`apps/backend`, `apps/frontend`, `packages/shared`.
