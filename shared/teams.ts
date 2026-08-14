/**
 * Team balancing — "who's on whose side tonight?"
 *
 * With four players there are exactly three distinct 2v2 pairings. We score
 * each one by how close the two team averages are and return the fairest.
 * Deterministic and cheap, so the UI can re-run it on every tap.
 */

/** Only the rating matters here; callers keep their own id type. */
export interface Rated {
  rating: number;
}

export interface Split<T extends Rated> {
  teamA: [T, T];
  teamB: [T, T];
  /** Absolute gap between the two team-average ratings. */
  gap: number;
}

/** The three ways to split four players into two pairs. */
const PAIRINGS: [number, number, number, number][] = [
  [0, 1, 2, 3],
  [0, 2, 1, 3],
  [0, 3, 1, 2],
];

const avg = (a: Rated, b: Rated) => (a.rating + b.rating) / 2;

/**
 * Fairest 2v2 split of exactly four players.
 * Throws on the wrong count — callers should gate on length first.
 */
export function bestSplit<T extends Rated>(four: T[]): Split<T> {
  if (four.length !== 4) {
    throw new Error(`bestSplit needs exactly 4 players, got ${four.length}`);
  }
  let best: Split<T> | null = null;
  for (const [i, j, k, l] of PAIRINGS) {
    const gap = Math.abs(avg(four[i], four[j]) - avg(four[k], four[l]));
    if (!best || gap < best.gap) {
      best = {
        teamA: [four[i], four[j]],
        teamB: [four[k], four[l]],
        gap,
      };
    }
  }
  return best!;
}

/**
 * Pick `count` players at random. Uses a caller-supplied RNG so tests can
 * pin it down; defaults to Math.random.
 */
export function pickRandom<T>(
  pool: T[],
  count: number,
  rng: () => number = Math.random,
): T[] {
  const copy = pool.slice();
  // Fisher-Yates, but we only need the first `count`.
  const n = Math.min(count, copy.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

/** Plain-English read on how even a split is. */
export function fairnessLabel(gap: number): string {
  if (gap < 15) return "Dead even";
  if (gap < 40) return "Pretty fair";
  if (gap < 90) return "Slight edge";
  return "Lopsided";
}
