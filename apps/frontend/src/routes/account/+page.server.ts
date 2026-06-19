import { redirect } from "@sveltejs/kit";
import { eden, withSession, SESSION_COOKIE } from "$lib/server/eden";
import type { Actions, PageServerLoad } from "./$types";

// Protected page: SSRs the authenticated user's own data via /me (AC). Any
// missing/invalid session → 401 from the backend → redirect to /login.
export const load: PageServerLoad = async ({ cookies }) => {
  const result = await eden.me.get(withSession(cookies));
  if (result.error) throw redirect(303, "/login");
  return { user: result.data };
};

export const actions: Actions = {
  // Revokes the session server-side, clears the cookie, and bounces to /login.
  logout: async ({ cookies }) => {
    await eden.auth.logout.post(withSession(cookies));
    cookies.delete(SESSION_COOKIE, { path: "/" });
    throw redirect(303, "/login");
  },
};
