# Architecture

## Plain-English summary

The whole app is one small program running on Cloudflare's network. It serves the
web page, runs the API, holds the database, and handles Google sign-in, all from a
single deploy. The front end is a React app; the back end is a tiny Cloudflare
Worker; the data lives in a Cloudflare SQL database (D1). There is no separate
server to manage and it costs essentially nothing at this scale.

---

## The stack

| Layer | Tech | Why |
|------|------|-----|
| Front end | React 18 + TypeScript + Vite | Fast, modern, type-safe UI |
| Back end | Cloudflare Worker + Hono | Tiny, fast API at the edge, one deploy |
| Database | Cloudflare D1 (SQLite) | Relational, perfect for players/matches/stats |
| Auth | Google OAuth 2.0 + signed cookie | Standard sign-in; identity = email |
| Hosting | Cloudflare (Worker serves the built front end as static assets) | One URL, one deploy, global, cheap |
| Install | PWA (manifest + service worker) | Add-to-home-screen, offline shell |

The front end is built by Vite into `dist/`, and the Worker serves those files as
static assets alongside the API. So `pickleball.dhrumilkherde.com` is a single
Worker that returns the web page for normal visits and JSON for `/api/*` calls.

---

## How a request flows

1. You open the site. Cloudflare serves the built React app (HTML/JS/CSS).
2. The app asks `GET /api/me`. If you are not signed in, it gets 401 and shows the
   Login screen. If you are, it gets your account + your groups.
3. You pick or create a group. The app remembers the current group id and calls
   group-scoped endpoints like `GET /api/groups/123/leaderboard`.
4. The Worker checks your session cookie and your membership in group 123 before
   returning anything. If you are not a member, it returns 403.

---

## Sign-in flow (Google OAuth)

1. You click **Continue with Google** which navigates to `/auth/login`.
2. The Worker sets a short-lived anti-forgery cookie and redirects you to Google.
3. You pick your Google account; Google redirects back to `/auth/callback?code=...`.
4. The Worker exchanges the code for your profile (email, name, picture), creates or
   updates your `users` row, **auto-links** any players whose invited email matches
   yours, sets a signed session cookie, and sends you to the home page.
5. The session cookie is a signed token (HMAC via `hono/jwt`, secret in
   `SESSION_SECRET`). It is HttpOnly, Secure, SameSite=Lax, and lasts 30 days.

There is also a **local-only** developer login at `/auth/dev` for testing without
Google. It only works when `DEV_AUTH=1` is set (local `.dev.vars`), and returns 404
in production.

Auth code: [`worker/auth.ts`](../worker/auth.ts).

---

## Data model (D1 tables)

Defined across the migrations in [`migrations/`](../migrations).

- **users** — one per Google login. `email` (unique), `name`, `avatar_url`,
  `advanced_mode` flag.
- **groups** — a private ladder. `name`, `code` (unique 6-hex join code),
  `creator_user_id`, `allow_member_add` flag.
- **group_members** — who is in which group. `role` ('admin' | 'member'),
  `can_add_players` flag. Unique per (group, user).
- **players** — a competitor on a ladder. Belongs to a `group_id`. Has `name`
  (unique *within* the group), `emoji`, `owner_user_id` (null until claimed),
  `invited_email` (for auto-link), `added_by_user_id`.
- **matches** — a logged game. Belongs to a `group_id`. Two players per side,
  `score_a`/`score_b`, and the two contribution splits.
- **rating_events** — the per-player rating change for each match. Belongs to a
  `group_id`. Rebuilt whenever a group is recomputed.
- **claim_requests** — a user asking to own a player. `status` ('pending' |
  'approved' | 'denied'). (Used by Phase 2.)

**Everything is scoped by `group_id`.** Player names are unique per group, not
globally, so two different groups can both have a "Neil."

---

## API (Hono routes on the Worker)

Code: [`worker/index.ts`](../worker/index.ts).

Account-level (need a signed-in user):
- `GET /api/me` — your account + your groups (+ which player you own in each).
- `PATCH /api/me` — toggle your Advanced mode.
- `POST /api/groups` — create a group (you become admin).
- `POST /api/groups/join` — join by code.

Group-scoped (need membership in `:gid`, enforced by a `groupGuard` middleware):
- `GET /api/groups/:gid/leaderboard` — ranked players + champ + streaks + sparklines.
- `GET /api/groups/:gid/players` — active players.
- `GET /api/groups/:gid/players/:id` — a player's profile + partner/nemesis.
- `GET /api/groups/:gid/matches` — match history with rating deltas.
- `POST /api/groups/:gid/players` — add a player (permission-checked).
- `POST /api/groups/:gid/matches` — log a match (validates score, recomputes).
- `DELETE /api/groups/:gid/matches/:id` — admin only; recomputes.
- `PATCH /api/groups/:gid/settings` — admin only; rename, who-can-add.

The single most important rule: **the server never trusts a group id from the client
without checking membership.** That is what guarantees groups stay private from each
other.

---

## Front-end map

- [`src/App.tsx`](../src/App.tsx) — the orchestrator: auth gate, group screen, group
  switcher, masthead, tab navigation, account sheet.
- [`src/api.ts`](../src/api.ts) — the typed client; holds the "current group" and
  builds all the URLs.
- `src/components/` — `Leaderboard`, `LogMatch`, `History`, `Profile`,
  `AddPlayerSheet`, `Login`, `GroupPicker`, `AccountSheet`.
- [`src/index.css`](../src/index.css) — the full design system (colours, fonts,
  sticker cards, animations).
- `public/` — `favicon.svg` (the Sir Dill logo mark), `mascot.svg` (full-body
  mascot), PWA `icons/`, `manifest.webmanifest`, `sw.js` (service worker).

## Hosting and the custom domain

The app is deployed with `wrangler deploy`. The custom domain
`pickleball.dhrumilkherde.com` is attached out-of-band via the Cloudflare API
(`scripts/attach-domain.sh`), not via a `routes` entry in `wrangler.jsonc` (that
entry breaks local development). See [HURDLES.md](HURDLES.md) and
[OPERATIONS.md](OPERATIONS.md).
