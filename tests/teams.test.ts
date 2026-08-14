import { describe, it, expect } from "vitest";
import { bestSplit, pickRandom, fairnessLabel } from "../shared/teams";

const P = (id: number, rating: number) => ({ id, rating });

describe("bestSplit", () => {
  it("pairs strongest with weakest to level the teams", () => {
    // 1400/1300 vs 1100/1000 would be a 300-point gap; the fair split is
    // 1400+1000 against 1300+1100, a gap of 0.
    const s = bestSplit([P(1, 1400), P(2, 1300), P(3, 1100), P(4, 1000)]);
    expect(s.gap).toBe(0);
    const ids = (t: { id: number }[]) => t.map((p) => p.id).sort().join(",");
    expect([ids(s.teamA), ids(s.teamB)].sort()).toEqual(["1,4", "2,3"]);
  });

  it("returns a gap of 0 when everyone is equal", () => {
    expect(bestSplit([P(1, 1200), P(2, 1200), P(3, 1200), P(4, 1200)]).gap).toBe(0);
  });

  it("never leaves a fairer pairing on the table", () => {
    const four = [P(1, 1500), P(2, 1210), P(3, 1190), P(4, 900)];
    const best = bestSplit(four);
    const all = [
      Math.abs((1500 + 1210) / 2 - (1190 + 900) / 2),
      Math.abs((1500 + 1190) / 2 - (1210 + 900) / 2),
      Math.abs((1500 + 900) / 2 - (1210 + 1190) / 2),
    ];
    expect(best.gap).toBeCloseTo(Math.min(...all), 10);
  });

  it("puts each of the four players on exactly one team", () => {
    const s = bestSplit([P(1, 1300), P(2, 1250), P(3, 1180), P(4, 1020)]);
    const ids = [...s.teamA, ...s.teamB].map((p) => p.id).sort();
    expect(ids).toEqual([1, 2, 3, 4]);
  });

  it("rejects anything other than four players", () => {
    expect(() => bestSplit([P(1, 1200)])).toThrow(/exactly 4/);
    expect(() => bestSplit([])).toThrow(/exactly 4/);
  });
});

describe("pickRandom", () => {
  it("returns the requested count without repeats", () => {
    const pool = [1, 2, 3, 4, 5, 6];
    const got = pickRandom(pool, 4);
    expect(got).toHaveLength(4);
    expect(new Set(got).size).toBe(4);
    got.forEach((g) => expect(pool).toContain(g));
  });

  it("never returns more than the pool holds", () => {
    expect(pickRandom([1, 2], 4)).toHaveLength(2);
  });

  it("does not mutate the pool", () => {
    const pool = [1, 2, 3, 4, 5];
    pickRandom(pool, 3);
    expect(pool).toEqual([1, 2, 3, 4, 5]);
  });

  it("is deterministic under a fixed rng", () => {
    const seeded = () => 0;
    expect(pickRandom([1, 2, 3, 4, 5], 3, seeded)).toEqual(
      pickRandom([1, 2, 3, 4, 5], 3, seeded),
    );
  });

  it("can reach every player in the pool", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 400; i++) pickRandom([1, 2, 3, 4, 5, 6], 4).forEach((x) => seen.add(x));
    expect(seen.size).toBe(6);
  });
});

describe("fairnessLabel", () => {
  it("describes the gap in plain English", () => {
    expect(fairnessLabel(0)).toBe("Dead even");
    expect(fairnessLabel(30)).toBe("Pretty fair");
    expect(fairnessLabel(60)).toBe("Slight edge");
    expect(fairnessLabel(200)).toBe("Lopsided");
  });
});
