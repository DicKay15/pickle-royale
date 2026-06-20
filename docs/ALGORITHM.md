# The Royale Rating (the scoring algorithm)

## Plain-English summary

Everyone starts at **1200 points**. When you win, you gain points; when you lose,
you lose points. Four things make it smart and fair:

1. **Who you beat matters.** Beat a stronger team and you gain more. Lose to a
   weaker team and you drop more.
2. **How big you won matters.** An 11-2 thrashing moves ratings more than an 11-9
   nail-biter, but with diminishing returns (11-0 is not five times an 11-2).
3. **New players settle fast.** Your first 10 games move your rating in bigger
   steps so you find your real level quickly, then it steadies.
4. **Who carried matters.** Each team sets a "who carried?" split. In a win, the
   carrier gains more and the carried teammate gains less. In a loss, the carrier
   loses less (it was not their fault) and the passenger loses more.

The leaderboard is always rebuilt from the full list of matches, in order. That
means editing or deleting a match can never corrupt anyone's rating: the app just
replays history from scratch.

The engine lives in one file: [`shared/elo.ts`](../shared/elo.ts), and it has 19
automated tests in [`tests/elo.test.ts`](../tests/elo.test.ts).

---

## The math, step by step

For a single match between Team A (players a1, a2) and Team B (b1, b2):

**1. Team rating** = the average of the two players' ratings.

**2. Expected result** (classic Elo logistic curve):

```
expectedA = 1 / (1 + 10 ^ ((teamB - teamA) / 400))
```

This is the probability the model gave Team A to win. 0.5 means a coin flip; higher
means Team A was favoured.

**3. Surprise** = actual result (1 if A won, 0 if A lost) minus `expectedA`. A big
positive surprise (an underdog winning) drives a big rating move.

**4. Margin-of-victory multiplier.** Bigger point gaps swing more, on a log curve,
and favourites who blow out weak teams get a damper so the #1 seat stays
contestable:

```
mov = ( ln(pointDiff + 1) * 2.2 ) / ( (winnerElo - loserElo) * 0.001 + 2.2 )
```

**5. K-factor** (how big a step a player can take):
- 40 for a player's first 10 matches (calibrating), then 24 (stable).

**6. Contribution split ("who carried?").** Each player's move is weighted by
`2 × their share`, so:
- 50/50 split = the classic Elo move (weight 1.0 each).
- The cap is **10% to 90%** per player. At the extreme, the carrier's weight is
  `2 × 0.9 = 1.8×` the normal move and the partner's is `2 × 0.1 = 0.2×`.
- The two teammates' weights always add up to 2, so the team's total movement is
  unchanged; the split only decides how that movement is shared inside the team.

**7. Per-player change:**

```
delta = kFactor(player) × mov × surprise × (2 × share)
```

Winners use their contribution share directly (carrier gains more). Losers use the
*inverse* of their share (carrier loses less, passenger loses more). Ratings never
fall below a floor of 100.

---

## Worked example

Two equal teams, all at 1200, all veterans (K = 24). Team A wins 11-7, split 50/50.

- expectedA = 0.5, so surprise = 1 − 0.5 = 0.5.
- mov for a 4-point gap between equal teams ≈ 0.73.
- delta per winner = 24 × 0.73 × 0.5 × (2 × 0.5) ≈ **+8.7**; losers ≈ **−8.7**.

Now the same match but a1 carried (90/10):

- a1 delta = 24 × 0.73 × 0.5 × (2 × 0.9) ≈ **+15.8**
- a2 delta = 24 × 0.73 × 0.5 × (2 × 0.1) ≈ **+1.8**
- Team A still gained the same total (~17.6); it is just shared 90/10.

---

## Why "replay from scratch"

Ratings are never stored as the single source of truth. The match log is. After any
insert or delete, the app runs `replayMatches()` over that group's matches in order
and recomputes everyone from 1200. This is what makes deletes and future edits safe,
and it is fast at a friend-group's volume. Each group is replayed independently, so
one group can never affect another.

---

## The "who carried?" control (UX)

On the Log Match screen, each team gets a slider. It is a tug-of-war from the
centre: drag the thumb **toward** a player to raise *their* share, and a coloured
band grows from the centre toward that player. Centre is a 50/50 split. The ends are
90/10. (This direction was a deliberate fix: an earlier version moved the number the
wrong way when you dragged toward a name.)
