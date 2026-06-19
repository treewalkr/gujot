# GuJot — manual run recipes (https://github.com/casey/just)
#
# The full stack runs containerized via docker compose (mode 2, ADR-0005):
# Postgres + Elysia backend + SvelteKit frontend. `just up` brings it all up
# the same way the E2E gate does, and the data persists in a volume.

# Default port the frontend is published on the host.
FRONTEND_PORT := env_var_or_default("FRONTEND_PUBLISH_PORT", "5173")

# Show available recipes.
default:
    @just --list

# --- Containerized stack -----------------------------------------------------

# Build all service images.
build:
    docker compose build

# Bring up Postgres and wait for it to accept connections.
db-up:
    docker compose up -d --wait postgres

# Apply Drizzle migrations against the direct (session-mode) connection.
migrate: db-up
    docker compose run -T --rm backend sh -c 'cd apps/backend && bun run db:migrate'

# Bring up the whole stack: build, migrate, then start backend + frontend.
up: build migrate
    docker compose up -d --wait
    @echo "→ frontend: http://localhost:{{FRONTEND_PORT}}"

# Stop the stack, keeping the Postgres volume (data survives).
down:
    docker compose down

# Stop the stack AND delete the Postgres volume (start from a clean DB).
down-clean:
    docker compose down -v

# Show container status.
ps:
    docker compose ps

# Tail logs. Usage: just logs, or just logs backend.
logs service='':
    docker compose logs -f {{service}}

# Shell into the running backend container.
shell-backend:
    docker compose exec backend sh

# --- Host-mode dev (mode 1, partial) ----------------------------------------
# Runs the backend and frontend directly on the host via Bun/Vite. Requires a
# reachable Postgres and DATABASE_URL / DATABASE_URL_DIRECT in the environment —
# `just up postgres` alone won't supply them, so point .env at a Postgres first.
dev:
    bun run dev

# --- Checks -----------------------------------------------------------------

# Run unit tests across all workspaces.
test:
    bun run test

# Typecheck all workspaces.
typecheck:
    bun run typecheck

# Run the full containerized E2E gate (builds, migrates, restart test, tears down).
e2e:
    bun run test:e2e
