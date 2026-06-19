import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    // Same-origin convenience for client-side calls in mode-1 (partial) dev.
    // The skeleton's data fetch is SSR, so this is forward-looking only.
    proxy: {
      "/api": process.env.BACKEND_URL ?? "http://localhost:3000",
    },
  },
});
