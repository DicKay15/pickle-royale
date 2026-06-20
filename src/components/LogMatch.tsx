import { useEffect, useMemo, useRef, useState } from "react";
import { api, type BoardEntry, type LogResult } from "../api";

type Side = "A" | "B" | null;

function expectedScore(a: number, b: number) {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

const NORMAL_TITLES = [
  "Ratings updated",
  "The ladder shifts",
  "Numbers don't lie",
  "Respect reallocated",
  "Justice served",
];

const LOAD_LINES = [
  "Chalking the lines…",
  "Inflating the ball…",
  "Consulting the rulebook…",
  "Waxing the paddles…",
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/* ---------- confetti ---------- */

const CONFETTI_COLORS = ["#c9f73a", "#ff6b4a", "#ffc93c", "#8fd8e8", "#14604a"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 0.6,
        dur: 2.2 + Math.random() * 1.8,
        round: Math.random() > 0.5,
      })),
    [],
  );
  return (
    <>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}vw`,
            width: p.size,
            height: p.size * (p.round ? 1 : 0.5),
            background: p.color,
            borderRadius: p.round ? "50%" : 2,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  );
}

/* ---------- stepper with hold-to-repeat ---------- */

function Stepper({
  value,
  onChange,
  label,
  presets,
  hideVal,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  presets?: number[];
  hideVal?: boolean;
}) {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const valRef = useRef(value);
  valRef.current = value;

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const start = (dir: 1 | -1) => {
    onChange(Math.min(99, Math.max(0, valRef.current + dir)));
    stop();
    let ticks = 0;
    timer.current = setInterval(() => {
      ticks++;
      if (ticks > 3) {
        onChange(Math.min(99, Math.max(0, valRef.current + dir)));
      }
    }, 120);
  };

  useEffect(() => stop, []);

  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`${label} minus 1`}
        onPointerDown={() => start(-1)}
        onPointerUp={stop}
        onPointerLeave={stop}
        onContextMenu={(e) => e.preventDefault()}
      >
        −
      </button>
      {!hideVal && (
        <div className="val" aria-live="polite">
          {value}
        </div>
      )}
      <button
        type="button"
        aria-label={`${label} plus 1`}
        onPointerDown={() => start(1)}
        onPointerUp={stop}
        onPointerLeave={stop}
        onContextMenu={(e) => e.preventDefault()}
      >
        +
      </button>
      {presets?.map((p) => (
        <button
          key={p}
          type="button"
          className="preset"
          aria-label={`Set ${label} to ${p}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

/* ---------- carry slider ---------- */

function CarrySlider({
  p1,
  p2,
  value,
  onChange,
  accent,
}: {
  p1: string;
  p2: string;
  value: number; // p1's share, 10–90
  onChange: (v: number) => void;
  accent: string;
}) {
  // The slider is a tug-of-war from the centre: drag the thumb TOWARD a
  // player to raise their share. Native range goes left=min→right=max, so
  // the raw input position is the mirror of p1's share (left = p1 dominant).
  const raw = 100 - value; // thumb position 10..90 (10 = far left = p1 hero)
  const pos = ((raw - 10) / 80) * 100; // 0..100 along the track
  const lo = Math.min(pos, 50);
  const hi = Math.max(pos, 50);
  return (
    <div className="carry">
      <div className="carry-label">
        <span>
          {p1} <span className="pct">{value}%</span>
        </span>
        <span>
          <span className="pct">{100 - value}%</span> {p2}
        </span>
      </div>
      <input
        type="range"
        min={10}
        max={90}
        step={5}
        value={raw}
        aria-label={`Who carried, ${p1} versus ${p2}`}
        aria-valuetext={`${p1} ${value} percent, ${p2} ${100 - value} percent`}
        onChange={(e) => onChange(100 - Number(e.target.value))}
        style={
          {
            "--lo": `${lo}%`,
            "--hi": `${hi}%`,
            "--band": accent,
          } as React.CSSProperties
        }
      />
      <div className="carry-hint">Slide toward whoever carried 🦸</div>
    </div>
  );
}

/* ---------- result reveal ---------- */

function Reveal({
  result,
  skunk,
  onClose,
}: {
  result: LogResult;
  skunk: boolean;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // pick a normal headline once per reveal
  const normalTitle = useMemo(() => pick(NORMAL_TITLES), []);

  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  return (
    <div
      className="reveal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reveal-title"
    >
      {(result.upset || skunk) && !reduceMotion && <Confetti />}
      <div className="reveal-card" ref={cardRef} tabIndex={-1}>
        <img className="reveal-peek" src="/mascot.svg" alt="" />
        {skunk ? (
          <>
            <div className="reveal-kicker skunk">11–0 · that's a pickle</div>
            <div className="reveal-pickled" id="reveal-title">
              Pickled! 🥒
            </div>
          </>
        ) : (
          <>
            <div className="reveal-kicker">
              {result.upset ? "🚨 UPSET ALERT 🚨" : "Match logged"}
            </div>
            <div className="reveal-title" id="reveal-title">
              {result.upset ? "David beats Goliath!" : normalTitle}
            </div>
          </>
        )}
        <div className="reveal-list">
          {[...result.changes]
            .sort((a, b) => b.delta - a.delta)
            .map((ch) => (
              <div key={ch.playerId} className="reveal-row">
                <span>{ch.emoji}</span>
                <span className="nm">{ch.name}</span>
                <span className={`delta ${ch.delta >= 0 ? "up" : "down"}`}>
                  {ch.delta >= 0 ? "+" : ""}
                  {Math.round(ch.delta)}
                </span>
                <span className="total">{Math.round(ch.after)}</span>
              </div>
            ))}
        </div>
        <button className="cta" onClick={onClose}>
          Back to standings
        </button>
      </div>
    </div>
  );
}

/* ---------- main ---------- */

export default function LogMatch({
  version,
  onLogged,
  onDone,
  onAddPlayer,
  showToast,
}: {
  version: number;
  onLogged: () => void;
  onDone: () => void;
  onAddPlayer: () => void;
  showToast: (msg: string) => void;
}) {
  const [players, setPlayers] = useState<BoardEntry[] | null>(null);
  const [sides, setSides] = useState<Record<number, Side>>({});
  const [scoreA, setScoreA] = useState(11);
  const [scoreB, setScoreB] = useState(0);
  const [carryA, setCarryA] = useState(50);
  const [carryB, setCarryB] = useState(50);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<LogResult | null>(null);
  const [loadLine] = useState(() => pick(LOAD_LINES));

  useEffect(() => {
    api
      .leaderboard()
      .then((d) => setPlayers(d.leaderboard))
      .catch(() => showToast("Couldn't load players"));
  }, [version, showToast]);

  const teamA = useMemo(
    () => (players ?? []).filter((p) => sides[p.id] === "A"),
    [players, sides],
  );
  const teamB = useMemo(
    () => (players ?? []).filter((p) => sides[p.id] === "B"),
    [players, sides],
  );

  const cycle = (id: number) => {
    setSides((s) => {
      const cur = s[id] ?? null;
      let next: Side;
      if (cur === null) next = teamA.length < 2 ? "A" : teamB.length < 2 ? "B" : null;
      else if (cur === "A") next = teamB.length < 2 ? "B" : null;
      else next = null;
      return { ...s, [id]: next };
    });
  };

  const teamsSet = teamA.length === 2 && teamB.length === 2;
  // real pickleball: reach 11 (or 15/21), win by 2
  const scoreOk =
    scoreA !== scoreB &&
    Math.max(scoreA, scoreB) >= 11 &&
    Math.abs(scoreA - scoreB) >= 2;
  const scoreHint = !teamsSet
    ? null
    : scoreA === scoreB
      ? "No draws — someone won! 🏓"
      : Math.max(scoreA, scoreB) < 11
        ? "Winning score must reach at least 11"
        : Math.abs(scoreA - scoreB) < 2
          ? "Gotta win by 2! 🏓"
          : null;
  const ready = teamsSet && scoreOk;

  const winProbA = useMemo(() => {
    if (teamA.length !== 2 || teamB.length !== 2) return null;
    const ra = (teamA[0].rating + teamA[1].rating) / 2;
    const rb = (teamB[0].rating + teamB[1].rating) / 2;
    return expectedScore(ra, rb);
  }, [teamA, teamB]);

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const res = await api.logMatch({
        a1: teamA[0].id,
        a2: teamA[1].id,
        b1: teamB[0].id,
        b2: teamB[1].id,
        scoreA,
        scoreB,
        contribA: carryA / 100,
        contribB: carryB / 100,
      });
      setResult(res);
      onLogged();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't log the match");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setSides({});
    setScoreA(11);
    setScoreB(0);
    setCarryA(50);
    setCarryB(50);
    setResult(null);
    onDone();
  };

  if (!players)
    return (
      <div className="page" aria-busy="true">
        <img className="load-mascot" src="/mascot.svg" alt="" />
        <div className="load-line">{loadLine}</div>
        <div className="skel" style={{ height: 110, margin: "16px 0 14px" }} />
        <div className="skel" style={{ height: 180, marginBottom: 14 }} />
        <div className="skel" style={{ height: 180 }} />
      </div>
    );

  return (
    <div className="page">
      <h2 className="page-title">New Rumble</h2>

      {/* picker */}
      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--ink-soft)",
            marginBottom: 10,
          }}
        >
          Tap a player to assign: <b style={{ color: "var(--court)" }}>Team Green</b> →{" "}
          <b style={{ color: "var(--coral)" }}>Team Orange</b> → out
        </div>
        <div className="chip-grid">
          {players.map((p) => {
            const side = sides[p.id] ?? null;
            const teamsFull =
              side === null && teamA.length === 2 && teamB.length === 2;
            return (
              <button
                key={p.id}
                className={`p-chip ${side === "A" ? "on-a" : side === "B" ? "on-b" : ""} ${teamsFull ? "dim" : ""}`}
                onClick={() => cycle(p.id)}
                aria-pressed={side !== null}
              >
                <span className="av">{p.emoji}</span>
                {p.name}
              </button>
            );
          })}
          <button
            className="p-chip"
            style={{ borderStyle: "dashed", boxShadow: "none" }}
            onClick={onAddPlayer}
          >
            <span className="av">＋</span>
            New player
          </button>
        </div>
      </div>

      {/* side-by-side teams */}
      <div className="teams-row">
        <section className="team-zone team-a">
          <h3>🟢 Team Green</h3>
          <div className="slot-row">
            {teamA.map((p) => (
              <span key={p.id} className="p-chip on-a" style={{ boxShadow: "none" }}>
                <span className="av">{p.emoji}</span>
                {p.name}
              </span>
            ))}
            {teamA.length < 2 && <span className="slot-empty">pick {2 - teamA.length} more…</span>}
          </div>
        </section>

        <div className="net-divider">
          <span className="net-ball">🥒</span>
          <span className="net-label">NET</span>
        </div>

        <section className="team-zone team-b">
          <h3>🟠 Team Orange</h3>
          <div className="slot-row">
            {teamB.map((p) => (
              <span key={p.id} className="p-chip on-b" style={{ boxShadow: "none" }}>
                <span className="av">{p.emoji}</span>
                {p.name}
              </span>
            ))}
            {teamB.length < 2 && <span className="slot-empty">pick {2 - teamB.length} more…</span>}
          </div>
        </section>
      </div>

      {/* score */}
      <div className="score-block">
        <div className="score-col a">
          <div className="who">Green</div>
          <div className="score-big a" aria-live="polite">{scoreA}</div>
          <Stepper value={scoreA} onChange={setScoreA} label="Team Green score" presets={[11, 15]} hideVal />
        </div>
        <div className="score-col b">
          <div className="who">Orange</div>
          <div className="score-big b" aria-live="polite">{scoreB}</div>
          <Stepper value={scoreB} onChange={setScoreB} label="Team Orange score" presets={[11, 15]} hideVal />
        </div>
      </div>

      {/* odds */}
      {winProbA !== null && (
        <div className="odds">
          <div className="odds-bar">
            <div
              className="a-fill"
              style={{ width: `${Math.round(winProbA * 100)}%` }}
            />
          </div>
          <div className="odds-text">
            <span>Green {Math.round(winProbA * 100)}%</span>
            <span>chance to win</span>
            <span>{Math.round((1 - winProbA) * 100)}% Orange</span>
          </div>
        </div>
      )}

      {/* who carried — the final step, once both teams are set */}
      {teamsSet && (
        <div className="carry-panel">
          <div className="carry-panel-title">🦸 Who carried?</div>
          <CarrySlider
            p1={teamA[0].name}
            p2={teamA[1].name}
            value={carryA}
            onChange={setCarryA}
            accent="var(--lime)"
          />
          <CarrySlider
            p1={teamB[0].name}
            p2={teamB[1].name}
            value={carryB}
            onChange={setCarryB}
            accent="var(--coral)"
          />
        </div>
      )}

      {scoreHint && <div className="form-error">{scoreHint}</div>}

      <button className="cta" disabled={!ready || busy} onClick={submit}>
        {busy ? "Crunching the math…" : "Log the rumble 🏓"}
      </button>

      {result && (
        <Reveal
          result={result}
          skunk={Math.min(scoreA, scoreB) === 0}
          onClose={reset}
        />
      )}
    </div>
  );
}
