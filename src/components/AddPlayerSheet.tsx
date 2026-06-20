import { useState } from "react";
import { api } from "../api";
import Modal from "./Modal";

const EMOJIS = [
  "🏓", "🦖", "🐙", "🦅", "🐯", "🦊", "🐼", "🐸",
  "🦄", "🐉", "👾", "🤖", "🥷", "🧙", "🦁", "🐺",
];

export default function AddPlayerSheet({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏓");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give them a name!");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.addPlayer(trimmed, emoji, email.trim() || undefined);
      onAdded(trimmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add player");
      setBusy(false);
    }
  };

  return (
    <Modal title="New Challenger 🥊" onClose={onClose}>
        {error && <div className="form-error">{error}</div>}

        <div className="field">
          <label htmlFor="np-name">Name</label>
          <input
            id="np-name"
            type="text"
            maxLength={24}
            placeholder="e.g. SpinMaster"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>Battle avatar</label>
          <div className="emoji-row">
            {EMOJIS.map((e) => (
              <button
                key={e}
                className={`emoji-opt ${emoji === e ? "sel" : ""}`}
                onClick={() => setEmoji(e)}
                aria-label={`Avatar ${e}`}
                aria-pressed={emoji === e}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="np-email">Invite by email (optional)</label>
          <input
            id="np-email"
            type="email"
            inputMode="email"
            placeholder="their@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <div className="field-hint">
            They'll get this player (and its history) automatically when they sign
            in with this email.
          </div>
        </div>

        <button className="cta" disabled={busy} onClick={submit}>
          {busy ? "Adding…" : "Enter the Royale"}
        </button>
    </Modal>
  );
}
