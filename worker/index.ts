import { Hono, type MiddlewareHandler } from "hono";
import { auth, currentUser, type Env, type SessionUser } from "./auth";
import {
  replayMatches,
  teamWinProbability,
  BASE_RATING,
  clampContrib,
  type MatchRecord,
  type PlayerState,
  type RatingEvent,
} from "../shared/elo";

type Vars = {
  user: SessionUser;
  groupId: number;
  role: string;
  canAdd: boolean;
};

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

// auth routes (/auth/login, /auth/callback, /auth/logout, /auth/dev)
app.route("/", auth);

// ---------- middleware ----------

/** Require a signed-in user; 401 otherwise. */
const requireUser: MiddlewareHandler<{ Bindings: Env; Variables: Vars }> = async (
  c,
  next,
) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "Please sign in" }, 401);
  c.set("user", user);
  await next();
};

/** Require sign-in AND membership in the :gid group. Sets role + canAdd. */
const groupGuard: MiddlewareHandler<{ Bindings: Env; Variables: Vars }> = async (
  c,
  next,
) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "Please sign in" }, 401);
  const gid = Number(c.req.param("gid"));
  if (!Number.isInteger(gid)) return c.json({ error: "Bad group" }, 400);
  const m = await c.env.DB.prepare(
    "SELECT role, can_add_players FROM group_members WHERE group_id = ? AND user_id = ?",
  )
    .bind(gid, user.id)
    .first<{ role: string; can_add_players: number }>();
  if (!m) return c.json({ error: "You're not in this group" }, 403);
  c.set("user", user);
  c.set("groupId", gid);
  c.set("role", m.role);
  c.set("canAdd", !!m.can_add_players);
  await next();
};

// ---------- data helpers (group-scoped) ----------

interface PlayerRow {
  id: number;
  group_id: number;
  name: string;
  emoji: string;
  active: number;
  owner_user_id: number | null;
  invited_email: string | null;
  created_at: string;
}

interface MatchRow {
  id: number;
  group_id: number;
  played_at: string;
  a1: number;
  a2: number;
  b1: number;
  b2: number;
  score_a: number;
  score_b: number;
  contrib_a: number;
  contrib_b: number;
}

function toMatchRecord(r: MatchRow): MatchRecord {
  return {
    id: r.id,
    a1: r.a1,
    a2: r.a2,
    b1: r.b1,
    b2: r.b2,
    scoreA: r.score_a,
    scoreB: r.score_b,
    contribA: r.contrib_a,
    contribB: r.contrib_b,
  };
}

async function loadMatches(db: D1Database, groupId: number): Promise<MatchRow[]> {
  const { results } = await db
    .prepare(
      "SELECT * FROM matches WHERE group_id = ? ORDER BY played_at ASC, id ASC",
    )
    .bind(groupId)
    .all<MatchRow>();
  return results;
}

async function loadPlayers(db: D1Database, groupId: number): Promise<PlayerRow[]> {
  const { results } = await db
    .prepare("SELECT * FROM players WHERE group_id = ? ORDER BY id ASC")
    .bind(groupId)
    .all<PlayerRow>();
  return results;
}

/** Replay one group's history and rewrite its rating_events rows only. */
async function recompute(
  db: D1Database,
  groupId: number,
): Promise<{ ratings: Record<number, PlayerState>; events: RatingEvent[] }> {
  const matches = (await loadMatches(db, groupId)).map(toMatchRecord);
  const result = replayMatches(matches);

  const stmts: D1PreparedStatement[] = [
    db.prepare("DELETE FROM rating_events WHERE group_id = ?").bind(groupId),
  ];
  const insert = db.prepare(
    "INSERT INTO rating_events (group_id, match_id, player_id, rating_before, rating_after, delta) VALUES (?, ?, ?, ?, ?, ?)",
  );
  for (const e of result.events) {
    stmts.push(
      insert.bind(groupId, e.matchId, e.playerId, e.before, e.after, e.delta),
    );
  }
  await db.batch(stmts);
  return result;
}

function genCode(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

// ---------- account routes ----------

app.get("/api/me", requireUser, async (c) => {
  const user = c.get("user");
  const { results: groups } = await c.env.DB.prepare(
    `SELECT g.id, g.name, g.code, g.allow_member_add, gm.role, gm.can_add_players,
       (SELECT id FROM players WHERE group_id = g.id AND owner_user_id = ? LIMIT 1) AS my_player_id,
       (SELECT name FROM players WHERE group_id = g.id AND owner_user_id = ? LIMIT 1) AS my_player_name
     FROM group_members gm JOIN groups g ON g.id = gm.group_id
     WHERE gm.user_id = ? ORDER BY gm.joined_at ASC`,
  )
    .bind(user.id, user.id, user.id)
    .all<{
      id: number;
      name: string;
      code: string;
      allow_member_add: number;
      role: string;
      can_add_players: number;
      my_player_id: number | null;
      my_player_name: string | null;
    }>();

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      advancedMode: !!user.advanced_mode,
    },
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      code: g.code,
      allowMemberAdd: !!g.allow_member_add,
      role: g.role,
      canAddPlayers: !!g.can_add_players,
      myPlayerId: g.my_player_id,
      myPlayerName: g.my_player_name,
    })),
  });
});

app.patch("/api/me", requireUser, async (c) => {
  const user = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as { advancedMode?: boolean };
  if (typeof body.advancedMode === "boolean") {
    await c.env.DB.prepare("UPDATE users SET advanced_mode = ? WHERE id = ?")
      .bind(body.advancedMode ? 1 : 0, user.id)
      .run();
  }
  return c.json({ ok: true });
});

app.post("/api/groups", requireUser, async (c) => {
  const user = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name || name.length > 40) {
    return c.json({ error: "Group name must be 1–40 characters" }, 400);
  }

  // generate a unique code (retry a few times)
  let code = genCode();
  for (let i = 0; i < 5; i++) {
    const clash = await c.env.DB.prepare("SELECT 1 FROM groups WHERE code = ?")
      .bind(code)
      .first();
    if (!clash) break;
    code = genCode();
  }

  const g = await c.env.DB.prepare(
    "INSERT INTO groups (name, code, creator_user_id) VALUES (?, ?, ?) RETURNING id, name, code",
  )
    .bind(name, code, user.id)
    .first<{ id: number; name: string; code: string }>();
  await c.env.DB.prepare(
    "INSERT INTO group_members (group_id, user_id, role, can_add_players) VALUES (?, ?, 'admin', 1)",
  )
    .bind(g!.id, user.id)
    .run();

  return c.json({ group: { id: g!.id, name: g!.name, code: g!.code, role: "admin" } }, 201);
});

app.post("/api/groups/join", requireUser, async (c) => {
  const user = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as { code?: string };
  const code = (body.code ?? "").trim().toUpperCase();
  if (!code) return c.json({ error: "Enter a group code" }, 400);

  const g = await c.env.DB.prepare("SELECT id, name, code FROM groups WHERE code = ?")
    .bind(code)
    .first<{ id: number; name: string; code: string }>();
  if (!g) return c.json({ error: "No group with that code" }, 404);

  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO group_members (group_id, user_id, role, can_add_players) VALUES (?, ?, 'member', 0)",
  )
    .bind(g.id, user.id)
    .run();

  return c.json({ group: { id: g.id, name: g.name, code: g.code, role: "member" } });
});

// ---------- group-scoped routes ----------

app.use("/api/groups/:gid/*", groupGuard);

app.get("/api/groups/:gid/info", async (c) => {
  const gid = c.get("groupId");
  const g = await c.env.DB.prepare(
    "SELECT id, name, code, allow_member_add FROM groups WHERE id = ?",
  )
    .bind(gid)
    .first<{ id: number; name: string; code: string; allow_member_add: number }>();
  return c.json({
    id: g!.id,
    name: g!.name,
    code: g!.code,
    allowMemberAdd: !!g!.allow_member_add,
    role: c.get("role"),
  });
});

app.get("/api/groups/:gid/leaderboard", async (c) => {
  const db = c.env.DB;
  const gid = c.get("groupId");
  const [players, matchRows] = await Promise.all([
    loadPlayers(db, gid),
    loadMatches(db, gid),
  ]);
  const matches = matchRows.map(toMatchRecord);
  const { ratings, events } = replayMatches(matches);

  const byPlayer = new Map<number, RatingEvent[]>();
  for (const e of events) {
    const list = byPlayer.get(e.playerId) ?? [];
    list.push(e);
    byPlayer.set(e.playerId, list);
  }

  const board = players
    .filter((p) => p.active)
    .map((p) => {
      const evs = byPlayer.get(p.id) ?? [];
      let wins = 0;
      let losses = 0;
      for (const e of evs) e.delta >= 0 ? wins++ : losses++;

      let streak = 0;
      for (let i = evs.length - 1; i >= 0; i--) {
        const won = evs[i].delta >= 0;
        if (streak === 0) streak = won ? 1 : -1;
        else if (won && streak > 0) streak++;
        else if (!won && streak < 0) streak--;
        else break;
      }

      const last5 = evs.slice(-5).map((e) => e.delta >= 0);
      const spark = [BASE_RATING, ...evs.slice(-12).map((e) => e.after)];

      return {
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        rating: ratings[p.id]?.rating ?? BASE_RATING,
        matches: evs.length,
        wins,
        losses,
        streak,
        last5,
        spark,
        provisional: evs.length < 10,
        ownerUserId: p.owner_user_id,
      };
    })
    .sort((a, b) => b.rating - a.rating);

  return c.json({ leaderboard: board, totalMatches: matches.length });
});

app.get("/api/groups/:gid/players", async (c) => {
  const players = await loadPlayers(c.env.DB, c.get("groupId"));
  return c.json({
    players: players
      .filter((p) => p.active)
      .map((p) => ({ id: p.id, name: p.name, emoji: p.emoji })),
  });
});

app.get("/api/groups/:gid/players/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const db = c.env.DB;
  const gid = c.get("groupId");
  const [players, matchRows] = await Promise.all([
    loadPlayers(db, gid),
    loadMatches(db, gid),
  ]);
  const me = players.find((p) => p.id === id);
  if (!me) return c.json({ error: "Player not found" }, 404);

  const names = new Map(players.map((p) => [p.id, p]));
  const matches = matchRows.map(toMatchRecord);
  const { ratings, events } = replayMatches(matches);
  const matchById = new Map(matchRows.map((m) => [m.id, m]));

  const myEvents = events.filter((e) => e.playerId === id);
  const history = myEvents.map((e) => ({
    matchId: e.matchId,
    playedAt: matchById.get(e.matchId)?.played_at ?? "",
    rating: e.after,
    delta: e.delta,
  }));

  const partnerStats = new Map<number, { games: number; wins: number }>();
  const opponentStats = new Map<number, { games: number; wins: number }>();
  let wins = 0;
  let losses = 0;
  let biggestWin: { matchId: number; delta: number } | null = null;

  for (const m of matchRows) {
    const onA = m.a1 === id || m.a2 === id;
    const onB = m.b1 === id || m.b2 === id;
    if (!onA && !onB) continue;
    const won = onA ? m.score_a > m.score_b : m.score_b > m.score_a;
    won ? wins++ : losses++;

    const partner = onA ? (m.a1 === id ? m.a2 : m.a1) : m.b1 === id ? m.b2 : m.b1;
    const opps = onA ? [m.b1, m.b2] : [m.a1, m.a2];

    const ps = partnerStats.get(partner) ?? { games: 0, wins: 0 };
    ps.games++;
    if (won) ps.wins++;
    partnerStats.set(partner, ps);

    for (const o of opps) {
      const os = opponentStats.get(o) ?? { games: 0, wins: 0 };
      os.games++;
      if (won) os.wins++;
      opponentStats.set(o, os);
    }

    const ev = myEvents.find((e) => e.matchId === m.id);
    if (ev && ev.delta > 0 && (!biggestWin || ev.delta > biggestWin.delta)) {
      biggestWin = { matchId: m.id, delta: ev.delta };
    }
  }

  const describe = (
    m: Map<number, { games: number; wins: number }>,
    best: boolean,
  ) => {
    let pick: { id: number; games: number; wins: number; rate: number } | null = null;
    for (const [pid, s] of m) {
      if (s.games < 2) continue;
      const rate = s.wins / s.games;
      if (
        !pick ||
        (best ? rate > pick.rate : rate < pick.rate) ||
        (rate === pick.rate && s.games > pick.games)
      ) {
        pick = { id: pid, games: s.games, wins: s.wins, rate };
      }
    }
    if (!pick) return null;
    const p = names.get(pick.id);
    return {
      id: pick.id,
      name: p?.name ?? "?",
      emoji: p?.emoji ?? "🏓",
      games: pick.games,
      wins: pick.wins,
      winRate: pick.rate,
    };
  };

  return c.json({
    id: me.id,
    name: me.name,
    emoji: me.emoji,
    rating: ratings[id]?.rating ?? BASE_RATING,
    wins,
    losses,
    history,
    bestPartner: describe(partnerStats, true),
    nemesis: describe(opponentStats, false),
    biggestWin,
  });
});

app.get("/api/groups/:gid/matches", async (c) => {
  const db = c.env.DB;
  const gid = c.get("groupId");
  const [players, matchRows] = await Promise.all([
    loadPlayers(db, gid),
    loadMatches(db, gid),
  ]);
  const { events } = replayMatches(matchRows.map(toMatchRecord));
  const names = new Map(players.map((p) => [p.id, p]));
  const evByMatch = new Map<number, RatingEvent[]>();
  for (const e of events) {
    const list = evByMatch.get(e.matchId) ?? [];
    list.push(e);
    evByMatch.set(e.matchId, list);
  }

  const list = matchRows
    .slice()
    .reverse()
    .map((m) => {
      const evs = evByMatch.get(m.id) ?? [];
      const withDelta = (id: number) => {
        const p = names.get(id);
        const e = evs.find((x) => x.playerId === id);
        return {
          id,
          name: p?.name ?? "?",
          emoji: p?.emoji ?? "🏓",
          delta: e?.delta ?? 0,
        };
      };
      return {
        id: m.id,
        playedAt: m.played_at,
        teamA: [withDelta(m.a1), withDelta(m.a2)],
        teamB: [withDelta(m.b1), withDelta(m.b2)],
        scoreA: m.score_a,
        scoreB: m.score_b,
      };
    });

  return c.json({ matches: list });
});

app.post("/api/groups/:gid/players", async (c) => {
  const gid = c.get("groupId");
  const role = c.get("role");
  const canAdd = c.get("canAdd");
  const group = await c.env.DB.prepare(
    "SELECT allow_member_add FROM groups WHERE id = ?",
  )
    .bind(gid)
    .first<{ allow_member_add: number }>();
  const allowed = role === "admin" || canAdd || !!group?.allow_member_add;
  if (!allowed) {
    return c.json({ error: "You don't have permission to add players here" }, 403);
  }

  const body = await c.req.json<{
    name?: string;
    emoji?: string;
    invitedEmail?: string;
  }>();
  const name = (body.name ?? "").trim();
  const emoji = (body.emoji ?? "🏓").trim() || "🏓";
  const invitedEmail = (body.invitedEmail ?? "").trim().toLowerCase() || null;
  if (!name || name.length > 24) {
    return c.json({ error: "Name must be 1–24 characters" }, 400);
  }

  try {
    const res = await c.env.DB.prepare(
      "INSERT INTO players (group_id, name, emoji, invited_email, added_by_user_id) VALUES (?, ?, ?, ?, ?) RETURNING id, name, emoji",
    )
      .bind(gid, name, emoji, invitedEmail, c.get("user").id)
      .first<{ id: number; name: string; emoji: string }>();
    return c.json({ player: res }, 201);
  } catch {
    return c.json({ error: "That name is already taken in this group" }, 409);
  }
});

app.post("/api/groups/:gid/matches", async (c) => {
  const gid = c.get("groupId");
  const b = await c.req.json<{
    a1?: number;
    a2?: number;
    b1?: number;
    b2?: number;
    scoreA?: number;
    scoreB?: number;
    contribA?: number;
    contribB?: number;
  }>();

  const ids = [b.a1, b.a2, b.b1, b.b2];
  if (ids.some((x) => typeof x !== "number")) {
    return c.json({ error: "Pick 4 players" }, 400);
  }
  if (new Set(ids).size !== 4) {
    return c.json({ error: "All 4 players must be different" }, 400);
  }

  const db = c.env.DB;
  const activePlayers = await loadPlayers(db, gid);
  const activeIds = new Set(activePlayers.filter((p) => p.active).map((p) => p.id));
  if (!ids.every((x) => activeIds.has(x as number))) {
    return c.json({ error: "One of those players isn't in this group" }, 400);
  }

  const sA = b.scoreA;
  const sB = b.scoreB;
  if (
    typeof sA !== "number" ||
    typeof sB !== "number" ||
    !Number.isInteger(sA) ||
    !Number.isInteger(sB) ||
    sA < 0 ||
    sB < 0 ||
    sA > 99 ||
    sB > 99
  ) {
    return c.json({ error: "Scores must be whole numbers (0–99)" }, 400);
  }
  if (sA === sB) {
    return c.json({ error: "No draws in pickleball — someone won!" }, 400);
  }
  if (Math.max(sA, sB) < 11) {
    return c.json({ error: "Winning score must reach at least 11" }, 400);
  }
  if (Math.abs(sA - sB) < 2) {
    return c.json({ error: "You have to win by 2!" }, 400);
  }

  const before = replayMatches((await loadMatches(db, gid)).map(toMatchRecord));
  const winProbA = teamWinProbability(before.ratings, {
    a1: b.a1!,
    a2: b.a2!,
    b1: b.b1!,
    b2: b.b2!,
  });

  await db
    .prepare(
      `INSERT INTO matches (group_id, a1, a2, b1, b2, score_a, score_b, contrib_a, contrib_b)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      gid,
      b.a1,
      b.a2,
      b.b1,
      b.b2,
      sA,
      sB,
      clampContrib(b.contribA ?? 0.5),
      clampContrib(b.contribB ?? 0.5),
    )
    .run();

  const { ratings, events } = await recompute(db, gid);
  const players = await loadPlayers(db, gid);
  const names = new Map(players.map((p) => [p.id, p]));

  const newest = events.slice(-4).map((e) => ({
    playerId: e.playerId,
    name: names.get(e.playerId)?.name ?? "?",
    emoji: names.get(e.playerId)?.emoji ?? "🏓",
    before: e.before,
    after: e.after,
    delta: e.delta,
    newRating: ratings[e.playerId]?.rating ?? BASE_RATING,
  }));

  const aWon = sA > sB;
  const winnerProb = aWon ? winProbA : 1 - winProbA;

  return c.json({ changes: newest, upset: winnerProb < 0.35, winnerProb }, 201);
});

app.delete("/api/groups/:gid/matches/:id", async (c) => {
  if (c.get("role") !== "admin") {
    return c.json({ error: "Only the group admin can delete matches" }, 403);
  }
  const gid = c.get("groupId");
  const id = Number(c.req.param("id"));
  const res = await c.env.DB.prepare(
    "DELETE FROM matches WHERE id = ? AND group_id = ?",
  )
    .bind(id, gid)
    .run();
  if (res.meta.changes === 0) {
    return c.json({ error: "Match not found" }, 404);
  }
  await recompute(c.env.DB, gid);
  return c.json({ ok: true });
});

app.patch("/api/groups/:gid/settings", async (c) => {
  if (c.get("role") !== "admin") {
    return c.json({ error: "Only the group admin can change settings" }, 403);
  }
  const gid = c.get("groupId");
  const body = (await c.req.json().catch(() => ({}))) as {
    name?: string;
    allowMemberAdd?: boolean;
  };
  if (typeof body.name === "string" && body.name.trim()) {
    await c.env.DB.prepare("UPDATE groups SET name = ? WHERE id = ?")
      .bind(body.name.trim().slice(0, 40), gid)
      .run();
  }
  if (typeof body.allowMemberAdd === "boolean") {
    await c.env.DB.prepare("UPDATE groups SET allow_member_add = ? WHERE id = ?")
      .bind(body.allowMemberAdd ? 1 : 0, gid)
      .run();
  }
  return c.json({ ok: true });
});

// ---------- SPA fallback for everything else ----------

app.get("*", (c) => {
  const p = new URL(c.req.url).pathname;
  if (p.startsWith("/api") || p.startsWith("/auth")) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

export default app;
