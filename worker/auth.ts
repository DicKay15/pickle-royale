import { Hono, type Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";

export type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  SESSION_SECRET?: string;
  DEV_AUTH?: string; // "1" enables /auth/dev for local testing only
};

// Helpers accept any Hono context shape (routes elsewhere add Variables).
type Ctx = Context<any>;

const COOKIE = "pr_session";
const STATE_COOKIE = "pr_oauth_state";
const SESSION_DAYS = 30;

export interface SessionUser {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
  advanced_mode: number;
}

function secret(env: Env): string {
  // Local dev falls back to an insecure secret; production must set SESSION_SECRET.
  return env.SESSION_SECRET || "dev-insecure-secret-change-me";
}

function isHttps(c: Ctx): boolean {
  return new URL(c.req.url).protocol === "https:";
}

/** Read + verify the session cookie, returning the user row or null. */
export async function currentUser(c: Ctx): Promise<SessionUser | null> {
  const env = c.env as Env;
  const token = getCookie(c, COOKIE);
  if (!token) return null;
  try {
    const payload = await verify(token, secret(env), "HS256");
    const uid = Number((payload as { uid?: number }).uid);
    if (!uid) return null;
    const row = await env.DB.prepare(
      "SELECT id, email, name, avatar_url, advanced_mode FROM users WHERE id = ?",
    )
      .bind(uid)
      .first<SessionUser>();
    return row ?? null;
  } catch {
    return null;
  }
}

async function setSession(c: Ctx, uid: number): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  const token = await sign({ uid, exp }, secret(c.env));
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    secure: isHttps(c),
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

/** Find or create a user by email; refresh profile fields. Returns user id. */
async function upsertUser(
  env: Env,
  p: { email: string; sub?: string; name?: string; picture?: string },
): Promise<number> {
  const email = p.email.toLowerCase();
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number }>();
  if (existing) {
    await env.DB.prepare(
      "UPDATE users SET google_sub = COALESCE(?, google_sub), name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url) WHERE id = ?",
    )
      .bind(p.sub ?? null, p.name ?? null, p.picture ?? null, existing.id)
      .run();
    return existing.id;
  }
  const res = await env.DB.prepare(
    "INSERT INTO users (email, google_sub, name, avatar_url) VALUES (?, ?, ?, ?) RETURNING id",
  )
    .bind(email, p.sub ?? null, p.name ?? null, p.picture ?? null)
    .first<{ id: number }>();
  return res!.id;
}

/**
 * Auto-link: any unclaimed player whose invited_email matches this user's
 * (Google-verified) email becomes owned by them, and they join that group.
 */
async function autoLink(env: Env, userId: number, email: string): Promise<void> {
  const lower = email.toLowerCase();
  const { results } = await env.DB.prepare(
    "SELECT id, group_id FROM players WHERE lower(invited_email) = ? AND owner_user_id IS NULL",
  )
    .bind(lower)
    .all<{ id: number; group_id: number }>();
  for (const pl of results) {
    await env.DB.prepare(
      "UPDATE players SET owner_user_id = ? WHERE id = ? AND owner_user_id IS NULL",
    )
      .bind(userId, pl.id)
      .run();
    await env.DB.prepare(
      "INSERT OR IGNORE INTO group_members (group_id, user_id, role, can_add_players) VALUES (?, ?, 'member', 0)",
    )
      .bind(pl.group_id, userId)
      .run();
  }
}

export const auth = new Hono<{ Bindings: Env }>();

auth.get("/auth/login", (c) => {
  const env = c.env;
  if (!env.GOOGLE_CLIENT_ID) return c.text("Google login is not configured yet.", 503);
  const origin = new URL(c.req.url).origin;
  const state = crypto.randomUUID();
  setCookie(c, STATE_COOKIE, state, {
    httpOnly: true,
    secure: isHttps(c),
    sameSite: "Lax",
    path: "/",
    maxAge: 600,
  });
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}/auth/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

auth.get("/auth/callback", async (c) => {
  const env = c.env;
  const url = new URL(c.req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = getCookie(c, STATE_COOKIE);
  deleteCookie(c, STATE_COOKIE, { path: "/" });
  if (!code || !state || state !== savedState) return c.redirect("/?auth=error");
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return c.redirect("/?auth=error");

  const redirectUri = `${url.origin}/auth/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!tokenRes.ok) return c.redirect("/?auth=error");
  const tok = (await tokenRes.json()) as { access_token?: string };
  if (!tok.access_token) return c.redirect("/?auth=error");

  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tok.access_token}` },
  });
  if (!infoRes.ok) return c.redirect("/?auth=error");
  const info = (await infoRes.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  if (!info.email) return c.redirect("/?auth=error");

  const uid = await upsertUser(env, {
    email: info.email,
    sub: info.sub,
    name: info.name,
    picture: info.picture,
  });
  await autoLink(env, uid, info.email);
  await setSession(c, uid);
  return c.redirect("/");
});

auth.post("/auth/logout", (c) => {
  deleteCookie(c, COOKIE, { path: "/" });
  return c.json({ ok: true });
});

/** DEV ONLY: fake login for local testing without Google. Guarded by DEV_AUTH=1. */
auth.get("/auth/dev", async (c) => {
  if (c.env.DEV_AUTH !== "1") return c.text("Not found", 404);
  const email = (c.req.query("email") || "dev@example.com").toLowerCase();
  const name = c.req.query("name") || email.split("@")[0];
  const uid = await upsertUser(c.env, { email, name });
  await autoLink(c.env, uid, email);
  await setSession(c, uid);
  return c.redirect("/");
});
