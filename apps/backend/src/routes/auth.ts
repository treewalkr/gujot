import { Elysia, status, t } from "elysia";
import type { CookieOptions } from "elysia";
import { eq } from "drizzle-orm";
import { getDb } from "../database/client";
import { users } from "../database/schema";
import { userSchema } from "../database/model";
import { envPlugin } from "../env";
import { hashPassword, verifyPassword } from "../auth/password";
import { auth, getSessionStore } from "../auth/plugin";
import { clearSessionCookie, readSessionId, setSessionCookie } from "../auth/session-cookie";

// Register/login share the same credential body. Password is bounded at both
// ends: 8 minimum (a low bar for the MVP slice; tightening is a later concern)
// and a 1024 maximum so an oversized input can't pin argon2id. Email is
// normalized — trimmed and lowercased — at this boundary so trailing whitespace
// or case can't create dupe accounts or defeat a login lookup, regardless of
// which client (the form, or a direct API call) supplied it.
const credentialsBody = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8, maxLength: 1024 }),
});

// Generic API error shape, shared by every auth status code. Registered as a
// named model below (entries.ts convention) so OpenAPI and Eden see one type.
const errorBody = t.Object({ error: t.String() });

const authModels = {
  user: userSchema,
  credentials: credentialsBody,
  error: errorBody,
} as const;

/** Normalize an email at the trust boundary: trim whitespace, lowercase. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// postgres-js surfaces the Postgres SQLSTATE on `.code`; 23505 is unique
// violation. Used to turn a racing register's constraint failure into 409
// rather than letting it surface as a 500.
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "23505"
  );
}

/** Start a session for `userId` and set the opaque id in the response cookie. */
async function startSession(
  set: { cookie?: Record<string, CookieOptions & { value?: unknown }> },
  userId: number,
  ttlSeconds: number,
  secure: boolean,
) {
  const session = await getSessionStore().create(userId, ttlSeconds);
  setSessionCookie(set, session.id, secure);
}

export const authRoutes = new Elysia({ prefix: "/auth", name: "Auth", tags: ["auth"] })
  .use(envPlugin)
  .model(authModels)
  .post(
    "/register",
    async ({ body, env, set }) => {
      const email = normalizeEmail(body.email);
      const passwordHash = await hashPassword(body.password);

      // Race-free: the users_email_unique constraint is the single authority on
      // whether the email is taken. A pre-check would always lose to a
      // concurrent register; instead attempt the insert and map the unique
      // violation to 409. (Registration still reveals email existence via 409;
      // login deliberately does not — see /login.)
      let user: { id: number; email: string };
      try {
        [user] = await getDb()
          .insert(users)
          .values({ email, passwordHash })
          .returning({ id: users.id, email: users.email });
      } catch (err) {
        if (isUniqueViolation(err)) return status(409, { error: "email already registered" });
        throw err;
      }

      await startSession(set, user.id, env.SESSION_TTL_SECONDS, env.COOKIE_SECURE);
      return user;
    },
    {
      body: "credentials",
      response: { 200: "user", 409: "error" },
      detail: {
        summary: "Register",
        description: "Creates a user, hashes the password with argon2id, and starts a session.",
      },
    },
  )
  .post(
    "/login",
    async ({ body, env, set }) => {
      const email = normalizeEmail(body.email);
      const [user] = await getDb().select().from(users).where(eq(users.email, email));
      // Same 401 whether the email is unknown or the password is wrong, so a
      // probe can't tell which. Not a constant-time path; that's out of scope.
      const ok = user ? await verifyPassword(body.password, user.passwordHash) : false;
      if (!user || !ok) return status(401, { error: "invalid credentials" });

      await startSession(set, user.id, env.SESSION_TTL_SECONDS, env.COOKIE_SECURE);
      return { id: user.id, email: user.email };
    },
    {
      body: "credentials",
      response: { 200: "user", 401: "error" },
      detail: {
        summary: "Login",
        description: "Verifies credentials and starts a session, set in an httpOnly cookie.",
      },
    },
  )
  .post(
    "/logout",
    async ({ cookie, env, set }) => {
      const sid = readSessionId(cookie);
      if (sid) await getSessionStore().delete(sid);
      clearSessionCookie(set, env.COOKIE_SECURE);
      set.status = 204;
      return null;
    },
    {
      response: { 204: t.Null() },
      detail: {
        summary: "Logout",
        description: "Revokes the session server-side and clears the cookie.",
      },
    },
  );

// Protected: returns the caller's own user data via an Eden-typed call. The
// `isAuth` macro resolves the session → `currentUser` (rejecting with 401 when
// there is none) before this handler runs.
export const meRoutes = new Elysia({ name: "Me", tags: ["auth"] })
  .use(auth)
  .model({ user: authModels.user, error: authModels.error })
  .get(
    "/me",
    ({ currentUser }) => ({ id: currentUser.id, email: currentUser.email }),
    {
      isAuth: true,
      response: { 200: "user", 401: "error" },
      detail: {
        summary: "Current user",
        description: "Returns the authenticated user's own data. Requires a valid session.",
      },
    },
  );
