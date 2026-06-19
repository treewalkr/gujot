# Frontend context — the SvelteKit UI

The SvelteKit frontend: presentation and client-side state for personal finance.
Sibling to [`apps/backend/CONTEXT.md`](../backend/CONTEXT.md); system-wide
decisions live in [`docs/adr/`](../../docs/adr/).

## Domain glossary

- **Eden treaty** — the e2e type-safe RPC client
  ([`$lib/server/eden.ts`](src/lib/server/eden.ts)) built from the backend's
  `type App`. Calls the backend over HTTP **server-side during SSR** — it lives
  under `$lib/server` so it never ships to the browser
  ([ADR-0001](../../docs/adr/0001-elysia-eden-typed-client.md)). `BACKEND_URL` is
  read at runtime so one image works on host and in the compose network.
- **load** — a `PageServerLoad` (`src/routes/+page.server.ts`) that fetches the
  backend (`/status`, `/entries`) over Eden during SSR and returns data for the
  page to render. A backend signature change is a type error here.
- **form action** — the `default` action in `+page.server.ts` creates a ledger
  **Entry** by posting to the backend over Eden. The user enters a major-unit
  amount (dollars); `Money.fromDecimal` converts it to minor units before
  posting, matching the backend's integer `amount` ([ADR-0003](../../docs/adr/0003-no-client-side-validation-reuse.md)).
- **Money rendering** — entries are rendered via `Money.of(amount,
  currency).format()` from `@gujot/shared`, so the same primitive that flows
  through the backend formats the value in the UI.
- **Entry / Ledger** — see the [backend glossary](../backend/CONTEXT.md); the
  frontend renders the ledger and adds entries to it.

## Conventions

- **Server-side data access only.** All backend calls happen in `+page.server.ts`
  (load or actions), never in client components. The page component receives
  already-loaded `data` and renders.
- **`@gujot/shared` is the shared vocabulary.** Money/Currency types and the
  `CURRENCIES` list (used to populate the currency `<select>`) come from the
  shared package, so the UI and the backend agree on valid codes.
- **Adapter-node SSR on Node** ([ADR-0002](../../docs/adr/0002-frontend-ssr-node-adapter.md)).
  The frontend is the second runtime (Node), distinct from the Bun backend.
