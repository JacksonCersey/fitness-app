import { SCORE_SCALING } from './constants';
import { getBestWorkingSet } from './e1rm';
import { normalizeMovementKey } from './exerciseMultipliers';

/** Below this vs recent movement average counts as a weak session. */
export const RELATIVE_WEAK_THRESHOLD = 0.93;

/** Above this vs recent movement average counts as clear progress. */
export const RELATIVE_STRONG_THRESHOLD = 1.02;

const MOVEMENT_HISTORY_WINDOW = SCORE_SCALING.recentWorkoutWindow;

/**
 * @param {{ completedAt?: string, setsByMovement?: Record<string, unknown[]> }} workout
 * @param {number} bodyweightLb
 * @param {Record<string, unknown>} exerciseLookup
 * @returns {Record<string, number>}
 */
export function extractWorkoutMovementE1rms(workout, bodyweightLb, exerciseLookup) {
  /** @type {Record<string, number>} */
  const e1rms = {};
  const map = workout?.setsByMovement || {};
  const movements = Object.keys(map);

  for (let i = 0; i < movements.length; i += 1) {
    const movement = movements[i];
    const movementKey = normalizeMovementKey(movement);
    const best = getBestWorkingSet(movement, map[movement], bodyweightLb, exerciseLookup);
    if (!best || best.estimated1Rm <= 0) continue;
    e1rms[movementKey] = best.estimated1Rm;
  }

  return e1rms;
}

/**
 * @param {Record<string, number>} currentE1rms
 * @param {Array<Record<string, number>>} priorSessionsOldestFirst
 * @param {number} [movementWindow]
 * @returns {number} 1.0 = in line with recent averages for each movement trained
 */
export function computeWorkoutRelativePerformance(
  currentE1rms,
  priorSessionsOldestFirst,
  movementWindow = MOVEMENT_HISTORY_WINDOW,
) {
  const keys = Object.keys(currentE1rms);
  if (keys.length === 0) return 1;

  const ratios = [];
  for (let k = 0; k < keys.length; k += 1) {
    const movementKey = keys[k];
    const current = currentE1rms[movementKey];
    const samples = [];

    for (let i = priorSessionsOldestFirst.length - 1; i >= 0 && samples.length < movementWindow; i -= 1) {
      const value = priorSessionsOldestFirst[i][movementKey];
      if (value != null && Number.isFinite(value)) {
        samples.push(value);
      }
    }

    if (samples.length === 0) {
      ratios.push(1);
      continue;
    }

    const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    if (average <= 0) {
      ratios.push(1);
      continue;
    }

    ratios.push(current / average);
  }

  return ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
}

/**
 * @param {Array<{ completedAt?: string, setsByMovement?: Record<string, unknown[]> }>} oldestFirst
 * @param {(date: Date) => number} getBodyweightLbAtDate
 * @param {Record<string, unknown>} exerciseLookup
 * @returns {{
 *   sessions: Array<Record<string, number>>,
 *   workoutRelatives: number[],
 *   meanRelative: number,
 *   lastRelative: number,
 * }}
 */
export function buildWorkoutRelativePerformanceSeries(oldestFirst, getBodyweightLbAtDate, exerciseLookup) {
  /** @type {Array<Record<string, number>>} */
  const sessions = [];
  /** @type {number[]} */
  const workoutRelatives = [];

  for (let i = 0; i < oldestFirst.length; i += 1) {
    const workout = oldestFirst[i];
    const date = workout?.completedAt ? new Date(workout.completedAt) : null;
    if (!date || Number.isNaN(date.getTime())) continue;

    const e1rms = extractWorkoutMovementE1rms(
      workout,
      getBodyweightLbAtDate(date),
      exerciseLookup,
    );
    const relative = computeWorkoutRelativePerformance(e1rms, sessions);
    sessions.push(e1rms);
    workoutRelatives.push(relative);
  }

  if (workoutRelatives.length === 0) {
    return { sessions, workoutRelatives, meanRelative: 1, lastRelative: 1 };
  }

  const recentSlice = workoutRelatives.slice(-MOVEMENT_HISTORY_WINDOW);
  const meanRelative =
    recentSlice.reduce((sum, value) => sum + value, 0) / recentSlice.length;
  const lastRelative = workoutRelatives[workoutRelatives.length - 1];

  return { sessions, workoutRelatives, meanRelative, lastRelative };
}

/**
 * Recent pillar anchored to lifetime strength, scaled by movement-relative performance.
 * Push/pull vs legs stays ~1.0 when weights are consistent for each movement.
 * @param {number} lifetimePillar
 * @param {number} meanRelative
 * @returns {number}
 */
export function computeRelativeRecentPerformancePillar(lifetimePillar, meanRelative) {
  if (lifetimePillar <= 0) {
    return meanRelative * SCORE_SCALING.recentWorkoutMultiplier * 8;
  }
  return lifetimePillar * meanRelative;
}

/**
 * @param {number} relative
 * @returns {boolean}
 */
export function isWeakRelativePerformance(relative) {
  return relative < RELATIVE_WEAK_THRESHOLD;
}
