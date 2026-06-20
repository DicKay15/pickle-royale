import type { Info } from "../statInfo";

/** Tap-to-learn bottom sheet explaining a single stat or badge. */
export default function InfoSheet({
  info,
  onClose,
}: {
  info: Info | null;
  onClose: () => void;
}) {
  if (!info) return null;
  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-label={info.title}>
        <h3>{info.title}</h3>
        <p className="info-body">{info.body}</p>
        <button className="cta" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
