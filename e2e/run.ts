import { execSync, spawnSync } from "node:child_process";

const port = process.env.FRONTEND_PUBLISH_PORT ?? "5173";
const frontendUrl = `http://localhost:${port}`;

function run(cmd: string, env?: NodeJS.ProcessEnv) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

function poll(url: string, attempts: number, ms: number) {
  for (let i = 0; i < attempts; i++) {
    const res = spawnSync("curl", ["-fsS", "-o", "/dev/null", url]);
    if (res.status === 0) return;
    execSync(`sleep ${ms / 1000}`);
  }
  throw new Error(`${url} did not become reachable`);
}

try {
  run("docker compose build");
  run("docker compose up -d --wait");
  // adapter-node takes a moment to listen after the container reports up.
  poll(frontendUrl, 30, 1000);

  run("bunx playwright test --config=e2e/playwright.config.ts", {
    FRONTEND_URL: frontendUrl,
  });
} finally {
  run("docker compose down", {});
}
