-- Pickle Royale v3: accounts + multi-group
-- Fresh start under the group model (existing data was test-only).

-- USERS: one per Google login
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  google_sub TEXT,
  name TEXT,
  avatar_url TEXT,
  advanced_mode INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- GROUPS: a private ladder (name + shareable code)
CREATE TABLE groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  creator_user_id INTEGER NOT NULL REFERENCES users(id),
  allow_member_add INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- MEMBERSHIP: user <-> group, with role + per-member permission
CREATE TABLE group_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES groups(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member',          -- 'admin' | 'member'
  can_add_players INTEGER NOT NULL DEFAULT 0,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(group_id, user_id)
);
CREATE INDEX idx_gm_user ON group_members(user_id);
CREATE INDEX idx_gm_group ON group_members(group_id);

-- Rebuild players/matches/rating_events with group scoping.
-- Drop in dependency order (dependents first) so FKs don't block.
DROP TABLE rating_events;
DROP TABLE matches;
DROP TABLE players;

CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES groups(id),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🏓',
  active INTEGER NOT NULL DEFAULT 1,
  owner_user_id INTEGER REFERENCES users(id),    -- set when a user claims this player
  invited_email TEXT,                            -- pre-attached email for auto-link on login
  added_by_user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(group_id, name)                         -- names unique within a group, not globally
);
CREATE INDEX idx_players_group ON players(group_id);
CREATE INDEX idx_players_owner ON players(owner_user_id);
CREATE INDEX idx_players_invited ON players(invited_email);

CREATE TABLE matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES groups(id),
  played_at TEXT NOT NULL DEFAULT (datetime('now')),
  a1 INTEGER NOT NULL REFERENCES players(id),
  a2 INTEGER NOT NULL REFERENCES players(id),
  b1 INTEGER NOT NULL REFERENCES players(id),
  b2 INTEGER NOT NULL REFERENCES players(id),
  score_a INTEGER NOT NULL,
  score_b INTEGER NOT NULL,
  contrib_a REAL NOT NULL DEFAULT 0.5,
  contrib_b REAL NOT NULL DEFAULT 0.5,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_matches_group ON matches(group_id, played_at);

CREATE TABLE rating_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES groups(id),
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id),
  rating_before REAL NOT NULL,
  rating_after REAL NOT NULL,
  delta REAL NOT NULL
);
CREATE INDEX idx_re_group ON rating_events(group_id);
CREATE INDEX idx_re_player ON rating_events(player_id);
CREATE INDEX idx_re_match ON rating_events(match_id);

-- CLAIM REQUESTS: a user asks to own an existing player
-- (created after players is rebuilt so the FK resolves to the new table)
CREATE TABLE claim_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES groups(id),
  player_id INTEGER NOT NULL REFERENCES players(id),
  requester_user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',        -- 'pending' | 'approved' | 'denied'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_by INTEGER,
  resolved_at TEXT
);
CREATE INDEX idx_claims_group ON claim_requests(group_id, status);
