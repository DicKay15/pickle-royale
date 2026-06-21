import { useEffect, useState } from "react";
import { api, type MatchEntry, type MatchPlayer } from "../api";
import { ConfirmModal } from "./Modal";
import { CloseIcon } from "./icons";

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
  isAdmin,
  onChanged,
  showToast,
}: {
  version: number;
  isAdmin: boolean;
  onChanged: () => void;
  showToast: (msg: string) => void;
}) {
  const [matches, setMatches] = useState<MatchEntry[] | null>(null);
  const [confirm, setConfirm] = useState<MatchEntry | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .matches()
      .then((d) => setMatches(d.matches))
      .catch(() => showToast("Couldn't load match history"));
  }, [version, showToast]);

  const del = async () => {
    if (!confirm || busy) return;
    setBusy(true);
    try {
      await api.deleteMatch(confirm.id);
      showToast("Match deleted — ratings recalculated");
      setConfirm(null);
      onChanged();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't delete");
    } finally {
      setBusy(false);
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
              {isAdmin && (
                <button
                  className="h-del"
                  aria-label="Delete this match"
                  onClick={() => setConfirm(m)}
                >
                  <CloseIcon className="h-del-ico" />
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

      {confirm && (
        <ConfirmModal
          title="Delete this match?"
          danger
          busy={busy}
          confirmLabel="Delete"
          body={`This removes the ${confirm.scoreA}–${confirm.scoreB} result and recalculates everyone's ratings. This can't be undone.`}
          onConfirm={del}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
