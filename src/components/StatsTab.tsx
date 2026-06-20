import { useEffect, useState } from "react";
import { api, type MeGroup, type Profile as ProfileData } from "../api";
import { StatsSections } from "./profileParts";

/** The signed-in user's own stats for the current group. */
export default function StatsTab({
  currentGroup,
  version,
  onClaim,
}: {
  currentGroup: MeGroup;
  version: number;
  onClaim: () => void;
}) {
  const pid = currentGroup.myPlayerId;
  const [p, setP] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (pid == null) {
      setP(null);
      return;
    }
    setP(null);
    api.profile(pid).then(setP).catch(() => setP(null));
  }, [pid, version, currentGroup.id]);

  if (pid == null)
    return (
      <div className="page">
        <h2 className="page-title">Stats</h2>
        <div className="empty">
          <img className="load-mascot" src="/mascot.svg" alt="" style={{ width: 90 }} />
          <h3>No stats yet</h3>
          <p>Claim your player to unlock your stats in {currentGroup.name}.</p>
          <button className="cta" style={{ marginTop: 12 }} onClick={onClaim}>
            Claim your player
          </button>
        </div>
      </div>
    );

  if (!p)
    return (
      <div className="page" aria-busy="true">
        <div className="skel" style={{ height: 150, marginBottom: 14 }} />
        <div className="skel" style={{ height: 120 }} />
      </div>
    );

  return (
    <div className="page">
      <h2 className="page-title">Stats</h2>
      <StatsSections p={p} />
    </div>
  );
}
