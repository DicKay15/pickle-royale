import { useEffect, useState } from "react";
import {
  api,
  type ClaimRequest,
  type GroupSummary,
  type Me,
  type MeGroup,
  type Profile as ProfileData,
} from "../api";
import { ProfileHero, AchievementsGrid } from "./profileParts";
import { DownloadIcon } from "./icons";
import Modal from "./Modal";

export default function ProfileTab({
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
  const isAdmin = currentGroup.role === "admin";
  const pid = currentGroup.myPlayerId;

  // own profile (hero + achievements) when claimed
  const [p, setP] = useState<ProfileData | null>(null);
  useEffect(() => {
    if (pid == null) {
      setP(null);
      return;
    }
    setP(null);
    api.profile(pid).then(setP).catch(() => setP(null));
  }, [pid, version, currentGroup.id]);

  // cross-group summary
  const [summary, setSummary] = useState<GroupSummary[] | null>(null);
  useEffect(() => {
    api.summary().then((d) => setSummary(d.summary)).catch(() => setSummary([]));
  }, [version]);

  // advanced mode
  const [adv, setAdv] = useState(me.user.advancedMode);
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

  // admin: members-can-add
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

  // admin: claim requests
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

  // admin: delete group (irreversible)
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const closeDelete = () => {
    setDeleteOpen(false);
    setConfirmName("");
  };
  const deleteGroup = async () => {
    if (deleting || confirmName.trim() !== currentGroup.name) return;
    setDeleting(true);
    try {
      await api.deleteGroup(confirmName.trim());
      closeDelete();
      showToast(`"${currentGroup.name}" deleted`);
      onRefresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't delete group");
    } finally {
      setDeleting(false);
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
      {/* profile hero, or a claim prompt if not linked here */}
      {pid != null ? (
        p ? (
          <ProfileHero p={p} />
        ) : (
          <div className="skel" style={{ height: 90, marginBottom: 14 }} />
        )
      ) : (
        <div className="empty" style={{ marginBottom: 14 }}>
          <img className="load-mascot" src="/mascot.svg" alt="" style={{ width: 90 }} />
          <h3>You're not on the board yet</h3>
          <p>Claim your player to get your own profile in {currentGroup.name}.</p>
          <button className="cta" style={{ marginTop: 12 }} onClick={onClaim}>
            Claim your player
          </button>
        </div>
      )}

      {/* your groups */}
      {summary && summary.length > 0 && (
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

      {/* achievements (only when you own a player here) */}
      {p && <AchievementsGrid badges={p.badges} counts={p.badgeCounts} />}

      {/* account / email */}
      <div className="section-head plain">Account</div>
      <div className="acct-who">
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
        Adds a last-game nudge and a weekly movers card to the Standings page.
      </div>

      <a className="acct-row-link" href={api.exportCsvUrl()} download>
        <DownloadIcon className="acct-row-ico" />
        <span>Export this group as CSV</span>
      </a>
      <div className="acct-hint">
        Every match with scores and rating changes, ready for a spreadsheet.
      </div>

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

          <button
            className="acct-row-link danger"
            style={{ marginTop: 14 }}
            onClick={() => setDeleteOpen(true)}
          >
            Delete group
          </button>
          <div className="acct-hint">
            Permanently removes {currentGroup.name}, its players, matches, and
            ratings for everyone. This can't be undone.
          </div>
        </>
      )}

      <button className="cta secondary" style={{ marginTop: 18 }} onClick={signOut}>
        Sign out
      </button>

      {deleteOpen && (
        <Modal title={`Delete ${currentGroup.name}?`} onClose={closeDelete}>
          <div className="info-body">
            This permanently deletes the group, every player, every match, and
            all rating history for everyone in it. This can't be undone. Type{" "}
            <b>{currentGroup.name}</b> to confirm.
          </div>
          <input
            className="field-input"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && deleteGroup()}
            placeholder={currentGroup.name}
            autoFocus
          />
          <div className="modal-actions">
            <button className="cta secondary" onClick={closeDelete} disabled={deleting}>
              Cancel
            </button>
            <button
              className="cta danger"
              onClick={deleteGroup}
              disabled={deleting || confirmName.trim() !== currentGroup.name}
            >
              {deleting ? "…" : "Delete forever"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
