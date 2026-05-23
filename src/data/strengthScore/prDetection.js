import { getBestWorkingSet } from './e1rm';
import { normalizeMovementKey } from './exerciseMultipliers';

/**
 * @typedef {Object} MovementPrState
 * @property {number} bestE1Rm
 * @property {string} [lastWorkoutId]
 * @property {string} [lastDateISO]
 */

/**
 * Walk workouts oldest → newest to detect PRs chronologically.
 * @param {Array<{ id?: string, completedAt?: string, setsByMovement?: Record<string, unknown[]> }>} workoutsOldestFirst
 * @param {(date: Date) => number} getBodyweightLbAtDate
 * @param {Record<string, unknown>} exerciseLookup
 * @returns {Map<string, { prByWorkoutId: Map<string, boolean>, currentPrs: Record<string, MovementPrState> }>}
 */
export function buildPrTimeline(workoutsOldestFirst, getBodyweightLbAtDate, exerciseLookup) {
  /** @type {Record<string, MovementPrState>} */
  const currentPrs = {};
  /** workoutId → movementKey → was PR */
  const prByWorkoutId = new Map();

  for (let w = 0; w < workoutsOldestFirst.length; w += 1) {
    const workout = workoutsOldestFirst[w];
    const workoutId = workout?.id || `w-${w}`;
    const completedAt = workout?.completedAt;
    const date = completedAt ? new Date(completedAt) : null;
    if (!date || Number.isNaN(date.getTime())) continue;

    const bw = getBodyweightLbAtDate(date);
    const map = workout.setsByMovement || {};
    const workoutPrs = new Map();

    const keys = Object.keys(map);
    for (let k = 0; k < keys.length; k += 1) {
      const movement = keys[k];
      const movementKey = normalizeMovementKey(movement);
      const best = getBestWorkingSet(movement, map[movement], bw, exerciseLookup);
      if (!best || best.estimated1Rm <= 0) continue;

      const prev = currentPrs[movementKey];
      const isPr = !prev || best.estimated1Rm > prev.bestE1Rm + 0.25;
      if (isPr) {
        currentPrs[movementKey] = {
          bestE1Rm: best.estimated1Rm,
          lastWorkoutId: workoutId,
          lastDateISO: completedAt,
        };
        workoutPrs.set(movementKey, true);
      }
    }

    if (workoutPrs.size > 0) {
      prByWorkoutId.set(workoutId, workoutPrs);
    }
  }

  return { currentPrs, prByWorkoutId };
}

/**
 * @param {string} workoutId
 * @param {Map<string, Map<string, boolean>>} prByWorkoutId
 * @returns {boolean}
 */
export function workoutHadAnyPr(workoutId, prByWorkoutId) {
  const m = prByWorkoutId.get(workoutId);
  return Boolean(m && m.size > 0);
}
