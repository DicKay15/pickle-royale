// Plain-English explanations for every stat, shown in the tap-to-learn InfoSheet.

export interface Info {
  title: string;
  body: string;
}

export const STAT_INFO: Record<string, Info> = {
  rating: {
    title: "Royale Rating",
    body: "Your skill score. Everyone starts at 1200. Beating stronger teams (and winning by a bigger margin) earns more points; losing to weaker teams costs more. It updates after every match.",
  },
  rank: {
    title: "Rank",
    body: "Where you sit on the group ladder, by Royale Rating. Only players who have played at least one match are ranked.",
  },
  record: {
    title: "Win - Loss record",
    body: "How many matches you've won and lost in this group.",
  },
  matches: {
    title: "Matches",
    body: "Total games you've played. Every other stat gets more meaningful the more you play.",
  },
  biggestHeist: {
    title: "Biggest heist",
    body: "The most rating points you've ever gained from a single win. Usually a big upset or a blowout.",
  },
  currentStreak: {
    title: "Current streak",
    body: "How many matches you've won (🔥) or lost (🧊) in a row right now. It resets the moment the result flips.",
  },
  longestWinStreak: {
    title: "Longest win streak",
    body: "Your best-ever run of consecutive wins in this group.",
  },
  carryScore: {
    title: "Carry score",
    body: "Your average 'who carried?' share across your games. Above 55% means you're usually the carrier (the engine of the team); below 45% means you're usually the one being carried; around 50% is balanced.",
  },
  clutch: {
    title: "Clutch (decided by 2)",
    body: "Your win - loss record in nail-biters decided by exactly 2 points. It shows whether you win the tight ones.",
  },
  pickles: {
    title: "Pickles",
    body: "In pickleball, shutting a team out is called 'getting pickled'. 🥒 is how many times your team won with the opponent stuck on 0. 😵 is how many times your team got held to 0.",
  },
  dreamPartner: {
    title: "Dream partner",
    body: "The teammate you win the most with (best win rate together, minimum 2 games). Your best chemistry.",
  },
  nemesis: {
    title: "Nemesis",
    body: "The opponent who beats you most often. You currently have a losing record against them.",
  },
  favouriteVictim: {
    title: "Favourite victim",
    body: "The opponent you beat most often. You currently have a winning record against them.",
  },
  teammates: {
    title: "With teammates",
    body: "Your win - loss record paired with each person you've played alongside.",
  },
  opponents: {
    title: "Against opponents",
    body: "Your win - loss record facing each person across the net.",
  },
  ratingJourney: {
    title: "Rating journey",
    body: "Your Royale Rating over time. The dashed line is the 1200 starting point, so anything above it means you're net positive.",
  },
};
