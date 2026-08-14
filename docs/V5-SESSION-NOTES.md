# Session Notes — v5 and v5.1

**Sessions:** June 21, 2026 (four commits, one day)
**Scope:** Polish + invites + backups (v5), then post-use tweaks (v5.1)
**Status:** Both shipped and live.

This document picks up where the main docs left off (v4.1 shipped June 20).
It covers everything built in the June 21 sessions: what changed, why, the
new technical decisions, the hurdles, and the open issues going forward.

The existing doc files (PRD, ROADMAP, DECISIONS, HURDLES, ARCHITECTURE,
OPERATIONS) are unchanged — treat this as the supplement until those are
updated.

---

## What was built

### v5 — Polish, custom icons, invites, weekly backups

**Product changes:**

- **Sheet vs Modal convention formalised.** Info = bottom sheet (`InfoSheet`).
  Actions and confirmations = centred modal (`Modal` / `ConfirmModal`). Every
  overlay was also moved to portal to `document.body`, which fixed a bug where
  sheets sat underneath the bottom navbar.

- **Rumbles (match history) → delete flow improved.** Tapping a match no longer
  triggers the delete immediately. Now it opens a `ConfirmModal` (admin only).
  Date display was also cleaned up.

- **Log Match → score defaults.** Scores now start at 0/0 instead of blank.
  Two quick-add buttons (`+5` and `+11`) let the admin tap a running total
  rather than typing. This shaves a few seconds off the logging flow.

- **Stat section headers → more personal language.** "You and" (partner stats)
  and "You vs" (opponent stats) instead of generic headings.

- **Custom SVG icons throughout.** All nav icons, the weekly movers card icon,
  and achievement icons are now custom SVGs in `src/components/icons.tsx`.
  No more emoji standing in for UI.

- **Invites:** a per-player invite link system. The admin taps a button on a
  player's profile to generate a signed link. The link survives the Google
  sign-in redirect (stored in localStorage), and shows a "Join & claim" modal
  on the group screen once the person is signed in.

- **Weekly automated backup to R2.** Every Monday at 06:00 UTC the Worker
  exports all tables to a timestamped JSON file in the `pickle-royale-backups`
  R2 bucket. See Architecture changes and Operations sections below.

- **Additive-only migrations from this point.** No destructive schema changes
  going forward — only `ADD COLUMN`, `CREATE TABLE`, new indexes.

- **Retired `AccountSheet.tsx` and `MeTab.tsx`.** These files were already
  superseded by v4 / v4.1. Removed.

---

### v5.1 Round 1 — Drop paid email, Rumbles X back, mascot-FAB

Shipped same day after real use on the day revealed several friction points.

- **Email invites dropped.** Resend was wired up in v5 but requires a paid key.
  Dhrumil's rule: free and open-source only. Switched to **Copy link + native
  Share** (`navigator.share` API). On mobile this opens the OS share sheet
  (WhatsApp, Messages, etc.) with a pre-written message:
  > *"Join our Pickle Royale group and claim your player 'X'!"*
  On desktop (no `navigator.share`), it falls back to clipboard copy. The backend
  email code was kept dormant — no key, no emails, no deletion.

- **Invite card moved up the page.** In v5 the invite button was buried at
  the bottom of a player's profile. After use it was clear nobody would find it
  there. Moved it to sit directly under the Hero section (the player's name +
  emoji + stats), visible immediately without scrolling.

- **Rumbles X back.** v5 removed the visible delete button, replacing it with a
  tap-anywhere-on-the-card flow. Users tapped expecting a details view, not a
  delete prompt. Fix: a visible `CloseIcon` X in the top-right corner of each
  match card (admin only), aligned with the date row. Tapping opens the
  `ConfirmModal` — the same flow as v5, just with an obvious trigger.

- **Nav centre button → Sir Dill mascot-FAB.** The plain green + was replaced
  with the mascot (Sir Dill) as a floating-action button with a small lime badge.

---

### v5.1 Round 2 — Revert mascot, solid nav icons

Second pass on the same day after feedback from Dhrumil.

- **Mascot-FAB reverted → original green + back.** After seeing the mascot as
  the nav centre, Dhrumil preferred the plain + that had always been there.
  The mascot-FAB idea is parked.

- **Side nav icons → solid, chunky filled glyphs.** All four side-nav icons
  (Standings, Rumbles, Stats, Profile) were redrawn as bold filled shapes
  (`stroke={false}`, `fill="currentColor"`). These have more visual weight and
  character than thin line icons. The Rumbles icon is a single filled paddle
  with a ball.

- **New icons added to `icons.tsx`:** `CloseIcon` (for the Rumbles X),
  `ShareIcon` (for the invite share button).

---

## Decisions made

**Drop Resend email in favour of native sharing.**
The product constraint is free and open-source only. `navigator.share` covers
mobile perfectly (the app is primarily used on mobile), and clipboard copy handles
desktop. No infrastructure, no cost, no key to manage. Email invite code stays in
the codebase dormant — easy to re-enable if that constraint ever changes.

**Invite link survives login via localStorage.**
The invite flow requires the user to sign in with Google first (the app requires
auth). The token therefore had to survive the OAuth redirect. Options considered:
(a) encode in the OAuth `state` param — fragile, hard to debug; (b) use a cookie
— cross-site write issues; (c) stash in localStorage — simple, reliable, correct
for a same-origin redirect. localStorage was chosen.

**Signed token for invite links (not a plain player ID).**
A plain ID would let anyone who found the link URL claim any unclaimed player.
The token is signed with `SESSION_SECRET` and embeds the player ID, group ID, and
an expiry. Server validates the signature before allowing the claim.

**Separate Modal from InfoSheet.**
Before v5, all overlays used a bottom sheet. But a delete confirmation is not
"information" — it is an action with irreversible consequences. Centring it on
screen and requiring an explicit confirm button is the right UX pattern. Making
this a hard convention (info = sheet, actions = modal) keeps the whole app
consistent going forward.

**Portal all overlays to `document.body`.**
React's default is to render components in the DOM tree where they are declared.
The tab bar is a flex child near the bottom of the root. Anything rendered inside
it has a lower stacking context and can end up underneath the bar visually. Portals
break out of the tree entirely and render at the top of the DOM. This is the
standard fix and has no performance cost at this scale.

**Automated weekly backup, not just D1 Time Travel.**
Cloudflare's built-in D1 Time Travel (point-in-time restore, ~30 days) is the
primary safety net. The R2 export adds a portable, human-readable record. It also
lets us verify the data schema independently and is easier to inspect than a
database snapshot. Trigger: Monday 06:00 UTC (quiet time, post-weekend games).

**Additive-only migrations from here.**
Real match data is now in production. A destructive migration (DROP, TRUNCATE,
column rename) could silently corrupt or wipe it. Every future schema change adds
something; never removes or renames.

**Solid filled nav icons, not thin lines.**
Thin line icons read as "system UI" — generic, low personality. Filled glyphs with
weight match the app's character (bold, playful, confident). The Rumbles paddle
icon is the clearest example: a filled paddle + ball reads instantly, where a
thin-stroke version would be ambiguous at 20px.

---

## New hurdles and fixes

### 1. Sheets sat under the bottom navbar (z-index/stacking context)

**Symptom:** Sheets and modals opened but the navbar bar appeared on top of them.

**Cause:** The overlay was rendered inside a component that was itself a flex
child inside the tab bar container, giving it a lower stacking context.

**Fix:** React portals. All overlays now render to `document.body` via
`ReactDOM.createPortal()`. The navbar can no longer stack above them.

---

### 2. Invite link lost across the Google sign-in redirect

**Symptom:** User clicked an invite link. The app redirected them to Google for
login. After returning from Google, the invite token was gone.

**Cause:** The OAuth redirect is a real browser navigation — it leaves and returns
to the page, wiping any in-memory state.

**Fix:** When the app detects `?invite=<token>` in the URL on load, it immediately
stashes the token in `localStorage` before anything else. After the OAuth callback
completes and the app re-loads, `App.tsx` checks localStorage for a pending invite
and triggers the "Join & claim" flow.

---

### 3. Tap-to-delete on Rumbles cards felt wrong to users

**Symptom:** After shipping v5's tap-anywhere-to-delete, users were tapping cards
expecting a match details view. The delete prompt was surprising and jarring.

**Cause:** "Tap a card → action" is a standard mobile pattern, but here users
reasonably expected "Tap a card → see more." The match card was doing the wrong
job.

**Fix:** Removed whole-card tap-to-delete entirely. Added a visible `CloseIcon` X
in the top-right corner of each card (admin-only, rendered conditionally). The X
is clearly a removal affordance; the card body is inert.

---

### 4. Invite card was invisible to admins (below the fold)

**Symptom:** In v5, the invite section was placed at the bottom of the player
profile page. In practice, admins never scrolled far enough to find it.

**Cause:** Profile pages have a lot of sections. Bottom placement works for
secondary actions, not for a core admin workflow.

**Fix:** Moved the invite card to sit directly under the Hero section (name, emoji,
stats). Visible without scrolling. Wrapped in `.invite-actions` with `ShareIcon`
"Share link" and "🔗 Copy link" buttons side by side.

---

### 5. `pnpm dev` does not rebuild on source file changes

**Symptom:** After editing a source file locally, the dev server appeared to serve
the old version even after a reload.

**Cause:** `pnpm dev` runs `wrangler dev`, which serves the **already-built**
`dist/` folder. It does not run Vite in watch mode. So editing `src/` does nothing
until you rebuild.

**Fix:** Run `npx vite build` after each edit, then reload the browser preview.
Or keep a separate `npx vite build --watch` terminal running alongside `pnpm dev`.

---

## Architecture changes

### New files and components

| File | What it does |
|------|-------------|
| `src/components/Modal.tsx` | A centred, portalled confirmation modal. Used for delete confirms and the invite accept flow. Props: `title`, `children`, `confirmLabel`, `onConfirm`, `onCancel`. |
| `src/components/icons.tsx` | All custom SVG icons. Exports: `StandingsIcon`, `RumbleIcon`, `StatsIcon`, `ProfileIcon`, `MoversIcon`, `AchievementsIcon`, `CloseIcon`, `ShareIcon`. Each takes standard SVG props. |

### Deleted files

| File | Why |
|------|-----|
| `src/components/AccountSheet.tsx` | Superseded by the Profile tab in v4. |
| `src/components/MeTab.tsx` | Superseded by the Profile + Stats split in v4.1. |

### New API endpoints (v5)

| Method | Path | What it does |
|--------|------|-------------|
| `POST` | `/api/groups/:gid/players/:id/invite-link` | Generates a signed invite token for a player. Returns `{ token }`. Admin only. |
| `GET` | `/api/invite?token=...` | Validates the invite token. Returns player + group info (so the UI can show "Join & claim X?"). No auth required. |
| `POST` | `/api/invite/accept` | Accepts the invite (requires auth). Claims the player for the signed-in user. |

### New Cloudflare bindings (wrangler.jsonc)

| Binding | Type | What it does |
|---------|------|-------------|
| `BACKUPS` | R2 bucket (`pickle-royale-backups`) | The weekly backup cron writes JSON exports here. |

### Worker export shape changed

The Worker's default export was a plain `{ fetch }` handler. With the cron added,
it is now `{ fetch, scheduled }`. The `scheduled` handler calls `runBackup(db, env)`
which dumps every table to a JSON file named by timestamp:
`backup-YYYY-MM-DDTHH-mm-ssZ.json`.

### Component changes of note

- **`History.tsx`** — card tap no longer triggers delete. `CloseIcon` X added top-right (admin only). Date rendering cleaned up.
- **`Profile.tsx`** — invite card moved from bottom to just under the Hero section. Share button uses `navigator.share` (with clipboard fallback). Resend-email field removed.
- **`App.tsx`** — invite token checked from localStorage on load; "Join & claim" `ConfirmModal` wired in. Portals used for all overlays.
- **`LogMatch.tsx`** — score inputs default 0/0. `+5`/`+11` buttons added.
- **All sheets/modals** — now use `ReactDOM.createPortal(…, document.body)` so they sit above the navbar.

---

## Bugs logged (June 21)

The following was noted in `docs/Bugs` (committed June 21) as a known gap:

> Emails are not sent when a user enters an email id. There should also be an
> option to invite someone directly to the group: admin adds a player, attaches
> their email, invites to group — the player receives a mail, clicks the link,
> and gets a prompt: *"Are you sure you want to join the group and claim your
> player 'XYZ'?"*

**Status:** Invite links via Share/copy are live. Email sending requires
`RESEND_API_KEY` (not set — free-only constraint). The "invite directly to group
by email" flow (without needing the admin to navigate to a specific player's
profile first) is not built.

---

## Open items as of June 21

| Item | Detail |
|------|--------|
| `RESEND_API_KEY` | Not set. Invite emails are dormant. Copy/Share works. Set the secret if this ever changes. |
| Group-level email invite | Admin can invite from a player profile. Direct "invite someone to the group" flow (without a player already added) is not built yet. |
| Phase 4 (global leaderboard) | Design doc at `docs/Phase 4`. Not built. Key design challenge: ratings are per-group; a global ladder must aggregate by Google user across groups. |
| Google consent screen in "Testing" mode | Only pre-added test-user emails can sign in. Publishing the screen removes this limit but adds an "unverified app" warning. |

---

## June 22 session

No code was committed on June 22. The session (titled "Web and mobile product
experience") was a discussion and review — likely reviewing v5.1 after live use
and thinking through next steps. No decisions or features to document.

---

_Last updated: 2026-06-22._
