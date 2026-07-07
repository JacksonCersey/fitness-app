/**
 * Strength Score — motivating, progression-focused user strength index.
 *
 * Recent performance is movement-relative: bench is compared to recent bench sessions,
 * not to deadlift sessions. The displayed score stays flat when weights are steady and
 * only decreases after a genuinely weak workout vs recent movement averages.
 */

import { getBodyweightLbAtDate, getLatestBodyweightLb } from './bodyweight';
import { buildPrTimeline } from './prDetection';
import {
  blendOverallPillars,
  computeConsistencyPillar,
  computeLifetimePrPillar,
  computeStrengthTrendDelta,
  getStrengthLevelLabel,
  getStrengthLevelProgress,
  smoothDisplayedScore,
} from './overallScore';
import {
  buildWorkoutRelativePerformanceSeries,
  computeRelativeRecentPerformancePillar,
  isWeakRelativePerformance,
} from './relativePerformance';
import { buildLifetimeBestLiftScores, computeWorkoutStrengthScore } from './workoutScore';
import { SCORE_SCALING } from './constants';
import { computeConsecutiveTrainingWeekStreak } from '../../utils/consecutiveWeekStreak';

export { getExerciseStrengthMeta, normalizeMovementKey } from './exerciseMultipliers';
export { estimateOneRepMax, isWorkingSet, getBestWorkingSet } from './e1rm';
export { getRecencyMultiplier } from './recency';
export { STRENGTH_LEVEL_BANDS } from './constants';
export { runStrengthScoreExamples } from './examples';
export {
  RELATIVE_WEAK_THRESHOLD,
  RELATIVE_STRONG_THRESHOLD,
} from './relativePerformance';

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
 * @property {number[]} recentOverallScores Oldest-first overall strength scores for sparkline (up to 6).
 * @property {Array<{ value: number; timestamp: number; label: string }>} overallScoreHistory
 * @property {boolean} hasData
 */

/**
 * @param {Array<{ id?: string, completedAt?: string, setsByMovement?: Record<string, unknown[]> }>} oldestFirst
 * @param {Array<{ dateISO?: string, weightLb?: number }>} weightLogs
 * @param {Record<string, unknown>} exerciseLookup
 * @param {number} consecutiveWeeks
 * @param {number|null} previousDisplayedScore
 * @param {boolean} allowDecrease
 * @returns {{
 *   overallScore: number,
 *   recentPillar: number,
 *   lifetimePillar: number,
 *   consistencyPillar: number,
 * }}
 */
function computeOverallFromHistory(
  oldestFirst,
  weightLogs,
  exerciseLookup,
  consecutiveWeeks,
  previousDisplayedScore,
  allowDecrease,
) {
  const getBw = (date) => getBodyweightLbAtDate(weightLogs, date);

  const { meanRelative } = buildWorkoutRelativePerformanceSeries(
    oldestFirst,
    getBw,
    exerciseLookup,
  );

  const lifetimeBests = buildLifetimeBestLiftScores(oldestFirst, getBw, exerciseLookup);
  const lifetimePillar = computeLifetimePrPillar(lifetimeBests);
  const recentPillar = computeRelativeRecentPerformancePillar(lifetimePillar, meanRelative);
  const consistencyPillar = computeConsistencyPillar(consecutiveWeeks);
  const rawOverall = blendOverallPillars(recentPillar, lifetimePillar, consistencyPillar);
  const overallScore = smoothDisplayedScore(rawOverall, previousDisplayedScore, { allowDecrease });

  return {
    overallScore,
    recentPillar,
    lifetimePillar,
    consistencyPillar,
  };
}

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
  void referenceDate;

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
    recentOverallScores: [],
    overallScoreHistory: [],
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
  const { lastRelative } = buildWorkoutRelativePerformanceSeries(oldestFirst, getBw, exerciseLookup);
  const allowDecrease = isWeakRelativePerformance(lastRelative);

  const current = computeOverallFromHistory(
    oldestFirst,
    weightLogs,
    exerciseLookup,
    consecutiveWeeks,
    previousDisplayedScore,
    allowDecrease,
  );

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

  const lifetimeBests = buildLifetimeBestLiftScores(oldestFirst, getBw, exerciseLookup);
  const topLifetimeLifts = Object.values(lifetimeBests)
    .sort((a, b) => b.bestScore - a.bestScore)
    .slice(0, 4)
    .map((r) => ({ movement: r.movement, bestScore: Math.round(r.bestScore * 10) / 10 }));

  const overallScoreTimeline = [];
  /** @type {Array<{ value: number; timestamp: number; label: string }>} */
  const overallScoreHistory = [];
  const workoutYears = new Set(
    oldestFirst.map((workout) => new Date(workout.completedAt).getFullYear()),
  );
  const multiYearHistory = workoutYears.size > 1;
  let timelinePrevious = null;
  for (let index = 0; index < oldestFirst.length; index += 1) {
    const workout = oldestFirst[index];
    const workoutDate = new Date(workout.completedAt);
    const prefix = oldestFirst.slice(0, index + 1);
    const prefixStreak = computeConsecutiveTrainingWeekStreak(prefix, workoutDate);
    const { workoutRelatives } = buildWorkoutRelativePerformanceSeries(prefix, getBw, exerciseLookup);
    const prefixLastRelative = workoutRelatives[workoutRelatives.length - 1] ?? 1;
    const prefixAllowDecrease = isWeakRelativePerformance(prefixLastRelative);
    const point = computeOverallFromHistory(
      prefix,
      weightLogs,
      exerciseLookup,
      prefixStreak,
      timelinePrevious,
      prefixAllowDecrease,
    );
    overallScoreTimeline.push(point.overallScore);
    const month = workoutDate.getMonth() + 1;
    const day = workoutDate.getDate();
    const label = multiYearHistory
      ? `${month}/${day}/${String(workoutDate.getFullYear()).slice(-2)}`
      : `${month}/${day}`;
    overallScoreHistory.push({
      value: point.overallScore,
      timestamp: workoutDate.getTime(),
      label,
    });
    timelinePrevious = point.overallScore;
  }

  const sparklineWindow = SCORE_SCALING.recentWorkoutWindow;
  const recentOverallScores = overallScoreTimeline.slice(-sparklineWindow);
  const newestFirstOverallScores = [...overallScoreTimeline].reverse();

  return {
    overallScore: current.overallScore,
    levelLabel: getStrengthLevelLabel(current.overallScore),
    levelProgress: getStrengthLevelProgress(current.overallScore),
    recentPillar: Math.round(current.recentPillar),
    lifetimePillar: Math.round(current.lifetimePillar),
    consistencyPillar: Math.round(current.consistencyPillar),
    lastWorkoutScore:
      scored.length > 0 ? Math.round(scored[0].finalScore * 10) / 10 : null,
    lastWorkoutHadPr: scored.length > 0 ? scored[0].hadPr : false,
    trendDelta: computeStrengthTrendDelta(newestFirstOverallScores),
    consecutiveWeeks,
    bodyweightLb: getLatestBodyweightLb(weightLogs),
    topLifetimeLifts,
    recentOverallScores,
    overallScoreHistory,
    hasData: true,
  };
}
