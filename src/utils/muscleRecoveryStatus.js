import { exerciseMuscleMap, getMuscleActivations, MUSCLE_GROUPS } from '../../data/exerciseMuscleMap';
import { DISPLAY_LABEL_TO_SLUGS } from '../../data/workoutMuscleHeat';

const SYNTH_PRIMARY = 0.62;
const SYNTH_SECONDARY = 0.38;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_10D = 10 * MS_PER_DAY;

/**
 * Fatigue decays exponentially:
 * - very recent sessions count most
 * - each additional day reduces impact smoothly (no hard cutoffs)
 */
const FATIGUE_HALF_LIFE_DAYS = 2.2;
const FATIGUE_HALF_LIFE_MS = FATIGUE_HALF_LIFE_DAYS * MS_PER_DAY;
const LN2 = Math.log(2);

/** Minimum per-set stress to count as “worked” for last-hit tracking. */
const MIN_SET_STRESS = 0.25;

/**
 * @typedef {'ready' | 'recovering' | 'highFatigue'} MuscleRecoveryStatus
 */

/**
 * @param {Record<string, unknown[]> | null | undefined} setsByMovement
 * @param {Record<string, { primaryMuscles?: string[]; secondaryMuscles?: string[] }>} exerciseLookup
 * @returns {Record<string, number>}
 */
function rawStressBySlugFromSets(setsByMovement, exerciseLookup) {
  /** @type {Record<string, number>} */
  const accumulated = {};
  MUSCLE_GROUPS.forEach((g) => {
    accumulated[g] = 0;
  });

  if (!setsByMovement || typeof setsByMovement !== 'object') return accumulated;

  Object.entries(setsByMovement).forEach(([name, setsArr]) => {
    const n = Array.isArray(setsArr) ? setsArr.length : 0;
    if (n <= 0) return;

    const detailed = exerciseMuscleMap[name];
    if (detailed) {
      const full = getMuscleActivations(name);
      MUSCLE_GROUPS.forEach((g) => {
        accumulated[g] += (full[g] ?? 0) * n;
      });
      return;
    }

    const db = exerciseLookup[name.toLowerCase()];
    if (!db) return;

    /** @type {Record<string, number>} */
    const slugBump = {};
    MUSCLE_GROUPS.forEach((g) => {
      slugBump[g] = 0;
    });
    (db.primaryMuscles ?? []).forEach((label) => {
      const slugs = DISPLAY_LABEL_TO_SLUGS[label];
      if (!slugs) return;
      slugs.forEach((s) => {
        slugBump[s] = Math.max(slugBump[s], SYNTH_PRIMARY);
      });
    });
    (db.secondaryMuscles ?? []).forEach((label) => {
      const slugs = DISPLAY_LABEL_TO_SLUGS[label];
      if (!slugs) return;
      slugs.forEach((s) => {
        slugBump[s] = Math.max(slugBump[s], SYNTH_SECONDARY);
      });
    });
    MUSCLE_GROUPS.forEach((g) => {
      accumulated[g] += slugBump[g] * n;
    });
  });

  return accumulated;
}

/**
 * Recovery status per muscle slug from decayed workload in recent history.
 * - ready: low remaining fatigue, likely fully trainable
 * - recovering: some remaining fatigue, generally trainable
 * - highFatigue: unusually high recent workload / recovery debt
 *
 * @param {unknown[]} workoutHistory
 * @param {Record<string, { primaryMuscles?: string[]; secondaryMuscles?: string[] }>} exerciseLookup
 * @param {Date} [referenceDate]
 * @returns {Record<string, MuscleRecoveryStatus>}
 */
export function computeMuscleRecoveryStatusBySlug(workoutHistory, exerciseLookup, referenceDate = new Date()) {
  const now = referenceDate.getTime();

  /** @type {Record<string, number>} */
  const decayedFatigue = {};

  MUSCLE_GROUPS.forEach((g) => {
    decayedFatigue[g] = 0;
  });

  if (Array.isArray(workoutHistory)) {
    for (let w = 0; w < workoutHistory.length; w += 1) {
      const workout = workoutHistory[w];
      if (!workout || typeof workout !== 'object') continue;
      const completedRaw = workout.completedAt;
      if (!completedRaw) continue;
      const completedAt = new Date(completedRaw);
      const t = completedAt.getTime();
      if (Number.isNaN(t)) continue;

      const ageMs = now - t;
      if (ageMs < 0 || ageMs > MS_10D) continue;

      // Exponential decay keeps changes smooth instead of abrupt day buckets.
      const decayWeight = Math.exp((-LN2 * ageMs) / FATIGUE_HALF_LIFE_MS);

      const stress = rawStressBySlugFromSets(workout.setsByMovement, exerciseLookup);
      MUSCLE_GROUPS.forEach((g) => {
        const s = stress[g] ?? 0;
        if (s < MIN_SET_STRESS) return;
        decayedFatigue[g] += s * decayWeight;
      });
    }
  }

  /** @type {Record<string, MuscleRecoveryStatus>} */
  const out = {};
  MUSCLE_GROUPS.forEach((g) => {
    const score = decayedFatigue[g] ?? 0;
    if (score >= 8.5) {
      out[g] = 'highFatigue';
      return;
    }
    if (score >= 2.8) {
      out[g] = 'recovering';
      return;
    }
    out[g] = 'ready';
  });

  return out;
}
