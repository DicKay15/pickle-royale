# Operations & Maintenance

How to run, test, deploy, and look after Pickle Royale. Commands are run from the
project root: `/Users/dhrumil/Work/Personal/pickle-royale`.

---

## Accounts and IDs

- **Cloudflare account:** dhrumil.kherde@gmail.com (the "lolwierd" account).
- **D1 database:** name `pickle-royale`. The local dev database is separate from the
  remote/production one.
- **Live URL:** https://pickleball.dhrumilkherde.com
- **Worker name:** `pickle-royale`.

---

## Run it locally

```
pnpm install          # first time only
pnpm dev              # runs `wrangler dev` on http://localhost:8787
```

Use `pnpm dev` (which runs the Worker), not Vite alone, because Vite alone will not
serve the API.

**Local sign-in without Google:** local dev reads `.dev.vars` (git-ignored), which
sets `DEV_AUTH=1` and a local `SESSION_SECRET`. With that, visit:

```
http://localhost:8787/auth/dev?email=you@example.com&name=You
```

That fakes a signed-in session so you can test groups, logging, and stats without
real Google. This endpoint returns 404 in production (it is gated on `DEV_AUTH`).

---

## Database migrations

Migrations live in `migrations/` and run in filename order.

```
pnpm run db:local     # apply migrations to the LOCAL dev database
pnpm run db:remote    # apply migrations to the REMOTE/production database
```

Note: `db:remote` runs against live data. The current schema starts each group
empty (no seeded players); the admin adds players in-app.

---

## Test and build

```
pnpm test             # run the rating-engine unit tests (vitest)
npx tsc --noEmit      # type-check everything
pnpm run build        # build the front end into dist/
```

Always run the tests and a type-check before deploying.

---

## Deploy

```
pnpm run deploy       # builds the front end, then `wrangler deploy`
```

After deploying a change that existing users must receive immediately (especially
anything in the cached app shell or the service worker), **bump the cache version**
in `public/sw.js` (`const CACHE = "pickle-royale-vN"`). The app self-heals (reloads
once when the new worker takes over), but bumping guarantees the swap.

---

## Secrets (production)

Stored as Cloudflare Worker secrets, never in code:

- `GOOGLE_CLIENT_ID` — the Google OAuth client id.
- `GOOGLE_CLIENT_SECRET` — the Google OAuth client secret.
- `SESSION_SECRET` — random string used to sign session cookies.

Set or rotate one with:

```
printf %s 'THE_VALUE' | npx wrangler secret put GOOGLE_CLIENT_ID
```

(Do not set `DEV_AUTH` in production; it must stay local-only.)

---

## Google sign-in setup

The OAuth client is configured in Google Cloud Console (a project dedicated to
Pickle Royale). Two settings matter:

- **Authorised redirect URIs** must include exactly:
  - `https://pickleball.dhrumilkherde.com/auth/callback`
  - `http://localhost:8787/auth/callback`
- **Test users:** while the consent screen is in "Testing" mode, only emails added
  under **APIs & Services → OAuth consent screen → Test users** can sign in. Add the
  crew's Gmail addresses there. To let anyone sign in without this, "publish" the
  consent screen (this shows an "unverified app" warning unless verified).

---

## The custom domain

`pickleball.dhrumilkherde.com` is attached to the Worker via the Cloudflare API in
`scripts/attach-domain.sh`, NOT via a `routes` entry in `wrangler.jsonc`. A `routes`
entry breaks local asset serving. If the domain ever detaches, re-run that script.

---

## Important config note

`wrangler.jsonc` sets `assets.run_worker_first: ["/api/*", "/auth/*"]`. This is
required so browser navigations to sign-in reach the Worker instead of being captured
by the single-page-app fallback. Do not remove it. See
[HURDLES.md](HURDLES.md) item 7.

---

## Routine tasks

- **Add a person to a group:** they sign in with Google (must be a test user), then
  enter the group's 6-char code. Or the admin adds them as a player and (Phase 2)
  attaches their email to auto-link them.
- **Fix a wrongly logged match:** delete it from the Rumbles/history screen (admin
  only); ratings recompute automatically.
- **Reset a group:** delete its matches; ratings return everyone to 1200 on the next
  recompute.

---

## Health checks (after a deploy)

```
# app loads
curl -s -o /dev/null -w "%{http_code}\n" https://pickleball.dhrumilkherde.com
# login is required
curl -s -o /dev/null -w "%{http_code}\n" https://pickleball.dhrumilkherde.com/api/me   # expect 401
# sign-in reaches Google even as a browser navigation
curl -s -o /dev/null -w "%{http_code}\n" -H "Sec-Fetch-Mode: navigate" \
  https://pickleball.dhrumilkherde.com/auth/login   # expect 302
# dev backdoor is disabled in prod
curl -s -o /dev/null -w "%{http_code}\n" "https://pickleball.dhrumilkherde.com/auth/dev?email=x@y.com"  # expect 404
```
