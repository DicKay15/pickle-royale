# Product Requirements (PRD)

## Plain-English summary

Dhrumil and his friends play 2v2 pickleball every week with random teams. They
wanted a fun way to track who is actually the best, beyond memory and arguments.
Pickle Royale lets one person log each match on their phone, mark who carried the
team, and the app keeps a live leaderboard with smart ratings. It looks playful and
premium, works great on a phone, and installs like a real app. Friends can have
their own logins and private groups.

---

## Vision

Make the weekly pickleball session feel like a real league: a crown for the champ,
ratings that reward beating strong teams, bragging rights that are earned and
visible, and just enough personality that people *want* to open it.

## Who it's for

- **Primary:** a casual friend group that plays 2v2 regularly and wants a private,
  fun ladder. One person usually runs it (the "admin").
- **Secondary:** the individual player who wants their own stats, rivalries, and
  progress over time.

## The problem

- No shared record of who won what; rankings live in people's heads and get
  disputed.
- Simple win/loss counts are unfair: beating a strong duo should count more than
  beating a weak one, and a blowout should count more than a squeaker.
- In 2v2 with random teams, one strong player can carry a weak partner, and pure
  team results hide that.
- Generic sports trackers are bland and no fun.

## Goals

1. Logging a match takes under 20 seconds on a phone.
2. Ratings feel fair and are hard to game (margin of victory, opponent strength,
   "who carried").
3. The app has a memorable identity, not a templated look.
4. Private by group; one person can run it solo; friends can opt in.
5. Zero maintenance headaches; cheap to run.

## Non-goals (deliberately out of scope, for now)

- Full tournament brackets or scheduling.
- Singles or 3v3+ formats (2v2 is the core).
- Public/global leaderboards across strangers.
- Native iOS/Android store apps (it is an installable web app instead).
- Money, payments, or ads.

---

## Personas

- **The Organiser (admin).** Holds the phone at the court, adds everyone, logs
  every game, shares the group code. Wants speed and control.
- **The Competitor.** Cares about their rating, their nemesis, their streak. Will
  log in and claim their name to see personal stats.
- **The Casual.** Just shows up and plays. Happy to be a tracked "player" who never
  logs in.

---

## Features

### Core (v1, shipped)
- **Log a match:** pick Team Green vs Team Orange (2 each), enter the score, set a
  "Who carried?" split per team.
- **Royale Rating:** automatic 2v2 Elo with margin-of-victory, fast calibration for
  new players, and a contribution split. See [ALGORITHM.md](ALGORITHM.md).
- **Leaderboard:** a champ card with a crown, ranked rows with win/loss, hot/cold
  streaks, and rating trend lines. Players who have not played sit "on the bench."
- **Result reveal:** an animated rating-change screen, confetti on an upset.
- **Player profile:** rating-over-time chart, best partner, nemesis, biggest win.
- **Match history:** a feed of past games with rating changes; admin can delete.
- **Add players** any time, with a fun emoji avatar.
- **PWA:** installable to the home screen, works offline-ish.

### Character (v2, shipped)
- A redrawn mascot logo ("Sir Dill", a crowned pickle) used across the app and as
  the app icon.
- A crafted masthead: mascot, wordmark, a rotated "Official Power Rankings" stamp,
  and a rotating tagline.
- Witty touches: rank honorifics ("The Don of Dink" at #1, "Wooden Spoon" at last),
  a "PICKLED!" callout with confetti on an 11-0 skunk, witty loading lines, and a
  tap-the-mascot easter egg.
- Log Match flow reordered to: pick teams, enter score, then "who carried."

### Accounts and groups (v3 Phase 1, shipped)
- **Google sign-in** required to use the app (any Google account).
- **Groups:** create a group (you become admin) or join one with a 6-character code.
  Data is private per group; one account can be in several groups, with a switcher.
- **Player vs user separation:** players need no account; the admin tracks everyone.
- **Account sheet:** see your groups, switch, copy the share code, a "members can
  add players" toggle (admin), and sign out.

### Identity (v3 Phase 2, planned)
- **Claiming:** a logged-in person takes ownership of their player name and its full
  history. Auto-linked if their email was pre-attached; otherwise they request it and
  the admin approves.
- **Invites:** the admin (or whoever added a player) attaches an email to a name so
  that person auto-links on sign-in.
- **Permissions:** WhatsApp-style control of who may add players.

### Advanced stats and motivation (v3 Phase 3, planned)
- A per-user **Advanced mode** toggle that reveals: personal match history, deeper
  personal stats (win rate, streaks, carry score, clutch record, pickle counts),
  rivalries and chemistry (nemesis, favourite victim, best partner, teammate and
  opponent breakdowns), badges and awards, weekly movers, and a motivation banner
  driven by your last game.

---

## Success signals

- The crew logs matches every week without being chased.
- People check their rank/profile between sessions.
- Friends choose to sign in and claim their names.
- It keeps running with effectively no upkeep or cost.
