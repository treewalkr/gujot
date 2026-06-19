import { treaty } from "@elysiajs/eden";
import type { App } from "@gujot/backend";
import { env } from "$env/dynamic/private";

/**
 * Eden treaty client built from the backend's live route type (ADR-0001).
 * Lives under `$lib/server` so it never ships to the browser — the backend
 * is called server-side during SSR. BACKEND_URL is read at runtime so the
 * same image works on host (mode 1) and in the compose network (mode 2).
 */
export const eden = treaty<App>(env.BACKEND_URL ?? "http://localhost:3000");
