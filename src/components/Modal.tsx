import { type ReactNode } from "react";
import { Overlay, OverlayClose, OverlayDescription, OverlayTitle } from "./ui/Overlay";

/** Centered modal (for actions + confirmations). Behaviour lives in ui/Overlay. */
export default function Modal({
  title,
  onClose,
  children,
}: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Overlay surface="modal" onClose={onClose} label={title ? undefined : "Dialog"}>
      {title && (
        <div className="modal-head">
          <OverlayTitle>{title}</OverlayTitle>
          <OverlayClose />
        </div>
      )}
      {children}
    </Overlay>
  );
}

/**
 * Yes/no confirmation. An alertdialog: the scrim doesn't dismiss it, and
 * focus starts on Cancel so Enter never confirms a delete by accident.
 */
export function ConfirmModal({
  title,
  body,
  confirmLabel = "Confirm",
  danger,
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Overlay surface="modal" alert onClose={busy ? () => {} : onClose}>
      <div className="modal-head">
        <OverlayTitle>{title}</OverlayTitle>
      </div>
      {body && <OverlayDescription className="info-body">{body}</OverlayDescription>}
      <div className="modal-actions">
        <button className="cta secondary" onClick={onClose} disabled={busy} autoFocus>
          Cancel
        </button>
        <button
          className={`cta ${danger ? "danger" : ""}`}
          onClick={onConfirm}
          disabled={busy}
          aria-busy={busy || undefined}
        >
          {busy ? "…" : confirmLabel}
        </button>
      </div>
    </Overlay>
  );
}
