# Hurdles and How We Cleared Them

A running log of the real problems we hit and exactly how each was fixed. These are
the things that cost time, so they are worth remembering. Format: **Symptom →
Cause → Fix.**

---

## 1. Custom domain broke local development

**Symptom:** With the custom domain configured as a `routes` entry in
`wrangler.jsonc`, the local dev server returned 404 for the home page.

**Cause:** A `routes` custom-domain entry changes how `wrangler dev` serves static
assets locally.

**Fix:** Keep `wrangler.jsonc` free of `routes`. Attach the custom domain
out-of-band via the Cloudflare API in `scripts/attach-domain.sh`. Local dev and the
live domain both work.

---

## 2. AI image generation (Codex CLI) errors

**Symptom:** `codex` failed with a missing-binary error, then with a deprecated flag.

**Cause:** A broken install, then a changed CLI interface.

**Fix:** Reinstalled the CLI, and ran it with `--sandbox workspace-write
--skip-git-repo-check`.

---

## 3. White screen after a deploy (stale service worker, v1)

**Symptom:** Returning users got a blank page after a new deploy.

**Cause:** The service worker served a cached `index.html` that pointed at the
previous build's (now renamed) JavaScript file.

**Fix:** Made the service worker **network-first for page navigations**, so a new
deploy is picked up immediately; it only falls back to cache when offline.

---

## 4. Unranked players sat above real players

**Symptom:** Players with zero games showed at 1200, above people who had actually
played and lost.

**Cause:** Everyone defaults to 1200, and unplayed players were mixed into the
ranking.

**Fix:** Split the leaderboard into **ranked** (have played) and a dimmed **bench**
(zero games, "yet to rumble").

---

## 5. Invalid scores could be logged

**Symptom:** A nonsense `1-0` match existed from early testing.

**Cause:** No score validation.

**Fix:** Server-side pickleball rules (must reach 11, win by 2), mirrored on the
client with specific hints, plus validation that all four player ids are real and in
the group.

---

## 6. The icons had no image tool, and the mascot had a white box

**Symptom (a):** No `sharp`, ImageMagick, or `rsvg-convert` installed to turn the
SVG logo into PNG app icons.

**Fix (a):** Use macOS's built-in `qlmanage -t -s <size> -o <dir> file.svg` to
rasterize. The PWA icons bake a green background into a wrapper SVG (mark inside a
scaled group), with extra padding for the Android "maskable" safe zone.

**Symptom (b):** In the app, the mascot appeared inside an ugly white square.

**Cause:** `qlmanage` renders SVG onto a white background, so the "transparent" PNG
was not transparent.

**Fix (b):** The mascot is itself an SVG, so we reference `/mascot.svg` directly in
the app (transparent and crisper). `qlmanage` is only used for the green app-icon
tiles, where a background is wanted anyway.

---

## 7. THE BIG ONE: Google sign-in did nothing (Cloudflare SPA captured the navigation)

**Symptom:** Clicking **Continue with Google** changed the URL to `/auth/login` but
just showed the app's login page again, never reaching Google. It happened even on a
clean page and in incognito, so it was not a browser cache issue.

**The misleading part:** Testing `/auth/login` with `curl` returned the correct
`302` redirect to Google. So the server *looked* fine.

**Cause:** With Cloudflare Static Assets set to `not_found_handling:
"single-page-application"`, real **browser navigations** (which send a `Sec-Fetch-
Mode: navigate` header) to a non-asset path get served `index.html` by the SPA
fallback **before the Worker runs**. So the Worker's redirect never executed. `curl`
did not send that header, so it fell through to the Worker and looked correct, which
sent us debugging the wrong layer (the service worker) first.

**How we found it:** Re-ran `curl` *with* browser headers:
`curl -H "Sec-Fetch-Mode: navigate" -H "Sec-Fetch-Dest: document" .../auth/login`
→ returned `200 text/html` (the app) instead of `302`. That proved the asset layer,
not the Worker, was answering browser navigations.

**Fix:** In `wrangler.jsonc`, set
`assets.run_worker_first: ["/api/*", "/auth/*"]` so the Worker runs first for those
paths (and the redirect fires), while everything else is still served as a static
asset.

**Lesson:** When debugging redirects/navigations behind Cloudflare Static Assets,
always test with `Sec-Fetch-Mode: navigate`, or `curl` will lie to you.

---

## 8. A stale service worker could also swallow /auth (secondary)

**Symptom:** Even with the server fixed, an old cached service worker could intercept
the sign-in navigation.

**Cause:** The service worker's navigation handler did not exclude `/auth/*`, and
there was no mechanism to retire an old worker.

**Fix:** The service worker now **ignores `/auth/*` and all cross-origin requests**
entirely (OAuth redirects must be native). And the app **self-heals**: when a new
worker takes control, the page reloads once (`controllerchange` listener in
`src/main.tsx`), so a stale worker can never get stuck. The cache version was bumped
to force the swap.

---

## 9. The "who carried?" slider moved the wrong way

**Symptom:** Dragging the slider toward a player *decreased* their percentage instead
of increasing it, and it was capped at 30/70.

**Cause:** A native range input goes left=low, right=high, but the left player's
label showed the raw value, so dragging left lowered the left player.

**Fix:** Rebuilt it as a **tug-of-war from the centre**: drag toward a player to
raise their share, with a coloured band growing from the centre toward them. Widened
the cap to **10/90** and updated the rating engine's clamp to match.

---

## 10. TypeScript friction with the Worker context

**Symptom:** Type errors mixing the auth helpers (no custom variables) with the main
app's request context (which adds `user`, `groupId`, `role`).

**Fix:** Typed the shared auth helpers against a permissive context and cast
`c.env` to the known `Env` where needed. Also fixed JSON body parsing by casting the
parsed body instead of using a generic on `.json()`.

---

## Quick debugging reference

- **Redirect works in curl but not the browser?** Re-test with
  `-H "Sec-Fetch-Mode: navigate" -H "Sec-Fetch-Dest: document"`. If it changes,
  it's the Cloudflare asset layer; use `run_worker_first`.
- **A change isn't showing for an existing user?** Suspect the service worker. It is
  network-first for pages and self-heals on update, but a hard refresh or incognito
  confirms quickly.
- **Ratings look wrong?** They are always a pure replay of the match log for that
  group; check the matches, not a stored rating.
