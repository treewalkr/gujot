# GuJot

GuJot is a personal finance and expense-tracking application — a monorepo with
an [Elysia](https://elysia.dev) backend and a [SvelteKit](https://svelte.dev)
frontend sharing a single [Bun](https://bun.sh) workspace.

## Prerequisites

- [Docker](https://www.docker.com/) (the primary way to run the stack)
- [Bun](https://bun.sh) and [Node](https://nodejs.org/) (for host-mode dev and
  running checks)
- [`just`](https://github.com/casey/just) — optional, for the run recipes below

## Getting started

Copy the env template, then bring up the stack:

```sh
cp .env.example .env
just up
```

`just up` builds the images, applies Drizzle migrations, and starts the backend
and frontend. The UI is then served at <http://localhost:5173>.

Without `just`, the equivalent Docker Compose commands are in the
[`Justfile`](./Justfile).

## Common tasks

| Task                       | Command        |
| -------------------------- | -------------- |
| Start the stack            | `just up`      |
| Stop (keep the DB volume)  | `just down`    |
| Stop (wipe the DB volume)  | `just down-clean` |
| Tail logs                  | `just logs [backend\|frontend]` |
| Run unit tests             | `just test`    |
| Typecheck all workspaces   | `just typecheck` |
| Run E2E checks             | `just e2e`     |
| Host-mode dev (partial)    | `just dev`     |

## End-to-end checks

The containerized end-to-end suite (`e2e/`) is required to pass before a change
merges: it builds the images, migrates a fresh database, runs Playwright against
the full stack, and tears it down. Run it with `just e2e` (or
`bun run test:e2e`).

## Contributing

Work is tracked as GitHub issues, triaged into a small set of state labels (see
[`docs/agents/`](./docs/agents)). See the
[`docs/adr/`](./docs/adr) directory for architectural decisions and their
trade-offs.
