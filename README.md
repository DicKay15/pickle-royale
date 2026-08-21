# 🥒 Pickle Royale

Playful pickleball rankings + match-log for weekly 2v2 games.
**Live:** https://pickleball.dhrumilkherde.com
**Try it without an account:** https://pickleball.dhrumilkherde.com/demo

**📚 Full documentation:** [`docs/`](docs/README.md) — product, architecture,
algorithm, decisions, the bugs we hit, roadmap, and how to operate it.

**🎨 Design language:** [`docs/DESIGN-LANGUAGE.md`](docs/DESIGN-LANGUAGE.md) — the
canonical spec for how Pickle Royale looks on every platform. Read it before
touching any UI, here or in the mobile app.

## What it does
- Log a 2v2 match: pick teams, enter the score, set a "who carried?" contribution split
- Auto-calculates everyone's **Royale Rating** (custom Elo) and re-ranks the leaderboard
- Crowns a reigning champ, tracks streaks, sparklines, dream partners & nemeses
- Installable PWA, works great on phone at the court

## Demo mode
`/demo` signs a visitor in without Google. Each visit mints its own throwaway
user + a group seeded with six players and six weeks of matches (deterministic,
see `worker/demo.ts`), so they land on a populated ladder as its admin and can
log a match themselves. Demo accounts and their groups are deleted by a daily
cron (04:00 UTC); real groups are never touched.

## Stack
React + TypeScript · Vite · Hono · Cloudflare Workers + D1 · PWA

## Develop
```bash
pnpm install
pnpm run db:local        # set up local database
pnpm dev                 # → http://localhost:8787  (use this, not vite)
pnpm test                # rating-engine unit tests
```

## Deploy
```bash
pnpm run db:remote       # apply migrations to production D1
pnpm run deploy          # build + wrangler deploy
bash scripts/attach-domain.sh   # one-time: attach custom domain
```

## The rating engine
`shared/elo.ts` — 2v2 team Elo with margin-of-victory scaling, provisional
K-factor for new players, and a contribution split. Ratings are always
recomputed by replaying the full match log, so deleting/editing a match
never corrupts anyone's rating.

## Status
- **Live now:** Google login + private groups (join codes), per-group isolation,
  full v1 ranking app + character pass.
- **Next:** claiming/invites (Phase 2), advanced stats + motivation (Phase 3).
- See [`docs/ROADMAP.md`](docs/ROADMAP.md).
