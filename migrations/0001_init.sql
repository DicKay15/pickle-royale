-- Pickle Royale schema
CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL DEFAULT '🏓',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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

CREATE TABLE rating_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id),
  rating_before REAL NOT NULL,
  rating_after REAL NOT NULL,
  delta REAL NOT NULL
);

CREATE INDEX idx_matches_played_at ON matches(played_at);
CREATE INDEX idx_re_player ON rating_events(player_id);
CREATE INDEX idx_re_match ON rating_events(match_id);
