// Typed client for the Pickle Royale API (group-scoped).

export interface Player {
  id: number;
  name: string;
  emoji: string;
}

export interface BoardEntry extends Player {
  rating: number;
  matches: number;
  wins: number;
  losses: number;
  streak: number;
  last5: boolean[];
  spark: number[];
  provisional: boolean;
  ownerUserId: number | null;
}

export interface MatchPlayer extends Player {
  delta: number;
}

export interface MatchEntry {
  id: number;
  playedAt: string;
  teamA: MatchPlayer[];
  teamB: MatchPlayer[];
  scoreA: number;
  scoreB: number;
}

export interface RatingChange {
  playerId: number;
  name: string;
  emoji: string;
  before: number;
  after: number;
  delta: number;
  newRating: number;
}

export interface LogResult {
  changes: RatingChange[];
  upset: boolean;
  winnerProb: number;
}

export interface Profile extends Player {
  rating: number;
  wins: number;
  losses: number;
  history: { matchId: number; playedAt: string; rating: number; delta: number }[];
  bestPartner: PartnerStat | null;
  nemesis: PartnerStat | null;
  biggestWin: { matchId: number; delta: number } | null;
}

export interface PartnerStat extends Player {
  games: number;
  wins: number;
  winRate: number;
}

export interface MeGroup {
  id: number;
  name: string;
  code: string;
  allowMemberAdd: boolean;
  role: "admin" | "member";
  canAddPlayers: boolean;
  myPlayerId: number | null;
  myPlayerName: string | null;
}

export interface Me {
  user: {
    id: number;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    advancedMode: boolean;
  };
  groups: MeGroup[];
}

// ---- current group (set by App after login) ----
let currentGroupId: number | null = null;
export function setGroup(id: number | null): void {
  currentGroupId = id;
}
function gid(): number {
  if (currentGroupId == null) throw new Error("No group selected");
  return currentGroupId;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...init,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    const err = new Error(data.error ?? "Something went wrong — try again") as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // auth + account
  me: async (): Promise<Me | null> => {
    try {
      return await req<Me>("/api/me");
    } catch (e) {
      if ((e as { status?: number }).status === 401) return null;
      throw e;
    }
  },
  setAdvanced: (advancedMode: boolean) =>
    req<{ ok: true }>("/api/me", {
      method: "PATCH",
      body: JSON.stringify({ advancedMode }),
    }),
  logout: () => req<{ ok: true }>("/auth/logout", { method: "POST" }),

  // groups
  createGroup: (name: string) =>
    req<{ group: MeGroup }>("/api/groups", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  joinGroup: (code: string) =>
    req<{ group: MeGroup }>("/api/groups/join", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  updateSettings: (input: { name?: string; allowMemberAdd?: boolean }) =>
    req<{ ok: true }>(`/api/groups/${gid()}/settings`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  // group-scoped data
  leaderboard: () =>
    req<{ leaderboard: BoardEntry[]; totalMatches: number }>(
      `/api/groups/${gid()}/leaderboard`,
    ),
  players: () => req<{ players: Player[] }>(`/api/groups/${gid()}/players`),
  profile: (id: number) =>
    req<Profile>(`/api/groups/${gid()}/players/${id}`),
  matches: () => req<{ matches: MatchEntry[] }>(`/api/groups/${gid()}/matches`),
  addPlayer: (name: string, emoji: string, invitedEmail?: string) =>
    req<{ player: Player }>(`/api/groups/${gid()}/players`, {
      method: "POST",
      body: JSON.stringify({ name, emoji, invitedEmail }),
    }),
  logMatch: (input: {
    a1: number;
    a2: number;
    b1: number;
    b2: number;
    scoreA: number;
    scoreB: number;
    contribA: number;
    contribB: number;
  }) =>
    req<LogResult>(`/api/groups/${gid()}/matches`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  deleteMatch: (id: number) =>
    req<{ ok: true }>(`/api/groups/${gid()}/matches/${id}`, {
      method: "DELETE",
    }),
};
