import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  // Bundle the Eden client into the SSR output so the adapter-node runtime
  // image needs no node_modules for it (bun may nest workspace deps).
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
