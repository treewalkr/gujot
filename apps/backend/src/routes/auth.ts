import { Elysia, status, t } from "elysia";
import { eq } from "drizzle-orm";
import { getDb } from "../database/client";
import { users } from "../database/schema";
import { userSchema } from "../database/model";
import { envPlugin } from "../env";
import { hashPassword, verifyPassword } from "../auth/password";
import { auth, getSessionStore } from "../auth/plugin";
import { clearSessionCookie, readSessionId, setSessionCookie } from "../auth/session-cookie";

// Register/login share the same credential body. Password minimum is 8 (a low
// bar for the MVP slice; tightening is a later concern). Email is normalized to
// lowercase on the way in so case can't create dupe accounts or defeat a login
// lookup.
const credentialsBody = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
});

const errorBody = t.Object({ error: t.String() });

/** Start a session for `userId` and set the opaque id in the response cookie. */
async function startSession(
  set: { cookie?: Record<string, unknown> },
  userId: number,
  ttlSeconds: number,
  secure: boolean,
) {
  const session = await getSessionStore().create(userId, ttlSeconds);
  setSessionCookie(set, session.id, secure);
}

export const authRoutes = new Elysia({ prefix: "/auth", name: "Auth", tags: ["auth"] })
  .use(envPlugin)
  .post(
    "/register",
    async ({ body, env, set }) => {
      const email = body.email.toLowerCase();
      const [existing] = await getDb().select().from(users).where(eq(users.email, email));
      if (existing) return status(409, { error: "email already registered" });

      const passwordHash = await hashPassword(body.password);
      const [user] = await getDb()
        .insert(users)
        .values({ email, passwordHash })
        .returning({ id: users.id, email: users.email });
      await startSession(set, user.id, env.SESSION_TTL_SECONDS, env.COOKIE_SECURE);
      return user;
    },
    {
      body: credentialsBody,
      response: { 200: userSchema, 409: errorBody },
      detail: {
        summary: "Register",
        description: "Creates a user, hashes the password with argon2id, and starts a session.",
      },
    },
  )
  .post(
    "/login",
    async ({ body, env, set }) => {
      const email = body.email.toLowerCase();
      const [user] = await getDb().select().from(users).where(eq(users.email, email));
      // Same 401 whether the email is unknown or the password is wrong, so a
      // probe can't tell which. Not a constant-time path; that's out of scope.
      const ok = user ? await verifyPassword(body.password, user.passwordHash) : false;
      if (!user || !ok) return status(401, { error: "invalid credentials" });

      await startSession(set, user.id, env.SESSION_TTL_SECONDS, env.COOKIE_SECURE);
      return { id: user.id, email: user.email };
    },
    {
      body: credentialsBody,
      response: { 200: userSchema, 401: errorBody },
      detail: {
        summary: "Login",
        description: "Verifies credentials and starts a session, set in an httpOnly cookie.",
      },
    },
  )
  .post(
    "/logout",
    async ({ request, env, set }) => {
      const sid = readSessionId(request.headers);
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
  .get(
    "/me",
    ({ currentUser }) => ({ id: currentUser.id, email: currentUser.email }),
    {
      isAuth: true,
      response: { 200: userSchema, 401: errorBody },
      detail: {
        summary: "Current user",
        description: "Returns the authenticated user's own data. Requires a valid session.",
      },
    },
  );
