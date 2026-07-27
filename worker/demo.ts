/**
 * Demo mode: a throwaway, fully-populated group for people who land on
 * /demo without a Google account (recruiters, friends-of-friends, anyone
 * following a portfolio link).
 *
 * Every visit mints its OWN demo user + demo group, so two visitors can
 * never see each other's edits and nothing they do touches a real group.
 * Demo accounts are swept by cron after DEMO_TTL_MS.
 *
 * Demo users are identified purely by their email shape (see isDemoEmail),
 * which avoids a schema migration.
 */

const DEMO_DOMAIN = "demo.pickleroyale.invalid";
export const DEMO_TTL_MS = 24 * 60 * 60 * 1000;

export function isDemoEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${DEMO_DOMAIN}`);
}

/** Deterministic PRNG so every visitor sees the same season play out. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The cast. `skill` is hidden truth used only to generate plausible
 * results; the app derives every rating from the match log itself.
 * `growth` per session gives the ladder a story: "You" starts mid-table
 * and climbs, Arjun drifts down, Kabir slowly finds his game.
 */
const CAST = [
  // Maya is deliberately the strongest player in the room even though she
  // plays less: "You" climbs the ladder on volume but still loses the
  // head-to-head, which gives the Stats tab a real nemesis instead of "TBD".
  { name: "You", emoji: "🎯", skill: 0.46, growth: 0.03 },
  { name: "Maya", emoji: "🔥", skill: 0.86, growth: 0.0 },
  { name: "Arjun", emoji: "⚡", skill: 0.64, growth: -0.014 },
  { name: "Neha", emoji: "🌊", skill: 0.55, growth: 0.004 },
  { name: "Kabir", emoji: "🐢", skill: 0.36, growth: 0.012 },
  { name: "Sanjay", emoji: "🎪", skill: 0.3, growth: 0.008 },
];

/** Days before now for each play session. Last one is recent so the
 *  "this week" movers card and the post-match banner have something. */
const SESSION_DAYS_AGO = [37, 30, 23, 16, 9, 2];
const MATCHES_PER_SESSION = 5;

interface SeedMatch {
  a: [number, number];
  b: [number, number];
  scoreA: number;
  scoreB: number;
  contribA: number;
  contribB: number;
  playedAt: string;
}

function buildSeason(): SeedMatch[] {
  const rnd = mulberry32(20260727);
  const out: SeedMatch[] = [];

  for (let s = 0; s < SESSION_DAYS_AGO.length; s++) {
    const skills = CAST.map((p) => p.skill + p.growth * s);

    for (let m = 0; m < MATCHES_PER_SESSION; m++) {
      // pick 4 of 6, biased to include "You" (index 0) most sessions
      const pool = [0, 1, 2, 3, 4, 5];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      let four = pool.slice(0, 4);
      if (!four.includes(0) && rnd() < 0.75) four[3] = 0;

      const a: [number, number] = [four[0], four[1]];
      const b: [number, number] = [four[2], four[3]];

      const sA = (skills[a[0]] + skills[a[1]]) / 2;
      const sB = (skills[b[0]] + skills[b[1]]) / 2;
      const pA = 1 / (1 + Math.pow(10, (sB - sA) * 2.6));
      const aWins = rnd() < pA;

      // Closeness: mismatched teams produce blowouts, even teams grind.
      const gap = Math.abs(pA - 0.5) * 2; // 0 = even, 1 = lopsided
      const target = rnd() < 0.25 ? 15 : 11;
      let loser = Math.round(target * (1 - gap) * (0.45 + rnd() * 0.5));
      loser = Math.max(0, Math.min(target - 2, loser));
      // Very lopsided games occasionally end in a pickle (shutout), which
      // the app tracks as its own stat.
      if (gap > 0.55 && rnd() < 0.3) loser = 0;

      const scoreA = aWins ? target : loser;
      const scoreB = aWins ? loser : target;

      // Most games split credit evenly; sometimes one player carried.
      const skew = rnd();
      const contribA = skew > 0.78 ? (rnd() < 0.5 ? 0.62 : 0.4) : 0.5;
      const contribB = skew < 0.14 ? (rnd() < 0.5 ? 0.6 : 0.42) : 0.5;

      const at = new Date(
        Date.now() -
          SESSION_DAYS_AGO[s] * 86400_000 +
          m * 40 * 60_000 +
          Math.floor(rnd() * 9) * 60_000,
      );

      out.push({
        a,
        b,
        scoreA,
        scoreB,
        contribA,
        contribB,
        playedAt: at.toISOString().slice(0, 19).replace("T", " "),
      });
    }
  }
  return out;
}

function genCode(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/**
 * Create a fresh demo user + seeded group. The user is group admin and
 * owns the player named "You", so the Stats and Profile tabs have data
 * instead of an empty claim prompt.
 * Ratings are NOT computed here — the caller runs recompute().
 */
export async function createDemoAccount(
  db: D1Database,
): Promise<{ userId: number; groupId: number }> {
  const email = `demo+${crypto.randomUUID()}@${DEMO_DOMAIN}`;

  const user = await db
    .prepare("INSERT INTO users (email, name, advanced_mode) VALUES (?, ?, 1) RETURNING id")
    .bind(email, "Demo Player")
    .first<{ id: number }>();
  const userId = user!.id;

  let code = genCode();
  for (let i = 0; i < 5; i++) {
    const clash = await db.prepare("SELECT 1 FROM groups WHERE code = ?").bind(code).first();
    if (!clash) break;
    code = genCode();
  }

  const group = await db
    .prepare("INSERT INTO groups (name, code, creator_user_id) VALUES (?, ?, ?) RETURNING id")
    .bind("YooYs (Demo)", code, userId)
    .first<{ id: number }>();
  const groupId = group!.id;

  await db
    .prepare(
      "INSERT INTO group_members (group_id, user_id, role, can_add_players) VALUES (?, ?, 'admin', 1)",
    )
    .bind(groupId, userId)
    .run();

  const playerIds: number[] = [];
  for (const c of CAST) {
    const row = await db
      .prepare(
        "INSERT INTO players (group_id, name, emoji, owner_user_id, added_by_user_id) VALUES (?, ?, ?, ?, ?) RETURNING id",
      )
      .bind(groupId, c.name, c.emoji, c.name === "You" ? userId : null, userId)
      .first<{ id: number }>();
    playerIds.push(row!.id);
  }

  const insert = db.prepare(
    `INSERT INTO matches (group_id, played_at, a1, a2, b1, b2, score_a, score_b, contrib_a, contrib_b)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  await db.batch(
    buildSeason().map((m) =>
      insert.bind(
        groupId,
        m.playedAt,
        playerIds[m.a[0]],
        playerIds[m.a[1]],
        playerIds[m.b[0]],
        playerIds[m.b[1]],
        m.scoreA,
        m.scoreB,
        m.contribA,
        m.contribB,
      ),
    ),
  );

  return { userId, groupId };
}

/** Delete demo accounts (and everything they own) older than the TTL. */
export async function sweepDemoAccounts(
  db: D1Database,
  ttlMs: number = DEMO_TTL_MS,
): Promise<number> {
  const cutoff = new Date(Date.now() - ttlMs).toISOString().slice(0, 19).replace("T", " ");
  const { results } = await db
    .prepare(
      "SELECT id FROM users WHERE email LIKE ? AND created_at < ?",
    )
    .bind(`%@${DEMO_DOMAIN}`, cutoff)
    .all<{ id: number }>();
  if (!results.length) return 0;

  for (const u of results) {
    const { results: groups } = await db
      .prepare("SELECT id FROM groups WHERE creator_user_id = ?")
      .bind(u.id)
      .all<{ id: number }>();

    for (const g of groups) {
      // dependency order: rating_events -> matches -> claims -> players -> members -> group
      await db.batch([
        db.prepare("DELETE FROM rating_events WHERE group_id = ?").bind(g.id),
        db.prepare("DELETE FROM matches WHERE group_id = ?").bind(g.id),
        db.prepare("DELETE FROM claim_requests WHERE group_id = ?").bind(g.id),
        db.prepare("DELETE FROM players WHERE group_id = ?").bind(g.id),
        db.prepare("DELETE FROM group_members WHERE group_id = ?").bind(g.id),
        db.prepare("DELETE FROM groups WHERE id = ?").bind(g.id),
      ]);
    }

    await db.batch([
      db.prepare("DELETE FROM group_members WHERE user_id = ?").bind(u.id),
      db.prepare("DELETE FROM users WHERE id = ?").bind(u.id),
    ]);
  }
  return results.length;
}
