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
  avatarUrl: string | null;
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
  rank: number | null;
  wins: number;
  losses: number;
  history: { matchId: number; playedAt: string; rating: number; delta: number }[];
  bestPartner: PartnerStat | null;
  nemesis: PartnerStat | null;
  favouriteVictim: PartnerStat | null;
  biggestWin: { matchId: number; delta: number } | null;
  ownerUserId: number | null;
  avatarUrl: string | null;
  invitedEmail: string | null;
  // advanced (Phase 3)
  currentStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
  carryScore: number; // avg contribution %, >50 = carrier
  clutch: { wins: number; losses: number };
  picklesGiven: number;
  picklesTaken: number;
  teammates: Breakdown[];
  opponents: Breakdown[];
  badges: Badge[];
}

export interface PartnerStat extends Player {
  games: number;
  wins: number;
  winRate: number;
}

export interface Breakdown extends Player {
  games: number;
  wins: number;
  losses: number;
}

export interface Badge {
  key: string;
  label: string;
  emoji: string;
}

export interface Motivation {
  line: string;
  tone: "win" | "loss" | "neutral";
}

interface Mover {
  id: number;
  name: string;
  emoji: string;
  rank: number;
  rankDelta: number;
  ratingDelta: number;
}

export interface Movers {
  risers: Mover[];
  mostImproved: Mover | null;
  powerCouple: {
    a: { name: string; emoji: string };
    b: { name: string; emoji: string };
    games: number;
    wins: number;
    winRate: number;
  } | null;
  playedThisWeek: boolean;
}

export interface GroupSummary {
  groupId: number;
  groupName: string;
  role: "admin" | "member";
  myPlayerId: number | null;
  playerName: string | null;
  emoji: string | null;
  avatarUrl: string | null;
  rank: number | null;
  rating: number | null;
  wins: number;
  losses: number;
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
  pendingClaims: number; // pending claim requests in this group (for admins)
  myPending: number; // claim requests I have pending here
}

export interface ClaimRequest {
  id: number;
  playerId: number;
  playerName: string;
  playerEmoji: string;
  requesterName: string | null;
  requesterEmail: string;
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
  summary: () => req<{ summary: GroupSummary[] }>("/api/me/summary"),

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

  // claiming + invites (Phase 2)
  invitePlayer: (playerId: number, email: string) =>
    req<{ linked?: boolean; invited?: boolean }>(
      `/api/groups/${gid()}/players/${playerId}/invite`,
      { method: "POST", body: JSON.stringify({ email }) },
    ),
  claimPlayer: (playerId: number) =>
    req<{ linked?: boolean; requested?: boolean }>(
      `/api/groups/${gid()}/players/${playerId}/claim`,
      { method: "POST" },
    ),
  claims: () => req<{ claims: ClaimRequest[] }>(`/api/groups/${gid()}/claims`),
  motivation: () =>
    req<{ motivation: Motivation | null }>(`/api/groups/${gid()}/motivation`),
  movers: () => req<Movers>(`/api/groups/${gid()}/movers`),
  approveClaim: (cid: number) =>
    req<{ approved: true }>(`/api/groups/${gid()}/claims/${cid}/approve`, {
      method: "POST",
    }),
  denyClaim: (cid: number) =>
    req<{ denied: true }>(`/api/groups/${gid()}/claims/${cid}/deny`, {
      method: "POST",
    }),
};
