import { useEffect, useState } from "react";
import {
  api,
  type ClaimRequest,
  type GroupSummary,
  type Me,
  type MeGroup,
} from "../api";
import Profile from "./Profile";

export default function MeTab({
  me,
  currentGroup,
  version,
  onSwitch,
  onClaim,
  onRefresh,
  showToast,
}: {
  me: Me;
  currentGroup: MeGroup;
  version: number;
  onSwitch: (gid: number) => void;
  onClaim: () => void;
  onRefresh: () => void;
  showToast: (m: string) => void;
}) {
  const advanced = me.user.advancedMode;
  const isAdmin = currentGroup.role === "admin";

  const [summary, setSummary] = useState<GroupSummary[] | null>(null);
  useEffect(() => {
    api.summary().then((d) => setSummary(d.summary)).catch(() => setSummary([]));
  }, [version]);

  // advanced mode toggle
  const [adv, setAdv] = useState(advanced);
  const [savingAdv, setSavingAdv] = useState(false);
  const toggleAdv = async () => {
    if (savingAdv) return;
    const next = !adv;
    setAdv(next);
    setSavingAdv(true);
    try {
      await api.setAdvanced(next);
      onRefresh();
      showToast(next ? "Advanced mode on 📊" : "Advanced mode off");
    } catch (e) {
      setAdv(!next);
      showToast(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setSavingAdv(false);
    }
  };

  // admin: members-can-add toggle
  const [allowAdd, setAllowAdd] = useState(!!currentGroup.allowMemberAdd);
  const [savingAdd, setSavingAdd] = useState(false);
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

  // admin: claim requests inbox
  const [claims, setClaims] = useState<ClaimRequest[] | null>(null);
  const [resolving, setResolving] = useState<number | null>(null);
  useEffect(() => {
    if (isAdmin && currentGroup.pendingClaims > 0) {
      api.claims().then((d) => setClaims(d.claims)).catch(() => setClaims([]));
    } else {
      setClaims(null);
    }
  }, [isAdmin, currentGroup.id, currentGroup.pendingClaims]);
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

  const signOut = async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    window.location.href = "/";
  };

  return (
    <div className="page">
      <h2 className="page-title">Me</h2>

      {/* cross-group summary */}
      {summary && summary.length > 1 && (
        <div className="xg-card">
          <div className="xg-title">Your groups</div>
          {summary.map((s) => (
            <button
              key={s.groupId}
              className={`xg-row ${s.groupId === currentGroup.id ? "on" : ""}`}
              onClick={() => onSwitch(s.groupId)}
            >
              <span className="xg-name">👥 {s.groupName}</span>
              {s.myPlayerId != null ? (
                <span className="xg-stat">
                  {s.rank ? `#${s.rank}` : "—"} · {s.rating}
                </span>
              ) : (
                <span className="xg-stat muted">not linked</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* your profile in the current group */}
      {currentGroup.myPlayerId != null ? (
        <Profile
          id={currentGroup.myPlayerId}
          version={version}
          isAdmin={isAdmin}
          advanced={advanced}
          embedded
          onChanged={onRefresh}
          showToast={showToast}
        />
      ) : (
        <div className="empty" style={{ marginBottom: 14 }}>
          <img className="load-mascot" src="/mascot.svg" alt="" style={{ width: 90 }} />
          <h3>You're not on the board yet</h3>
          <p>Claim your player to get your own stats in {currentGroup.name}.</p>
          <button className="cta" style={{ marginTop: 12 }} onClick={onClaim}>
            Claim your player
          </button>
        </div>
      )}

      {/* settings */}
      <div className="section-head plain">Settings</div>
      <button
        className={`acct-toggle ${adv ? "on" : ""}`}
        onClick={toggleAdv}
        role="switch"
        aria-checked={adv}
      >
        <span>Advanced mode 📊</span>
        <span className="knob" />
      </button>
      <div className="acct-hint">
        Personal stats, rivalries, badges, weekly movers, and a nudge from your last
        game.
      </div>

      <div className="acct-who" style={{ marginTop: 16 }}>
        {me.user.avatarUrl ? (
          <img className="acct-av" src={me.user.avatarUrl} alt="" referrerPolicy="no-referrer" />
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
      <button className="cta secondary" style={{ marginTop: 12 }} onClick={signOut}>
        Sign out
      </button>

      {/* manage group (admin only) */}
      {isAdmin && (
        <>
          <div className="section-head plain">Manage group</div>
          <button
            className={`acct-toggle ${allowAdd ? "on" : ""}`}
            onClick={toggleAllowAdd}
            role="switch"
            aria-checked={allowAdd}
          >
            <span>Members can add players</span>
            <span className="knob" />
          </button>

          {claims && claims.length > 0 && (
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
        </>
      )}
    </div>
  );
}
