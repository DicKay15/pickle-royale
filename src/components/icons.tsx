import type { ReactNode } from "react";

/**
 * Custom line/solid icons in the brand style. All inherit `currentColor`, so they
 * take the colour of their context (nav active = lime, on a gold badge = ink, etc.).
 */
function Svg({
  children,
  className,
  size = 24,
  stroke = true,
}: {
  children: ReactNode;
  className?: string;
  size?: number;
  stroke?: boolean;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={stroke ? "none" : "currentColor"}
      stroke={stroke ? "currentColor" : "none"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

type P = { className?: string; size?: number };

/* ---- navigation ---- */

// Solid, chunky glyphs — they carry weight (and personality) rather than
// reading as thin hairline icons. They fill with currentColor, so an active
// tab paints them lime and an inactive one paints them muted.

export const TrophyIcon = (p: P) => (
  <Svg {...p} stroke={false}>
    <path d="M7 3h10a1 1 0 0 1 1 1v1h2.5a1 1 0 0 1 1 1c0 2.7-2 4.7-4.7 5A6 6 0 0 1 13 14.8V17h2.5a1 1 0 0 1 1 1v.5H7.5V18a1 1 0 0 1 1-1H11v-2.2a6 6 0 0 1-3.8-3.8C4.5 10.7 2.5 8.7 2.5 6a1 1 0 0 1 1-1H6V4a1 1 0 0 1 1-1zM6 7H4.6c.3 1.3 1.2 2.2 2.4 2.5A15 15 0 0 1 6 7zm12 0a15 15 0 0 1-1 2.5c1.2-.3 2.1-1.2 2.4-2.5H18z" />
    <rect x="6.5" y="20" width="11" height="2" rx="1" />
  </Svg>
);

export const PaddlesIcon = (p: P) => (
  <Svg {...p} stroke={false}>
    <g transform="rotate(-38 12 11)">
      <ellipse cx="12" cy="8" rx="5" ry="6" />
      <rect x="10.5" y="13" width="3" height="7" rx="1.5" />
    </g>
    <circle cx="18.4" cy="18.4" r="2.4" />
  </Svg>
);

export const StatsIcon = (p: P) => (
  <Svg {...p} stroke={false}>
    <rect x="3" y="12" width="4.6" height="9" rx="1.6" />
    <rect x="9.7" y="5" width="4.6" height="16" rx="1.6" />
    <rect x="16.4" y="9" width="4.6" height="12" rx="1.6" />
  </Svg>
);

export const PersonIcon = (p: P) => (
  <Svg {...p} stroke={false}>
    <circle cx="12" cy="7.5" r="4.2" />
    <path d="M3.8 20.5a8.2 8.2 0 0 1 16.4 0 1 1 0 0 1-1 1.1H4.8a1 1 0 0 1-1-1.1z" />
  </Svg>
);

/* ---- misc ---- */

export const TrendingIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 16l5-5 4 3 6-7" />
    <path d="M16 7h4v4" />
  </Svg>
);

export const ChevronDownIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);

export const LockIcon = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);

export const CloseIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const ShareIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 4v12" />
    <path d="M8 8l4-4 4 4" />
    <path d="M6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6" />
  </Svg>
);

/* ---- achievements ---- */

const Star = (p: P) => (
  <Svg {...p} stroke={false}>
    <path d="M12 3.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.2l5.4-.8z" />
  </Svg>
);

const PickleballIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="15" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="15" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </Svg>
);

const ShieldIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l7 3v5c0 4.2-3 7.4-7 9-4-1.6-7-4.8-7-9V6z" />
    <path d="M9 11.5l2 2 4-4" />
  </Svg>
);

const PickleIcon = (p: P) => (
  <Svg {...p}>
    <path d="M7.5 16.5a4.5 4.5 0 0 1 0-6.4l2.6-2.6a4.5 4.5 0 0 1 6.4 6.4l-2.6 2.6a4.5 4.5 0 0 1-6.4 0z" />
    <path d="M11 10.5l.01 0" />
    <path d="M13 12.5l.01 0" />
    <path d="M11.5 13.5l.01 0" />
  </Svg>
);

const FlameIcon = (p: P) => (
  <Svg {...p} stroke={false}>
    <path d="M12 2.5c3 3.5 5 6 5 9.5a5 5 0 0 1-10 0c0-1.8.8-3 1.8-4 .2 1 .9 1.8 1.8 1.8 1.2 0 1.6-2.6-.4-7.3z" />
  </Svg>
);

const BoltIcon = (p: P) => (
  <Svg {...p} stroke={false}>
    <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
  </Svg>
);

const DumbbellIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 9v6" />
    <path d="M7 6.5v11" />
    <path d="M7 12h10" />
    <path d="M17 6.5v11" />
    <path d="M20 9v6" />
  </Svg>
);

/** key → icon, matching the achievements catalog + backend badge keys. */
export const ACH_ICONS: Record<string, (p: P) => JSX.Element> = {
  first_win: Star,
  ten: PickleballIcon,
  fifty: ShieldIcon,
  pickler: PickleIcon,
  onfire: FlameIcon,
  streaker: BoltIcon,
  ironman: DumbbellIcon,
};
