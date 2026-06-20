import { useEffect, useState } from "react";
import { api, type Profile as ProfileData } from "../api";
import { ProfileHero, StatsSections } from "./profileParts";

/** Standings detail view for ANY player (no achievements — those are private
 *  to each user in their own Profile tab). */
export default function Profile({
  id,
  version,
  isAdmin,
  onBack,
  onChanged,
  showToast,
}: {
  id: number;
  version: number;
  isAdmin: boolean;
  onBack?: () => void;
  onChanged: () => void;
  showToast: (m: string) => void;
}) {
  const [p, setP] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    api.profile(id).then(setP).catch((e) => setError(e.message));
  }, [id, version]);

  const invite = async () => {
    const email = inviteEmail.trim();
    if (!email || inviting) return;
    setInviting(true);
    try {
      const res = await api.invitePlayer(id, email);
      showToast(
        res.linked
          ? "Linked! They're in. 🎉"
          : res.sent
            ? `Invite emailed to ${email} ✉️`
            : "Email saved — they'll auto-link when they sign in.",
      );
      setInviteEmail("");
      onChanged();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't invite");
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      const { url } = await api.inviteLink(id);
      await navigator.clipboard.writeText(url);
      showToast("Invite link copied — share it in WhatsApp 📋");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't make a link");
    }
  };

  if (error)
    return (
      <div className="page empty">
        <span className="big">🤔</span>
        <h3>Player not found</h3>
        {onBack && (
          <button className="cta secondary" style={{ marginTop: 12 }} onClick={onBack}>
            ← Back
          </button>
        )}
      </div>
    );

  if (!p)
    return (
      <div className="page" aria-busy="true">
        <div className="skel" style={{ height: 90, marginBottom: 14 }} />
        <div className="skel" style={{ height: 150, marginBottom: 14 }} />
        <div className="skel" style={{ height: 120 }} />
      </div>
    );

  return (
    <div className="page">
      {onBack && (
        <button className="back-btn" onClick={onBack}>
          ← Standings
        </button>
      )}

      <ProfileHero p={p} />
      <StatsSections p={p} />

      {p.ownerUserId != null ? (
        <div className="claimed-note">✅ This player has been claimed</div>
      ) : (
        isAdmin && (
          <div className="invite-card">
            <h4>Invite {p.name} to claim this profile</h4>
            <p>
              Email them the invite, or copy a link to share in WhatsApp. They'll
              get this player (with all its history) when they sign in.
            </p>
            <div className="invite-row">
              <input
                className="field-input"
                style={{ marginBottom: 0 }}
                type="email"
                inputMode="email"
                placeholder="their@gmail.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && invite()}
              />
              <button className="cta" disabled={inviting} onClick={invite}>
                {inviting ? "…" : "Email"}
              </button>
            </div>
            <button
              className="cta secondary"
              style={{ marginTop: 8 }}
              onClick={copyInviteLink}
            >
              🔗 Copy invite link
            </button>
            {p.invitedEmail && (
              <div className="field-hint">Currently invited: {p.invitedEmail}</div>
            )}
          </div>
        )
      )}
    </div>
  );
}
