import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // SSR via the Node adapter (ADR-0002) — the frontend is a long-running
    // Node service, the second runtime alongside the Bun backend.
    adapter: adapter(),
  },
};

export default config;
