import { useEffect, useState } from "react";
import { api, type Profile as ProfileData } from "../api";
import { ProfileHero, StatsSections } from "./profileParts";
import { ShareIcon } from "./icons";

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
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    api.profile(id).then(setP).catch((e) => setError(e.message));
  }, [id, version]);

  const inviteMessage = (name: string) =>
    `Join our Pickle Royale group and claim your player "${name}"! 🥒🏓`;

  // Native share sheet (WhatsApp, Messages, etc.) with a copy-link fallback.
  const shareInvite = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const { url } = await api.inviteLink(id);
      const text = inviteMessage(p!.name);
      if (navigator.share) {
        await navigator.share({ title: "Pickle Royale", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        showToast("Invite copied — paste it in WhatsApp 📋");
      }
    } catch (e) {
      // user dismissing the native share sheet is not an error
      if (e instanceof Error && e.name === "AbortError") return;
      showToast(e instanceof Error ? e.message : "Couldn't make a link");
    } finally {
      setSharing(false);
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

      {p.ownerUserId != null ? (
        <div className="claimed-note">✅ This player has been claimed</div>
      ) : (
        isAdmin && (
          <div className="invite-card">
            <h4>Invite {p.name}</h4>
            <p>
              Send them a link to join the group and claim this player, with all
              its match history.
            </p>
            <div className="invite-actions">
              <button className="cta" disabled={sharing} onClick={shareInvite}>
                <ShareIcon className="cta-ico" />
                {sharing ? "…" : "Share link"}
              </button>
              <button className="cta secondary" onClick={copyInviteLink}>
                🔗 Copy link
              </button>
            </div>
          </div>
        )
      )}

      <StatsSections p={p} />
    </div>
  );
}
