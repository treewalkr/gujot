import { error } from "@sveltejs/kit";
import { eden } from "$lib/server/eden";
import type { PageServerLoad } from "./$types";

// Fetches backend data server-side via Eden during SSR. The route type flows
// from the backend's `type App` at compile time, so a signature change on the
// backend becomes a type error here.
export const load: PageServerLoad = async () => {
  const { data, error: backendError } = await eden.status.get();
  if (backendError) throw error(500, "backend /status unreachable");
  return { backend: data };
};
