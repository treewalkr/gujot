import { fail, redirect } from "@sveltejs/kit";
import {
  eden,
  parseSessionSetCookie,
  sessionSetCookieFrom,
  SESSION_COOKIE,
} from "$lib/server/eden";
import type { Actions, PageServerLoad } from "./$types";

// Skip the register page for an already-authenticated visitor.
export const load: PageServerLoad = async ({ cookies }) => {
  if (cookies.get(SESSION_COOKIE)) throw redirect(303, "/account");
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || password.length < 8) {
      return fail(400, { email, error: "Email and an 8+ character password are required." });
    }

    const result = await eden.auth.register.post({ email, password });
    if (result.error) {
      const message = result.status === 409 ? "Email already registered." : "Registration failed.";
      return fail(400, { email, error: message });
    }

    // The backend sets the session cookie; forward it to the browser verbatim.
    const setCookie = sessionSetCookieFrom(result.response);
    if (setCookie) {
      const { value, options } = parseSessionSetCookie(setCookie);
      cookies.set(SESSION_COOKIE, value, options);
    }
    throw redirect(303, "/account");
  },
};
