import { describe, it, expect } from "vitest";
import {
  applyMatch,
  replayMatches,
  expectedScore,
  movMultiplier,
  kFactor,
  clampContrib,
  teamWinProbability,
  BASE_RATING,
  K_PROVISIONAL,
  K_STABLE,
  PROVISIONAL_GAMES,
  type MatchRecord,
  type PlayerState,
} from "../shared/elo";

const fresh = (): Record<number, PlayerState> => ({});

const match = (over: Partial<MatchRecord> = {}): MatchRecord => ({
  id: 1,
  a1: 1,
  a2: 2,
  b1: 3,
  b2: 4,
  scoreA: 11,
  scoreB: 7,
  contribA: 0.5,
  contribB: 0.5,
  ...over,
});

describe("expectedScore", () => {
  it("is 0.5 for equal ratings", () => {
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5);
  });
  it("favors the higher rating", () => {
    expect(expectedScore(1400, 1200)).toBeGreaterThan(0.7);
    expect(expectedScore(1200, 1400)).toBeLessThan(0.3);
  });
});

describe("movMultiplier", () => {
  it("scales with point differential", () => {
    const close = movMultiplier(2, 1200, 1200);
    const blowout = movMultiplier(9, 1200, 1200);
    expect(blowout).toBeGreaterThan(close);
  });
  it("dampens favorite blowouts vs underdog blowouts", () => {
    const favoriteWins = movMultiplier(9, 1400, 1200);
    const underdogWins = movMultiplier(9, 1200, 1400);
    expect(underdogWins).toBeGreaterThan(favoriteWins);
  });
  it("is log-shaped, not linear", () => {
    const m3 = movMultiplier(3, 1200, 1200);
    const m9 = movMultiplier(9, 1200, 1200);
    expect(m9 / m3).toBeLessThan(3);
  });
});

describe("kFactor", () => {
  it("is provisional for new players, stable after", () => {
    expect(kFactor(0)).toBe(K_PROVISIONAL);
    expect(kFactor(PROVISIONAL_GAMES - 1)).toBe(K_PROVISIONAL);
    expect(kFactor(PROVISIONAL_GAMES)).toBe(K_STABLE);
  });
});

describe("clampContrib", () => {
  it("clamps into 0.1–0.9 and defaults bad input to 0.5", () => {
    expect(clampContrib(0.97)).toBe(0.9);
    expect(clampContrib(0.03)).toBe(0.1);
    expect(clampContrib(0.9)).toBe(0.9);
    expect(clampContrib(0.1)).toBe(0.1);
    expect(clampContrib(0.55)).toBe(0.55);
    expect(clampContrib(NaN)).toBe(0.5);
  });
});

describe("applyMatch", () => {
  it("winners gain, losers lose", () => {
    const r = fresh();
    const events = applyMatch(r, match());
    expect(events).toHaveLength(4);
    expect(r[1].rating).toBeGreaterThan(BASE_RATING);
    expect(r[2].rating).toBeGreaterThan(BASE_RATING);
    expect(r[3].rating).toBeLessThan(BASE_RATING);
    expect(r[4].rating).toBeLessThan(BASE_RATING);
  });

  it("is zero-sum at equal K and 50/50 contribution", () => {
    const r = fresh();
    const events = applyMatch(r, match());
    const total = events.reduce((s, e) => s + e.delta, 0);
    expect(total).toBeCloseTo(0, 6);
  });

  it("equal teams, 50/50: all four deltas have same magnitude", () => {
    const r = fresh();
    const events = applyMatch(r, match());
    const mags = events.map((e) => Math.abs(e.delta));
    expect(mags[0]).toBeCloseTo(mags[1], 6);
    expect(mags[0]).toBeCloseTo(mags[2], 6);
    expect(mags[0]).toBeCloseTo(mags[3], 6);
  });

  it("winning carrier gains more than their teammate", () => {
    const r = fresh();
    const events = applyMatch(r, match({ contribA: 0.7 }));
    const a1 = events.find((e) => e.playerId === 1)!;
    const a2 = events.find((e) => e.playerId === 2)!;
    expect(a1.delta).toBeGreaterThan(a2.delta);
    // 70/30 → carrier gets 1.4x classic, teammate 0.6x
    expect(a1.delta / a2.delta).toBeCloseTo(0.7 / 0.3, 5);
  });

  it("extreme carry (90/10) splits the swing 1.8x vs 0.2x", () => {
    const r = fresh();
    const events = applyMatch(r, match({ contribA: 0.9 }));
    const a1 = events.find((e) => e.playerId === 1)!;
    const a2 = events.find((e) => e.playerId === 2)!;
    // 90/10 → carrier 2×0.9=1.8x classic, teammate 2×0.1=0.2x
    expect(a1.delta / a2.delta).toBeCloseTo(0.9 / 0.1, 5);
  });

  it("losing carrier loses LESS than their teammate", () => {
    const r = fresh();
    // team B lost; b1 carried with 0.7
    const events = applyMatch(r, match({ contribB: 0.7 }));
    const b1 = events.find((e) => e.playerId === 3)!;
    const b2 = events.find((e) => e.playerId === 4)!;
    expect(b1.delta).toBeLessThan(0);
    expect(b2.delta).toBeLessThan(0);
    expect(Math.abs(b1.delta)).toBeLessThan(Math.abs(b2.delta));
  });

  it("upset win moves ratings more than expected win", () => {
    const upset = fresh();
    upset[1] = { rating: 1100, matchesPlayed: 20 };
    upset[2] = { rating: 1100, matchesPlayed: 20 };
    upset[3] = { rating: 1300, matchesPlayed: 20 };
    upset[4] = { rating: 1300, matchesPlayed: 20 };
    const upsetEvents = applyMatch(upset, match());

    const expected = fresh();
    expected[1] = { rating: 1300, matchesPlayed: 20 };
    expected[2] = { rating: 1300, matchesPlayed: 20 };
    expected[3] = { rating: 1100, matchesPlayed: 20 };
    expected[4] = { rating: 1100, matchesPlayed: 20 };
    const expectedEvents = applyMatch(expected, match());

    expect(upsetEvents[0].delta).toBeGreaterThan(expectedEvents[0].delta);
  });

  it("blowout (11-1) swings more than a squeaker (11-9)", () => {
    const r1 = fresh();
    const blowout = applyMatch(r1, match({ scoreA: 11, scoreB: 1 }));
    const r2 = fresh();
    const squeaker = applyMatch(r2, match({ scoreA: 11, scoreB: 9 }));
    expect(blowout[0].delta).toBeGreaterThan(squeaker[0].delta);
  });

  it("provisional players move faster than veterans", () => {
    const vets = fresh();
    for (const id of [1, 2, 3, 4])
      vets[id] = { rating: 1200, matchesPlayed: 30 };
    const vetEvents = applyMatch(vets, match());

    const newbies = fresh();
    const newbieEvents = applyMatch(newbies, match());
    expect(newbieEvents[0].delta).toBeGreaterThan(vetEvents[0].delta);
  });
});

describe("replayMatches", () => {
  it("is deterministic and order-dependent", () => {
    const ms: MatchRecord[] = [
      match({ id: 1 }),
      match({ id: 2, scoreA: 5, scoreB: 11, contribB: 0.6 }),
      match({ id: 3, a1: 1, a2: 3, b1: 2, b2: 4, scoreA: 11, scoreB: 8 }),
    ];
    const run1 = replayMatches(ms);
    const run2 = replayMatches(ms);
    expect(run1.ratings).toEqual(run2.ratings);
    expect(run1.events).toHaveLength(12);
  });

  it("removing a match and replaying cleanly undoes it", () => {
    const ms: MatchRecord[] = [match({ id: 1 }), match({ id: 2 })];
    const withBoth = replayMatches(ms);
    const withOne = replayMatches([ms[0]]);
    expect(withBoth.ratings[1].rating).not.toBeCloseTo(
      withOne.ratings[1].rating,
    );
    expect(withOne.ratings[1].matchesPlayed).toBe(1);
  });
});

describe("teamWinProbability", () => {
  it("returns 0.5 for unknown/equal players and favors stronger team", () => {
    const r = fresh();
    expect(teamWinProbability(r, { a1: 1, a2: 2, b1: 3, b2: 4 })).toBeCloseTo(
      0.5,
    );
    r[1] = { rating: 1400, matchesPlayed: 5 };
    expect(
      teamWinProbability(r, { a1: 1, a2: 2, b1: 3, b2: 4 }),
    ).toBeGreaterThan(0.5);
  });
});
