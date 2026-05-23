/**
 * Strength Score — motivating, progression-focused user strength index.
 *
 * Future persistence (AsyncStorage / backend) suggested fields:
 * - strength_score_displayed: number (smoothed UI value)
 * - strength_score_computed_at: ISO string
 * - strength_pr_map: Record<movementKey, { bestE1Rm, dateISO }>
 * - strength_workout_scores: { workoutId, raw, final, dateISO }[]
 *
 * Anti-gaming: working-set rep cap, max per-lift contribution, max workout raw,
 * minimum gap between workouts optional (not enforced yet).
 */

import { getBodyweightLbAtDate, getLatestBodyweightLb } from './bodyweight';
import { buildPrTimeline } from './prDetection';
import {
  blendOverallPillars,
  computeConsistencyPillar,
  computeLifetimePrPillar,
  computeRecentPerformancePillar,
  computeStrengthTrendDelta,
  getStrengthLevelLabel,
  getStrengthLevelProgress,
  smoothDisplayedScore,
} from './overallScore';
import { buildLifetimeBestLiftScores, computeWorkoutStrengthScore } from './workoutScore';

export { getExerciseStrengthMeta, normalizeMovementKey } from './exerciseMultipliers';
export { estimateOneRepMax, isWorkingSet, getBestWorkingSet } from './e1rm';
export { getRecencyMultiplier } from './recency';
export { STRENGTH_LEVEL_BANDS } from './constants';
export { runStrengthScoreExamples } from './examples';

/**
 * @typedef {Object} StrengthScoreSummary
 * @property {number} overallScore
 * @property {string} levelLabel
 * @property {number} levelProgress
 * @property {number} recentPillar
 * @property {number} lifetimePillar
 * @property {number} consistencyPillar
 * @property {number|null} lastWorkoutScore
 * @property {boolean} lastWorkoutHadPr
 * @property {number|null} trendDelta
 * @property {number} consecutiveWeeks
 * @property {number} bodyweightLb
 * @property {Array<{ movement: string, bestScore: number }>} topLifetimeLifts
 * @property {boolean} hasData
 */

/**
 * @param {unknown[]} workoutHistory
 * @param {Array<{ dateISO?: string, weightLb?: number }>} weightLogs
 * @param {Record<string, unknown>} exerciseLookup
 * @param {number} consecutiveWeeks
 * @param {Date} [referenceDate]
 * @param {number|null} [previousDisplayedScore]
 * @returns {StrengthScoreSummary}
 */
export function computeStrengthScoreSummary(
  workoutHistory,
  weightLogs,
  exerciseLookup,
  consecutiveWeeks,
  referenceDate = new Date(),
  previousDisplayedScore = null,
) {
  const empty = {
    overallScore: 0,
    levelLabel: 'Beginner',
    levelProgress: 0,
    recentPillar: 0,
    lifetimePillar: 0,
    consistencyPillar: 0,
    lastWorkoutScore: null,
    lastWorkoutHadPr: false,
    trendDelta: null,
    consecutiveWeeks,
    bodyweightLb: getLatestBodyweightLb(weightLogs),
    topLifetimeLifts: [],
    hasData: false,
  };

  if (!Array.isArray(workoutHistory) || workoutHistory.length === 0) {
    return empty;
  }

  const getBw = (date) => getBodyweightLbAtDate(weightLogs, date);

  const validWorkouts = workoutHistory.filter((w) => {
    if (!w?.completedAt || !w.setsByMovement) return false;
    return !Number.isNaN(new Date(w.completedAt).getTime());
  });

  if (validWorkouts.length === 0) return empty;

  const oldestFirst = [...validWorkouts].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
  );
  const newestFirst = [...oldestFirst].reverse();

  const { prByWorkoutId } = buildPrTimeline(oldestFirst, getBw, exerciseLookup);

  /** @type {Array<{ workout: object, finalScore: number, date: Date, hadPr: boolean }>} */
  const scored = [];
  for (let i = 0; i < newestFirst.length; i += 1) {
    const workout = newestFirst[i];
    const date = new Date(workout.completedAt);
    const breakdown = computeWorkoutStrengthScore(
      workout,
      getBw(date),
      exerciseLookup,
      prByWorkoutId,
      consecutiveWeeks,
    );
    scored.push({
      workout,
      finalScore: breakdown.finalScore,
      date,
      hadPr: breakdown.hadPr,
    });
  }

  const recentPillar = computeRecentPerformancePillar(scored, referenceDate);
  const lifetimeBests = buildLifetimeBestLiftScores(oldestFirst, getBw, exerciseLookup);
  const lifetimePillar = computeLifetimePrPillar(lifetimeBests);
  const consistencyPillar = computeConsistencyPillar(consecutiveWeeks);

  const rawOverall = blendOverallPillars(recentPillar, lifetimePillar, consistencyPillar);
  const overallScore = Math.round(
    smoothDisplayedScore(rawOverall, previousDisplayedScore),
  );

  const newestFirstFinalScores = scored.map((s) => s.finalScore);
  const topLifetimeLifts = Object.values(lifetimeBests)
    .sort((a, b) => b.bestScore - a.bestScore)
    .slice(0, 4)
    .map((r) => ({ movement: r.movement, bestScore: Math.round(r.bestScore * 10) / 10 }));

  return {
    overallScore,
    levelLabel: getStrengthLevelLabel(overallScore),
    levelProgress: getStrengthLevelProgress(overallScore),
    recentPillar: Math.round(recentPillar),
    lifetimePillar: Math.round(lifetimePillar),
    consistencyPillar: Math.round(consistencyPillar),
    lastWorkoutScore:
      scored.length > 0 ? Math.round(scored[0].finalScore * 10) / 10 : null,
    lastWorkoutHadPr: scored.length > 0 ? scored[0].hadPr : false,
    trendDelta: computeStrengthTrendDelta(newestFirstFinalScores),
    consecutiveWeeks,
    bodyweightLb: getLatestBodyweightLb(weightLogs),
    topLifetimeLifts,
    hasData: true,
  };
}
