import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  // Bundle @elysiajs/eden into the SSR output. Left externalized, the
  // adapter-node runtime fails to resolve it and the frontend healthcheck
  // (which SSRs `/` through Eden) goes unhealthy — verified by the e2e gate.
  ssr: {
    noExternal: ["@elysiajs/eden"],
  },
  server: {
    // Same-origin convenience for client-side calls in mode-1 (partial) dev.
    // The skeleton's data fetch is SSR, so this is forward-looking only.
    proxy: {
      "/api": process.env.BACKEND_URL ?? "http://localhost:3000",
    },
  },
});
