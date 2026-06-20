# Decision Log

Every meaningful choice, with the reasoning. Newest decisions are toward the bottom
of each section. The point of this log is so future-you (or a new contributor) never
has to guess "why is it like this?"

---

## Product

**Name: "Pickle Royale."** Battle-royale energy, and it gives us the crown / champ
motif and the "rumble" language. Picked over plainer names.

**One person can run a whole group.** The biggest product insight: a "player" (a
name on the ladder) is separate from a "user" (a Google login). The admin can add
everyone and log scores without anyone else signing in. Friends log in later only if
they want their own access and stats. This matches how the group actually plays (one
phone at the court).

**Private groups, like WhatsApp.** Instead of one global ladder, the app is
organised into groups with a 6-character join code. A person can be in multiple
groups with a switcher. This keeps each crew's data private and self-contained.

**Advanced mode is opt-in, per user.** The base app stays simple. Each person can
turn on Advanced mode for themselves to reveal personal history, deeper stats, and
motivation. It does not change anyone else's experience.

**2v2 only.** The group plays doubles, so the rating engine and UI are built around
two-versus-two. Singles/3v3 are out of scope.

---

## Algorithm

**Custom 2v2 Elo, not plain win/loss.** Win/loss counts are unfair. Elo naturally
rewards beating stronger teams. We added margin-of-victory and a contribution split
on top.

**Margin of victory with a damper.** Blowouts count more, but on a log curve, and a
favourite blowing out a weak team gets diminishing returns so the top seat stays
contestable.

**Provisional K-factor.** New players move in bigger steps for their first 10 games
so they reach their true level quickly, then settle.

**"Who carried?" contribution split.** In random-team 2v2, a strong player can carry
a weak partner. The split lets the credit (or blame) follow reality. Weighted as
`2 × share`, so 50/50 equals classic Elo and the team's total movement is unchanged.

**Contribution cap widened to 10/90 (was 30/70).** Requested so a true hard-carry is
properly reflected. Safe because the split only redistributes within a team.

**Replay from the full log.** Ratings are always recomputed from all matches in
order, per group. This makes deleting/editing matches safe and keeps groups isolated.

---

## Technology

**Cloudflare Worker + D1, served as one app.** One deploy, one URL, global, near-zero
cost, no servers to babysit. D1 (SQL) was chosen over KV because the data is
relational (head-to-head, partners, per-group queries) which KV handles poorly.

**Hono framework.** A tiny, fast router that fits the Worker model well.

**PWA over native apps.** Installable to the home screen without app-store friction
or separate codebases.

**Fonts:** Lilita One (chunky display), Bricolage Grotesque (body), Azeret Mono
(numbers/ratings). Picked for personality, not the generic defaults.

---

## Identity / design

**Refined character mascot ("Sir Dill").** The first logo (a flat ball + tiny crown)
read as cheap. We redrew a crowned-pickle character with depth and used it as the
logo, the app icon, and an in-app character. Chosen over a crest or a plain
monogram for maximum personality.

**Spend boldness in one place.** The masthead + mascot are the signature; everything
else stays calm, to avoid a cluttered, templated feel.

---

## Accounts and access

**Login required to use the app (any Google account).** Privacy is then handled by
groups, not by blocking sign-in. Simple and low-friction for a friend group.

**Group creator is the admin.** They approve claims and choose who may add players
(everyone, or specific members), WhatsApp-style.

**Fresh start at the v3 cutover.** The pre-v3 data was only test data, so the move to
the group model wiped it deliberately rather than migrating it.

**Dedicated Google OAuth client.** A new OAuth client just for Pickle Royale (rather
than reusing another project's) so the sign-in screen is clean and self-contained.

**Ship v3 phase by phase.** Login + groups first, then claiming/invites, then the
advanced stats layer. Each phase is tested and shipped before the next, to keep
quality high and risk low.

---

## Auth implementation

**Signed cookie sessions (stateless).** A signed token in an HttpOnly, Secure,
SameSite=Lax cookie (via `hono/jwt`), rather than a server-side session store.
Simplest robust option for this scale.

**Server-first routing for `/auth/*` and `/api/*`.** Required so browser navigations
to sign-in reach the Worker instead of the single-page-app fallback. See
[HURDLES.md](HURDLES.md) for the full story; this one cost real time.

---

## Profile & information architecture (v4)

**Dedicated "Me" tab.** A person can be in several groups but mostly cares about
their own stats, so the Me tab gives one-tap access to your profile, plus a
cross-group summary (your rank in each crew). Chosen over hunting for yourself on
the leaderboard.

**Profile organised into labelled sections.** The old profile was a flat wall of
stat cards. v4 groups them under headings (Form, Rivalries, Achievements, and an
advanced Playstyle + breakdowns), so it scans top-to-bottom and hierarchy is clear.

**Tap any stat to learn what it means.** Every stat and badge opens a bottom-sheet
explainer. Removes the guesswork without cluttering the cards.

**Google profile photos, automatic, no uploads.** We already capture each user's
Google avatar at login, so a claimed player simply shows their photo (emoji stays
for unclaimed players and as a fallback). Custom uploads were declined to avoid
standing up file storage.

**Group bar is just switching + invite code.** Everything else that had piled into
it (advanced mode, sign out, members-can-add, claim approvals) moved into the Me tab
(Settings + Manage group), so each surface does one clear job.

**Achievements show earned + locked.** A chase list is more motivating than only
showing what you already have.

**Fix: nemesis vs favourite victim.** With few games someone could be both (100%
either way). Now nemesis requires a losing record against them and favourite victim
a winning record, else they stay empty.
