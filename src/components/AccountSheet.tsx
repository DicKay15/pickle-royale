import { useState } from "react";
import { api, type Me } from "../api";

export default function AccountSheet({
  me,
  currentGroupId,
  onSwitch,
  onAddGroup,
  onRefresh,
  onClose,
  showToast,
}: {
  me: Me;
  currentGroupId: number;
  onSwitch: (gid: number) => void;
  onAddGroup: () => void;
  onRefresh: () => void;
  onClose: () => void;
  showToast: (m: string) => void;
}) {
  const current = me.groups.find((g) => g.id === currentGroupId);
  const [allowAdd, setAllowAdd] = useState(!!current?.allowMemberAdd);
  const [savingAdd, setSavingAdd] = useState(false);

  const copyCode = async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.code);
      showToast("Code copied! Share it with your crew 📋");
    } catch {
      showToast(`Your group code: ${current.code}`);
    }
  };

  const toggleAllowAdd = async () => {
    if (savingAdd) return;
    const next = !allowAdd;
    setAllowAdd(next);
    setSavingAdd(true);
    try {
      await api.updateSettings({ allowMemberAdd: next });
      onRefresh();
    } catch (e) {
      setAllowAdd(!next);
      showToast(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setSavingAdd(false);
    }
  };

  const signOut = async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    window.location.href = "/";
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="acct-card" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-x" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="acct-who">
          {me.user.avatarUrl ? (
            <img className="acct-av" src={me.user.avatarUrl} alt="" />
          ) : (
            <div className="acct-av acct-av-fallback">
              {(me.user.name ?? me.user.email)[0]?.toUpperCase()}
            </div>
          )}
          <div className="acct-who-text">
            <div className="acct-name">{me.user.name ?? "Signed in"}</div>
            <div className="acct-email">{me.user.email}</div>
          </div>
        </div>

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

            {current.role === "admin" && (
              <button
                className={`acct-toggle ${allowAdd ? "on" : ""}`}
                onClick={toggleAllowAdd}
                role="switch"
                aria-checked={allowAdd}
              >
                <span>Members can add players</span>
                <span className="knob" />
              </button>
            )}
          </>
        )}

        <button className="cta secondary acct-signout" onClick={signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
