import { useEffect, useState } from "react";
import { api, type ClaimRequest, type Me } from "../api";

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
  const [claims, setClaims] = useState<ClaimRequest[] | null>(null);
  const [resolving, setResolving] = useState<number | null>(null);

  const isAdmin = current?.role === "admin";

  useEffect(() => {
    if (isAdmin && current && current.pendingClaims > 0) {
      api.claims().then((d) => setClaims(d.claims)).catch(() => setClaims([]));
    }
  }, [isAdmin, current]);

  const resolveClaim = async (cid: number, approve: boolean) => {
    if (resolving) return;
    setResolving(cid);
    try {
      if (approve) await api.approveClaim(cid);
      else await api.denyClaim(cid);
      setClaims((cs) => (cs ? cs.filter((c) => c.id !== cid) : cs));
      onRefresh();
      showToast(approve ? "Claim approved ✅" : "Claim denied");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't update");
    } finally {
      setResolving(null);
    }
  };

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

        {isAdmin && claims && claims.length > 0 && (
          <>
            <div className="acct-label">Claim requests</div>
            <div className="acct-groups">
              {claims.map((c) => (
                <div key={c.id} className="claim-req">
                  <div className="cr-top">
                    <span className="row-emoji">{c.playerEmoji}</span>
                    <div className="cr-text">
                      <div className="cr-name">
                        {c.requesterName || c.requesterEmail}
                      </div>
                      <div className="cr-sub">
                        wants to be <b>{c.playerName}</b>
                      </div>
                    </div>
                  </div>
                  <div className="cr-actions">
                    <button
                      className="cr-deny"
                      disabled={resolving !== null}
                      onClick={() => resolveClaim(c.id, false)}
                    >
                      Deny
                    </button>
                    <button
                      className="cr-approve"
                      disabled={resolving !== null}
                      onClick={() => resolveClaim(c.id, true)}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <button className="cta secondary acct-signout" onClick={signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
