import { useEffect, useState } from "react";
import { Overlay, OverlayClose, OverlayDescription, OverlayTitle } from "./ui/Overlay";
import { api, type BoardEntry } from "../api";

export default function ClaimSheet({
  onClose,
  onClaimed,
  showToast,
}: {
  onClose: () => void;
  onClaimed: () => void;
  showToast: (m: string) => void;
}) {
  const [players, setPlayers] = useState<BoardEntry[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    api
      .leaderboard()
      .then((d) => setPlayers(d.leaderboard.filter((p) => p.ownerUserId == null)))
      .catch(() => showToast("Couldn't load players"));
  }, [showToast]);

  const claim = async (id: number, name: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await api.claimPlayer(id);
      if (res.linked) showToast(`You're ${name} now! 🎉`);
      else showToast(`Request sent to the admin for ${name} ⏳`);
      onClaimed();
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't claim");
      setBusyId(null);
    }
  };

  return (
    <Overlay surface="card" onClose={onClose}>
        <OverlayClose />
        <OverlayTitle as="h2" className="picker-title picker-title-start">
          Which one is you?
        </OverlayTitle>
        <OverlayDescription className="picker-sub picker-sub-start">
          Claim your name to get your own profile and stats. If the admin already
          added your email, you'll be linked instantly; otherwise they'll get a
          request to approve.
        </OverlayDescription>

        {!players && <div className="skel" style={{ height: 120 }} aria-label="Loading names" role="status" />}

        {players && players.length === 0 && (
          <div className="acct-hint">
            No unclaimed names left. Ask the admin to add you as a player.
          </div>
        )}

        {players && players.length > 0 && (
          <div className="acct-groups">
            {players.map((p) => (
              <button
                key={p.id}
                className="claim-row"
                disabled={busyId !== null}
                onClick={() => claim(p.id, p.name)}
              >
                <span className="row-emoji">{p.emoji}</span>
                <span className="claim-name">{p.name}</span>
                <span className="claim-cta">
                  {busyId === p.id ? "…" : "This is me"}
                </span>
              </button>
            ))}
          </div>
        )}
    </Overlay>
  );
}
