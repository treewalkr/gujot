import { execSync } from "node:child_process";

const port = process.env.FRONTEND_PUBLISH_PORT ?? "5173";
const frontendUrl = `http://localhost:${port}`;

function run(cmd: string, env?: NodeJS.ProcessEnv) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

try {
  run("docker compose build");
  // --wait blocks until both services' healthchecks pass. The frontend check
  // GETs /, which SSRs and calls the backend, so "healthy" means the whole
  // frontend→backend chain is already answering 200 — no extra poll needed.
  run("docker compose up -d --wait");

  run("bunx playwright test --config=e2e/playwright.config.ts", {
    FRONTEND_URL: frontendUrl,
  });
} finally {
  run("docker compose down", {});
}
