import { useEffect, useState } from "react";
import { api, type Profile as ProfileData } from "../api";

function RatingChart({
  history,
}: {
  history: { rating: number }[];
}) {
  const data = [1200, ...history.map((h) => h.rating)];
  if (data.length < 2)
    return (
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>
        Play a match to start the journey 📈
      </p>
    );
  const w = 320;
  const h = 120;
  const pad = 8;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const x = (i: number) => pad + (i / (data.length - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - ((v - min) / range) * (h - pad * 2);
  const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const last = data[data.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: "100%", height: "auto", display: "block" }}
      role="img"
      aria-label="Rating history chart"
    >
      {/* baseline at 1200 */}
      <line
        x1={pad}
        x2={w - pad}
        y1={y(1200)}
        y2={y(1200)}
        stroke="var(--ink-soft)"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.4"
      />
      <polyline
        points={`${pts.join(" ")} ${x(data.length - 1)},${h - pad} ${x(0)},${h - pad}`}
        fill="var(--lime-soft)"
        opacity="0.7"
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="var(--court)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={x(data.length - 1)}
        cy={y(last)}
        r="5"
        fill="var(--lime)"
        stroke="var(--ink)"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function Profile({
  id,
  version,
  onBack,
}: {
  id: number;
  version: number;
  onBack: () => void;
}) {
  const [p, setP] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .profile(id)
      .then(setP)
      .catch((e) => setError(e.message));
  }, [id, version]);

  if (error)
    return (
      <div className="page empty">
        <span className="big">🤔</span>
        <h3>Player not found</h3>
        <button className="cta secondary" style={{ marginTop: 12 }} onClick={onBack}>
          ← Back
        </button>
      </div>
    );

  if (!p)
    return (
      <div className="page" aria-busy="true">
        <div className="skel" style={{ height: 90, marginBottom: 14 }} />
        <div className="skel" style={{ height: 150, marginBottom: 14 }} />
        <div className="skel" style={{ height: 120 }} />
      </div>
    );

  const total = p.wins + p.losses;
  const winRate = total ? Math.round((p.wins / total) * 100) : 0;

  return (
    <div className="page">
      <button className="back-btn" onClick={onBack}>
        ← Standings
      </button>

      <div className="profile-hero">
        <div className="big-av">{p.emoji}</div>
        <div>
          <h2>{p.name}</h2>
          <div className="meta">
            {p.wins}W – {p.losses}L{total > 0 ? ` · ${winRate}% wins` : ""}
          </div>
        </div>
        <div className="num">{Math.round(p.rating)}</div>
      </div>

      <div className="chart-card">
        <h4>Rating journey</h4>
        <RatingChart history={p.history} />
      </div>

      <div className="stat-grid">
        <div className="stat-cell">
          <div className="k">Dream partner</div>
          <div className="v">
            {p.bestPartner ? (
              <>
                {p.bestPartner.emoji} {p.bestPartner.name}
                <span style={{ color: "var(--court)", fontSize: 12 }}>
                  {Math.round(p.bestPartner.winRate * 100)}%
                </span>
              </>
            ) : (
              <span style={{ color: "var(--ink-soft)" }}>TBD</span>
            )}
          </div>
        </div>
        <div className="stat-cell">
          <div className="k">Nemesis</div>
          <div className="v">
            {p.nemesis ? (
              <>
                {p.nemesis.emoji} {p.nemesis.name}
                <span style={{ color: "var(--coral)", fontSize: 12 }}>
                  {Math.round(p.nemesis.winRate * 100)}% vs
                </span>
              </>
            ) : (
              <span style={{ color: "var(--ink-soft)" }}>TBD</span>
            )}
          </div>
        </div>
        <div className="stat-cell">
          <div className="k">Matches</div>
          <div className="v">{total}</div>
        </div>
        <div className="stat-cell">
          <div className="k">Biggest heist</div>
          <div className="v">
            {p.biggestWin ? (
              <span className="delta up">+{Math.round(p.biggestWin.delta)} pts</span>
            ) : (
              <span style={{ color: "var(--ink-soft)" }}>TBD</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
