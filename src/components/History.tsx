import { useEffect, useState } from "react";
import { api, type MatchEntry, type MatchPlayer } from "../api";

function fmtDate(iso: string) {
  const d = new Date(iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function SidePlayers({
  players,
  right,
}: {
  players: MatchPlayer[];
  right?: boolean;
}) {
  return (
    <div className={`h-side ${right ? "right" : ""}`}>
      {players.map((p) => (
        <span key={p.id} className="h-p">
          {!right && <span>{p.emoji}</span>}
          {right && (
            <span className={`d ${p.delta >= 0 ? "delta up" : "delta down"}`}>
              {p.delta >= 0 ? "+" : ""}
              {Math.round(p.delta)}
            </span>
          )}
          <span>{p.name}</span>
          {!right && (
            <span className={`d ${p.delta >= 0 ? "delta up" : "delta down"}`}>
              {p.delta >= 0 ? "+" : ""}
              {Math.round(p.delta)}
            </span>
          )}
          {right && <span>{p.emoji}</span>}
        </span>
      ))}
    </div>
  );
}

export default function History({
  version,
  onChanged,
  showToast,
}: {
  version: number;
  onChanged: () => void;
  showToast: (msg: string) => void;
}) {
  const [matches, setMatches] = useState<MatchEntry[] | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    api
      .matches()
      .then((d) => setMatches(d.matches))
      .catch(() => showToast("Couldn't load match history"));
  }, [version, showToast]);

  const del = async (id: number) => {
    try {
      await api.deleteMatch(id);
      setConfirmId(null);
      showToast("Match deleted — ratings recalculated");
      onChanged();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't delete");
    }
  };

  if (!matches)
    return (
      <div className="page" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skel" style={{ height: 110, marginBottom: 10 }} />
        ))}
      </div>
    );

  return (
    <div className="page">
      <h2 className="page-title">Past Rumbles</h2>

      {matches.length === 0 ? (
        <div className="empty">
          <span className="big">📜</span>
          <h3>No rumbles yet</h3>
          <p>Match history shows up here once you log your first game.</p>
        </div>
      ) : (
        matches.map((m, i) => (
          <article
            key={m.id}
            className="h-card"
            style={{ animationDelay: `${Math.min(i, 6) * 0.05}s` }}
          >
            <div className="h-top">
              <span>{fmtDate(m.playedAt)}</span>
              {confirmId === m.id ? (
                <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ color: "var(--coral)" }}>Delete?</span>
                  <button
                    className="h-del"
                    style={{ color: "var(--coral)", fontWeight: 800 }}
                    onClick={() => del(m.id)}
                  >
                    Yes
                  </button>
                  <button className="h-del" onClick={() => setConfirmId(null)}>
                    No
                  </button>
                </span>
              ) : (
                <button
                  className="h-del"
                  aria-label="Delete match"
                  onClick={() => setConfirmId(m.id)}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="h-teams">
              <SidePlayers players={m.teamA} />
              <div className="h-score">
                <span className={m.scoreA > m.scoreB ? "win" : "lose"}>
                  {m.scoreA}
                </span>
                <span style={{ fontSize: 14, opacity: 0.5 }}>–</span>
                <span className={m.scoreB > m.scoreA ? "win" : "lose"}>
                  {m.scoreB}
                </span>
              </div>
              <SidePlayers players={m.teamB} right />
            </div>
          </article>
        ))
      )}
    </div>
  );
}
