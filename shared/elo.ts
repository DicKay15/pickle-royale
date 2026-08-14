/**
 * Royale Rating — the Pickle Royale ranking engine.
 *
 * 2v2 Elo with:
 *  - margin-of-victory scaling (FiveThirtyEight-style, log of point diff,
 *    dampened when the favorite wins so the #1 seat stays contestable)
 *  - provisional K-factor (new players calibrate fast, veterans move slow)
 *  - contribution split ("who carried?") — the team's delta is divided
 *    between teammates by their contribution share
 *
 * Ratings are ALWAYS derived by replaying the full match log in order
 * (see replayMatches). Deleting or editing a match can never corrupt
 * ratings — you just replay.
 */

export const BASE_RATING = 1200;
export const K_PROVISIONAL = 40;
export const K_STABLE = 24;
export const PROVISIONAL_GAMES = 10;
export const MIN_CONTRIB = 0.1;
export const MAX_CONTRIB = 0.9;
const RATING_FLOOR = 100;
/**
 * Ceiling on the margin-of-victory multiplier, and a floor under its
 * denominator. Without these the curve has a singularity: at a rating gap
 * of -2200 the denominator hits 0 (multiplier -> Infinity) and past it the
 * multiplier flips NEGATIVE, which would invert the result and hand the
 * winners a rating loss. Both guards only engage past a ~1150-point gap,
 * which is far outside any real ladder, so normal play is untouched.
 */
const MAX_MOV = 5;
const MIN_MOV_DENOM = 0.6;

export interface MatchRecord {
  id: number;
  /** player ids — team A */
  a1: number;
  a2: number;
  /** player ids — team B */
  b1: number;
  b2: number;
  scoreA: number;
  scoreB: number;
  /** a1's share of team A's delta, 0.1–0.9 (a2 gets the rest) */
  contribA: number;
  /** b1's share of team B's delta, 0.1–0.9 (b2 gets the rest) */
  contribB: number;
}

export interface RatingEvent {
  matchId: number;
  playerId: number;
  before: number;
  after: number;
  delta: number;
}

export interface PlayerState {
  rating: number;
  matchesPlayed: number;
}

/** Classic Elo expected score for `a` vs `b`. */
export function expectedScore(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

/**
 * Margin-of-victory multiplier. Bigger blowout = bigger swing, but with a
 * log curve (11-0 is not 5x of 11-9) and a damper when the higher-rated
 * side wins (favorites farming weak teams get diminishing returns —
 * underdog upsets hit full force).
 */
export function movMultiplier(
  pointDiff: number,
  winnerElo: number,
  loserElo: number,
): number {
  const diff = Math.max(1, Math.abs(pointDiff));
  const denom = Math.max(MIN_MOV_DENOM, (winnerElo - loserElo) * 0.001 + 2.2);
  return Math.min(MAX_MOV, (Math.log(diff + 1) * 2.2) / denom);
}

/** K-factor: fast while calibrating, stable after PROVISIONAL_GAMES. */
export function kFactor(matchesPlayed: number): number {
  return matchesPlayed < PROVISIONAL_GAMES ? K_PROVISIONAL : K_STABLE;
}

export function clampContrib(c: number): number {
  if (!Number.isFinite(c)) return 0.5;
  return Math.min(MAX_CONTRIB, Math.max(MIN_CONTRIB, c));
}

/** Win probability for team A — used by the UI for upset detection. */
export function teamWinProbability(
  ratings: Record<number, PlayerState>,
  m: Pick<MatchRecord, "a1" | "a2" | "b1" | "b2">,
): number {
  // Read-only: must NOT insert missing players the way get() does, or a
  // preview call would quietly seed the caller's rating map.
  const at = (id: number) => ratings[id]?.rating ?? BASE_RATING;
  const ra = (at(m.a1) + at(m.a2)) / 2;
  const rb = (at(m.b1) + at(m.b2)) / 2;
  return expectedScore(ra, rb);
}

function get(
  ratings: Record<number, PlayerState>,
  id: number,
): PlayerState {
  if (!ratings[id]) ratings[id] = { rating: BASE_RATING, matchesPlayed: 0 };
  return ratings[id];
}

/**
 * Apply one match to the rating state (mutates `ratings`), returning the
 * four rating events.
 */
export function applyMatch(
  ratings: Record<number, PlayerState>,
  m: MatchRecord,
): RatingEvent[] {
  const pa1 = get(ratings, m.a1);
  const pa2 = get(ratings, m.a2);
  const pb1 = get(ratings, m.b1);
  const pb2 = get(ratings, m.b2);

  const teamA = (pa1.rating + pa2.rating) / 2;
  const teamB = (pb1.rating + pb2.rating) / 2;

  const expA = expectedScore(teamA, teamB);
  const aWon = m.scoreA > m.scoreB;
  const actualA = aWon ? 1 : 0;

  const winnerElo = aWon ? teamA : teamB;
  const loserElo = aWon ? teamB : teamA;
  const mov = movMultiplier(m.scoreA - m.scoreB, winnerElo, loserElo);

  const contribA1 = clampContrib(m.contribA);
  const contribB1 = clampContrib(m.contribB);

  // Per-player delta: own K × MOV × surprise × contribution weight.
  // contribution weight is 2×share, so 50/50 ≡ classic Elo.
  const surpriseA = actualA - expA; // positive if A overperformed
  const events: RatingEvent[] = [];

  const apply = (
    playerId: number,
    p: PlayerState,
    surprise: number,
    share: number,
  ) => {
    const delta = kFactor(p.matchesPlayed) * mov * surprise * (2 * share);
    const before = p.rating;
    const after = Math.max(RATING_FLOOR, before + delta);
    p.rating = after;
    p.matchesPlayed += 1;
    events.push({
      matchId: m.id,
      playerId,
      before,
      after,
      delta: after - before,
    });
  };

  // Winners: higher contribution → bigger gain.
  // Losers: higher contribution → SMALLER loss (you carried; not your fault).
  const shareA1 = aWon ? contribA1 : 1 - contribA1;
  const shareB1 = aWon ? 1 - contribB1 : contribB1;

  apply(m.a1, pa1, surpriseA, shareA1);
  apply(m.a2, pa2, surpriseA, 1 - shareA1);
  apply(m.b1, pb1, -surpriseA, shareB1);
  apply(m.b2, pb2, -surpriseA, 1 - shareB1);

  return events;
}

/**
 * Replay the entire match log from scratch. Single source of truth for
 * all ratings — call after every insert/delete.
 */
export function replayMatches(matches: MatchRecord[]): {
  ratings: Record<number, PlayerState>;
  events: RatingEvent[];
} {
  const ratings: Record<number, PlayerState> = {};
  const events: RatingEvent[] = [];
  for (const m of matches) {
    events.push(...applyMatch(ratings, m));
  }
  return { ratings, events };
}
