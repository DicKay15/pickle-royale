# Pickle Royale — Documentation

This folder is the single source of truth for the whole product: what it is, how
it is built, why it was built that way, the problems we hit, and where it is going.
It is written so that anyone can follow it, whether or not you write code. Each
document opens with a plain-English summary, then goes deeper.

**Live app:** https://pickleball.dhrumilkherde.com
**Code:** `/Users/dhrumil/Work/Personal/pickle-royale`

---

## What is Pickle Royale, in one line

A playful, private rankings app for a group of friends who play 2v2 pickleball:
log a match, say who carried, and everyone's rating and the leaderboard update
automatically.

---

## Read in this order

| # | Doc | What's inside | For |
|---|-----|---------------|-----|
| 1 | [PRD.md](PRD.md) | The product: vision, who it's for, the problem, every feature, what's out of scope | Everyone |
| 2 | [ALGORITHM.md](ALGORITHM.md) | How the "Royale Rating" is calculated, in plain words then in math | Everyone |
| 3 | [ARCHITECTURE.md](ARCHITECTURE.md) | How it's built: the stack, the database, the screens, the sign-in flow | Technical |
| 4 | [DECISIONS.md](DECISIONS.md) | Every important choice we made and the reasoning behind it | Everyone |
| 5 | [HURDLES.md](HURDLES.md) | The bugs and blockers we hit and exactly how we cleared them | Technical + curious |
| 6 | [ROADMAP.md](ROADMAP.md) | What shipped, what's in progress, what's next, and parked ideas | Everyone |
| 7 | [OPERATIONS.md](OPERATIONS.md) | How to run it locally, deploy it, manage secrets, add people | Technical / maintainer |

---

## The one mental model that explains everything

There are two separate ideas, and keeping them separate is the key to the whole app:

- A **player** is a name on a ladder (e.g. "DicKay"). A player does not need an
  account. The person holding the phone can add everyone as players and log scores
  for them.
- A **user** is a Google login (an email). A user can optionally *own* a player
  (called "claiming") to get their own access and personal stats.

So one person can run an entire group solo, and friends can join later if they want
their own login. Everything in the app is organised into **groups** (like WhatsApp
groups), and data never crosses between groups.

---

## Status at a glance

- **v1** — Core app (log matches, ratings, leaderboard, PWA). Shipped.
- **v2** — Character pass (new mascot logo, masthead, witty touches). Shipped.
- **v3 Phase 1** — Google login + private groups + per-group isolation. Shipped.
- **v3 Phase 2** — Claiming + invites. Next.
- **v3 Phase 3** — Advanced stats + motivation. After that.

See [ROADMAP.md](ROADMAP.md) for the detail.

_Last updated: 2026-06-19._
