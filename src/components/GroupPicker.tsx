import { useState } from "react";
import { Overlay, OverlayClose } from "./ui/Overlay";
import { api, type MeGroup } from "../api";

export default function GroupPicker({
  onPicked,
  showToast,
  onClose,
  firstRun,
}: {
  onPicked: (g: MeGroup) => void;
  showToast: (m: string) => void;
  onClose?: () => void;
  firstRun?: boolean;
}) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "create") {
        const n = name.trim();
        if (!n) {
          showToast("Give your group a name");
          setBusy(false);
          return;
        }
        const { group } = await api.createGroup(n);
        showToast(`Group "${group.name}" created! 🎉`);
        onPicked(group);
      } else {
        const c = code.trim();
        if (!c) {
          showToast("Enter a group code");
          setBusy(false);
          return;
        }
        const { group } = await api.joinGroup(c);
        showToast(`Joined "${group.name}"! 🏓`);
        onPicked(group);
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const body = (
    <div className="picker-card">
      {onClose && !firstRun && <OverlayClose />}
      <img className="picker-mascot" src="/mascot.svg" alt="" />
      <h2 className="picker-title">
        {firstRun ? "Welcome to the Royale" : "New group"}
      </h2>
      <p className="picker-sub">
        Start your own ladder, or join your crew with their 6-character code.
      </p>

      <div className="seg">
        <button
          className={mode === "create" ? "on" : ""}
          onClick={() => setMode("create")}
        >
          Create
        </button>
        <button
          className={mode === "join" ? "on" : ""}
          onClick={() => setMode("join")}
        >
          Join
        </button>
      </div>

      {mode === "create" ? (
        <input
          className="field-input"
          placeholder="Group name (e.g. Sunday Smashers)"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      ) : (
        <input
          className="field-input code-field"
          placeholder="ABC123"
          value={code}
          maxLength={6}
          autoCapitalize="characters"
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      )}

      <button className="cta" disabled={busy} onClick={submit}>
        {busy
          ? "One sec…"
          : mode === "create"
            ? "Create group"
            : "Join group"}
      </button>
    </div>
  );

  if (firstRun) return <div className="auth-screen">{body}</div>;
  // Opened from inside the app: a real dialog. Without an onClose there is no
  // way back, so it stays mounted until a group is picked.
  return (
    <Overlay
      surface="card"
      popupClassName="picker-popup"
      onClose={onClose ?? (() => {})}
      label={mode === "create" ? "Create a group" : "Join a group"}
    >
      {body}
    </Overlay>
  );
}
