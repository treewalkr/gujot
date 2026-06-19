# Bun runtime for the Elysia backend (ADR-0002/0006).
# Context is the repo root so the whole workspace is installable.
FROM oven/bun:1.3 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/ apps/
COPY packages/ packages/
RUN bun install --frozen-lockfile

FROM oven/bun:1.3
WORKDIR /app
COPY --from=deps /app /app
ENV BACKEND_PORT=3000
EXPOSE 3000
CMD ["bun", "run", "apps/backend/src/server.ts"]
