# Deployment: single droplet, docker-compose, managed DB

**Status:** accepted

The application runs as containers in a single `docker-compose` stack on one DigitalOcean
droplet: a `frontend` container (SvelteKit Node adapter), a `backend` container (Elysia on
Bun), and a `caddy` reverse proxy for TLS/terminatiion. The database is **Supabase**
(managed Postgres) — not a container.

## Decision

Co-locate frontend and backend on one droplet behind a single reverse proxy.

## Rationale

- **Same origin → no CORS.** Frontend and backend share an origin (Caddy routes `/` to the
  frontend and `/api` to the backend), so the `httpOnly` cookie auth from ADR-0002/0004
  stays simple — no credentialled cross-origin requests, no `SameSite` gymnastics.
- **Docker dev/prod parity.** Local development uses the same `docker-compose` shape as
  production, which is the reason Docker was chosen for local dev in the first place.
- **Cost + vendor simplicity.** One host (DO) plus managed DB (Supabase).

## Rejected: managed-frontend hosting (Vercel/Cloudflare)

Deploying the frontend to Vercel/Cloudflare while the backend stays on a droplet would be a
split deployment: cross-origin (reintroducing CORS and complicating cookies) and
non-Docker (breaking dev/prod parity). Since a droplet is operated for the backend
regardless, splitting the frontend out adds cost for no gain. Revisit only if a specific
managed feature (PR preview deploys, edge) becomes worth the parity loss.

## Fallback

If Supabase's pooled connection proves unworkable (see ADR-0004), a `postgres` container is
added to this same compose stack. Nothing else changes.
