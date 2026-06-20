import { useRef, useState, type ReactNode } from "react";
import type { Profile as ProfileData } from "../api";
import Avatar from "./Avatar";
import InfoSheet from "./InfoSheet";
import { STAT_INFO, type Info } from "../statInfo";
import { ACHIEVEMENTS } from "../achievements";
import { ACH_ICONS, LockIcon } from "./icons";

/* ---------- rating journey: hold + drag to scrub ---------- */

export function RatingChart({ history }: { history: ProfileData["history"] }) {
  const ratings = [1200, ...history.map((h) => h.rating)];
  const [active, setActive] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  if (ratings.length < 2)
    return (
      <div className="chart-card">
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>
          Play a match to start the journey 📈
        </p>
      </div>
    );

  const n = ratings.length;
  const w = 320;
  const h = 120;
  const pad = 8;
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const range = max - min || 1;
  const X = (i: number) => pad + (i / (n - 1)) * (w - pad * 2);
  const Y = (v: number) => h - pad - ((v - min) / range) * (h - pad * 2);
  const pts = ratings.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`);

  const scrub = (clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setActive(Math.round(frac * (n - 1)));
  };

  const dotIdx = active ?? n - 1;
  const activeVal = active != null ? ratings[active] : null;
  const delta = active != null && active > 0 ? history[active - 1].delta : null;

  return (
    <div className="chart-card">
      <div
        className="chart-wrap"
        ref={wrapRef}
        onPointerDown={(e) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
          scrub(e.clientX);
        }}
        onPointerMove={(e) => {
          if (active != null) scrub(e.clientX);
        }}
        onPointerUp={() => setActive(null)}
        onPointerCancel={() => setActive(null)}
      >
        <svg
          viewBox={`0 0 ${w} ${h}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          role="img"
          aria-label="Rating history chart. Press and drag to scrub."
        >
          <line
            x1={pad}
            x2={w - pad}
            y1={Y(1200)}
            y2={Y(1200)}
            stroke="var(--ink-soft)"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.4"
          />
          <polyline
            points={`${pts.join(" ")} ${X(n - 1)},${h - pad} ${X(0)},${h - pad}`}
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
          {active != null && (
            <line
              x1={X(active)}
              x2={X(active)}
              y1={pad}
              y2={h - pad}
              stroke="var(--ink)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.5"
            />
          )}
          <circle
            cx={X(dotIdx)}
            cy={Y(ratings[dotIdx])}
            r="5"
            fill="var(--lime)"
            stroke="var(--ink)"
            strokeWidth="2"
          />
        </svg>

        {active != null && activeVal != null && (
          <div
            className="chart-pill"
            style={{ left: `${(X(active) / w) * 100}%`, top: `${(Y(activeVal) / h) * 100}%` }}
          >
            <span className="cp-rating">{Math.round(activeVal)}</span>
            {delta != null && (
              <span className={`cp-delta ${delta >= 0 ? "up" : "down"}`}>
                {delta >= 0 ? "+" : ""}
                {Math.round(delta)}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="chart-hint">Hold & drag the line to scrub your history</div>
    </div>
  );
}

/* ---------- hero ---------- */

export function ProfileHero({ p }: { p: ProfileData }) {
  const total = p.wins + p.losses;
  const winRate = total ? Math.round((p.wins / total) * 100) : 0;
  return (
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
  );
}

/* ---------- the six stat sections ---------- */

function streakLabel(s: number) {
  if (s >= 1) return `🔥 ${s}W`;
  if (s <= -1) return `🧊 ${-s}L`;
  return "–";
}

export function StatsSections({ p }: { p: ProfileData }) {
  const [info, setInfo] = useState<Info | null>(null);

  const Cell = ({
    infoKey,
    label,
    children,
  }: {
    infoKey: string;
    label: string;
    children: ReactNode;
  }) => (
    <button className="stat-cell tappable" onClick={() => setInfo(STAT_INFO[infoKey])}>
      <div className="k">
        {label} <span className="info-dot">ⓘ</span>
      </div>
      <div className="v">{children}</div>
    </button>
  );

  const rival = (rv: ProfileData["bestPartner"]) =>
    rv ? (
      <>
        {rv.emoji} {rv.name}
      </>
    ) : (
      <span style={{ color: "var(--ink-soft)" }}>TBD</span>
    );

  return (
    <>
      <button className="section-head" onClick={() => setInfo(STAT_INFO.ratingJourney)}>
        Rating journey <span className="info-dot">ⓘ</span>
      </button>
      <RatingChart history={p.history} />

      <div className="section-head plain">Form</div>
      <div className="stat-grid">
        <Cell infoKey="currentStreak" label="Current streak">
          {streakLabel(p.currentStreak)}
        </Cell>
        <Cell infoKey="longestWinStreak" label="Longest win streak">
          {p.longestWinStreak}
        </Cell>
        <Cell infoKey="matches" label="Matches">
          {p.wins + p.losses}
        </Cell>
        <Cell infoKey="biggestHeist" label="Biggest heist">
          {p.biggestWin ? (
            <span className="delta up">+{Math.round(p.biggestWin.delta)}</span>
          ) : (
            <span style={{ color: "var(--ink-soft)" }}>TBD</span>
          )}
        </Cell>
      </div>

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
          <button className="section-head" onClick={() => setInfo(STAT_INFO.teammates)}>
            You and <span className="info-dot">ⓘ</span>
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
          <button className="section-head" onClick={() => setInfo(STAT_INFO.opponents)}>
            You vs <span className="info-dot">ⓘ</span>
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

      <InfoSheet info={info} onClose={() => setInfo(null)} />
    </>
  );
}

/* ---------- achievements (earned + locked, with ×N multipliers) ---------- */

export function AchievementsGrid({
  badges,
  counts,
}: {
  badges: { key: string }[];
  counts: Record<string, number>;
}) {
  const [info, setInfo] = useState<Info | null>(null);
  return (
    <>
      <div className="section-head plain">Achievements</div>
      <div className="ach-grid">
        {ACHIEVEMENTS.map((a) => {
          const earned = badges.some((b) => b.key === a.key);
          const c = counts[a.key] ?? 0;
          const showMult = !!a.countable && c > 1;
          const Icon = ACH_ICONS[a.key];
          return (
            <button
              key={a.key}
              className={`ach ${earned ? "earned" : "locked"}`}
              onClick={() =>
                setInfo({
                  title: a.label,
                  body: earned
                    ? `Earned${c > 1 ? ` ${c} times` : ""}! ${a.how}`
                    : `Locked. ${a.how}`,
                })
              }
            >
              <span className="ach-emoji">
                {earned && Icon ? (
                  <Icon className="ach-ico" />
                ) : (
                  <LockIcon className="ach-ico" />
                )}
              </span>
              <span className="ach-label">
                {a.label}
                {showMult && <span className="ach-mult">×{c}</span>}
              </span>
            </button>
          );
        })}
      </div>
      <InfoSheet info={info} onClose={() => setInfo(null)} />
    </>
  );
}
