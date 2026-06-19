import { execSync } from "node:child_process";

const port = process.env.FRONTEND_PUBLISH_PORT ?? "5173";
const frontendUrl = `http://localhost:${port}`;

function run(cmd: string, env?: NodeJS.ProcessEnv) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

try {
  run("docker compose build");

  // Bring Postgres up and wait for it to accept connections before migrating.
  run("docker compose up -d --wait postgres");

  // Apply migrations against the DIRECT connection (ADR-0004). Runs in the
  // backend image so drizzle-kit and the generated SQL are present; the
  // DATABASE_URL_DIRECT env comes from the backend service definition.
  run("docker compose run -T --rm backend sh -c 'cd apps/backend && bun run db:migrate'");

  // Now bring the rest of the stack up. --wait blocks until healthchecks pass:
  // the frontend check GETs /, which SSRs and calls the backend /entries, so
  // "healthy" means the whole frontend→backend→postgres chain answers 200.
  run("docker compose up -d --wait");

  // Create an entry and prove it renders.
  run("bunx playwright test --config=e2e/playwright.config.ts e2e/skeleton.spec.ts e2e/ledger.spec.ts", {
    FRONTEND_URL: frontendUrl,
  });

  // Survives-restart: kill the backend process and wait for it to come back
  // healthy, then confirm the row written above is still served from Postgres.
  run("docker compose restart backend");
  run("docker compose up -d --wait");
  run("bunx playwright test --config=e2e/playwright.config.ts e2e/ledger-persist.spec.ts", {
    FRONTEND_URL: frontendUrl,
  });
} finally {
  // Remove volumes so each gate run starts from a clean database.
  run("docker compose down -v", {});
}
