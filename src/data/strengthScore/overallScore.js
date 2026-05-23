import { STRENGTH_LEVEL_BANDS, OVERALL_SCORE_WEIGHTS, SCORE_SCALING, SMOOTHING } from './constants';
import { applyRecencyToWorkoutScore } from './recency';

/**
 * @param {number} score
 * @returns {string}
 */
export function getStrengthLevelLabel(score) {
  const s = Math.max(0, Math.round(score));
  for (let i = 0; i < STRENGTH_LEVEL_BANDS.length; i += 1) {
    const band = STRENGTH_LEVEL_BANDS[i];
    if (s >= band.min && s <= band.max) return band.label;
  }
  return 'Beginner';
}

/**
 * @param {number} score
 * @returns {number} 0–1 progress within current band toward next
 */
export function getStrengthLevelProgress(score) {
  const s = Math.max(0, Math.round(score));
  for (let i = 0; i < STRENGTH_LEVEL_BANDS.length; i += 1) {
    const band = STRENGTH_LEVEL_BANDS[i];
    if (s >= band.min && s <= band.max) {
      const span = band.max === Infinity ? 200 : band.max - band.min + 1;
      const inBand = s - band.min;
      return Math.min(1, inBand / span);
    }
  }
  return 0;
}

/**
 * @param {Array<{ workout: object, finalScore: number, date: Date }>} scoredWorkoutsNewestFirst
 * @param {Date} referenceDate
 * @returns {number}
 */
export function computeRecentPerformancePillar(scoredWorkoutsNewestFirst, referenceDate) {
  const window = SCORE_SCALING.recentWorkoutWindow;
  const slice = scoredWorkoutsNewestFirst.slice(0, window);
  if (slice.length === 0) return 0;

  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < slice.length; i += 1) {
    const row = slice[i];
    const decayed = applyRecencyToWorkoutScore(row.finalScore, row.date, referenceDate);
    const positionWeight = 1 + (window - i) * 0.08;
    weightedSum += decayed * positionWeight;
    weightTotal += positionWeight;
  }

  const avgRaw = weightTotal > 0 ? weightedSum / weightTotal : 0;
  return avgRaw * SCORE_SCALING.recentWorkoutMultiplier;
}

/**
 * @param {Record<string, { bestScore: number }>} lifetimeBests
 * @returns {number}
 */
export function computeLifetimePrPillar(lifetimeBests) {
  const rows = Object.values(lifetimeBests)
    .map((r) => r.bestScore)
    .sort((a, b) => b - a)
    .slice(0, SCORE_SCALING.lifetimePrTopLiftCount);
  if (rows.length === 0) return 0;
  const sum = rows.reduce((a, b) => a + b, 0);
  return sum * SCORE_SCALING.lifetimePrMultiplier;
}

/**
 * @param {number} consecutiveWeeks
 * @returns {number}
 */
export function computeConsistencyPillar(consecutiveWeeks) {
  const pts = Math.min(
    SCORE_SCALING.consistencyPointsCap,
    Math.max(0, consecutiveWeeks) * SCORE_SCALING.consistencyPointsPerWeek,
  );
  return pts;
}

/**
 * Gentle display smoothing so score rarely drops sharply between sessions.
 * @param {number} computed
 * @param {number|null} previousDisplayed
 * @returns {number}
 */
export function smoothDisplayedScore(computed, previousDisplayed) {
  if (previousDisplayed == null || !Number.isFinite(previousDisplayed)) {
    return computed;
  }
  const alpha = SMOOTHING.displayEmaAlpha;
  const blended = previousDisplayed * (1 - alpha) + computed * alpha;
  return Math.max(blended, computed * 0.97);
}

/**
 * @param {number} recent
 * @param {number} lifetime
 * @param {number} consistency
 * @returns {number}
 */
export function blendOverallPillars(recent, lifetime, consistency) {
  const w = OVERALL_SCORE_WEIGHTS;
  let overall =
    recent * w.recentPerformance + lifetime * w.lifetimePrs + consistency * w.consistency;
  overall = Math.max(overall, lifetime * SMOOTHING.lifetimeFloorFactor);
  return Math.round(Math.min(1200, Math.max(0, overall)));
}

/**
 * Trend: compare avg of last 3 workout scores vs prior 3.
 * @param {number[]} newestFirstFinalScores
 * @returns {number|null} positive = improving
 */
export function computeStrengthTrendDelta(newestFirstFinalScores) {
  if (newestFirstFinalScores.length < 4) return null;
  const recent = newestFirstFinalScores.slice(0, 3);
  const prior = newestFirstFinalScores.slice(3, 6);
  if (prior.length === 0) return null;
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  return avg(recent) - avg(prior);
}
