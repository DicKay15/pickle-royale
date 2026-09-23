import { useEffect, useState, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { AlertDialog } from "@base-ui/react/alert-dialog";

/*
 * Every overlay in the app goes through this one primitive, composed on
 * Base UI's Dialog. Base UI owns the behaviour (focus trap, Esc, outside
 * press, scroll lock, inert background, focus return to whatever opened it,
 * title wiring for screen readers). This file only decides which of our
 * existing surfaces the popup wears.
 *
 * The house rule from DESIGN-LANGUAGE.md still applies:
 *   info            -> "sheet"  (bottom sheet)
 *   actions/confirm -> "modal"  (centered card)
 *   account-level   -> "card"   (centered, lighter scrim, sits under modals)
 *
 * Callers mount an Overlay when it should be open and unmount it to close,
 * which matches how the rest of the app already renders its sheets. The one
 * cost of that: an unmounted Root never runs Base UI's close sequence, so it
 * can't hand focus back. useReturnFocus covers that gap.
 */

/** Remember what had focus when the overlay mounted and give it back on unmount. */
function useReturnFocus() {
  const [returnTo] = useState(() =>
    typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null),
  );
  useEffect(
    () => () => {
      // Wait a frame so Base UI has released the focus trap and inert background.
      // Always prefer our own record: Base UI's fallback can point at an element
      // from an earlier dialog. Only stand down if another dialog now owns focus.
      requestAnimationFrame(() => {
        const inOtherDialog = document.activeElement?.closest('[role="dialog"],[role="alertdialog"]');
        if (!inOtherDialog && returnTo?.isConnected) returnTo.focus({ preventScroll: true });
      });
    },
    [returnTo],
  );
}

type Surface = "modal" | "sheet" | "card";

const SURFACE: Record<Surface, { viewport: string; popup: string }> = {
  modal: { viewport: "modal-overlay", popup: "modal-card" },
  sheet: { viewport: "sheet-backdrop", popup: "sheet" },
  card: { viewport: "sheet-overlay", popup: "acct-card" },
};

type OverlayProps = {
  onClose: () => void;
  children: ReactNode;
  surface?: Surface;
  /** Extra class on the popup, for surfaces with their own card (e.g. picker-card). */
  popupClassName?: string;
  /** Accessible name when there is no visible <OverlayTitle>. */
  label?: string;
  /**
   * Destructive or irreversible confirmations. Renders role="alertdialog" and
   * ignores outside presses, so a stray tap on the scrim can't answer for you.
   */
  alert?: boolean;
};

export function Overlay({
  onClose,
  children,
  surface = "modal",
  popupClassName,
  label,
  alert,
}: OverlayProps) {
  useReturnFocus();
  const s = SURFACE[surface];
  const popupClass = popupClassName ?? s.popup;
  const onOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  if (alert) {
    return (
      <AlertDialog.Root open onOpenChange={onOpenChange}>
        <AlertDialog.Portal>
          <AlertDialog.Viewport className={s.viewport}>
            <AlertDialog.Popup className={popupClass} aria-label={label}>
              {children}
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    );
  }

  return (
    <Dialog.Root open onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Viewport className={s.viewport}>
          <Dialog.Popup className={popupClass} aria-label={label}>
            {children}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Visible title, wired to the popup's aria-labelledby. Renders an h3 by default. */
export function OverlayTitle({
  children,
  className,
  as = "h3",
}: {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3";
}) {
  const Tag = as;
  return <Dialog.Title className={className} render={<Tag />}>{children}</Dialog.Title>;
}

export function OverlayDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Description className={className} render={<p />}>
      {children}
    </Dialog.Description>
  );
}

/** The round ✕ in the corner. Base UI's docs are right that Esc and the scrim aren't enough on their own. */
export function OverlayClose({ className = "sheet-x" }: { className?: string }) {
  return (
    <Dialog.Close className={className} aria-label="Close">
      <span aria-hidden="true">✕</span>
    </Dialog.Close>
  );
}
