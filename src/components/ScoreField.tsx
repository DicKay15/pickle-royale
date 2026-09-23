import { NumberField } from "@base-ui/react/number-field";

/*
 * A score is a number field, so it's built on Base UI's NumberField rather
 * than a row of hand-wired buttons. What that buys at the court:
 *   - the big score is the real <input>: tap it and type 11, or use ↑/↓,
 *     Home/End, Shift+↑ for +10
 *   - − and + auto-repeat while held (pointer and keyboard)
 *   - screen readers get a named number field with its current value
 * The earlier version listened to pointerdown only, so keyboard users could
 * focus − and + but pressing them did nothing.
 */

const MAX_SCORE = 99;

export default function ScoreField({
  value,
  onChange,
  label,
  tone,
  presets = [],
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  /** a = Green, b = Orange. Drives the colour of the big number. */
  tone: "a" | "b";
  presets?: number[];
}) {
  return (
    <NumberField.Root
      className="score-field"
      value={value}
      min={0}
      max={MAX_SCORE}
      largeStep={10}
      onValueChange={(v) => onChange(v ?? 0)}
    >
      <NumberField.Input
        className={`score-big score-input ${tone}`}
        aria-label={label}
        inputMode="numeric"
        onFocus={(e) => e.currentTarget.select()}
      />
      <NumberField.Group className="stepper">
        <NumberField.Decrement aria-label={`${label}, minus 1`}>−</NumberField.Decrement>
        <NumberField.Increment aria-label={`${label}, plus 1`}>+</NumberField.Increment>
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            className="preset"
            aria-label={`${label}, add ${p}`}
            onClick={() => onChange(Math.min(MAX_SCORE, value + p))}
          >
            +{p}
          </button>
        ))}
      </NumberField.Group>
    </NumberField.Root>
  );
}
