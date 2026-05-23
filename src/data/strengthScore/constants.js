/** @typedef {{ min: number, max: number, label: string }} StrengthLevelBand */

/** Overall score level bands (RPG-style). */
export const STRENGTH_LEVEL_BANDS = /** @type {StrengthLevelBand[]} */ ([
  { min: 0, max: 199, label: 'Beginner' },
  { min: 200, max: 399, label: 'Novice' },
  { min: 400, max: 599, label: 'Intermediate' },
  { min: 600, max: 799, label: 'Advanced' },
  { min: 800, max: 999, label: 'Elite' },
  { min: 1000, max: Infinity, label: 'Freak' },
]);

/** How overall score blends its three pillars (must sum to 1). */
export const OVERALL_SCORE_WEIGHTS = {
  recentPerformance: 0.5,
  lifetimePrs: 0.3,
  consistency: 0.2,
};

/** Tunable scalers — map raw workout math onto ~0–1000 user-facing score. */
export const SCORE_SCALING = {
  /** Multiplies average recent workout raw score for the 50% pillar. */
  recentWorkoutMultiplier: 28,
  /** Multiplies sum of top lifetime lift scores for the 30% pillar. */
  lifetimePrMultiplier: 14,
  /** Points per consecutive training week for the 20% pillar (capped). */
  consistencyPointsPerWeek: 12,
  consistencyPointsCap: 150,
  /** Max exercises counted toward lifetime PR pillar. */
  lifetimePrTopLiftCount: 8,
  /** How many recent workouts feed the rolling average. */
  recentWorkoutWindow: 6,
};

export const SET_RULES = {
  minReps: 1,
  maxReps: 12,
  maxWeightLb: 1200,
};

/** Fallback bodyweight when no log exists (lb). */
export const DEFAULT_BODYWEIGHT_LB = 170;

/** Minimum bodyweight divisor for relative strength. */
export const MIN_BODYWEIGHT_LB = 90;

export const BONUSES = {
  prWorkoutMultiplier: 1.05,
  consistencyPercentPerWeek: 0.015,
  consistencyPercentCap: 0.15,
  intensityLowRepAvgThreshold: 6,
  intensityMidRepAvgThreshold: 9,
  intensityLowRepBonus: 0.03,
  intensityMidRepBonus: 0.02,
};

export const ANTI_GAMING = {
  maxExerciseScorePerLift: 12,
  maxWorkoutRawScore: 80,
  minHoursBetweenWorkoutsForFullCredit: 4,
};

export const SMOOTHING = {
  /** Overall score cannot drop below this fraction of lifetime pillar (prevents harsh dips). */
  lifetimeFloorFactor: 0.72,
  /** Blend toward previous overall when history exists (0 = off, 1 = frozen). */
  displayEmaAlpha: 0.35,
};
