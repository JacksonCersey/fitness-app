/**
 * Weekly training streak ranks (consecutive weeks with ≥1 logged workout).
 * Thresholds are minimum streak length in weeks to earn each tier.
 */

/** Shown when streak is 0 — not yet earned Bronze. */
export const UNRANKED_RANK = {
  id: 'unranked',
  label: 'Unranked',
  weeksRequired: 0,
  image: require('../../assets/images/ranks/unranked.png'),
  accent: '#64748B',
};

export const STREAK_RANKS = [
  {
    id: 'bronze',
    label: 'Bronze',
    weeksRequired: 1,
    image: require('../../assets/images/ranks/bronze.png'),
    accent: '#D97706',
  },
  {
    id: 'silver',
    label: 'Silver',
    weeksRequired: 2,
    image: require('../../assets/images/ranks/silver.png'),
    accent: '#94A3B8',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    weeksRequired: 4,
    image: require('../../assets/images/ranks/emerald.png'),
    accent: '#22C55E',
  },
  {
    id: 'gold',
    label: 'Gold',
    weeksRequired: 8,
    image: require('../../assets/images/ranks/gold.png'),
    accent: '#F59E0B',
  },
  {
    id: 'ruby',
    label: 'Ruby',
    weeksRequired: 16,
    image: require('../../assets/images/ranks/ruby.png'),
    accent: '#EF4444',
  },
  {
    id: 'diamond',
    label: 'Diamond',
    weeksRequired: 32,
    image: require('../../assets/images/ranks/diamond.png'),
    accent: '#38BDF8',
  },
  {
    id: 'platinum',
    label: 'Platinum',
    weeksRequired: 52,
    image: require('../../assets/images/ranks/platinum.png'),
    accent: '#E2E8F0',
  },
];

/**
 * @param {number} streakWeeks Consecutive training-week streak (from workout history).
 */
export function getStreakRankProgress(streakWeeks) {
  const w = Math.max(0, Math.floor(Number(streakWeeks) || 0));

  let currentIndex = -1;
  for (let i = STREAK_RANKS.length - 1; i >= 0; i -= 1) {
    if (w >= STREAK_RANKS[i].weeksRequired) {
      currentIndex = i;
      break;
    }
  }

  const currentRank = currentIndex >= 0 ? STREAK_RANKS[currentIndex] : null;
  const nextRank = currentIndex < STREAK_RANKS.length - 1 ? STREAK_RANKS[currentIndex + 1] : null;
  const displayRank = currentRank ?? UNRANKED_RANK;

  const progressWeeksCurrent = w;
  const progressWeeksTarget = nextRank
    ? nextRank.weeksRequired
    : currentRank?.weeksRequired ?? STREAK_RANKS[0].weeksRequired;

  let progress = 0;
  if (nextRank && nextRank.weeksRequired > 0) {
    progress = w / nextRank.weeksRequired;
  } else if (!nextRank && currentRank) {
    progress = 1;
  }
  progress = Math.min(1, Math.max(0, progress));

  return {
    streakWeeks: w,
    currentRank,
    nextRank,
    displayRank,
    progress,
    progressWeeksCurrent,
    progressWeeksTarget,
    isMaxRank: !nextRank && currentRank != null,
  };
}
