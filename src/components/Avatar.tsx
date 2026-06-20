import { useState } from "react";

/**
 * Shows a player's Google photo when available, otherwise their emoji.
 * `className` is the existing circular container class (e.g. "row-emoji",
 * "champ-emoji", "big-av"), so the avatar drops into current layouts.
 */
export default function Avatar({
  emoji,
  avatarUrl,
  className,
}: {
  emoji: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  return (
    <span className={className}>
      {avatarUrl && !broken ? (
        <img
          className="avatar-img"
          src={avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        emoji
      )}
    </span>
  );
}
