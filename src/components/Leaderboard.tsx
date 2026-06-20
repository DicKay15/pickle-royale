import { useEffect, useState } from "react";
import { api, type BoardEntry, type MeGroup } from "../api";

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const w = 64;
  const h = 20;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map(
      (v, i) =>
        `${((i / (data.length - 1)) * w).toFixed(1)},${(
          h -
          2 -
          ((v - min) / range) * (h - 4)
        ).toFixed(1)}`,
    )
    .join(" ");
  const rising = data[data.length - 1] >= data[0];
  return (
    <svg
      className="spark"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={rising ? "var(--court)" : "var(--coral)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function streakBadge(streak: number) {
  if (streak >= 3)
    return <span className="streak-pill hot">🔥 {streak} streak</span>;
  if (streak <= -3)
    return <span className="streak-pill cold">🧊 {-streak} skid</span>;
  return null;
}

const MID_TITLES = [
  "Solid Citizen",
  "Mid-Court Menace",
  "Honest Hustler",
  "Baseline Brawler",
  "Dink Apprentice",
];

// witty honorific for a ranked player at 1-based position `pos` of `total`
function honorific(pos: number, total: number): { text: string; spoon: boolean } {
  if (pos === 2) return { text: "Heir to the Throne", spoon: false };
  if (pos === 3) return { text: "Court General", spoon: false };
  if (total >= 4 && pos === total) return { text: "Wooden Spoon 🥄", spoon: true };
  if (total >= 6 && pos === total - 1) return { text: "Net Casualty", spoon: false };
  return { text: MID_TITLES[pos % MID_TITLES.length], spoon: false };
}

const LOAD_LINES = [
  "Chalking the lines…",
  "Inflating the ball…",
  "Consulting the rulebook…",
  "Waxing the paddles…",
];

const randomLine = () =>
  LOAD_LINES[Math.floor(Math.random() * LOAD_LINES.length)];

export default function Leaderboard({
  version,
  meGroup,
  onSelect,
  onAdd,
  onLog,
  onClaim,
}: {
  version: number;
  meGroup: MeGroup;
  onSelect: (id: number) => void;
  onAdd: () => void;
  onLog: () => void;
  onClaim: () => void;
}) {
  const [board, setBoard] = useState<BoardEntry[] | null>(null);
  const [totalMatches, setTotalMatches] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadLine] = useState(randomLine);

  useEffect(() => {
    let alive = true;
    api
      .leaderboard()
      .then((d) => {
        if (!alive) return;
        setBoard(d.leaderboard);
        setTotalMatches(d.totalMatches);
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [version]);

  if (error)
    return (
      <div className="page empty">
        <span className="big">🥒</span>
        <h3>Court unavailable</h3>
        <p>{error}</p>
      </div>
    );

  if (!board)
    return (
      <div className="page" aria-busy="true">
        <img className="load-mascot" src="/mascot.svg" alt="" />
        <div className="load-line">{loadLine}</div>
        <div className="skel" style={{ height: 120, margin: "16px 0 14px" }} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skel" style={{ height: 70, marginBottom: 10 }} />
        ))}
      </div>
    );

  const hasGames = totalMatches > 0;
  const ranked = board.filter((p) => p.matches > 0);
  const bench = board.filter((p) => p.matches === 0);
  const [champ, ...rest] = ranked;
  const myId = meGroup.myPlayerId;

  // prompt to claim your player (only if you don't own one here yet)
  const claimBanner =
    myId == null ? (
      meGroup.myPending > 0 ? (
        <div className="claim-banner pending">
          ⏳ Claim sent — waiting for the admin to approve.
        </div>
      ) : (
        <button className="claim-banner" onClick={onClaim}>
          👋 Which one is you? <b>Claim your player</b>
        </button>
      )
    ) : null;

  return (
    <div className="page">
      {claimBanner}
      {hasGames && champ ? (
        <>
          <section
            className="champ"
            onClick={() => onSelect(champ.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onSelect(champ.id)}
          >
            <div className="champ-crown" aria-hidden="true">
              👑
            </div>
            <div className="champ-label">Reigning Champ</div>
            <div className="champ-row">
              <div className="champ-emoji">{champ.emoji}</div>
              <div>
                <div className="champ-name">
                  {champ.name}
                  {champ.id === myId && <span className="you-pill">you</span>}
                </div>
                <div className="champ-title">The Don of Dink</div>
                <div className="champ-record">
                  {champ.wins}W – {champ.losses}L
                  {champ.streak >= 3 ? ` · 🔥 ${champ.streak} streak` : ""}
                </div>
              </div>
              <div className="champ-rating">
                <div className="num">{Math.round(champ.rating)}</div>
                <div className="lbl">Royale Rating</div>
              </div>
            </div>
          </section>

          <div className="board">
            {rest.map((p, i) => {
              const title = honorific(i + 2, ranked.length);
              return (
              <button
                key={p.id}
                className="board-row"
                style={{ animationDelay: `${0.06 * (i + 1)}s` }}
                onClick={() => onSelect(p.id)}
              >
                <span className="rank-no">{i + 2}</span>
                <span className="row-emoji">{p.emoji}</span>
                <span className="row-main">
                  <span className="row-name">
                    {p.name}
                    {p.id === myId && <span className="you-pill">you</span>}
                  </span>
                  <span className={`row-title ${title.spoon ? "spoon" : ""}`}>
                    {title.text}
                  </span>
                  <span className="row-sub">
                    <span style={{ whiteSpace: "nowrap" }}>
                      {p.wins}W–{p.losses}L
                    </span>
                    {streakBadge(p.streak)}
                    {p.provisional && p.matches > 0 && (
                      <span className="prov-tag">new</span>
                    )}
                  </span>
                </span>
                <span className="row-rating">
                  <span className="num">{Math.round(p.rating)}</span>
                  <Sparkline data={p.spark} />
                </span>
              </button>
              );
            })}
          </div>

          {bench.length > 0 && (
            <>
              <h2 className="page-title" style={{ marginTop: 22 }}>
                On the bench
              </h2>
              <div className="board">
                {bench.map((p) => (
                  <button
                    key={p.id}
                    className="board-row"
                    style={{ opacity: 0.75 }}
                    onClick={() => onSelect(p.id)}
                  >
                    <span className="rank-no">–</span>
                    <span className="row-emoji">{p.emoji}</span>
                    <span className="row-main">
                      <span className="row-name">{p.name}</span>
                      <span className="row-sub">yet to rumble</span>
                    </span>
                    <span className="row-rating">
                      <span className="num" style={{ color: "var(--ink-soft)" }}>
                        {Math.round(p.rating)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="empty">
          <img
            src="/mascot.svg"
            alt=""
            style={{ width: 130, margin: "0 auto 4px", display: "block" }}
          />
          <h3>The court is silent…</h3>
          <p>
            Everyone starts at 1200. Log the first rumble and let the rankings
            begin!
          </p>
          <button
            className="cta"
            style={{ marginTop: 16 }}
            onClick={onLog}
          >
            Log first match
          </button>
        </div>
      )}

      <button
        className="cta secondary"
        style={{ marginTop: 14 }}
        onClick={onAdd}
      >
        + Add a player
      </button>
    </div>
  );
}
