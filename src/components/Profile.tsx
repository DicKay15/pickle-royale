import { useEffect, useState, type ReactNode } from "react";
import { api, type Profile as ProfileData } from "../api";
import Avatar from "./Avatar";
import InfoSheet from "./InfoSheet";
import { STAT_INFO, type Info } from "../statInfo";
import { ACHIEVEMENTS } from "../achievements";

function RatingChart({ history }: { history: { rating: number }[] }) {
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

function streakLabel(s: number) {
  if (s >= 1) return `🔥 ${s}W`;
  if (s <= -1) return `🧊 ${-s}L`;
  return "–";
}

export default function Profile({
  id,
  version,
  isAdmin,
  advanced,
  embedded,
  onBack,
  onChanged,
  showToast,
}: {
  id: number;
  version: number;
  isAdmin: boolean;
  advanced: boolean;
  embedded?: boolean;
  onBack?: () => void;
  onChanged: () => void;
  showToast: (m: string) => void;
}) {
  const [p, setP] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    api.profile(id).then(setP).catch((e) => setError(e.message));
  }, [id, version]);

  const invite = async () => {
    const email = inviteEmail.trim();
    if (!email || inviting) return;
    setInviting(true);
    try {
      const res = await api.invitePlayer(id, email);
      showToast(res.linked ? "Linked! They're in. 🎉" : "Invite saved ✉️");
      setInviteEmail("");
      onChanged();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't invite");
    } finally {
      setInviting(false);
    }
  };

  if (error)
    return (
      <div className="page empty">
        <span className="big">🤔</span>
        <h3>Player not found</h3>
        {!embedded && onBack && (
          <button className="cta secondary" style={{ marginTop: 12 }} onClick={onBack}>
            ← Back
          </button>
        )}
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

  // a tappable stat cell that opens the explainer
  const Cell = ({
    infoKey,
    label,
    children,
  }: {
    infoKey: string;
    label: string;
    children: ReactNode;
  }) => (
    <button
      className="stat-cell tappable"
      onClick={() => setInfo(STAT_INFO[infoKey])}
    >
      <div className="k">
        {label} <span className="info-dot">ⓘ</span>
      </div>
      <div className="v">{children}</div>
    </button>
  );

  const rival = (r: ProfileData["bestPartner"]) =>
    r ? (
      <>
        {r.emoji} {r.name}
      </>
    ) : (
      <span style={{ color: "var(--ink-soft)" }}>TBD</span>
    );

  return (
    <div className="page">
      {!embedded && onBack && (
        <button className="back-btn" onClick={onBack}>
          ← Standings
        </button>
      )}

      {/* HERO */}
      <div className="profile-hero">
        <Avatar className="big-av" emoji={p.emoji} avatarUrl={p.avatarUrl} />
        <div>
          <h2>{p.name}</h2>
          <div className="meta">
            {p.rank ? `#${p.rank}` : "Unranked"} · {p.wins}W–{p.losses}L
            {total > 0 ? ` · ${winRate}%` : ""}
          </div>
        </div>
        <div className="num">{Math.round(p.rating)}</div>
      </div>

      {/* RATING JOURNEY */}
      <button
        className="section-head"
        onClick={() => setInfo(STAT_INFO.ratingJourney)}
      >
        Rating journey <span className="info-dot">ⓘ</span>
      </button>
      <div className="chart-card">
        <RatingChart history={p.history} />
      </div>

      {/* FORM */}
      <div className="section-head plain">Form</div>
      <div className="stat-grid">
        <Cell infoKey="currentStreak" label="Current streak">
          {streakLabel(p.currentStreak)}
        </Cell>
        <Cell infoKey="longestWinStreak" label="Longest win streak">
          {p.longestWinStreak}
        </Cell>
        <Cell infoKey="matches" label="Matches">
          {total}
        </Cell>
        <Cell infoKey="biggestHeist" label="Biggest heist">
          {p.biggestWin ? (
            <span className="delta up">+{Math.round(p.biggestWin.delta)}</span>
          ) : (
            <span style={{ color: "var(--ink-soft)" }}>TBD</span>
          )}
        </Cell>
      </div>

      {/* RIVALRIES (highlights, always shown) */}
      <div className="section-head plain">Rivalries &amp; chemistry</div>
      <div className="stat-grid">
        <Cell infoKey="dreamPartner" label="Dream partner">
          {rival(p.bestPartner)}
        </Cell>
        <Cell infoKey="nemesis" label="Nemesis">
          {rival(p.nemesis)}
        </Cell>
        <Cell infoKey="favouriteVictim" label="Favourite victim">
          {rival(p.favouriteVictim)}
        </Cell>
      </div>

      {/* ACHIEVEMENTS (earned + locked) */}
      <div className="section-head plain">Achievements</div>
      <div className="ach-grid">
        {ACHIEVEMENTS.map((a) => {
          const earned = p.badges.some((b) => b.key === a.key);
          return (
            <button
              key={a.key}
              className={`ach ${earned ? "earned" : "locked"}`}
              onClick={() =>
                setInfo({
                  title: a.label,
                  body: earned ? `Earned! ${a.how}` : `Locked. ${a.how}`,
                })
              }
            >
              <span className="ach-emoji">{earned ? a.emoji : "🔒"}</span>
              <span className="ach-label">{a.label}</span>
            </button>
          );
        })}
      </div>

      {/* ADVANCED: playstyle + breakdown tables */}
      {advanced && (
        <>
          <div className="section-head plain">Playstyle</div>
          <div className="stat-grid">
            <Cell infoKey="carryScore" label="Carry score">
              {p.carryScore}%{" "}
              <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                {p.carryScore >= 55
                  ? "carrier"
                  : p.carryScore <= 45
                    ? "carried"
                    : "balanced"}
              </span>
            </Cell>
            <Cell infoKey="clutch" label="Clutch (by 2)">
              {p.clutch.wins}–{p.clutch.losses}
            </Cell>
            <Cell infoKey="pickles" label="Pickles">
              🥒 {p.picklesGiven} · 😵 {p.picklesTaken}
            </Cell>
          </div>

          {p.teammates.length > 0 && (
            <>
              <button
                className="section-head"
                onClick={() => setInfo(STAT_INFO.teammates)}
              >
                With teammates <span className="info-dot">ⓘ</span>
              </button>
              <div className="bd-card">
                {p.teammates.slice(0, 6).map((t) => (
                  <div key={t.id} className="bd-row">
                    <Avatar className="bd-emoji" emoji={t.emoji} />
                    <span className="bd-name">{t.name}</span>
                    <span className="bd-rec">
                      {t.wins}–{t.losses}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {p.opponents.length > 0 && (
            <>
              <button
                className="section-head"
                onClick={() => setInfo(STAT_INFO.opponents)}
              >
                Against opponents <span className="info-dot">ⓘ</span>
              </button>
              <div className="bd-card">
                {p.opponents.slice(0, 6).map((o) => (
                  <div key={o.id} className="bd-row">
                    <Avatar className="bd-emoji" emoji={o.emoji} />
                    <span className="bd-name">{o.name}</span>
                    <span className="bd-rec">
                      {o.wins}–{o.losses}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* claim status / admin invite */}
      {p.ownerUserId != null ? (
        <div className="claimed-note">✅ This player has been claimed</div>
      ) : (
        isAdmin && (
          <div className="invite-card">
            <h4>Invite {p.name} to claim this profile</h4>
            <p>
              Attach their email and they'll get this player (with all its history)
              automatically when they sign in.
            </p>
            <div className="invite-row">
              <input
                className="field-input"
                style={{ marginBottom: 0 }}
                type="email"
                inputMode="email"
                placeholder="their@gmail.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && invite()}
              />
              <button className="cta" disabled={inviting} onClick={invite}>
                {inviting ? "…" : "Invite"}
              </button>
            </div>
            {p.invitedEmail && (
              <div className="field-hint">Currently invited: {p.invitedEmail}</div>
            )}
          </div>
        )
      )}

      <InfoSheet info={info} onClose={() => setInfo(null)} />
    </div>
  );
}
