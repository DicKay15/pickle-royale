import { type Me } from "../api";

/** Slim group switcher: switch groups + copy the invite code. Nothing else. */
export default function GroupSheet({
  me,
  currentGroupId,
  onSwitch,
  onAddGroup,
  onClose,
  showToast,
}: {
  me: Me;
  currentGroupId: number;
  onSwitch: (gid: number) => void;
  onAddGroup: () => void;
  onClose: () => void;
  showToast: (m: string) => void;
}) {
  const current = me.groups.find((g) => g.id === currentGroupId);

  const copyCode = async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.code);
      showToast("Code copied! Share it with your crew 📋");
    } catch {
      showToast(`Your group code: ${current.code}`);
    }
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="acct-card" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-x" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="acct-label">Your groups</div>
        <div className="acct-groups">
          {me.groups.map((g) => (
            <button
              key={g.id}
              className={`acct-group ${g.id === currentGroupId ? "on" : ""}`}
              onClick={() => {
                onSwitch(g.id);
                onClose();
              }}
            >
              <span className="ag-name">👥 {g.name}</span>
              <span className="ag-meta">
                {g.role === "admin" ? "admin" : "member"} · #{g.code}
              </span>
            </button>
          ))}
          <button className="acct-add" onClick={onAddGroup}>
            ＋ Create or join another group
          </button>
        </div>

        {current && (
          <>
            <div className="acct-label">Invite your crew</div>
            <button className="acct-code" onClick={copyCode}>
              <span className="ac-code">#{current.code}</span>
              <span className="ac-copy">Copy code</span>
            </button>
            <div className="acct-hint">
              Anyone who signs in and enters this code joins {current.name}.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
