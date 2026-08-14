import { useEffect, useRef } from "react";

/* ---------- stepper with hold-to-repeat ---------- */

export default function Stepper({
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
          aria-label={`Add ${p} to ${label}`}
          onClick={() => onChange(Math.min(99, value + p))}
        >
          +{p}
        </button>
      ))}
    </div>
  );
}
