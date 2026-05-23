import { ANTI_GAMING, BONUSES } from './constants';
import {
  computeExerciseStrengthScore,
  getBestWorkingSet,
} from './e1rm';
import { getExerciseStrengthMeta, normalizeMovementKey } from './exerciseMultipliers';
import { workoutHadAnyPr } from './prDetection';

/**
 * @typedef {Object} WorkoutStrengthBreakdown
 * @property {number} rawScore
 * @property {number} finalScore
 * @property {boolean} hadPr
 * @property {number} intensityBonusMultiplier
 * @property {number} consistencyBonusMultiplier
 * @property {number} prBonusMultiplier
 * @property {Array<{ movement: string, exerciseScore: number, estimated1Rm: number }>} topLifts
 */

/**
 * @param {number} sets
 * @returns {number} multiplier
 */
function computeIntensityBonus(avgReps) {
  if (avgReps <= 0) return 1;
  if (avgReps <= BONUSES.intensityLowRepAvgThreshold) return 1 + BONUSES.intensityLowRepBonus;
  if (avgReps <= BONUSES.intensityMidRepAvgThreshold) return 1 + BONUSES.intensityMidRepBonus;
  return 1;
}

/**
 * @param {number} consecutiveWeeks
 * @returns {number} multiplier
 */
export function computeConsistencyBonusMultiplier(consecutiveWeeks) {
  const extra = Math.min(
    BONUSES.consistencyPercentCap,
    Math.max(0, consecutiveWeeks) * BONUSES.consistencyPercentPerWeek,
  );
  return 1 + extra;
}

/**
 * Score a single saved workout.
 * @param {{ id?: string, completedAt?: string, setsByMovement?: Record<string, unknown[]> }} workout
 * @param {number} bodyweightLb
 * @param {Record<string, unknown>} exerciseLookup
 * @param {Map<string, Map<string, boolean>>} prByWorkoutId
 * @param {number} consistencyWeeks — streak at time of scoring (current)
 * @returns {WorkoutStrengthBreakdown}
 */
export function computeWorkoutStrengthScore(
  workout,
  bodyweightLb,
  exerciseLookup,
  prByWorkoutId,
  consistencyWeeks,
) {
  const map = workout?.setsByMovement || {};
  const movements = Object.keys(map);
  /** @type {Array<{ movement: string, exerciseScore: number, estimated1Rm: number }>} */
  const liftRows = [];
  let repSum = 0;
  let repCount = 0;

  for (let i = 0; i < movements.length; i += 1) {
    const movement = movements[i];
    const sets = map[movement];
    const best = getBestWorkingSet(movement, sets, bodyweightLb, exerciseLookup);
    if (!best) continue;

    const { multiplier } = getExerciseStrengthMeta(movement);
    let exerciseScore = computeExerciseStrengthScore(best.estimated1Rm, bodyweightLb, multiplier);
    exerciseScore = Math.min(exerciseScore, ANTI_GAMING.maxExerciseScorePerLift);

    liftRows.push({
      movement,
      exerciseScore,
      estimated1Rm: best.estimated1Rm,
    });
    repSum += best.reps;
    repCount += 1;
  }

  liftRows.sort((a, b) => b.exerciseScore - a.exerciseScore);

  let rawScore = liftRows.reduce((sum, row) => sum + row.exerciseScore, 0);
  rawScore = Math.min(rawScore, ANTI_GAMING.maxWorkoutRawScore);

  const avgReps = repCount > 0 ? repSum / repCount : 0;
  const intensityBonusMultiplier = computeIntensityBonus(avgReps);
  const consistencyBonusMultiplier = computeConsistencyBonusMultiplier(consistencyWeeks);
  const hadPr = workoutHadAnyPr(workout?.id || '', prByWorkoutId);
  const prBonusMultiplier = hadPr ? BONUSES.prWorkoutMultiplier : 1;

  const finalScore =
    rawScore * intensityBonusMultiplier * consistencyBonusMultiplier * prBonusMultiplier;

  return {
    rawScore,
    finalScore,
    hadPr,
    intensityBonusMultiplier,
    consistencyBonusMultiplier,
    prBonusMultiplier,
    topLifts: liftRows.slice(0, 5),
  };
}

/**
 * Best exercise score ever per movement (for lifetime pillar).
 * @param {Array<{ completedAt?: string, setsByMovement?: Record<string, unknown[]> }>} workouts
 * @param {(date: Date) => number} getBodyweightLbAtDate
 * @param {Record<string, unknown>} exerciseLookup
 * @returns {Record<string, { movement: string, bestScore: number, estimated1Rm: number }>}
 */
export function buildLifetimeBestLiftScores(workouts, getBodyweightLbAtDate, exerciseLookup) {
  /** @type {Record<string, { movement: string, bestScore: number, estimated1Rm: number }>} */
  const bestByKey = {};

  for (let w = 0; w < workouts.length; w += 1) {
    const workout = workouts[w];
    const date = workout?.completedAt ? new Date(workout.completedAt) : null;
    if (!date || Number.isNaN(date.getTime())) continue;
    const bw = getBodyweightLbAtDate(date);
    const map = workout.setsByMovement || {};
    const keys = Object.keys(map);

    for (let k = 0; k < keys.length; k += 1) {
      const movement = keys[k];
      const movementKey = normalizeMovementKey(movement);
      const best = getBestWorkingSet(movement, map[movement], bw, exerciseLookup);
      if (!best) continue;
      const { multiplier } = getExerciseStrengthMeta(movement);
      let score = computeExerciseStrengthScore(best.estimated1Rm, bw, multiplier);
      score = Math.min(score, ANTI_GAMING.maxExerciseScorePerLift);
      const prev = bestByKey[movementKey];
      if (!prev || score > prev.bestScore) {
        bestByKey[movementKey] = {
          movement,
          bestScore: score,
          estimated1Rm: best.estimated1Rm,
        };
      }
    }
  }

  return bestByKey;
}
