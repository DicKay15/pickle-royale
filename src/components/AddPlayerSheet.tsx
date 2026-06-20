import { useState } from "react";
import { api } from "../api";

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
      await api.addPlayer(trimmed, emoji);
      onAdded(trimmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add player");
      setBusy(false);
    }
  };

  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Add player">
        <h3>New Challenger 🥊</h3>

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

        <button className="cta" disabled={busy} onClick={submit}>
          {busy ? "Adding…" : "Enter the Royale"}
        </button>
        <button
          className="cta secondary"
          style={{ marginTop: 8, boxShadow: "none", border: "none" }}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
