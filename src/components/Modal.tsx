import { type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Centered modal (for actions + confirmations). Portalled to body so it always
 *  sits above the navbar and any stacking context. */
export default function Modal({
  title,
  onClose,
  children,
}: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        {title && (
          <div className="modal-head">
            <h3>{title}</h3>
            <button className="sheet-x" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Yes/no confirmation built on Modal. */
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
    <Modal title={title} onClose={onClose}>
      {body && <div className="info-body">{body}</div>}
      <div className="modal-actions">
        <button className="cta secondary" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button
          className={`cta ${danger ? "danger" : ""}`}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
