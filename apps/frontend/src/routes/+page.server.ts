import { eden } from "$lib/server/eden";
import type { PageServerLoad } from "./$types";

// Fetches backend data server-side via Eden during SSR. The route type flows
// from the backend's `type App` at compile time, so a signature change on the
// backend becomes a type error here.
export const load: PageServerLoad = async () => {
  const { data, error } = await eden.status.get();
  if (error) throw error;
  return { backend: data };
};
