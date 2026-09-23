import type { Info } from "../statInfo";
import { Overlay, OverlayDescription, OverlayTitle } from "./ui/Overlay";

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
    <Overlay surface="sheet" onClose={onClose}>
      <OverlayTitle>{info.title}</OverlayTitle>
      <OverlayDescription className="info-body">{info.body}</OverlayDescription>
      <button className="cta" onClick={onClose}>
        Got it
      </button>
    </Overlay>
  );
}
