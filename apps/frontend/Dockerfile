# Build the SvelteKit app (Bun is fine for the Vite build), then run the
# adapter-node SSR server on Node (ADR-0002) — the second runtime.
# Context is the repo root: the frontend build resolves the backend's `type App`
# and shared package across the workspace.
FROM oven/bun:1.3 AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/ apps/
COPY packages/ packages/
RUN bun install --frozen-lockfile
RUN bun --filter @gujot/frontend build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/apps/frontend/build ./build
COPY --from=build /app/apps/frontend/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
ENV PORT=3000
EXPOSE 3000
CMD ["node", "build"]
