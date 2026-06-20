# Roadmap

Where the product has been, where it is, and where it is going. Checkboxes show
status at the last update.

---

## Shipped

### v1 — Core app
- [x] 2v2 match logging (teams, score, "who carried")
- [x] Royale Rating engine (Elo + MOV + provisional K + contribution split), tested
- [x] Leaderboard with champ card, streaks, rating sparklines, bench section
- [x] Result reveal with confetti on upsets
- [x] Player profiles (rating chart, best partner, nemesis, biggest win)
- [x] Match history with delete
- [x] Add players with emoji avatars
- [x] Installable PWA, deployed to pickleball.dhrumilkherde.com on Cloudflare + D1

### v2 — Character pass
- [x] New mascot logo "Sir Dill" + regenerated app icons
- [x] Crafted masthead (mascot, wordmark, stamp, rotating tagline)
- [x] Rank honorifics, "PICKLED!" skunk callout, witty loading lines, mascot easter egg
- [x] Log Match flow reordered: teams, score, then who-carried
- [x] Side-by-side teams, big colour-coded score, 11/15 score presets

### v3 Phase 1 — Accounts + Groups
- [x] Google sign-in (required), signed-cookie sessions
- [x] Private groups with 6-char join codes; multi-group with a switcher
- [x] Player vs user separation (players need no account)
- [x] Per-group data isolation enforced server-side (membership guard)
- [x] Account sheet (groups, switch, share code, members-can-add toggle, sign out)
- [x] Carry slider fixed (tug-of-war) + contribution cap widened to 10/90

### v3 Phase 2 — Identity: claiming + invites
- [x] Attach an email to a player (invite); auto-link that person on sign-in
      (immediately if they already have an account, otherwise on their next login)
- [x] Claim flow: a user requests a player name; admin approves/denies
- [x] "This is you" badge on the leaderboard + claimed status on profiles
- [x] Admin inbox for pending claims (in the account sheet)
- [x] Invite-by-email from a player's profile (admin)

### v3 Phase 3 — Advanced stats + motivation (opt-in via Advanced mode)
- [x] Per-user Advanced mode toggle (in the account sheet)
- [x] Personal stats on profiles: current/longest streak, carry score, clutch record
      (games decided by 2), pickles given/taken
- [x] Rivalries and chemistry: nemesis, favourite victim, best partner, plus
      teammate and opponent breakdown tables
- [x] Badges and awards (First Win, 10/50 Games, Pickler, On Fire, 5-Win Streak, Iron Man)
- [x] Weekly movers: rank risers, most improved, power couple
- [x] Motivation banner on the leaderboard, driven by your last game

**v3 is complete.** 🎉

### v4 — Profile & IA overhaul
- [x] Dedicated **Me tab** (4th nav item) with a cross-group summary (your rank +
      rating in each group; tap to switch) and your own profile inline
- [x] **Profile rebuilt with hierarchy:** clear sections (Hero, Rating journey,
      Form, Rivalries, Achievements, and advanced Playstyle + breakdown tables)
- [x] **Tap any stat or badge** for a plain-English explainer (bottom sheet)
- [x] **Google profile photos** auto-shown for claimed players (emoji fallback)
- [x] **Achievements** as an earned + locked chase grid
- [x] **Decluttered group bar** (switch + invite code only); Settings (advanced
      mode, sign out) and admin "Manage group" (members-can-add, claim approvals)
      moved into the Me tab
- [x] Fix: Nemesis only shows someone you lose to; Favourite victim only someone
      you beat (no more both being the same person)

**v4 is complete.** 🎉

---

## In progress / next

Nothing committed right now — see Parked ideas below for candidates.

---

## Parked ideas (not committed)

- Publish the Google sign-in screen so anyone can join without being added as a
  Google "test user" first.
- Seasons / periodic resets with a hall of fame.
- Doubles rotation helper (suggest balanced random teams for the night).
- Score-by-game tracking within a match.
- Granular per-member "can add players" permission (today it is one group-wide
  toggle, set by the admin).
- Push notifications ("you got passed on the ladder").
- Export a group's stats.

---

## Known limitations today

- The Google consent screen is in "test" mode, so only emails added as test users
  can sign in. Fine for the crew; the "publish" idea above removes this.
- No singles or 3v3 formats.
- Match editing is delete-and-relog (full edit UI is not built; the engine already
  supports clean recomputation).
