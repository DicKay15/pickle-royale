// The full achievements catalog. The backend returns the keys a player has
// EARNED (in profile.badges); the client renders this whole list, marking each
// as earned or locked. Keys must match the backend (worker/index.ts).

export interface Achievement {
  key: string;
  label: string;
  emoji: string;
  how: string;
  countable?: boolean; // can be earned multiple times → shows ×2, ×3, ...
}

export const ACHIEVEMENTS: Achievement[] = [
  { key: "first_win", label: "First Win", emoji: "🎉", how: "Win your first match." },
  { key: "ten", label: "10 Games", emoji: "🏓", how: "Play 10 matches." },
  { key: "fifty", label: "50 Games", emoji: "🏅", how: "Play 50 matches." },
  {
    key: "pickler",
    label: "Pickler",
    emoji: "🥒",
    how: "Win a match with your opponent stuck on 0 (a pickle / skunk).",
    countable: true,
  },
  {
    key: "onfire",
    label: "On Fire",
    emoji: "🔥",
    how: "Win 3 matches in a row.",
    countable: true,
  },
  {
    key: "streaker",
    label: "5-Win Streak",
    emoji: "⚡",
    how: "Win 5 matches in a row.",
    countable: true,
  },
  {
    key: "ironman",
    label: "Iron Man",
    emoji: "💪",
    how: "Play the most games of anyone in your group.",
  },
];
