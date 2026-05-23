import { isBodyweightOnlyExercise } from '../../utils/formatWorkout';
import { DEFAULT_BODYWEIGHT_LB, MIN_BODYWEIGHT_LB, SET_RULES } from './constants';

/**
 * Epley-style estimate: weight × (1 + reps / 30)
 * @param {number} weightLb
 * @param {number} reps
 * @returns {number}
 */
export function estimateOneRepMax(weightLb, reps) {
  const w = Number(weightLb) || 0;
  const r = Number(reps) || 0;
  if (w <= 0 || r <= 0) return 0;
  return w * (1 + r / 30);
}

/**
 * @param {number} reps
 * @param {number} weightLb
 * @returns {boolean}
 */
export function isWorkingSet(reps, weightLb) {
  const r = Number(reps) || 0;
  const w = Number(weightLb) || 0;
  if (r < SET_RULES.minReps || r > SET_RULES.maxReps) return false;
  if (w > SET_RULES.maxWeightLb) return false;
  return true;
}

/**
 * @param {string} movementName
 * @param {{ weight?: number, reps?: number }} setItem
 * @param {number} bodyweightLb
 * @param {Record<string, { bodyweightOnly?: boolean }>} exerciseLookup
 * @returns {number}
 */
export function getEffectiveLoadLb(movementName, setItem, bodyweightLb, exerciseLookup) {
  const added = Number(setItem?.weight) || 0;
  const bw = Math.max(MIN_BODYWEIGHT_LB, bodyweightLb || DEFAULT_BODYWEIGHT_LB);
  if (isBodyweightOnlyExercise(movementName, exerciseLookup)) {
    return bw + Math.max(0, added);
  }
  return added;
}

/**
 * Per spec: 70% relative strength + 30% absolute (e1RM / 100), × exercise multiplier.
 * @param {number} estimated1Rm
 * @param {number} bodyweightLb
 * @param {number} exerciseMultiplier
 * @returns {number}
 */
export function computeExerciseStrengthScore(estimated1Rm, bodyweightLb, exerciseMultiplier) {
  if (estimated1Rm <= 0 || exerciseMultiplier <= 0) return 0;
  const bw = Math.max(MIN_BODYWEIGHT_LB, bodyweightLb || DEFAULT_BODYWEIGHT_LB);
  const relativeStrength = estimated1Rm / bw;
  const absoluteComponent = estimated1Rm / 100;
  const raw = relativeStrength * 0.7 + absoluteComponent * 0.3;
  return raw * exerciseMultiplier;
}

/**
 * Best working set from an array of sets for one movement.
 * @param {string} movementName
 * @param {Array<{ weight?: number, reps?: number }>} sets
 * @param {number} bodyweightLb
 * @param {Record<string, unknown>} exerciseLookup
 * @returns {{ estimated1Rm: number, reps: number, weightLb: number } | null}
 */
export function getBestWorkingSet(movementName, sets, bodyweightLb, exerciseLookup) {
  if (!Array.isArray(sets) || sets.length === 0) return null;
  let best = null;
  let bestE1rm = 0;

  for (let i = 0; i < sets.length; i += 1) {
    const setItem = sets[i];
    const reps = Number(setItem?.reps) || 0;
    const load = getEffectiveLoadLb(movementName, setItem, bodyweightLb, exerciseLookup);
    if (!isWorkingSet(reps, load)) continue;
    const e1rm = estimateOneRepMax(load, reps);
    if (e1rm > bestE1rm) {
      bestE1rm = e1rm;
      best = { estimated1Rm: e1rm, reps, weightLb: load };
    }
  }
  return best;
}
